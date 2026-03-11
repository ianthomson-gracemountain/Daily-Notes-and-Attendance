import { v4 as uuidv4 } from 'uuid';
import { Provider, Client, DailyNote, DayStatus, AdminUser, AppSession, AppSettings } from './types';

const STORAGE_KEYS = {
  providers: 'gm_providers',
  clients: 'gm_clients',
  notes: 'gm_daily_notes',
  currentProvider: 'gm_current_provider',
  currentSession: 'gm_current_session',
  adminUsers: 'gm_admin_users',
  appSettings: 'gm_app_settings',
};

// --- Sample Data ---
const SAMPLE_PROVIDERS: Provider[] = [
  { id: 'p1', name: 'Sarah Johnson', email: 'sarah.johnson@gracemountainagency.com' },
  { id: 'p2', name: 'Mike Williams', email: 'mike.williams@gracemountainagency.com' },
  { id: 'p3', name: 'Jessica Davis', email: 'jessica.davis@gracemountainagency.com' },
];

const SAMPLE_CLIENTS: Client[] = [
  { id: 'c1', name: 'James Carter', providerId: 'p1' },
  { id: 'c2', name: 'Emily Rodriguez', providerId: 'p1' },
  { id: 'c3', name: 'David Kim', providerId: 'p2' },
  { id: 'c4', name: 'Maria Lopez', providerId: 'p2' },
  { id: 'c5', name: 'Thomas Brown', providerId: 'p3' },
];

const SAMPLE_ADMINS: AdminUser[] = [
  { id: 'admin1', name: 'Office Admin', email: 'admin@gracemountainagency.com', pin: '1234' },
];

const DEFAULT_SETTINGS: AppSettings = {
  phiProtectionEnabled: false,
  aiApiKey: '',
  aiProvider: 'none',
};

// --- Helpers ---
function getItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Initialize ---
export function initializeStore(): void {
  if (!getItem(STORAGE_KEYS.providers)) {
    setItem(STORAGE_KEYS.providers, SAMPLE_PROVIDERS);
  }
  if (!getItem(STORAGE_KEYS.clients)) {
    setItem(STORAGE_KEYS.clients, SAMPLE_CLIENTS);
  }
  if (!getItem(STORAGE_KEYS.notes)) {
    setItem(STORAGE_KEYS.notes, []);
  }
  if (!getItem(STORAGE_KEYS.adminUsers)) {
    setItem(STORAGE_KEYS.adminUsers, SAMPLE_ADMINS);
  }
  if (!getItem(STORAGE_KEYS.appSettings)) {
    setItem(STORAGE_KEYS.appSettings, DEFAULT_SETTINGS);
  }
  // Migrate old session format
  const oldProvider = getItem<Provider>(STORAGE_KEYS.currentProvider);
  const existingSession = getItem<AppSession>(STORAGE_KEYS.currentSession);
  if (oldProvider && !existingSession) {
    setItem(STORAGE_KEYS.currentSession, { role: 'provider', user: oldProvider } as AppSession);
  }
}

// --- Session ---
export function getSession(): AppSession | null {
  return getItem<AppSession>(STORAGE_KEYS.currentSession);
}

export function setSession(session: AppSession): void {
  setItem(STORAGE_KEYS.currentSession, session);
  // Keep backward compat
  if (session.role === 'provider') {
    setItem(STORAGE_KEYS.currentProvider, session.user);
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.currentSession);
  localStorage.removeItem(STORAGE_KEYS.currentProvider);
}

// --- Admin Users ---
export function getAdminUsers(): AdminUser[] {
  return getItem<AdminUser[]>(STORAGE_KEYS.adminUsers) || SAMPLE_ADMINS;
}

export function addAdminUser(user: Omit<AdminUser, 'id'>): AdminUser {
  const admins = getAdminUsers();
  const newAdmin: AdminUser = { ...user, id: uuidv4() };
  admins.push(newAdmin);
  setItem(STORAGE_KEYS.adminUsers, admins);
  return newAdmin;
}

export function removeAdminUser(id: string): void {
  const admins = getAdminUsers().filter(a => a.id !== id);
  setItem(STORAGE_KEYS.adminUsers, admins);
}

// --- Providers ---
export function getProviders(): Provider[] {
  return getItem<Provider[]>(STORAGE_KEYS.providers) || SAMPLE_PROVIDERS;
}

export function getCurrentProvider(): Provider | null {
  return getItem<Provider>(STORAGE_KEYS.currentProvider);
}

export function setCurrentProvider(provider: Provider): void {
  setItem(STORAGE_KEYS.currentProvider, provider);
}

export function addProvider(provider: Omit<Provider, 'id'>): Provider {
  const providers = getProviders();
  const newProvider: Provider = { ...provider, id: uuidv4() };
  providers.push(newProvider);
  setItem(STORAGE_KEYS.providers, providers);
  return newProvider;
}

export function updateProvider(id: string, updates: Partial<Omit<Provider, 'id'>>): Provider {
  const providers = getProviders();
  const idx = providers.findIndex(p => p.id === id);
  if (idx >= 0) {
    providers[idx] = { ...providers[idx], ...updates };
    setItem(STORAGE_KEYS.providers, providers);
    return providers[idx];
  }
  throw new Error('Provider not found');
}

