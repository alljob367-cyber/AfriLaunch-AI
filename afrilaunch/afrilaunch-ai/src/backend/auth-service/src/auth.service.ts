// AfriLaunch AI — Auth Service
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MfaService } from './mfa/mfa.service';
import { TokenService } from './token/token.service';
import { AuditService } from './audit/audit.service';

import {
  RegisterDto,
  LoginDto,
  OAuthCallbackDto,
  RefreshTokenDto,
  MfaVerifyDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private redis: RedisService,
    private mfa: MfaService,
    private tokens: TokenService,
    private audit: AuditService,
  ) {}

  // ── Inscription ──────────────────────────────────────────────
  async register(dto: RegisterDto, ip: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('EMAIL_ALREADY_EXISTS');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const referralCode = this.generateReferralCode();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        country: dto.country,
        language: dto.language ?? 'fr',
        referralCode,
        referredBy: dto.referralCode ?? null,
      },
    });

    // Créer le token de vérification email
    const verifyToken = await this.tokens.createEmailVerificationToken(user.id);

    // Audit
    await this.audit.log({
      userId: user.id,
      action: 'AUTH_REGISTER',
      resource: 'user',
      resourceId: user.id,
      ipAddress: ip,
    });

    // Envoyer email de vérification (via queue)
    // await this.emailQueue.add('verify-email', { userId: user.id, token: verifyToken });

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ── Connexion ─────────────────────────────────────────────────
  async login(dto: LoginDto, ip: string, userAgent: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      await this.handleFailedLogin(user.email, ip);
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('ACCOUNT_' + user.status);
    }

    // Vérifier si MFA est activé
    if (user.mfaEnabled) {
      const mfaSession = await this.redis.setex(
        `mfa_pending:${user.id}`,
        300,
        JSON.stringify({ userId: user.id, ip }),
      );
      return { requiresMfa: true, mfaSessionId: user.id };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Créer session
    const session = await this.createSession(user.id, ip, userAgent);

    await this.audit.log({
      userId: user.id,
      action: 'AUTH_LOGIN',
      resource: 'session',
      resourceId: session.id,
      ipAddress: ip,
    });

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    return { user: this.sanitizeUser(user), ...tokens, sessionId: session.id };
  }

  // ── Vérification MFA ─────────────────────────────────────────
  async verifyMfa(dto: MfaVerifyDto, ip: string) {
    const pending = await this.redis.get(`mfa_pending:${dto.userId}`);
    if (!pending) throw new UnauthorizedException('MFA_SESSION_EXPIRED');

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user?.mfaSecret) throw new UnauthorizedException('MFA_NOT_CONFIGURED');

    const isValid = this.mfa.verifyTOTP(dto.code, user.mfaSecret);
    if (!isValid) throw new UnauthorizedException('MFA_INVALID_CODE');

    await this.redis.del(`mfa_pending:${dto.userId}`);

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ── OAuth Callback ────────────────────────────────────────────
  async oauthCallback(dto: OAuthCallbackDto, ip: string) {
    let user = await this.prisma.user.findFirst({
      where: {
        oauthAccounts: {
          some: {
            provider: dto.provider,
            providerUserId: dto.providerUserId,
          },
        },
      },
      include: { oauthAccounts: true },
    });

    if (!user) {
      // Vérifier si email existe déjà
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });

      if (existingByEmail) {
        // Lier le compte OAuth à l'utilisateur existant
        await this.prisma.oAuthAccount.create({
          data: {
            userId: existingByEmail.id,
            provider: dto.provider,
            providerUserId: dto.providerUserId,
            accessToken: dto.accessToken,
            refreshToken: dto.refreshToken,
            expiresAt: dto.expiresAt,
            scope: dto.scope,
          },
        });
        user = existingByEmail;
      } else {
        // Créer nouvel utilisateur
        const referralCode = this.generateReferralCode();
        user = await this.prisma.user.create({
          data: {
            email: dto.email.toLowerCase(),
            firstName: dto.firstName,
            lastName: dto.lastName,
            avatar: dto.avatar,
            country: dto.country ?? 'CM',
            emailVerified: new Date(),
            referralCode,
            oauthAccounts: {
              create: {
                provider: dto.provider,
                providerUserId: dto.providerUserId,
                accessToken: dto.accessToken,
                refreshToken: dto.refreshToken,
                expiresAt: dto.expiresAt,
                scope: dto.scope,
              },
            },
          },
        });
      }
    }

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.audit.log({
      userId: user.id,
      action: 'AUTH_OAUTH_LOGIN',
      resource: 'user',
      resourceId: user.id,
      ipAddress: ip,
      metadata: { provider: dto.provider },
    });

    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ── Refresh Token ─────────────────────────────────────────────
  async refreshToken(dto: RefreshTokenDto) {
    const payload = await this.tokens.verifyRefreshToken(dto.refreshToken);
    if (!payload) throw new UnauthorizedException('INVALID_REFRESH_TOKEN');

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('USER_NOT_ACTIVE');
    }

    // Rotation du refresh token (invalidation de l'ancien)
    await this.tokens.revokeRefreshToken(dto.refreshToken);
    return this.generateTokenPair(user.id, user.email, user.role);
  }

  // ── Mot de passe oublié ───────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Toujours retourner succès pour éviter l'énumération d'emails
    if (!user) return { message: 'RESET_EMAIL_SENT_IF_EXISTS' };

    const resetToken = await this.tokens.createPasswordResetToken(user.id);
    // await this.emailQueue.add('reset-password', { userId: user.id, token: resetToken });

    return { message: 'RESET_EMAIL_SENT_IF_EXISTS' };
  }

  // ── Réinitialisation mot de passe ─────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    const userId = await this.tokens.verifyPasswordResetToken(dto.token);
    if (!userId) throw new BadRequestException('INVALID_OR_EXPIRED_TOKEN');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.tokens.revokePasswordResetToken(dto.token);
    // Invalider toutes les sessions existantes
    await this.invalidateAllSessions(userId);

    return { message: 'PASSWORD_RESET_SUCCESS' };
  }

  // ── Activer MFA ───────────────────────────────────────────────
  async setupMfa(userId: string) {
    const secret = this.mfa.generateSecret();
    const qrCode = await this.mfa.generateQRCode(secret, userId);

    // Stocker temporairement
    await this.redis.setex(`mfa_setup:${userId}`, 600, secret);

    return { secret, qrCode };
  }

  async confirmMfa(userId: string, code: string) {
    const secret = await this.redis.get(`mfa_setup:${userId}`);
    if (!secret) throw new BadRequestException('MFA_SETUP_SESSION_EXPIRED');

    const isValid = this.mfa.verifyTOTP(code, secret);
    if (!isValid) throw new BadRequestException('MFA_INVALID_CODE');

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true, mfaSecret: secret },
    });

    await this.redis.del(`mfa_setup:${userId}`);
    return { message: 'MFA_ENABLED' };
  }

  // ── Helpers privés ────────────────────────────────────────────
  private async generateTokenPair(userId: string, email: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync({ sub: userId, email, role, type: 'access' }),
      this.tokens.generateRefreshToken(userId),
    ]);
    return { accessToken, refreshToken };
  }

  private async createSession(userId: string, ip: string, userAgent: string) {
    return this.prisma.session.create({
      data: {
        userId,
        token: crypto.randomBytes(32).toString('hex'),
        ipAddress: ip,
        userAgent,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      },
    });
  }

  private async handleFailedLogin(email: string, ip: string) {
    const key = `failed_login:${ip}`;
    const attempts = await this.redis.incr(key);
    if (attempts === 1) await this.redis.expire(key, 900); // 15 min
    if (attempts >= 10) {
      await this.redis.setex(`blocked_ip:${ip}`, 3600, '1');
    }
  }

  private async invalidateAllSessions(userId: string) {
    await this.prisma.session.deleteMany({ where: { userId } });
    await this.redis.del(`user_sessions:${userId}`);
  }

  private generateReferralCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  private sanitizeUser(user: any) {
    const { passwordHash, mfaSecret, ...safe } = user;
    return safe;
  }
}
