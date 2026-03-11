'use client';

import { useState, useEffect } from 'react';
import { Provider, Client } from '@/lib/types';
import { getProviders, getAllClients, addClient, removeClient, reassignClient } from '@/lib/store';

interface ClientManagementProps {
  showToast: (msg: string) => void;
}

export default function ClientManagement({ showToast }: ClientManagementProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setClients(getAllClients());
    setProviders(getProviders());
  }, []);

  function refresh() {
    setClients(getAllClients());
    setProviders(getProviders());
  }

  function handleAdd() {
    if (!name.trim()) {
      showToast('Please enter a client name');
      return;
    }
    addClient({ name: name.trim(), providerId: selectedProviderId });
    setName('');
    setSelectedProviderId('');
    setShowForm(false);
    refresh();
    showToast('Client added!');
  }

  function handleRemove(id: string) {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    removeClient(id);
    setConfirmDelete(null);
    refresh();
    showToast('Client removed');
  }

  function handleReassign(clientId: string, newProviderId: string) {
    reassignClient(clientId, newProviderId);
    refresh();
    showToast('Client reassigned');
  }

  function getProviderName(providerId: string): string {
    if (!providerId) return 'Unassigned';
    return providers.find(p => p.id === providerId)?.name || 'Unknown';
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl text-gm-green" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
          Clients
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gm-gold hover:bg-gm-gold-light text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
        >
          {showForm ? 'Cancel' : '+ Add Client'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 slide-up">
          <h3 className="font-semibold text-gm-green-dark mb-4 text-sm">New Client</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Client Full Name"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-gm-gold focus:outline-none"
            />
            <select
              value={selectedProviderId}
              onChange={e => setSelectedProviderId(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-gm-gold focus:outline-none bg-white"
            >
              <option value="">Unassigned</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={!name.trim()}
              className="w-full bg-gm-green hover:bg-gm-green-light disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Add Client
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {clients.map(c => (
            <div key={c.id} className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">ID: {c.id}</p>
                </div>
                <div>
                  {confirmDelete === c.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemove(c.id)}
                        className="text-xs bg-gm-red text-white px-3 py-1.5 rounded-lg"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRemove(c.id)}
                      className="text-xs text-gm-red/60 hover:text-gm-red transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Assigned to:</span>
                <select
                  value={c.providerId || ''}
                  onChange={e => handleReassign(c.id, e.target.value)}
                  className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:border-gm-gold focus:outline-none bg-white"
                >
                  <option value="">Unassigned</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          {clients.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No clients yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