export function removeProvider(id: string): void {
  const providers = getProviders().filter(p => p.id !== id);
  setItem(STORAGE_KEYS.providers, providers);
}

// --- Clients ---
export function getClientsForProvider(providerId: string): Client[] {
  const clients = getItem<Client[]>(STORAGE_KEYS.clients) || SAMPLE_CLIENTS;
  return clients.filter(c => c.providerId === providerId);
}

export function getAllClients(): Client[] {
  return getItem<Client[]>(STORAGE_KEYS.clients) || SAMPLE_CLIENTS;
}

export function getUnassignedClients(): Client[] {
  return getAllClients().filter(c => !c.providerId || c.providerId === '');
}

export function addClient(client: Omit<Client, 'id'>): Client {
  const clients = getAllClients();
  const newClient: Client = { ...client, id: uuidv4() };
  clients.push(newClient);
  setItem(STORAGE_KEYS.clients, clients);
  return newClient;
}

export function updateClient(id: string, updates: Partial<Omit<Client, 'id'>>): Client {
  const clients = getAllClients();
  const idx = clients.findIndex(c => c.id === id);
  if (idx >= 0) {
    clients[idx] = { ...clients[idx], ...updates };
    setItem(STORAGE_KEYS.clients, clients);
    return clients[idx];
  }
  throw new Error('Client not found');
}

export function removeClient(id: string): void {
  const clients = getAllClients().filter(c => c.id !== id);
  setItem(STORAGE_KEYS.clients, clients);
}

export function reassignClient(clientId: string, newProviderId: string): void {
  updateClient(clientId, { providerId: newProviderId });
}

// --- Daily Notes ---
export function getAllNotes(): DailyNote[] {
  return getItem<DailyNote[]>(STORAGE_KEYS.notes) || [];
}

export function getNotesForProvider(providerId: string): DailyNote[] {
  return getAllNotes().filter(n => n.providerId === providerId);
}

export function getNoteForClientDate(clientId: string, date: string): DailyNote | null {
  const notes = getAllNotes();
  return notes.find(n => n.clientId === clientId && n.date === date) || null;
}

export function saveDailyNote(note: Omit<DailyNote, 'id' | 'createdAt' | 'updatedAt'>): DailyNote {
  const notes = getAllNotes();
  const existing = notes.findIndex(n => n.clientId === note.clientId && n.date === note.date);
  const now = new Date().toISOString();

  if (existing >= 0) {
    notes[existing] = {
      ...notes[existing],
      ...note,
      updatedAt: now,
    };
    setItem(STORAGE_KEYS.notes, notes);
    return notes[existing];
  }

  const newNote: DailyNote = {
    ...note,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  notes.push(newNote);
  setItem(STORAGE_KEYS.notes, notes);
  return newNote;
}

// --- Day Status (Missed Days) ---
export function getDayStatuses(providerId: string, startDate: Date, endDate: Date): DayStatus[] {
  const clients = getClientsForProvider(providerId);
  const notes = getNotesForProvider(providerId);
  const statuses: DayStatus[] = [];

  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const dayOfWeek = current.getDay();

    // Skip weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      for (const client of clients) {
        const note = notes.find(n => n.clientId === client.id && n.date === dateStr);
        statuses.push({
          date: dateStr,
          clientId: client.id,
          clientName: client.name,
          status: note ? 'completed' : 'missed',
          note: note || undefined,
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return statuses;
}

// --- App Settings ---
export function getAppSettings(): AppSettings {
  return getItem<AppSettings>(STORAGE_KEYS.appSettings) || DEFAULT_SETTINGS;
}

export function updateAppSettings(updates: Partial<AppSettings>): AppSettings {
  const settings = getAppSettings();
  const updated = { ...settings, ...updates };
  setItem(STORAGE_KEYS.appSettings, updated);
  return updated;
}

// --- Export ---
export function exportToCSV(providerId?: string, maskNames?: boolean): string {
  let notes = getAllNotes();
  if (providerId) {
    notes = notes.filter(n => n.providerId === providerId);
  }
  if (notes.length === 0) return '';

  const headers = [
    'ID', 'Provider Name', 'Provider ID', 'Client Name', 'Client ID',
    'Date', 'Services Provided', 'Notes', 'Created At', 'Updated At',
    'AI Enhanced', 'Original Notes',
  ];

  const rows = notes.map(n => {
    const clientDisplay = maskNames ? maskClientName(n.clientName, n.clientId) : n.clientName;
    return [
      n.id,
      n.providerName,
      n.providerId,
      clientDisplay,
      n.clientId,
      n.date,
      n.servicesProvided ? 'Yes' : 'No',
      `"${n.notes.replace(/"/g, '""')}"`,
      n.createdAt,
      n.updatedAt,
      n.aiEnhanced ? 'Yes' : 'No',
      n.originalNotes ? `"${n.originalNotes.replace(/"/g, '""')}"` : '',
    ];
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function exportToJSON(providerId?: string): string {
  let notes = getAllNotes();
  if (providerId) {
    notes = notes.filter(n => n.providerId === providerId);
  }
  return JSON.stringify(notes, null, 2);
}

function maskClientName(name: string, id: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = parts.map(p => p.charAt(0).toUpperCase()).join('');
  const numericId = id.replace(/\D/g, '') || '0';
  return `${initials}-${numericId.padStart(3, '0')}`;
}

export function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
