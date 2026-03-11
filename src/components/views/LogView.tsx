'use client';

import { useState } from 'react';
import { Client, DailyNote, Provider, UserRole } from '@/lib/types';
import { getNoteForClientDate, saveDailyNote, getAppSettings, getAllClients } from '@/lib/store';
import { syncNoteToSheet } from '@/lib/sheets';
import { getClientDisplayName } from '@/lib/phi';
import { enhanceNote } from '@/lib/ai';

interface LogViewProps {
  provider: Provider;
  role: UserRole;
  clients: Client[];
  sheetConnected: boolean;
  showToast: (msg: string) => void;
  onDone: () => void;
  // Pre-set values for when user clicks a missed day
  initialClient?: Client | null;
  initialDate?: string;
  initialStep?: 'select' | 'confirm';
}

export default function LogView({
  provider, role, clients, sheetConnected, showToast, onDone,
  initialClient, initialDate, initialStep,
}: LogViewProps) {
  const settings = getAppSettings();
  const [logStep, setLogStep] = useState<'select' | 'confirm' | 'note' | 'done'>(initialStep || 'select');
  const [selectedClient, setSelectedClient] = useState<Client | null>(initialClient || null);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || new Date().toISOString().split('T')[0]);
  const [servicesProvided, setServicesProvided] = useState<boolean | null>(null);
  const [noteText, setNoteText] = useState('');
  const [existingNote, setExistingNote] = useState<DailyNote | null>(null);

  // AI enhancement state
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [wasEnhanced, setWasEnhanced] = useState(false);
  const [originalNoteText, setOriginalNoteText] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);

  const allClients = getAllClients();

  function displayName(client: Client): string {
    return getClientDisplayName(client, role, settings.phiProtectionEnabled, allClients);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
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

  async function handleEnhance() {
    if (!noteText.trim() || !settings.aiApiKey) return;
    setIsEnhancing(true);
    setOriginalNoteText(noteText);

    const result = await enhanceNote(noteText, settings.aiApiKey);

    setIsEnhancing(false);
    if (result.success && result.enhanced) {
      setNoteText(result.enhanced);
      setWasEnhanced(true);
      showToast('Note enhanced with AI!');
    } else {
      showToast(result.error || 'AI enhancement failed');
    }
  }

  function handleRevert() {
    setNoteText(originalNoteText);
    setWasEnhanced(false);
    setShowOriginal(false);
  }

  async function handleSaveNote() {
    if (!selectedClient || servicesProvided === null || !noteText.trim()) return;

    const saved = saveDailyNote({
      providerId: provider.id,
      providerName: provider.name,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      date: selectedDate,
      servicesProvided,
      notes: noteText.trim(),
      aiEnhanced: wasEnhanced,
      originalNotes: wasEnhanced ? originalNoteText : undefined,
    });

    setLogStep('done');

    if (sheetConnected) {
      const phiEnabled = settings.phiProtectionEnabled;
      syncNoteToSheet(saved, { maskClientName: phiEnabled }).then(result => {
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

  return (
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
                <p className="font-medium text-sm">{displayName(client)}</p>
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
            Did you provide services for <span className="font-bold text-gm-green">{displayName(selectedClient)}</span> on{' '}
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

          <button onClick={() => setLogStep('select')} className="w-full mt-4 text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors">
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
              ? `Please give a brief note about ${displayName(selectedClient)}'s day today and how services were delivered.`
              : `Please give a brief note about why services were not delivered for ${displayName(selectedClient)}, including details if the client was absent and why.`
            }
          </p>

          <textarea
            value={noteText}
            onChange={e => { setNoteText(e.target.value); if (wasEnhanced) { /* keep enhanced flag, user is editing */ } }}
            placeholder={servicesProvided
              ? 'e.g., Client participated in group activities and had a positive day...'
              : 'e.g., Client was absent due to a medical appointment...'
            }
            rows={4}
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-gm-gold focus:outline-none transition-colors resize-none"
            autoFocus
          />
          <p className="text-xs text-gray-400 mt-1">Required field</p>

          {/* AI Enhancement */}
          {settings.aiApiKey && settings.aiProvider !== 'none' && (
            <div className="mt-3 space-y-2">
              {!wasEnhanced ? (
                <button
                  onClick={handleEnhance}
                  disabled={!noteText.trim() || isEnhancing}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-medium py-2.5 rounded-lg transition-all text-sm"
                >
                  {isEnhancing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      Enhance with AI
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-600 font-medium flex items-center gap-1">
                      <span>✨</span> AI Enhanced
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowOriginal(!showOriginal)}
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                      >
                        {showOriginal ? 'Hide Original' : 'View Original'}
                      </button>
                      <button
                        onClick={handleRevert}
                        className="text-xs text-gm-red hover:text-red-700 underline"
                      >
                        Revert
                      </button>
                    </div>
                  </div>
                  {showOriginal && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500">
                      <p className="font-medium text-gray-400 mb-1">Original:</p>
                      {originalNoteText}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSaveNote}
            disabled={!noteText.trim()}
            className="w-full mt-4 bg-gm-green hover:bg-gm-green-light disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Save Daily Note
          </button>

          <button onClick={() => setLogStep('confirm')} className="w-full mt-3 text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors">
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
            Daily note for <strong>{selectedClient ? displayName(selectedClient) : ''}</strong> on {formatDate(selectedDate)} has been saved.
            {wasEnhanced && <span className="block text-purple-500 text-xs mt-1">✨ AI Enhanced</span>}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onDone}
              className="flex-1 bg-gm-gold hover:bg-gm-gold-light text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Log Another
            </button>
            <button
              onClick={() => { /* parent will handle view switch */ onDone(); }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
