'use client';

import { useState, useEffect } from 'react';
import { Provider, Client } from '@/lib/types';
import { getProviders, addProvider, removeProvider, getAllClients } from '@/lib/store';

interface ProviderManagementProps {
  showToast: (msg: string) => void;
}

export default function ProviderManagement({ showToast }: ProviderManagementProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setProviders(getProviders());
    setClients(getAllClients());
  }, []);

  function refresh() {
    setProviders(getProviders());
    setClients(getAllClients());
  }

  function handleAdd() {
    if (!name.trim() || !email.trim()) {
      showToast('Please fill in all fields');
      return;
    }
    addProvider({ name: name.trim(), email: email.trim() });
    setName('');
    setEmail('');
    setShowForm(false);
    refresh();
    showToast('Provider added!');
  }

  function handleRemove(id: string) {
    const assignedClients = clients.filter(c => c.providerId === id);
    if (assignedClients.length > 0 && confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    removeProvider(id);
    setConfirmDelete(null);
    refresh();
    showToast('Provider removed');
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl text-gm-green" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
          Providers
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gm-gold hover:bg-gm-gold-light text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
        >
          {showForm ? 'Cancel' : '+ Add Provider'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 slide-up">
          <h3 className="font-semibold text-gm-green-dark mb-4 text-sm">New Provider</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-gm-gold focus:outline-none"
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-gm-gold focus:outline-none"
            />
            <button
              onClick={handleAdd}
              disabled={!name.trim() || !email.trim()}
              className="w-full bg-gm-green hover:bg-gm-green-light disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Add Provider
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {providers.map(p => {
            const assignedCount = clients.filter(c => c.providerId === p.id).length;
            return (
              <div key={p.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.email}</p>
                  <p className="text-xs text-gm-gold mt-0.5">{assignedCount} client{assignedCount !== 1 ? 's' : ''} assigned</p>
                </div>
                <div>
                  {confirmDelete === p.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gm-red">Has clients!</span>
                      <button
                        onClick={() => handleRemove(p.id)}
                        className="text-xs bg-gm-red text-white px-3 py-1.5 rounded-lg"
                      >
                        Confirm
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
                      onClick={() => handleRemove(p.id)}
                      className="text-xs text-gm-red/60 hover:text-gm-red transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {providers.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No providers yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
