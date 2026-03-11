'use client';

import { useState, useEffect, useCallback } from 'react';
import { Client, DailyNote, DayStatus, Provider } from '@/lib/types';
import {
  initializeStore,
  getProviders,
  getCurrentProvider,
  setCurrentProvider,
  getClientsForProvider,
  getNoteForClientDate,
  saveDailyNote,
  getDayStatuses,
  exportToCSV,
  exportToJSON,
  downloadFile,
  getAllNotes,
} from '@/lib/store';
import { getSheetUrl, setSheetUrl, clearSheetUrl, syncNoteToSheet, syncAllNotesToSheet } from '@/lib/sheets';

// --- Icon Components ---
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

function MountainIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-gm-cream">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20l5.5-11L12 15l3.5-7L21 20H3z" />
      <circle cx="17" cy="6" r="2" />
    </svg>
  );
}

// --- Views ---
type View = 'login' | 'dashboard' | 'log' | 'export' | 'settings';

export default function Home() {
  const [initialized, setInitialized] = useState(false);
  const [view, setView] = useState<View>('login');
  const [provider, setProvider] = useState<Provider | null>(null);
  const [providers, setProvidersList] = useState<Provider[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Log flow state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [servicesProvided, setServicesProvided] = useState<boolean | null>(null);
  const [noteText, setNoteText] = useState('');
  const [logStep, setLogStep] = useState<'select' | 'confirm' | 'note' | 'done'>('select');
  const [existingNote, setExistingNote] = useState<DailyNote | null>(null);

  // Dashboard state
  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, missed: 0 });

  // Settings state
  const [sheetUrl, setSheetUrlState] = useState<string>('');
  const [sheetConnected, setSheetConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    initializeStore();
    const saved = getCurrentProvider();
    if (saved) {
      setProvider(saved);
      setClients(getClientsForProvider(saved.id));
      setView('dashboard');
    }
    setProvidersList(getProviders());
    const savedUrl = getSheetUrl();
    if (savedUrl) {
      setSheetUrlState(savedUrl);
      setSheetConnected(true);
    }
    setInitialized(true);
  }, []);

  const refreshDashboard = useCallback(() => {
    if (!provider) return;
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    const endOfWeek = new Date(today);

    const statuses = getDayStatuses(provider.id, startOfWeek, endOfWeek);
    setDayStatuses(statuses);

    const total = statuses.length;
    const completed = statuses.filter(s => s.status === 'completed').length;
    setStats({ total, completed, missed: total - completed });
  }, [provider]);

  useEffect(() => {
    if (view === 'dashboard' && provider) {
      refreshDashboard();
    }
  }, [view, provider, refreshDashboard]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleLogin(p: Provider) {
    setProvider(p);
    setCurrentProvider(p);
    setClients(getClientsForProvider(p.id));
    setView('dashboard');
  }

  function handleLogout() {
    setProvider(null);
    localStorage.removeItem('gm_current_provider');
    setView('login');
  }

  function startLog(client?: Client) {
    setLogStep('select');
    setSelectedClient(client || null);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setServicesProvided(null);
    setNoteText('');
    setExistingNote(null);
    setView('log');
  }

  function handleClientDateSelect() {
    if (!selectedClient) return;
    const existing = getNoteForClientDate(selectedClient.id, selectedDate);
    if (existing) {
      setExistingNote(existing);
      setServicesProvided(existing.servicesProvided);
      setNoteText(existing.notes);
    }
    setLogStep('confirm');
  }

  function handleServiceAnswer(answer: boolean) {
    setServicesProvided(answer);
    setLogStep('note');
  }

  async function handleSaveNote() {
    if (!provider || !selectedClient || servicesProvided === null || !noteText.trim()) return;

    const saved = saveDailyNote({
      providerId: provider.id,
      providerName: provider.name,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      date: selectedDate,
      servicesProvided,
      notes: noteText.trim(),
    });

    setLogStep('done');

    // Sync to Google Sheet if connected
    if (sheetConnected) {
      syncNoteToSheet(saved).then(result => {
        if (result.success) {
          showToast('Saved & synced to Google Sheet!');
        } else {
          showToast('Saved locally (Sheet sync failed)');
        }
      });
    } else {
      showToast('Daily note saved successfully!');
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gm-green">
        <div className="text-gm-cream text-xl" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
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
          {provider && (
            <div className="flex items-center gap-3">
              <span className="text-gm-cream/80 text-sm hidden sm:inline">{provider.name}</span>
              <button
                onClick={handleLogout}
                className="text-gm-cream/60 hover:text-gm-cream text-xs border border-gm-cream/30 rounded px-2 py-1 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation */}
      {provider && view !== 'login' && (
        <nav className="bg-gm-green-dark border-t border-gm-green-light">
          <div className="max-w-4xl mx-auto px-4 flex gap-1">
            <button
              onClick={() => setView('dashboard')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${view === 'dashboard' ? 'text-gm-gold border-b-2 border-gm-gold' : 'text-gm-cream/70 hover:text-gm-cream'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => startLog()}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${view === 'log' ? 'text-gm-gold border-b-2 border-gm-gold' : 'text-gm-cream/70 hover:text-gm-cream'}`}
            >
              Daily Notes
            </button>
            <button
              onClick={() => setView('export')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${view === 'export' ? 'text-gm-gold border-b-2 border-gm-gold' : 'text-gm-cream/70 hover:text-gm-cream'}`}
            >
              Export Data
            </button>
            <button
              onClick={() => setView('settings')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${view === 'settings' ? 'text-gm-gold border-b-2 border-gm-gold' : 'text-gm-cream/70 hover:text-gm-cream'}`}
            >
              Settings
            </button>
          </div>
        </nav>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-gm-success text-white px-4 py-3 rounded-lg shadow-lg z-50 fade-in flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
          </svg>
          {toast}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {/* LOGIN VIEW */}
        {view === 'login' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] fade-in">
            <div className="bg-gm-green rounded-full w-20 h-20 flex items-center justify-center mb-6 shadow-lg">
              <MountainIcon />
            </div>
            <h2 className="text-2xl text-gm-green mb-1" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>Daily Notes</h2>
            <p className="text-gm-gold text-sm mb-8">Select your name to get started</p>
            <div className="w-full max-w-sm space-y-3">
              {providers.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleLogin(p)}
                  className="w-full bg-white border-2 border-gray-200 hover:border-gm-gold rounded-xl px-5 py-4 text-left transition-all hover:shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gm-green-dark">{p.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.email}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-300 group-hover:text-gm-gold transition-colors">
                      <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && provider && (
          <div className="space-y-6 fade-in">
            {/* Quick Action */}
            <div className="bg-gm-green rounded-2xl p-6 text-center shadow-lg">
              <h2 className="text-gm-cream text-xl mb-2" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>Daily Notes</h2>
              <p className="text-gm-cream/70 text-sm mb-4">Log attendance and notes for your clients</p>
              <button
                onClick={() => startLog()}
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
                  dayStatuses.map((status) => (
                    <div
                      key={`${status.date}-${status.clientId}`}
                      className={`px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${status.status === 'missed' ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (status.status === 'missed') {
                          const client = clients.find(c => c.id === status.clientId);
                          if (client) {
                            setSelectedClient(client);
                            setSelectedDate(status.date);
                            setServicesProvided(null);
                            setNoteText('');
                            setExistingNote(null);
                            setLogStep('confirm');
                            setView('log');
                          }
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <BellIcon missed={status.status === 'missed'} />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{status.clientName}</p>
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
                  ))
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
                  return (
                    <div key={client.id} className="px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${todayNote ? 'bg-gm-success' : 'bg-gm-gold'}`}>
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{client.name}</p>
                          <p className="text-xs text-gray-400">
                            {todayNote ? 'Logged today' : 'Not logged today'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => startLog(client)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${todayNote ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-gm-coral text-white hover:bg-gm-coral-light'}`}
                      >
                        {todayNote ? 'Edit' : 'Log Now'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* LOG VIEW */}
        {view === 'log' && provider && (
          <div className="max-w-lg mx-auto space-y-6 slide-up">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-2">
              {['Select', 'Confirm', 'Note', 'Done'].map((label, i) => {
                const stepMap = ['select', 'confirm', 'note', 'done'];
                const currentIdx = stepMap.indexOf(logStep);
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i <= currentIdx ? 'bg-gm-green text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {i < currentIdx ? '\u2713' : i + 1}
                    </div>
                    {i < 3 && <div className={`w-8 h-0.5 ${i < currentIdx ? 'bg-gm-green' : 'bg-gray-200'}`} />}
                  </div>
                );
              })}
            </div>

            {/* Step 1: Select Client & Date */}
            {logStep === 'select' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 slide-up">
                <h3 className="text-lg font-semibold text-gm-green-dark mb-4" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
                  Select Client & Date
                </h3>

                <label className="block text-sm font-medium text-gray-600 mb-2">Client</label>
                <div className="space-y-2 mb-5">
                  {clients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${selectedClient?.id === client.id ? 'border-gm-gold bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <p className="font-medium text-sm">{client.name}</p>
                    </button>
                  ))}
                </div>

                <label className="block text-sm font-medium text-gray-600 mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-gm-gold focus:outline-none transition-colors"
                />

                <button
                  onClick={handleClientDateSelect}
                  disabled={!selectedClient}
                  className="w-full mt-5 bg-gm-green hover:bg-gm-green-light disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Did you provide services? */}
            {logStep === 'confirm' && selectedClient && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 slide-up">
                {existingNote && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-700">
                    A note already exists for this date. You can update it below.
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gm-green-dark mb-2" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
                  Service Confirmation
                </h3>
                <p className="text-gray-600 mb-6">
                  Did you provide services for <span className="font-bold text-gm-green">{selectedClient.name}</span> on{' '}
                  <span className="font-bold text-gm-green">{formatDate(selectedDate)}</span>?
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleServiceAnswer(true)}
                    className="bg-gm-success-light hover:bg-green-100 border-2 border-gm-success text-gm-success font-semibold py-4 rounded-xl transition-all text-lg flex flex-col items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                    </svg>
                    Yes
                  </button>
                  <button
                    onClick={() => handleServiceAnswer(false)}
                    className="bg-gm-red-light hover:bg-red-100 border-2 border-gm-red text-gm-red font-semibold py-4 rounded-xl transition-all text-lg flex flex-col items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                    </svg>
                    No
                  </button>
                </div>

                <button
                  onClick={() => setLogStep('select')}
                  className="w-full mt-4 text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
                >
                  &larr; Back
                </button>
              </div>
            )}

            {/* Step 3: Notes */}
            {logStep === 'note' && selectedClient && servicesProvided !== null && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 slide-up">
                <h3 className="text-lg font-semibold text-gm-green-dark mb-2" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
                  {servicesProvided ? 'Service Notes' : 'Absence Notes'}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {servicesProvided
                    ? `Please give a brief note about ${selectedClient.name}'s day today and how services were delivered.`
                    : `Please give a brief note about why services were not delivered for ${selectedClient.name}, including details if the client was absent and why.`
                  }
                </p>

                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder={servicesProvided
                    ? 'e.g., Client participated in group activities and had a positive day...'
                    : 'e.g., Client was absent due to a medical appointment...'
                  }
                  rows={4}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-gm-gold focus:outline-none transition-colors resize-none"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1 mb-4">Required field</p>

                <button
                  onClick={handleSaveNote}
                  disabled={!noteText.trim()}
                  className="w-full bg-gm-green hover:bg-gm-green-light disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Save Daily Note
                </button>

                <button
                  onClick={() => setLogStep('confirm')}
                  className="w-full mt-3 text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
                >
                  &larr; Back
                </button>
              </div>
            )}

            {/* Step 4: Done */}
            {logStep === 'done' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center slide-up">
                <div className="w-16 h-16 bg-gm-success-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9 text-gm-success">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gm-green-dark mb-2" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
                  Note Saved!
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Daily note for <strong>{selectedClient?.name}</strong> on {formatDate(selectedDate)} has been saved.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => startLog()}
                    className="flex-1 bg-gm-gold hover:bg-gm-gold-light text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    Log Another
                  </button>
                  <button
                    onClick={() => setView('dashboard')}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
                  >
                    Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EXPORT VIEW */}
        {view === 'export' && (
          <div className="max-w-lg mx-auto space-y-6 fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gm-green-dark mb-2" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
                Export Data
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Download all daily notes data for integration with your systems. Data includes provider info, client info, dates, service status, and notes.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    const csv = exportToCSV();
                    if (!csv) { showToast('No data to export'); return; }
                    downloadFile(csv, `grace-mountain-daily-notes-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
                    showToast('CSV downloaded!');
                  }}
                  className="w-full flex items-center gap-4 bg-gm-green hover:bg-gm-green-light text-white font-semibold py-4 px-5 rounded-xl transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 shrink-0">
                    <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875Zm5.845 17.03a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V12a.75.75 0 0 0-1.5 0v4.19l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3Z" clipRule="evenodd" />
                    <path d="M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Z" />
                  </svg>
                  <div className="text-left">
                    <p>Download as CSV</p>
                    <p className="text-xs text-white/70 font-normal">Spreadsheet-compatible format</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const json = exportToJSON();
                    if (json === '[]') { showToast('No data to export'); return; }
                    downloadFile(json, `grace-mountain-daily-notes-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
                    showToast('JSON downloaded!');
                  }}
                  className="w-full flex items-center gap-4 bg-white border-2 border-gm-green text-gm-green hover:bg-gm-green hover:text-white font-semibold py-4 px-5 rounded-xl transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 shrink-0">
                    <path fillRule="evenodd" d="M14.447 3.026a.75.75 0 0 1 .527.921l-4.5 16.5a.75.75 0 0 1-1.448-.394l4.5-16.5a.75.75 0 0 1 .921-.527ZM16.72 6.22a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06L21.44 12l-4.72-4.72a.75.75 0 0 1 0-1.06ZM7.28 6.22a.75.75 0 0 1 0 1.06L2.56 12l4.72 4.72a.75.75 0 0 1-1.06 1.06L.97 12.53a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                  </svg>
                  <div className="text-left">
                    <p>Download as JSON</p>
                    <p className="text-xs opacity-70 font-normal">API-compatible format for app integration</p>
                  </div>
                </button>
              </div>

              {/* Data Preview */}
              <div className="mt-6 border-t border-gray-100 pt-5">
                <h4 className="text-sm font-semibold text-gray-600 mb-3">Data Preview</h4>
                <DataPreview />
              </div>
            </div>

            {/* Schema Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gm-green-dark mb-3" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
                Data Schema
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Each record contains these fields for easy integration:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs text-gray-600 space-y-1">
                <p><span className="text-gm-green font-bold">id</span>: string (UUID)</p>
                <p><span className="text-gm-green font-bold">providerId</span>: string</p>
                <p><span className="text-gm-green font-bold">providerName</span>: string</p>
                <p><span className="text-gm-green font-bold">clientId</span>: string</p>
                <p><span className="text-gm-green font-bold">clientName</span>: string</p>
                <p><span className="text-gm-green font-bold">date</span>: string (YYYY-MM-DD)</p>
                <p><span className="text-gm-green font-bold">servicesProvided</span>: boolean</p>
                <p><span className="text-gm-green font-bold">notes</span>: string</p>
                <p><span className="text-gm-green font-bold">createdAt</span>: string (ISO 8601)</p>
                <p><span className="text-gm-green font-bold">updatedAt</span>: string (ISO 8601)</p>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                This schema maps directly to the 8.7405 documentation requirements for per-diem daily attendance and notes.
              </p>
            </div>
          </div>
        )}
        {/* SETTINGS VIEW */}
        {view === 'settings' && (
          <div className="max-w-lg mx-auto space-y-6 fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gm-green-dark mb-2" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
                Google Sheets Integration
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Connect a Google Sheet to automatically sync daily notes as they are saved. Every note will be written as a row in your sheet.
              </p>

              {sheetConnected ? (
                <div className="space-y-4">
                  <div className="bg-gm-success-light border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gm-success shrink-0">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-gm-success font-medium">Google Sheet connected</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-gray-400 mb-1">Sheet URL</p>
                    <p className="text-xs text-gray-600 break-all font-mono">{sheetUrl}</p>
                  </div>

                  <button
                    onClick={async () => {
                      setSyncing(true);
                      const notes = getAllNotes();
                      const result = await syncAllNotesToSheet(notes);
                      setSyncing(false);
                      if (result.success) {
                        showToast(`Synced ${notes.length} notes to Google Sheet!`);
                      } else {
                        showToast(result.error || 'Sync failed');
                      }
                    }}
                    disabled={syncing}
                    className="w-full bg-gm-green hover:bg-gm-green-light disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    {syncing ? 'Syncing...' : 'Sync All Notes Now'}
                  </button>

                  <button
                    onClick={() => {
                      clearSheetUrl();
                      setSheetUrlState('');
                      setSheetConnected(false);
                      showToast('Google Sheet disconnected');
                    }}
                    className="w-full text-gm-red hover:bg-gm-red-light text-sm py-2 rounded-lg transition-colors"
                  >
                    Disconnect Sheet
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
                    <p className="font-medium mb-1">Setup Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Create a new Google Sheet</li>
                      <li>Go to Extensions &gt; Apps Script</li>
                      <li>Paste the script from <code className="bg-amber-100 px-1 rounded">google-apps-script.js</code></li>
                      <li>Run the <code className="bg-amber-100 px-1 rounded">setupSheet</code> function once</li>
                      <li>Click Deploy &gt; New deployment &gt; Web app</li>
                      <li>Set &quot;Who has access&quot; to &quot;Anyone&quot;</li>
                      <li>Copy the deployment URL and paste it below</li>
                    </ol>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Apps Script Web App URL</label>
                    <input
                      type="url"
                      value={sheetUrl}
                      onChange={e => setSheetUrlState(e.target.value)}
                      placeholder="https://script.google.com/macros/s/..."
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-gm-gold focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!sheetUrl.trim() || !sheetUrl.includes('script.google.com')) {
                        showToast('Please enter a valid Apps Script URL');
                        return;
                      }
                      setSheetUrl(sheetUrl.trim());
                      setSheetConnected(true);
                      showToast('Google Sheet connected!');
                    }}
                    disabled={!sheetUrl.trim()}
                    className="w-full bg-gm-green hover:bg-gm-green-light disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    Connect Google Sheet
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gm-green-dark text-gm-cream/50 text-center text-xs py-4 mt-auto">
        <p>Grace Mountain Agency &middot; Daily Notes & Attendance</p>
        <p className="mt-0.5">Compliant with 10 CCR 2505-10 &sect;8.7405</p>
      </footer>
    </div>
  );
}

// --- Data Preview Component ---
function DataPreview() {
  const [notes, setNotes] = useState<DailyNote[]>([]);

  useEffect(() => {
    setNotes(getAllNotes().slice(-5).reverse());
  }, []);

  if (notes.length === 0) {
    return <p className="text-gray-400 text-sm">No notes recorded yet. Log some daily notes to see data here.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 pr-3 font-semibold text-gray-500">Date</th>
            <th className="text-left py-2 pr-3 font-semibold text-gray-500">Client</th>
            <th className="text-left py-2 pr-3 font-semibold text-gray-500">Services</th>
            <th className="text-left py-2 font-semibold text-gray-500">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {notes.map(note => (
            <tr key={note.id}>
              <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">{note.date}</td>
              <td className="py-2 pr-3 text-gray-800 font-medium">{note.clientName}</td>
              <td className="py-2 pr-3">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${note.servicesProvided ? 'bg-gm-success-light text-gm-success' : 'bg-gm-red-light text-gm-red'}`}>
                  {note.servicesProvided ? 'YES' : 'NO'}
                </span>
              </td>
              <td className="py-2 text-gray-500 max-w-[200px] truncate">{note.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
