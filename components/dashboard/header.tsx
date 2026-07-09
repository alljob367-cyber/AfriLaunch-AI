// AfriLaunch AI — Dashboard Header (minimal shell)
'use client';

import Link from 'next/link';
import { Rocket, Bell, Search, Menu } from 'lucide-react';

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 glass border-b border-white/5 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-gray-400 hover:text-white">
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Rocket className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm hidden sm:block">
            AfriLaunch <span className="gradient-text">AI</span>
          </span>
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-2 glass rounded-full px-4 py-2 max-w-xs flex-1 mx-6">
        <Search className="w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Rechercher..."
          className="bg-transparent text-sm outline-none flex-1 placeholder:text-gray-500 text-white"
        />
        <kbd className="text-[10px] text-gray-500 glass px-1.5 py-0.5 rounded">⌘K</kbd>
      </div>

      <div className="flex items-center gap-3">
        <button className="glass rounded-full p-2 relative hover:scale-105 transition-transform">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
          EN
        </div>
      </div>
    </header>
  );
}
