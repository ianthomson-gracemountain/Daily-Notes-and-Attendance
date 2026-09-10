'use client';

import { AppView, UserRole } from '@/lib/types';
import { isFrozen } from '@/lib/freeze';

interface NavigationProps {
  view: AppView;
  setView: (view: AppView) => void;
  role: UserRole;
  onStartLog?: () => void;
}

interface TabItem {
  label: string;
  view: AppView;
  action?: () => void;
}

export default function Navigation({ view, setView, role, onStartLog }: NavigationProps) {
  const frozen = isFrozen();

  const providerTabs: TabItem[] = [
    { label: 'Dashboard', view: 'dashboard' },
    { label: 'Daily Notes', view: 'log', action: onStartLog },
    { label: 'My Notes', view: 'notes-history' },
    { label: 'Export Data', view: 'export' },
    { label: 'Settings', view: 'settings' },
  ];

  const adminTabs: TabItem[] = [
    { label: 'Overview', view: 'admin-dashboard' },
    { label: 'Providers', view: 'admin-providers' },
    { label: 'Clients', view: 'admin-clients' },
    { label: 'Assignments', view: 'admin-assignments' },
    { label: 'All Notes', view: 'admin-notes' },
    { label: 'Settings', view: 'settings' },
  ];

  const tabs: TabItem[] = role === 'admin' ? adminTabs : providerTabs;

  return (
    <nav className="bg-gm-green-dark border-t border-gm-green-light">
      <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.view}
            onClick={() => {
              if ('action' in tab && tab.action) {
                if (frozen) return;
                tab.action();
              } else {
                setView(tab.view);
              }
            }}
            disabled={frozen && 'action' in tab && !!tab.action}
            aria-disabled={frozen && 'action' in tab && !!tab.action}
            className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap disabled:text-gm-cream/30 disabled:hover:text-gm-cream/30 ${
              view === tab.view
                ? 'text-gm-gold border-b-2 border-gm-gold'
                : 'text-gm-cream/70 hover:text-gm-cream'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
