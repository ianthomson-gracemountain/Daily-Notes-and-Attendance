'use client';

import { useState } from 'react';
import { Provider, AdminUser, AppSession } from '@/lib/types';

interface LoginViewProps {
  providers: Provider[];
  adminUsers: AdminUser[];
  onLogin: (session: AppSession) => void;
}

function MountainIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-gm-cream">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20l5.5-11L12 15l3.5-7L21 20H3z" />
      <circle cx="17" cy="6" r="2" />
    </svg>
  );
}

export default function LoginView({ providers, adminUsers, onLogin }: LoginViewProps) {
  const [tab, setTab] = useState<'provider' | 'admin'>('provider');
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  function handleProviderLogin(p: Provider) {
    onLogin({ role: 'provider', user: p });
  }

  function handleAdminSelect(admin: AdminUser) {
    setSelectedAdmin(admin);
    setPin('');
    setPinError('');
  }

  function handlePinSubmit() {
    if (!selectedAdmin) return;
    if (pin === selectedAdmin.pin) {
      onLogin({ role: 'admin', user: selectedAdmin });
    } else {
      setPinError('Incorrect PIN. Please try again.');
      setPin('');
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] fade-in">
      <div className="bg-gm-green rounded-full w-20 h-20 flex items-center justify-center mb-6 shadow-lg">
        <MountainIcon />
      </div>
      <h2 className="text-2xl text-gm-green mb-1" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>Daily Notes</h2>
      <p className="text-gm-gold text-sm mb-6">Select your role to get started</p>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6 w-full max-w-sm">
        <button
          onClick={() => { setTab('provider'); setSelectedAdmin(null); setPin(''); setPinError(''); }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'provider' ? 'bg-white text-gm-green shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Provider
        </button>
        <button
          onClick={() => { setTab('admin'); setSelectedAdmin(null); setPin(''); setPinError(''); }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'admin' ? 'bg-white text-gm-green shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Admin / Staff
        </button>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {tab === 'provider' && providers.map(p => (
          <button
            key={p.id}
            onClick={() => handleProviderLogin(p)}
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

        {tab === 'admin' && !selectedAdmin && adminUsers.map(admin => (
          <button
            key={admin.id}
            onClick={() => handleAdminSelect(admin)}
            className="w-full bg-white border-2 border-gray-200 hover:border-gm-gold rounded-xl px-5 py-4 text-left transition-all hover:shadow-md group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gm-green-dark">{admin.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{admin.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold text-gm-gold bg-amber-50 px-2 py-0.5 rounded-full">ADMIN</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-300 group-hover:text-gm-gold transition-colors">
                <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
        ))}

        {tab === 'admin' && selectedAdmin && (
          <div className="bg-white border-2 border-gray-200 rounded-xl px-5 py-6 slide-up">
            <p className="text-sm text-gray-500 mb-1">Signing in as</p>
            <p className="font-semibold text-gm-green-dark mb-4">{selectedAdmin.name}</p>
            <label className="block text-sm font-medium text-gray-600 mb-2">Enter PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setPinError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handlePinSubmit(); }}
              placeholder="4-digit PIN"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-center text-2xl tracking-[0.5em] focus:border-gm-gold focus:outline-none transition-colors"
              autoFocus
            />
            {pinError && (
              <p className="text-sm text-gm-red mt-2">{pinError}</p>
            )}
            <button
              onClick={handlePinSubmit}
              disabled={pin.length !== 4}
              className="w-full mt-4 bg-gm-green hover:bg-gm-green-light disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => { setSelectedAdmin(null); setPin(''); setPinError(''); }}
              className="w-full mt-2 text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
            >
              &larr; Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
