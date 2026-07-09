'use client';

import { useState, useEffect } from 'react';
import { Provider, Client } from '@/lib/types';
import {
  getProviders,
  getAllClients,
  addClient,
  removeClient,
  reassignClient,
  archiveClient,
  unarchiveClient,
} from '@/lib/store';

interface ClientManagementProps {
  showToast: (msg: string) => void;
}

export default function ClientManagement({ showToast }: ClientManagementProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [name, setName] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [confirmArchive, setConfirmArchive] = useState<string | null>(null);
  const [confirmPurge, setConfirmPurge] = useState<string | null>(null);

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

  function handleArchive(id: string) {
    if (confirmArchive !== id) {
      setConfirmArchive(id);
      return;
    }
    archiveClient(id, 'Archived by admin');
    setConfirmArchive(null);
    refresh();
    showToast('Client archived. History preserved.');
  }

  function handleUnarchive(id: string) {
    unarchiveClient(id);
    refresh();
    showToast('Client unarchived');
  }

  function handlePurge(id: string) {
    if (confirmPurge !== id) {
      setConfirmPurge(id);
      return;
    }
    removeClient(id);
    setConfirmPurge(null);
    refresh();
    showToast('Client permanently deleted');
  }

  function handleReassign(clientId: string, newProviderId: string) {
    reassignClient(clientId, newProviderId);
    refresh();
    showToast('Client reassigned');
  }

  const activeClients = clients.filter(c => !c.archived);
  const archivedClients = clients.filter(c => c.archived);

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

      {/* Active Clients */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gm-green-dark">
            Active Clients
            <span className="ml-2 text-xs font-normal text-gray-400">({activeClients.length})</span>
          </h3>
        </div>
        <div className="divide-y divide-gray-50">
          {activeClients.map(c => (
            <div key={c.id} className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">ID: {c.id}</p>
                </div>
                <div>
                  {confirmArchive === c.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleArchive(c.id)}
                        className="text-xs bg-gm-gold text-white px-3 py-1.5 rounded-lg"
                      >
                        Confirm Archive
                      </button>
                      <button
                        onClick={() => setConfirmArchive(null)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleArchive(c.id)}
                      className="text-xs text-gm-gold/70 hover:text-gm-gold transition-colors"
                      title="Archive client (preserves history)"
                    >
                      Archive
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
          {activeClients.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No active clients.</div>
          )}
        </div>
      </div>

      {/* Archived Clients */}
      {archivedClients.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full px-5 py-3 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-sm font-semibold text-gray-500">
              Archived Clients
              <span className="ml-2 text-xs font-normal text-gray-400">({archivedClients.length})</span>
            </h3>
            <span className="text-xs text-gray-400">{showArchived ? 'Hide' : 'Show'}</span>
          </button>
          {showArchived && (
            <div className="divide-y divide-gray-50">
              {archivedClients.map(c => {
                const providerName = c.providerId
                  ? providers.find(p => p.id === c.providerId)?.name || 'Unknown'
                  : 'Unassigned';
                return (
                  <div key={c.id} className="px-5 py-4 bg-gray-50/50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-600">
                          {c.name}
                          <span className="ml-2 text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full align-middle">ARCHIVED</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">ID: {c.id} &middot; Last provider: {providerName}</p>
                        {c.archivedReason && (
                          <p className="text-xs text-gray-400 mt-0.5">Reason: {c.archivedReason}</p>
                        )}
                        {c.archivedAt && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Archived: {new Date(c.archivedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <button
                          onClick={() => handleUnarchive(c.id)}
                          className="text-xs text-gm-green hover:text-gm-green-dark transition-colors"
                        >
                          Unarchive
                        </button>
                        {confirmPurge === c.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePurge(c.id)}
                              className="text-xs bg-gm-red text-white px-2 py-1 rounded-md"
                              title="Permanently delete record and ability to see history via client list"
                            >
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => setConfirmPurge(null)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePurge(c.id)}
                            className="text-[11px] text-gm-red/50 hover:text-gm-red transition-colors"
                            title="Permanently delete (cannot be undone)"
                          >
                            Delete permanently
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
