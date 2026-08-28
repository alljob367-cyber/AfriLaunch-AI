// AfriLaunch AI — API Documentation (Swagger/OpenAPI)
// Accessible at /api-docs

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'AfriLaunch AI API',
    version: '1.0.0',
    description: 'Plateforme IA tout-en-un pour entrepreneurs africains. 13 agents IA, génération de contenu, site web, identité de marque, paiements Mobile Money (FCFA), WhatsApp Agent, et plus.',
    contact: { email: 'admin@albermon.com' },
    license: { name: 'Proprietary' },
  },
  servers: [
    { url: 'https://afrilaunchia.vercel.app', description: 'Production' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'afrilaunch_user',
      },
      adminAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'afrilaunch_admin',
      },
    },
  },
  paths: {
    // Auth
    '/api/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: {
            firstName: { type: 'string' }, email: { type: 'string' },
            password: { type: 'string' }, referredBy: { type: 'string' },
          } } } },
        },
        responses: { '200': { description: 'User created' }, '400': { description: 'Bad request' } },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Login',
        tags: ['Auth'],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: {
          email: { type: 'string' }, password: { type: 'string' },
        } } } } },
        responses: { '200': { description: 'Login successful' }, '401': { description: 'Invalid credentials' } },
      },
    },
    '/api/auth/me': {
      get: { summary: 'Get current user', tags: ['Auth'], security: [{ cookieAuth: [] }],
        responses: { '200': { description: 'User profile' }, '401': { description: 'Not authenticated' } } },
    },
    // AI
    '/api/ai/generate-async': {
      post: { summary: 'Generate content (async)', tags: ['AI'], security: [{ cookieAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: {
          type: { type: 'string', enum: ['identity', 'website', 'content'] },
          businessName: { type: 'string' }, industry: { type: 'string' },
          topic: { type: 'string' }, format: { type: 'string' }, tone: { type: 'string' },
        } } } } },
        responses: { '200': { description: 'Job created' }, '402': { description: 'Insufficient credits' } } },
      get: { summary: 'Poll job status', tags: ['AI'], security: [{ cookieAuth: [] }],
        parameters: [{ name: 'jobId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Job status' } } },
    },
    '/api/ai/voice': {
      post: { summary: 'Text-to-speech', tags: ['AI'], security: [{ cookieAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: {
          text: { type: 'string', maxLength: 5000 },
        } } } } },
        responses: { '200': { description: 'Audio generated' } } },
    },
    // Organization
    '/api/organization': {
      get: { summary: 'Get organization', tags: ['Organization'], security: [{ cookieAuth: [] }],
        responses: { '200': { description: 'Organization data' } } },
      post: { summary: 'Create/update organization', tags: ['Organization'], security: [{ cookieAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: {
          name: { type: 'string' }, industry: { type: 'string' }, country: { type: 'string' },
        } } } } },
        responses: { '200': { description: 'Organization created' } } },
    },
    // Social
    '/api/social/connect': {
      post: { summary: 'Connect social account', tags: ['Social'], security: [{ cookieAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: {
          platform: { type: 'string', enum: ['instagram', 'tiktok', 'facebook', 'whatsapp', 'linkedin', 'twitter'] },
          handle: { type: 'string' },
        } } } } },
        responses: { '200': { description: 'Account connected' } } },
    },
    '/api/social/publish': {
      post: { summary: 'Publish content', tags: ['Social'], security: [{ cookieAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: {
          platform: { type: 'string' }, content: { type: 'string' }, imageUrl: { type: 'string' },
        } } } } },
        responses: { '200': { description: 'Published' } } },
    },
    // Payment
    '/api/payment-manual/create': {
      post: { summary: 'Create payment order (FCFA)', tags: ['Payment'], security: [{ cookieAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: {
          type: { type: 'string', enum: ['plan', 'pack'] }, itemId: { type: 'string' },
          country: { type: 'string' }, method: { type: 'string' },
        } } } } },
        responses: { '200': { description: 'Order created' } } },
    },
    // WhatsApp
    '/api/whatsapp-agent/webhook': {
      post: { summary: 'Twilio WhatsApp webhook', tags: ['WhatsApp'],
        responses: { '200': { description: 'TwiML response' } } },
    },
    '/api/whatsapp-agent/status': {
      get: { summary: 'WhatsApp agent status (public)', tags: ['WhatsApp'],
        responses: { '200': { description: 'Status' } } },
    },
    // Admin
    '/api/admin/config': {
      get: { summary: 'Get app config', tags: ['Admin'], security: [{ adminAuth: [] }],
        responses: { '200': { description: 'Config' }, '401': { description: 'Unauthorized' } } },
      put: { summary: 'Update app config', tags: ['Admin'], security: [{ adminAuth: [] }],
        responses: { '200': { description: 'Config updated' } } },
    },
    '/api/admin/metrics': {
      get: { summary: 'Get financial metrics', tags: ['Admin'], security: [{ adminAuth: [] }],
        responses: { '200': { description: 'Metrics' } } },
    },
  },
};
