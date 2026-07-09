// AfriLaunch AI — Content Calendar Widget (compact)
'use client';

import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ContentCalendarProps {
  posts?: Array<{
    id: string;
    date: number; // day of month
    title: string;
    platform: string;
    time: string;
    color: string;
  }>;
}

const samplePosts: NonNullable<ContentCalendarProps['posts']> = [
  { id: '1', date: 9, title: 'Reel "Coulisses atelier"', platform: 'Instagram', time: '19:30', color: 'bg-pink-500' },
  { id: '2', date: 9, title: 'Newsletter mensuelle', platform: 'Email', time: '09:00', color: 'bg-orange-500' },
  { id: '3', date: 12, title: 'Tuto "Comment styliser"', platform: 'TikTok', time: '18:00', color: 'bg-slate-500' },
  { id: '4', date: 14, title: 'Carrousel "Collection été"', platform: 'Instagram', time: '12:00', color: 'bg-pink-500' },
  { id: '5', date: 16, title: 'Live Q&A', platform: 'Facebook', time: '20:00', color: 'bg-blue-500' },
  { id: '6', date: 22, title: 'Article blog SEO', platform: 'Site web', time: '10:00', color: 'bg-emerald-500' },
];

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function ContentCalendar({ posts = samplePosts }: ContentCalendarProps) {
  const [cursor, setCursor] = useState({ month: 6, year: 2025 }); // Juillet 2025
  const today = 9;
  const daysInMonth = 31;

  // Build calendar grid (starting on Tuesday = index 1 for July 2025)
  const firstDayIdx = 1;
  const cells: (number | null)[] = [
    ...Array(firstDayIdx).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const postsForDay = (day: number | null) =>
    day ? posts.filter((p) => p.date === day) : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">
            {MONTHS[cursor.month]} {cursor.year}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor((c) => ({ ...c, month: (c.month + 11) % 12 }))}
            className="glass rounded-lg p-1.5 hover:bg-white/10"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCursor((c) => ({ ...c, month: (c.month + 1) % 12 }))}
            className="glass rounded-lg p-1.5 hover:bg-white/10"
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
          const isToday = day === today;
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
        {posts.slice(0, 3).map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-2.5 rounded-lg glass hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div className={cn('w-9 h-9 rounded-lg flex flex-col items-center justify-center text-white text-[10px] font-bold', post.color)}>
              <span className="text-[9px] leading-none opacity-80">{MONTHS[cursor.month].slice(0, 3)}</span>
              <span className="text-sm leading-none">{post.date}</span>
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
