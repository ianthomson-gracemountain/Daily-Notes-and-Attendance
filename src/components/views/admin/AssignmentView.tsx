'use client';

import { useState, useEffect } from 'react';
import { Provider, Client } from '@/lib/types';
import { getProviders, getAllClients, getUnassignedClients, reassignClient } from '@/lib/store';
import { getInitials } from '@/lib/phi';

interface AssignmentViewProps {
  showToast: (msg: string) => void;
}

export default function AssignmentView({ showToast }: AssignmentViewProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [unassigned, setUnassigned] = useState<Client[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    setProviders(getProviders());
    setClients(getAllClients());
    setUnassigned(getUnassignedClients());
  }

  function handleAssign(clientId: string, providerId: string) {
    reassignClient(clientId, providerId);
    refresh();
    showToast('Client assigned');
  }

  function handleUnassign(clientId: string) {
    reassignClient(clientId, '');
    refresh();
    showToast('Client unassigned');
  }

  const providerClients = selectedProvider
    ? clients.filter(c => c.providerId === selectedProvider.id)
    : [];

  return (
    <div className="space-y-6 fade-in">
      <h2 className="text-xl text-gm-green" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
        Client Assignments
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Provider Panel */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Select Provider</h3>
          <div className="space-y-2">
            {providers.map(p => {
              const count = clients.filter(c => c.providerId === p.id).length;
              const isSelected = selectedProvider?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvider(isSelected ? null : p)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                    isSelected ? 'border-gm-gold bg-amber-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">{count} client{count !== 1 ? 's' : ''}</p>
                    </div>
                    {isSelected && (
                      <span className="text-gm-gold text-xs font-medium">Selected</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedProvider && (
            <div className="mt-4 bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-amber-50">
                <h4 className="text-sm font-semibold text-gm-green-dark">{selectedProvider.name}&apos;s Clients</h4>
              </div>
              <div className="divide-y divide-gray-50">
                {providerClients.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-400 text-xs">No clients assigned</div>
                ) : (
                  providerClients.map(c => (
                    <div key={c.id} className="px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gm-green flex items-center justify-center text-xs font-bold text-white">
                          {getInitials(c.name)}
                        </div>
                        <span className="text-sm text-gray-800">{c.name}</span>
                      </div>
                      <button
                        onClick={() => handleUnassign(c.id)}
                        className="text-xs text-gm-red/60 hover:text-gm-red"
                      >
                        Unassign
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Unassigned Pool */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">
            Unassigned Clients
            {unassigned.length > 0 && (
              <span className="ml-2 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">{unassigned.length}</span>
            )}
          </h3>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {unassigned.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                  All clients are assigned!
                </div>
              ) : (
                unassigned.map(c => (
                  <div key={c.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white">
                          {getInitials(c.name)}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{c.name}</span>
                      </div>
                    </div>
                    {selectedProvider ? (
                      <button
                        onClick={() => handleAssign(c.id, selectedProvider.id)}
                        className="w-full text-xs bg-gm-green hover:bg-gm-green-light text-white font-medium py-2 rounded-lg transition-colors"
                      >
                        Assign to {selectedProvider.name}
                      </button>
                    ) : (
                      <select
                        value=""
                        onChange={e => {
                          if (e.target.value) handleAssign(c.id, e.target.value);
                        }}
                        className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs bg-white focus:border-gm-gold focus:outline-none"
                      >
                        <option value="">Assign to provider...</option>
                        {providers.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
