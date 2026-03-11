'use client';

import { useEffect, useState } from 'react';
import { Provider, Client, DailyNote } from '@/lib/types';
import { getProviders, getAllClients, getAllNotes, getUnassignedClients } from '@/lib/store';

export default function AdminDashboardView() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [unassigned, setUnassigned] = useState<Client[]>([]);

  useEffect(() => {
    setProviders(getProviders());
    setClients(getAllClients());
    setNotes(getAllNotes());
    setUnassigned(getUnassignedClients());
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayNotes = notes.filter(n => n.date === today);
  const recentNotes = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);

  return (
    <div className="space-y-6 fade-in">
      <h2 className="text-xl text-gm-green" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
        Admin Overview
      </h2>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-gm-green">{providers.length}</p>
          <p className="text-xs text-gray-500 mt-1">Providers</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-gm-green">{clients.length}</p>
          <p className="text-xs text-gray-500 mt-1">Clients</p>
        </div>
        <div className="bg-gm-success-light rounded-xl p-4 text-center shadow-sm border border-green-100">
          <p className="text-2xl font-bold text-gm-success">{todayNotes.length}</p>
          <p className="text-xs text-gray-500 mt-1">Notes Today</p>
        </div>
        <div className={`rounded-xl p-4 text-center shadow-sm border ${unassigned.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
          <p className={`text-2xl font-bold ${unassigned.length > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{unassigned.length}</p>
          <p className="text-xs text-gray-500 mt-1">Unassigned Clients</p>
        </div>
      </div>

      {/* Provider Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gm-green-dark" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>Provider Summary</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {providers.map(p => {
            const assignedClients = clients.filter(c => c.providerId === p.id);
            const providerNotesToday = todayNotes.filter(n => n.providerId === p.id);
            return (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-400">{assignedClients.length} client{assignedClients.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    providerNotesToday.length >= assignedClients.length && assignedClients.length > 0
                      ? 'bg-gm-success-light text-gm-success'
                      : providerNotesToday.length > 0
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {providerNotesToday.length}/{assignedClients.length} today
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gm-green-dark" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>Recent Notes</h3>
        </div>
        {recentNotes.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">No notes recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-5 py-2 font-semibold text-gray-500">Date</th>
                  <th className="text-left py-2 font-semibold text-gray-500">Provider</th>
                  <th className="text-left py-2 font-semibold text-gray-500">Client</th>
                  <th className="text-left py-2 font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentNotes.map(note => (
                  <tr key={note.id}>
                    <td className="px-5 py-2 text-gray-600 whitespace-nowrap">{note.date}</td>
                    <td className="py-2 text-gray-800">{note.providerName}</td>
                    <td className="py-2 text-gray-800">{note.clientName}</td>
                    <td className="py-2">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${note.servicesProvided ? 'bg-gm-success-light text-gm-success' : 'bg-gm-red-light text-gm-red'}`}>
                        {note.servicesProvided ? 'YES' : 'NO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
