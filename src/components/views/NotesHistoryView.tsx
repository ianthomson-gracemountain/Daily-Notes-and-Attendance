'use client';

import { useState, useEffect } from 'react';
import { Client, DailyNote, Provider, UserRole } from '@/lib/types';
import { getNotesForProvider, getClientsForProvider, getAllClients, getAppSettings } from '@/lib/store';
import { getClientDisplayName } from '@/lib/phi';
import { analyzeNotePatterns } from '@/lib/ai';

interface NotesHistoryViewProps {
  provider: Provider;
  role: UserRole;
}

export default function NotesHistoryView({ provider, role }: NotesHistoryViewProps) {
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filterClient, setFilterClient] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  // AI Analysis state
  const [analysisText, setAnalysisText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const settings = getAppSettings();
  const allClients = getAllClients();

  useEffect(() => {
    setNotes(getNotesForProvider(provider.id));
    setClients(getClientsForProvider(provider.id));
  }, [provider.id]);

  function displayName(client: Client): string {
    return getClientDisplayName(client, role, settings.phiProtectionEnabled, allClients);
  }

  function clientDisplayName(clientId: string, clientName: string): string {
    const client = clients.find(c => c.id === clientId);
    return client ? displayName(client) : clientName;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  let filtered = [...notes];
  if (filterClient) {
    filtered = filtered.filter(n => n.clientId === filterClient);
  }
  if (filterDateFrom) {
    filtered = filtered.filter(n => n.date >= filterDateFrom);
  }
  if (filterDateTo) {
    filtered = filtered.filter(n => n.date <= filterDateTo);
  }
  filtered.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  async function handleAnalyze() {
    if (!settings.aiApiKey || filtered.length === 0) return;
    setIsAnalyzing(true);
    setShowAnalysis(true);
    setAnalysisText('');

    const result = await analyzeNotePatterns(filtered, settings.aiApiKey);
    setIsAnalyzing(false);
    if (result.success && result.analysis) {
      setAnalysisText(result.analysis);
    } else {
      setAnalysisText(result.error || 'Analysis failed. Please try again.');
    }
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl text-gm-green" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
          My Notes
        </h2>
        <span className="text-sm text-gray-400">{filtered.length} note{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Client</label>
            <select
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gm-gold focus:outline-none bg-white"
            >
              <option value="">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{displayName(c)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={e => setFilterDateFrom(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gm-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={e => setFilterDateTo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gm-gold focus:outline-none"
            />
          </div>
        </div>
        {(filterClient || filterDateFrom || filterDateTo) && (
          <button
            onClick={() => { setFilterClient(''); setFilterDateFrom(''); setFilterDateTo(''); }}
            className="mt-3 text-xs text-gm-red hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* AI Pattern Analysis */}
      {settings.aiApiKey && settings.aiProvider !== 'none' && filtered.length >= 3 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-purple-500">✨</span>
              <h3 className="font-semibold text-gm-green-dark text-sm" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
                AI Pattern Insights
              </h3>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-300 text-white transition-all"
            >
              {isAnalyzing ? 'Analyzing...' : showAnalysis ? 'Re-analyze' : 'Analyze Notes'}
            </button>
          </div>
          {showAnalysis && (
            <div className="px-5 py-4">
              {isAnalyzing ? (
                <div className="flex items-center gap-3 py-4">
                  <svg className="animate-spin w-5 h-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-sm text-gray-500">Reading through {filtered.length} notes to identify patterns...</p>
                </div>
              ) : (
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{analysisText}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Notes List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-gray-300">
              <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
              <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">No notes found. Start logging daily notes to see them here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.slice(0, 50).map(note => {
            const isExpanded = expandedNote === note.id;
            return (
              <div
                key={note.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedNote(isExpanded ? null : note.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${note.servicesProvided ? 'bg-gm-success' : 'bg-gm-red'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {clientDisplayName(note.clientId, note.clientName)}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(note.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${note.servicesProvided ? 'bg-gm-success-light text-gm-success' : 'bg-gm-red-light text-gm-red'}`}>
                      {note.servicesProvided ? 'Services' : 'Absent'}
                    </span>
                    {note.aiEnhanced && <span className="text-purple-400 text-xs">✨</span>}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className={`w-4 h-4 text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-gray-100 pt-3 slide-up">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.notes}</p>
                    {note.aiEnhanced && note.originalNotes && (
                      <details className="mt-3">
                        <summary className="text-xs text-purple-500 cursor-pointer hover:underline">View original note</summary>
                        <p className="mt-1 text-xs text-gray-400 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{note.originalNotes}</p>
                      </details>
                    )}
                    <p className="mt-3 text-[10px] text-gray-300">
                      Logged {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length > 50 && (
            <p className="text-center text-xs text-gray-400 py-2">
              Showing first 50 of {filtered.length} notes. Use filters to narrow results.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
