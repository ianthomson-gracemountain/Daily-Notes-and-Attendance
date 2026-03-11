'use client';

import { useEffect, useState, useCallback } from 'react';
import { Client, DayStatus, Provider, UserRole } from '@/lib/types';
import { getClientsForProvider, getDayStatuses, getNoteForClientDate } from '@/lib/store';
import { getClientDisplayName, getInitials } from '@/lib/phi';
import { getAppSettings } from '@/lib/store';

interface DashboardViewProps {
  provider: Provider;
  role: UserRole;
  clients: Client[];
  onStartLog: (client?: Client, date?: string) => void;
}

function BellIcon({ missed }: { missed: boolean }) {
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 ${missed ? 'text-gm-red bell-shake' : 'text-gm-success'}`}>
      {missed ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M5.85 3.5a.75.75 0 0 0-1.117-1 9.719 9.719 0 0 0-2.348 4.876.75.75 0 0 0 1.479.248A8.219 8.219 0 0 1 5.85 3.5ZM19.267 2.5a.75.75 0 1 0-1.118 1 8.22 8.22 0 0 1 1.987 4.124.75.75 0 0 0 1.48-.248A9.72 9.72 0 0 0 19.266 2.5Z" />
          <path fillRule="evenodd" d="M12 2.25A6.75 6.75 0 0 0 5.25 9v.75a8.217 8.217 0 0 1-2.119 5.52.75.75 0 0 0 .298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 1 0 7.48 0 24.583 24.583 0 0 0 4.83-1.244.75.75 0 0 0 .298-1.205 8.217 8.217 0 0 1-2.118-5.52V9A6.75 6.75 0 0 0 12 2.25ZM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 0 0 4.496 0l.002.1a2.25 2.25 0 1 1-4.5 0Z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
        </svg>
      )}
    </span>
  );
}

export default function DashboardView({ provider, role, clients, onStartLog }: DashboardViewProps) {
  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, missed: 0 });
  const settings = getAppSettings();

  const refreshDashboard = useCallback(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    const endOfWeek = new Date(today);

    const statuses = getDayStatuses(provider.id, startOfWeek, endOfWeek);
    setDayStatuses(statuses);

    const total = statuses.length;
    const completed = statuses.filter(s => s.status === 'completed').length;
    setStats({ total, completed, missed: total - completed });
  }, [provider.id]);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  function formatDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  function displayName(client: Client): string {
    return getClientDisplayName(client, role, settings.phiProtectionEnabled);
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Quick Action */}
      <div className="bg-gm-green rounded-2xl p-6 text-center shadow-lg">
        <h2 className="text-gm-cream text-xl mb-2" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>Daily Notes</h2>
        <p className="text-gm-cream/70 text-sm mb-4">Log attendance and notes for your clients</p>
        <button
          onClick={() => onStartLog()}
          className="bg-gm-gold hover:bg-gm-gold-light text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-md text-lg"
        >
          + Log Daily Note
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-gm-green">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Total This Week</p>
        </div>
        <div className="bg-gm-success-light rounded-xl p-4 text-center shadow-sm border border-green-100">
          <p className="text-2xl font-bold text-gm-success">{stats.completed}</p>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
        </div>
        <div className={`rounded-xl p-4 text-center shadow-sm border ${stats.missed > 0 ? 'bg-gm-red-light border-red-100' : 'bg-white border-gray-100'}`}>
          <p className={`text-2xl font-bold ${stats.missed > 0 ? 'text-gm-red' : 'text-gray-400'}`}>{stats.missed}</p>
          <p className="text-xs text-gray-500 mt-1">Missed</p>
        </div>
      </div>

      {/* This Week's Log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gm-green-dark" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>This Week</h3>
          {stats.missed > 0 && (
            <span className="inline-flex items-center gap-1 bg-gm-red-light text-gm-red text-xs font-medium px-2.5 py-1 rounded-full">
              <span className="bell-shake inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M5.85 3.5a.75.75 0 0 0-1.117-1 9.719 9.719 0 0 0-2.348 4.876.75.75 0 0 0 1.479.248A8.219 8.219 0 0 1 5.85 3.5ZM19.267 2.5a.75.75 0 1 0-1.118 1 8.22 8.22 0 0 1 1.987 4.124.75.75 0 0 0 1.48-.248A9.72 9.72 0 0 0 19.266 2.5Z" />
                  <path fillRule="evenodd" d="M12 2.25A6.75 6.75 0 0 0 5.25 9v.75a8.217 8.217 0 0 1-2.119 5.52.75.75 0 0 0 .298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 1 0 7.48 0 24.583 24.583 0 0 0 4.83-1.244.75.75 0 0 0 .298-1.205 8.217 8.217 0 0 1-2.118-5.52V9A6.75 6.75 0 0 0 12 2.25ZM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 0 0 4.496 0l.002.1a2.25 2.25 0 1 1-4.5 0Z" clipRule="evenodd" />
                </svg>
              </span>
              {stats.missed} missed
            </span>
          )}
        </div>
        <div className="divide-y divide-gray-50">
          {dayStatuses.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              No entries for this week yet. Start logging!
            </div>
          ) : (
            dayStatuses.map((status) => {
              const client = clients.find(c => c.id === status.clientId);
              return (
                <div
                  key={`${status.date}-${status.clientId}`}
                  className={`px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${status.status === 'missed' ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (status.status === 'missed' && client) {
                      onStartLog(client, status.date);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <BellIcon missed={status.status === 'missed'} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {client ? displayName(client) : status.clientName}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(status.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {status.status === 'completed' ? (
                      <span className="text-xs bg-gm-success-light text-gm-success font-medium px-2.5 py-1 rounded-full">
                        {status.note?.servicesProvided ? 'Services Provided' : 'Absent'}
                      </span>
                    ) : (
                      <span className="text-xs bg-gm-red-light text-gm-red font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                        Tap to log
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Log Buttons per Client */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gm-green-dark" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>Your Clients</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {clients.map(client => {
            const todayNote = getNoteForClientDate(client.id, new Date().toISOString().split('T')[0]);
            const name = displayName(client);
            return (
              <div key={client.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${todayNote ? 'bg-gm-success' : 'bg-gm-gold'}`}>
                    {getInitials(client.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{name}</p>
                    <p className="text-xs text-gray-400">
                      {todayNote ? 'Logged today' : 'Not logged today'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onStartLog(client)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${todayNote ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-gm-coral text-white hover:bg-gm-coral-light'}`}
                >
                  {todayNote ? 'Edit' : 'Log Now'}
                </button>
              </div>
            );
          })}
          {clients.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              No clients assigned to you yet. Contact your admin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
