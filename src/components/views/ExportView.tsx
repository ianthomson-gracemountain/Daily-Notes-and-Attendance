'use client';

import { useEffect, useState } from 'react';
import { DailyNote, UserRole } from '@/lib/types';
import { getAllNotes, getNotesForProvider, exportToCSV, exportToJSON, downloadFile, getAppSettings, getAllClients } from '@/lib/store';
import { maskClientNameStr } from '@/lib/phi';

interface ExportViewProps {
  providerId?: string; // undefined = admin (export all)
  role: UserRole;
  showToast: (msg: string) => void;
}

export default function ExportView({ providerId, role, showToast }: ExportViewProps) {
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const settings = getAppSettings();

  useEffect(() => {
    const allNotes = providerId ? getNotesForProvider(providerId) : getAllNotes();
    setNotes(allNotes.slice(-5).reverse());
  }, [providerId]);

  const shouldMask = role === 'provider' && settings.phiProtectionEnabled;
  const allClients = getAllClients();

  function clientDisplay(note: DailyNote): string {
    if (shouldMask) return maskClientNameStr(note.clientName, note.clientId, allClients);
    return note.clientName;
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gm-green-dark mb-2" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
          Export Data
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Download {providerId ? 'your' : 'all'} daily notes data for integration with your systems.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => {
              const csv = exportToCSV(providerId, shouldMask);
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
              const json = exportToJSON(providerId);
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
          <h4 className="text-sm font-semibold text-gray-600 mb-3">Data Preview (Last 5)</h4>
          {notes.length === 0 ? (
            <p className="text-gray-400 text-sm">No notes recorded yet.</p>
          ) : (
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
                      <td className="py-2 pr-3 text-gray-800 font-medium">{clientDisplay(note)}</td>
                      <td className="py-2 pr-3">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${note.servicesProvided ? 'bg-gm-success-light text-gm-success' : 'bg-gm-red-light text-gm-red'}`}>
                          {note.servicesProvided ? 'YES' : 'NO'}
                        </span>
                      </td>
                      <td className="py-2 text-gray-500 max-w-[200px] truncate">
                        {note.notes}
                        {note.aiEnhanced && <span className="ml-1 text-purple-400">✨</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Schema Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gm-green-dark mb-3" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
          Data Schema
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs text-gray-600 space-y-1">
          <p><span className="text-gm-green font-bold">id</span>: string (UUID)</p>
          <p><span className="text-gm-green font-bold">providerId</span>: string</p>
          <p><span className="text-gm-green font-bold">providerName</span>: string</p>
          <p><span className="text-gm-green font-bold">clientId</span>: string</p>
          <p><span className="text-gm-green font-bold">clientName</span>: string</p>
          <p><span className="text-gm-green font-bold">date</span>: string (YYYY-MM-DD)</p>
          <p><span className="text-gm-green font-bold">servicesProvided</span>: boolean</p>
          <p><span className="text-gm-green font-bold">notes</span>: string</p>
          <p><span className="text-gm-green font-bold">aiEnhanced</span>: boolean</p>
          <p><span className="text-gm-green font-bold">originalNotes</span>: string (if AI enhanced)</p>
          <p><span className="text-gm-green font-bold">createdAt</span>: string (ISO 8601)</p>
          <p><span className="text-gm-green font-bold">updatedAt</span>: string (ISO 8601)</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Compliant with 10 CCR 2505-10 &sect;8.7405 documentation requirements.
        </p>
      </div>
    </div>
  );
}
