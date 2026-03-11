'use client';

import { useState, useEffect } from 'react';
import { AppView, AppSession, Client, Provider } from '@/lib/types';
import {
  initializeStore,
  getProviders,
  getSession,
  setSession as storeSetSession,
  clearSession,
  getClientsForProvider,
  getAdminUsers,
} from '@/lib/store';
import { getSheetUrl } from '@/lib/sheets';

import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import Toast from '@/components/layout/Toast';

import LoginView from '@/components/views/LoginView';
import DashboardView from '@/components/views/DashboardView';
import LogView from '@/components/views/LogView';
import ExportView from '@/components/views/ExportView';
import SettingsView from '@/components/views/SettingsView';

import AdminDashboardView from '@/components/views/admin/AdminDashboardView';
import ProviderManagement from '@/components/views/admin/ProviderManagement';
import ClientManagement from '@/components/views/admin/ClientManagement';
import AssignmentView from '@/components/views/admin/AssignmentView';
import AllNotesView from '@/components/views/admin/AllNotesView';

export default function Home() {
  const [initialized, setInitialized] = useState(false);
  const [view, setView] = useState<AppView>('login');
  const [session, setSession] = useState<AppSession | null>(null);
  const [providers, setProvidersList] = useState<Provider[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sheetConnected, setSheetConnected] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Log flow pre-set state (for clicking missed days on dashboard)
  const [logInitialClient, setLogInitialClient] = useState<Client | null>(null);
  const [logInitialDate, setLogInitialDate] = useState<string | undefined>(undefined);
  const [logInitialStep, setLogInitialStep] = useState<'select' | 'confirm' | undefined>(undefined);
  // Key to force remount of LogView when starting a new log
  const [logKey, setLogKey] = useState(0);

  useEffect(() => {
    initializeStore();
    const saved = getSession();
    if (saved) {
      setSession(saved);
      if (saved.role === 'provider') {
        setClients(getClientsForProvider(saved.user.id));
        setView('dashboard');
      } else {
        setView('admin-dashboard');
      }
    }
    setProvidersList(getProviders());
    if (getSheetUrl()) {
      setSheetConnected(true);
    }
    setInitialized(true);
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleLogin(newSession: AppSession) {
    setSession(newSession);
    storeSetSession(newSession);
    if (newSession.role === 'provider') {
      setClients(getClientsForProvider(newSession.user.id));
      setView('dashboard');
    } else {
      setView('admin-dashboard');
    }
  }

  function handleLogout() {
    setSession(null);
    clearSession();
    setClients([]);
    setView('login');
  }

  function startLog(client?: Client, date?: string) {
    setLogInitialClient(client || null);
    setLogInitialDate(date);
    setLogInitialStep(client && date ? 'confirm' : client ? 'select' : 'select');
    setLogKey(k => k + 1);
    setView('log');
  }

  function handleLogDone() {
    // Reset and go back to start a fresh log or dashboard
    setLogInitialClient(null);
    setLogInitialDate(undefined);
    setLogInitialStep(undefined);
    setLogKey(k => k + 1);
    setView('dashboard');
  }

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gm-green">
        <div className="text-gm-cream text-xl" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header session={session} onLogout={handleLogout} />

      {session && view !== 'login' && (
        <Navigation
          view={view}
          setView={setView}
          role={session.role}
          onStartLog={() => startLog()}
        />
      )}

      <Toast message={toast} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {view === 'login' && (
          <LoginView
            providers={providers}
            adminUsers={getAdminUsers()}
            onLogin={handleLogin}
          />
        )}

        {view === 'dashboard' && session?.role === 'provider' && (
          <DashboardView
            provider={session.user as Provider}
            role={session.role}
            clients={clients}
            onStartLog={startLog}
          />
        )}

        {view === 'log' && session?.role === 'provider' && (
          <LogView
            key={logKey}
            provider={session.user as Provider}
            role={session.role}
            clients={clients}
            sheetConnected={sheetConnected}
            showToast={showToast}
            onDone={handleLogDone}
            initialClient={logInitialClient}
            initialDate={logInitialDate}
            initialStep={logInitialStep}
          />
        )}

        {view === 'export' && (
          <ExportView
            providerId={session?.role === 'provider' ? session.user.id : undefined}
            role={session?.role || 'provider'}
            showToast={showToast}
          />
        )}

        {view === 'settings' && session && (
          <SettingsView
            role={session.role}
            showToast={showToast}
            sheetConnected={sheetConnected}
            setSheetConnected={setSheetConnected}
          />
        )}

        {view === 'admin-dashboard' && session?.role === 'admin' && (
          <AdminDashboardView />
        )}

        {view === 'admin-providers' && session?.role === 'admin' && (
          <ProviderManagement showToast={showToast} />
        )}

        {view === 'admin-clients' && session?.role === 'admin' && (
          <ClientManagement showToast={showToast} />
        )}

        {view === 'admin-assignments' && session?.role === 'admin' && (
          <AssignmentView showToast={showToast} />
        )}

        {view === 'admin-notes' && session?.role === 'admin' && (
          <AllNotesView />
        )}
      </main>

      <footer className="bg-gm-green-dark text-gm-cream/50 text-center text-xs py-4 mt-auto">
        <p>Grace Mountain Agency &middot; Daily Notes & Attendance</p>
        <p className="mt-0.5">Compliant with 10 CCR 2505-10 &sect;8.7405</p>
      </footer>
    </div>
  );
}
