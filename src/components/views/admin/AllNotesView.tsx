'use client';

import { useState, useEffect } from 'react';
import { Provider, DailyNote } from '@/lib/types';
import { getProviders, getAllNotes } from '@/lib/store';

export default function AllNotesView() {
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filterProvider, setFilterProvider] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    setNotes(getAllNotes());
    setProviders(getProviders());
  }, []);

  let filtered = [...notes];
  if (filterProvider) {
    filtered = filtered.filter(n => n.providerId === filterProvider);
  }
  if (filterDateFrom) {
    filtered = filtered.filter(n => n.date >= filterDateFrom);
  }
  if (filterDateTo) {
    filtered = filtered.filter(n => n.date <= filterDateTo);
  }
  filtered.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6 fade-in">
      <h2 className="text-xl text-gm-green" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
        All Notes
      </h2>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Provider</label>
            <select
              value={filterProvider}
              onChange={e => setFilterProvider(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gm-gold focus:outline-none bg-white"
            >
              <option value="">All Providers</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={e => setFilterDateFrom(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gm-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={e => setFilterDateTo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gm-gold focus:outline-none"
            />
          </div>
        </div>
        {(filterProvider || filterDateFrom || filterDateTo) && (
          <button
            onClick={() => { setFilterProvider(''); setFilterDateFrom(''); setFilterDateTo(''); }}
            className="mt-3 text-xs text-gm-red hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">{filtered.length} note{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">No notes match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Date</th>
                  <th className="text-left py-2.5 font-semibold text-gray-500">Provider</th>
                  <th className="text-left py-2.5 font-semibold text-gray-500">Client</th>
                  <th className="text-left py-2.5 font-semibold text-gray-500">Services</th>
                  <th className="text-left py-2.5 pr-4 font-semibold text-gray-500">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.slice(0, 50).map(note => (
                  <tr key={note.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{note.date}</td>
                    <td className="py-2.5 text-gray-800">{note.providerName}</td>
                    <td className="py-2.5 text-gray-800 font-medium">{note.clientName}</td>
                    <td className="py-2.5">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${note.servicesProvided ? 'bg-gm-success-light text-gm-success' : 'bg-gm-red-light text-gm-red'}`}>
                        {note.servicesProvided ? 'YES' : 'NO'}
                      </span>
                      {note.aiEnhanced && <span className="ml-1 text-purple-400">✨</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500 max-w-[250px]">
                      <p className="truncate">{note.notes}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 50 && (
          <div className="px-5 py-3 border-t border-gray-100 text-center text-xs text-gray-400">
            Showing first 50 of {filtered.length} notes. Use filters to narrow results.
          </div>
        )}
      </div>
    </div>
  );
}
