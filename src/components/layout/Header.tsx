'use client';

import { AppSession } from '@/lib/types';

interface HeaderProps {
  session: AppSession | null;
  onLogout: () => void;
}

function MountainIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-gm-cream">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20l5.5-11L12 15l3.5-7L21 20H3z" />
      <circle cx="17" cy="6" r="2" />
    </svg>
  );
}

export default function Header({ session, onLogout }: HeaderProps) {
  return (
    <header className="bg-gm-green shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MountainIcon />
          <div>
            <h1 className="text-gm-cream text-lg tracking-wide" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
              Grace Mountain
            </h1>
            <p className="text-gm-gold text-xs tracking-wider" style={{ fontFamily: 'var(--font-josefin), Josefin Sans, sans-serif' }}>
              fostering family homes
            </p>
          </div>
        </div>
        {session && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-gm-cream/80 text-sm">{session.user.name}</span>
              <span className="block text-gm-gold/60 text-xs capitalize">{session.role}</span>
            </div>
            <button
              onClick={onLogout}
              className="text-gm-cream/60 hover:text-gm-cream text-xs border border-gm-cream/30 rounded px-2 py-1 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
