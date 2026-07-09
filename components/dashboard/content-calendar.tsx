// AfriLaunch AI — Content Calendar Widget (compact)
'use client';

import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface CalendarPost {
  id: string;
  date: Date; // full date of the post
  title: string;
  platform: string;
  time: string;
  color: string;
}

interface ContentCalendarProps {
  posts?: CalendarPost[];
}

// Mock posts anchored to the current month so the widget always shows
// upcoming content relative to "today".
function buildMockPosts(now: Date): CalendarPost[] {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const mk = (day: number, hour: number, minute: number, title: string, platform: string, color: string): CalendarPost => ({
    id: `${day}-${title}`,
    date: new Date(y, m, day, hour, minute),
    title,
    platform,
    time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    color,
  });

  const posts: CalendarPost[] = [];
  // Use next few days from today, capping at month end
  const lastDay = new Date(y, m + 1, 0).getDate();
  const days = [d, d + 3, d + 5, d + 7, d + 13].filter((x) => x <= lastDay);
  if (days[0]) posts.push(mk(days[0], 19, 30, 'Reel "Coulisses atelier"', 'Instagram', 'bg-pink-500'));
  if (days[0]) posts.push(mk(days[0], 9, 0, 'Newsletter mensuelle', 'Email', 'bg-orange-500'));
  if (days[1]) posts.push(mk(days[1], 18, 0, 'Tuto "Comment styliser"', 'TikTok', 'bg-slate-500'));
  if (days[2]) posts.push(mk(days[2], 12, 0, 'Carrousel "Collection été"', 'Instagram', 'bg-pink-500'));
  if (days[3]) posts.push(mk(days[3], 20, 0, 'Live Q&A', 'Facebook', 'bg-blue-500'));
  if (days[4]) posts.push(mk(days[4], 10, 0, 'Article blog SEO', 'Site web', 'bg-emerald-500'));
  return posts;
}

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function ContentCalendar({ posts }: ContentCalendarProps) {
  const now = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState({ month: now.getMonth(), year: now.getFullYear() });

  const resolvedPosts = useMemo(() => posts ?? buildMockPosts(now), [posts, now]);

  const daysInMonth = useMemo(
    () => new Date(cursor.year, cursor.month + 1, 0).getDate(),
    [cursor],
  );
  // Monday-first index (Mon=0 ... Sun=6)
  const firstDayIdx = useMemo(
    () => (new Date(cursor.year, cursor.month, 1).getDay() + 6) % 7,
    [cursor],
  );

  const cells: (number | null)[] = useMemo(() => {
    const arr: (number | null)[] = [...Array(firstDayIdx).fill(null)];
    for (let i = 1; i <= daysInMonth; i++) arr.push(i);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [firstDayIdx, daysInMonth]);

  const postsForDay = (day: number | null) => {
    if (!day) return [];
    return resolvedPosts.filter((p) => {
      const d = p.date;
      return (
        d.getFullYear() === cursor.year &&
        d.getMonth() === cursor.month &&
        d.getDate() === day
      );
    });
  };

  const todayDay = now.getDate();
  const isCurrentMonth = cursor.month === now.getMonth() && cursor.year === now.getFullYear();

  const upcoming = useMemo(() => {
    const future = resolvedPosts
      .filter((p) => p.date.getTime() >= now.getTime())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 3);
    return future.length > 0 ? future : resolvedPosts.slice(0, 3);
  }, [resolvedPosts, now]);

  const goPrev = () => {
    setCursor((c) => {
      const m = c.month - 1;
      if (m < 0) return { month: 11, year: c.year - 1 };
      return { ...c, month: m };
    });
  };
  const goNext = () => {
    setCursor((c) => {
      const m = c.month + 1;
      if (m > 11) return { month: 0, year: c.year + 1 };
      return { ...c, month: m };
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" aria-hidden="true" />
          <h3 className="font-semibold text-sm">
            {MONTHS[cursor.month]} {cursor.year}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Mois précédent"
            className="glass rounded-lg p-1.5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Mois suivant"
            className="glass rounded-lg p-1.5 hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] text-muted-foreground font-semibold py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {cells.map((day, i) => {
          const dayPosts = postsForDay(day);
          const isToday = day !== null && isCurrentMonth && day === todayDay;
          return (
            <div
              key={i}
              className={cn(
                'aspect-square rounded-lg p-1 flex flex-col items-center justify-center relative',
                day ? 'glass hover:bg-white/10 cursor-pointer' : '',
                isToday && 'ring-2 ring-primary',
              )}
            >
              {day && (
                <>
                  <span className="text-[11px] font-medium">{day}</span>
                  {dayPosts.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayPosts.slice(0, 3).map((p) => (
                        <div key={p.id} className={cn('w-1 h-1 rounded-full', p.color)} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Upcoming posts list */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
          À venir
        </p>
        {upcoming.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-2.5 rounded-lg glass hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div className={cn('w-9 h-9 rounded-lg flex flex-col items-center justify-center text-white text-[10px] font-bold', post.color)}>
              <span className="text-[9px] leading-none opacity-80">{MONTHS[post.date.getMonth()].slice(0, 3)}</span>
              <span className="text-sm leading-none">{post.date.getDate()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{post.title}</p>
              <p className="text-[10px] text-muted-foreground">{post.platform} · {post.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
