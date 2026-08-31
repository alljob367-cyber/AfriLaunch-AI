// AfriLaunch AI — YouTube module (import videos + auto-publish calendar)
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Youtube, Sparkles, Loader2, Save, Plus, Trash2, Calendar, Clock,
  Send, Check, AlertCircle, Video, ExternalLink, Edit3, X, Upload, Film,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';

interface VideoPost {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  visibility: string;
  videoUrl: string;
  thumbnailPrompt?: string;
  scheduledAt: number | null;
  status: string;
  publishedAt?: number;
  youtubeUrl?: string;
  error?: string;
  createdAt: number;
}

interface ScheduleConfig {
  enabled: boolean;
  activeDays: number[];
  publishTime: string;
  timezone: string;
  frequency: string;
  autoNotifyEmail: boolean;
  autoNotifyWhatsApp: boolean;
  maxVideosPerWeek: number;
}

const DAYS = [
  { value: 1, label: 'Lun' }, { value: 2, label: 'Mar' }, { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' }, { value: 5, label: 'Ven' }, { value: 6, label: 'Sam' },
  { value: 0, label: 'Dim' },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
  scheduled: { label: 'Programmée', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  publishing: { label: 'Publication', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  published: { label: 'Publiée', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  failed: { label: 'Échec', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  canceled: { label: 'Annulée', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
};

export default function YouTubePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [schedule, setSchedule] = useState<ScheduleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New video form
  const [topic, setTopic] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; sizeMB: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [vidRes, schRes] = await Promise.all([
        fetch('/api/youtube/videos', { credentials: 'include' }),
        fetch('/api/youtube/schedule', { credentials: 'include' }),
      ]);
      const vidData = await vidRes.json();
      const schData = await schRes.json();
      if (vidData.ok) setVideos(vidData.videos);
      if (schData.ok) setSchedule(schData.schedule);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-poll when there are scheduled videos
  useEffect(() => {
    const hasScheduled = videos.some((v) => v.status === 'scheduled' || v.status === 'publishing');
    if (hasScheduled) {
      const id = setInterval(fetchAll, 10000);
      return () => clearInterval(id);
    }
  }, [videos, fetchAll]);

  function toggleDay(day: number) {
    if (!schedule) return;
    const days = schedule.activeDays;
    setSchedule({
      ...schedule,
      activeDays: days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort(),
    });
  }

  async function handleSaveSchedule() {
    if (!schedule) return;
    setSavingSchedule(true);
    try {
      const res = await fetch('/api/youtube/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(schedule),
      });
      const data = await res.json();
      if (data.ok) {
        setSchedule(data.schedule);
        toast({ title: 'Calendrier enregistré ✅', variant: 'success' });
      } else {
        toast({ title: 'Échec', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setSavingSchedule(false);
    }
  }

  async function handleGenerateContent() {
    if (!topic.trim()) {
      toast({ title: 'Topic requis', description: 'Décrivez le sujet de votre vidéo.', variant: 'warning' });
      return;
    }
    setGenerating(true);
    setGeneratedContent(null);
    try {
      const res = await fetch('/api/youtube/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (data.ok) {
        setGeneratedContent(data);
        toast({ title: 'Contenu généré 🎬', description: `${data.creditsUsed} crédits débités.`, variant: 'success' });
      } else {
        toast({ title: 'Échec', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setGenerating(false);
    }
  }

  async function handleUploadVideo(file: File) {
    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Format non supporté',
        description: 'Sélectionnez un fichier vidéo (MP4, MOV, AVI, WebM, MKV, 3GP, FLV, MPEG, OGG).',
        variant: 'error',
      });
      return;
    }
    // Validate size (50MB max — storage backend is Supabase KV, not designed
    // for large blobs. For larger videos, use a direct YouTube URL.)
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > 50) {
      toast({
        title: 'Fichier trop volumineux',
        description: `${sizeMB.toFixed(1)} Mo. Maximum: 50 Mo. Pour les vidéos plus grandes, utilisez un lien YouTube direct.`,
        variant: 'error',
      });
      return;
    }

    setUploading(true);
    setUploadedFile(null);
    try {
      const fd = new FormData();
      fd.append('file', file, file.name);
      fd.append('title', topic || file.name.replace(/\.[^.]+$/, ''));

      const res = await fetch('/api/youtube/upload', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      const data = await res.json();
      if (data.ok) {
        setVideoUrl(data.videoUrl);
        setUploadedFile({ name: data.fileName, sizeMB: data.fileSizeMB });
        toast({
          title: 'Vidéo importée ✅',
          description: `${data.fileName} (${data.fileSizeMB} Mo) prête à publier.`,
          variant: 'success',
        });
      } else {
        toast({ title: 'Échec upload', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUploadVideo(file);
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUploadVideo(file);
  }

  async function handleCreateVideo() {
    if (!generatedContent && !topic.trim()) {
      toast({ title: 'Générez le contenu d\'abord', variant: 'warning' });
      return;
    }
    if (!videoUrl.trim()) {
      toast({ title: 'URL vidéo requise', description: 'Collez le lien de votre vidéo (YouTube upload, Drive, ou URL directe).', variant: 'warning' });
      return;
    }

    const content = generatedContent || { title: topic, description: '', tags: [], category: 'People & Blogs' };
    const schedTs = scheduledAt ? new Date(scheduledAt).getTime() : null;

    try {
      const res = await fetch('/api/youtube/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: content.title,
          description: content.description,
          tags: content.tags,
          category: content.category,
          videoUrl,
          thumbnailPrompt: content.thumbnailPrompt,
          scheduledAt: schedTs,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast({
          title: schedTs ? 'Vidéo programmée 📅' : 'Vidéo créée ✅',
          description: schedTs ? 'Elle sera publiée automatiquement à la date prévue.' : 'Elle sera publiée selon votre calendrier.',
          variant: 'success',
        });
        setShowCreateModal(false);
        setTopic(''); setVideoUrl(''); setGeneratedContent(null); setScheduledAt('');
        await fetchAll();
      } else {
        toast({ title: 'Échec', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    }
  }

  async function handlePublishNow(video: VideoPost) {
    setPublishing(video.id);
    try {
      // Try auto-publish first (real upload to YouTube via Data API v3)
      // Falls back to YouTube Studio deep link if OAuth not configured
      const res = await fetch('/api/youtube/auto-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ videoId: video.id }),
      });
      const data = await res.json();

      if (data.ok && data.youtubeUrl) {
        // ✅ Auto-published successfully
        toast({
          title: 'Vidéo publiée automatiquement 🎉',
          description: `Disponible sur YouTube : ${data.youtubeUrl}`,
          variant: 'success',
        });
        await fetchAll();
      } else if (data.fallbackStudioUrl) {
        // Fallback: open YouTube Studio with prefilled fields
        window.open(data.fallbackStudioUrl, '_blank', 'noopener,noreferrer');
        toast({
          title: 'YouTube Studio ouvert 🎬',
          description: 'Publication auto non configurée. Uploadez votre vidéo dans la fenêtre ouverte, puis publiez.',
          variant: 'warning',
        });
        await fetchAll();
      } else if (data.connectUrl) {
        // User needs to connect their YouTube account
        toast({
          title: 'YouTube non connecté',
          description: data.error,
          variant: 'warning',
        });
        // Optionally redirect
        // window.location.href = data.connectUrl;
      } else {
        toast({ title: 'Échec publication', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setPublishing(null);
    }
  }

  async function handleDelete(videoId: string) {
    if (!confirm('Supprimer cette vidéo ?')) return;
    try {
      const res = await fetch(`/api/youtube/videos/${videoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.ok) {
        await fetchAll();
        toast({ title: 'Vidéo supprimée', variant: 'warning' });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'error' });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-red-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="YouTube"
          description="Importez vos vidéos, l'IA génère titre/description/tags, et publie automatiquement selon votre calendrier."
          icon={Youtube}
          gradient="from-red-500 to-rose-600"
          action={
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:scale-105 transition-transform shadow-lg"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Nouvelle vidéo
            </button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schedule config (left) */}
          <div className="lg:col-span-1">
            <div className="card-premium sticky top-6">
              <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-400" aria-hidden="true" />
                Calendrier auto
              </h2>

              {schedule && (
                <div className="space-y-4">
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div>
                      <p className="text-sm font-semibold">Publication auto</p>
                      <p className="text-[11px] text-gray-500">Publier selon le calendrier ci-dessous</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSchedule({ ...schedule, enabled: !schedule.enabled })}
                      className={cn(
                        'relative w-11 h-6 rounded-full transition-colors flex-shrink-0',
                        schedule.enabled ? 'bg-red-500' : 'bg-gray-700',
                      )}
                      aria-pressed={schedule.enabled}
                    >
                      <span className={cn(
                        'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                        schedule.enabled ? 'translate-x-5' : 'translate-x-0.5',
                      )} />
                    </button>
                  </label>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block">JOURS DE PUBLICATION</label>
                    <div className="flex flex-wrap gap-1.5">
                      {DAYS.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleDay(d.value)}
                          className={cn(
                            'px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                            schedule.activeDays.includes(d.value)
                              ? 'border-red-500 bg-red-500/10 text-white'
                              : 'border-white/5 glass text-gray-500 hover:text-white',
                          )}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 mb-1.5 block flex items-center gap-1">
                        <Clock className="w-3 h-3" /> HEURE
                      </label>
                      <input
                        type="time"
                        value={schedule.publishTime}
                        onChange={(e) => setSchedule({ ...schedule, publishTime: e.target.value })}
                        className="w-full glass rounded-xl px-3 py-2 border border-white/5 focus:border-red-500/40 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 mb-1.5 block">MAX/SEMAINE</label>
                      <input
                        type="number"
                        min={1}
                        max={7}
                        value={schedule.maxVideosPerWeek}
                        onChange={(e) => setSchedule({ ...schedule, maxVideosPerWeek: Number(e.target.value) })}
                        className="w-full glass rounded-xl px-3 py-2 border border-white/5 focus:border-red-500/40 outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block">FUSEAU HORAIRE</label>
                    <select
                      value={schedule.timezone}
                      onChange={(e) => setSchedule({ ...schedule, timezone: e.target.value })}
                      className="w-full glass rounded-xl px-3 py-2 border border-white/5 focus:border-red-500/40 outline-none text-sm"
                    >
                      <option value="Africa/Douala" className="bg-gray-900">Cameroun (WAT)</option>
                      <option value="Africa/Dakar" className="bg-gray-900">Sénégal (GMT)</option>
                      <option value="Africa/Abidjan" className="bg-gray-900">Côte d'Ivoire (GMT)</option>
                      <option value="Africa/Lagos" className="bg-gray-900">Nigeria (WAT)</option>
                      <option value="Africa/Nairobi" className="bg-gray-900">Kenya (EAT)</option>
                      <option value="Europe/Paris" className="bg-gray-900">France (CET)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className="text-xs font-semibold">Notification email</span>
                      <button
                        type="button"
                        onClick={() => setSchedule({ ...schedule, autoNotifyEmail: !schedule.autoNotifyEmail })}
                        className={cn(
                          'relative w-9 h-5 rounded-full transition-colors flex-shrink-0',
                          schedule.autoNotifyEmail ? 'bg-red-500' : 'bg-gray-700',
                        )}
                      >
                        <span className={cn(
                          'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                          schedule.autoNotifyEmail ? 'translate-x-4' : 'translate-x-0.5',
                        )} />
                      </button>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveSchedule}
                    disabled={savingSchedule}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {savingSchedule ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
                    Enregistrer le calendrier
                  </button>

                  <p className="text-[10px] text-gray-600 leading-relaxed">
                    💡 Le cron vérifie toutes les heures. À l'heure programmée, l'IA envoie un email avec un lien YouTube Studio pré-rempli (titre, description, tags). Cliquez pour finaliser la publication.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Videos list (right) */}
          <div className="lg:col-span-2 space-y-4">
            {videos.length === 0 ? (
              <div className="card-premium p-8 text-center">
                <Video className="w-10 h-10 text-gray-600 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm text-gray-400 mb-1">Aucune vidéo</p>
                <p className="text-xs text-gray-600 mb-4">
                  Cliquez sur « Nouvelle vidéo » pour importer une vidéo et générer son contenu IA.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:scale-105 transition-transform"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" /> Créer ma première vidéo
                </button>
              </div>
            ) : (
              videos.map((video) => {
                const status = STATUS_LABELS[video.status] || STATUS_LABELS.draft;
                return (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-premium p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center flex-shrink-0">
                        <Video className="w-5 h-5 text-white" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-semibold truncate">{video.title}</p>
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border', status.color)}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{video.description}</p>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500">
                          <span>{video.tags.length} tags</span>
                          <span>·</span>
                          <span>{video.category}</span>
                          {video.scheduledAt && (
                            <>
                              <span>·</span>
                              <span className="text-blue-400">
                                📅 {new Date(video.scheduledAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </>
                          )}
                          {video.publishedAt && (
                            <>
                              <span>·</span>
                              <span className="text-emerald-400">
                                ✓ Publiée {new Date(video.publishedAt).toLocaleDateString('fr-FR')}
                              </span>
                            </>
                          )}
                        </div>
                        {video.error && (
                          <p className="text-[10px] text-red-400 mt-1">⚠ {video.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                      {video.status === 'published' && video.youtubeUrl ? (
                        <a
                          href={video.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold glass border border-white/10 hover:bg-white/10"
                        >
                          <ExternalLink className="w-3 h-3" aria-hidden="true" /> Voir sur YouTube
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePublishNow(video)}
                          disabled={publishing === video.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:scale-[1.02] transition-transform disabled:opacity-60"
                        >
                          {publishing === video.id
                            ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                            : <Send className="w-3 h-3" aria-hidden="true" />}
                          Publier maintenant
                        </button>
                      )}
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold glass border border-white/10 hover:bg-white/10"
                      >
                        <ExternalLink className="w-3 h-3" aria-hidden="true" /> Source
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(video.id)}
                        aria-label="Supprimer"
                        className="ml-auto p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Create video modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-6 border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-base flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-red-400" aria-hidden="true" />
                  Nouvelle vidéo
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  aria-label="Fermer"
                  className="p-2 rounded-lg hover:bg-white/5"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Step 1: Topic + AI content gen */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">SUJET DE LA VIDÉO</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Ex: Comment lancer un restaurant à Douala avec 500 000 FCFA"
                      className="flex-1 glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-red-500/40 outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateContent}
                      disabled={generating || !topic.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-600 hover:scale-[1.02] transition-transform disabled:opacity-60"
                    >
                      {generating ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Sparkles className="w-4 h-4" aria-hidden="true" />}
                      Générer (3 crédits)
                    </button>
                  </div>
                </div>

                {/* Generated content preview */}
                {generatedContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-4 border border-violet-500/20 bg-violet-500/5 space-y-3"
                  >
                    <p className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Contenu généré par IA
                    </p>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Titre</p>
                      <p className="text-sm font-semibold">{generatedContent.title}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Description</p>
                      <p className="text-xs text-gray-300 whitespace-pre-wrap line-clamp-4">{generatedContent.description}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Tags ({generatedContent.tags?.length || 0})</p>
                      <div className="flex flex-wrap gap-1">
                        {(generatedContent.tags || []).map((tag: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[10px] glass border border-white/10">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500">Catégorie: {generatedContent.category}</p>
                  </motion.div>
                )}

                {/* Step 2: Video source — upload file OR paste URL */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">SOURCE DE LA VIDÉO *</label>

                  {/* Dropzone for file upload */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'relative cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-all',
                      dragOver
                        ? 'border-red-500/60 bg-red-500/10'
                        : uploadedFile
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : 'border-white/10 hover:border-red-500/40 hover:bg-white/5',
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Loader2 className="w-6 h-6 animate-spin text-red-400" aria-hidden="true" />
                        <p className="text-xs text-gray-400">Upload en cours...</p>
                      </div>
                    ) : uploadedFile ? (
                      <div className="flex flex-col items-center gap-1.5 py-1">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
                          <Film className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                        </div>
                        <p className="text-xs font-semibold text-emerald-300">{uploadedFile.name}</p>
                        <p className="text-[10px] text-gray-500">{uploadedFile.sizeMB} Mo · Cliquez pour changer</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 py-1">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                          <Upload className="w-5 h-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <p className="text-xs font-semibold text-gray-300">Importer une vidéo</p>
                        <p className="text-[10px] text-gray-500">Glissez-déposez ou cliquez · MP4, MOV, WebM · max 500 Mo</p>
                      </div>
                    )}
                  </div>

                  {/* OR separator */}
                  <div className="flex items-center gap-3 my-2.5">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[10px] text-gray-600 uppercase">OU</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* URL input */}
                  <input
                    type="url"
                    value={videoUrl.startsWith('/api/youtube/file') ? '' : videoUrl}
                    onChange={(e) => {
                      setVideoUrl(e.target.value);
                      setUploadedFile(null);
                    }}
                    placeholder="https://youtu.be/... ou https://drive.google.com/..."
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-red-500/40 outline-none text-sm"
                  />
                  <p className="text-[10px] text-gray-600 mt-1">
                    {uploadedFile
                      ? `✅ Fichier importé prêt à publier`
                      : 'Importez votre fichier ou collez un lien YouTube/Drive déjà uploadé.'}
                  </p>
                </div>

                {/* Step 3: Schedule (optional) */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">PROGRAMMER (optionnel)</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-red-500/40 outline-none text-sm"
                  />
                  <p className="text-[10px] text-gray-600 mt-1">
                    Laissez vide pour utiliser le calendrier auto.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateVideo}
                  disabled={!videoUrl.trim() || (!generatedContent && !topic.trim())}
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:scale-[1.01] transition-transform shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  {scheduledAt ? 'Programmer la vidéo' : 'Créer la vidéo'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
