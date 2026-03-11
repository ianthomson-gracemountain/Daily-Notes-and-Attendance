import { v4 as uuidv4 } from 'uuid';
import { Provider, Client, DailyNote, DayStatus, AdminUser, AppSession, AppSettings } from './types';
import { maskClientNameStr } from './phi';

const STORAGE_KEYS = {
  providers: 'gm_providers',
  clients: 'gm_clients',
  notes: 'gm_daily_notes',
  currentProvider: 'gm_current_provider',
  currentSession: 'gm_current_session',
  adminUsers: 'gm_admin_users',
  appSettings: 'gm_app_settings',
};

// --- Provider & Client Data ---
const SAMPLE_PROVIDERS: Provider[] = [
  { id: 'p1', name: 'Teketel Atamo', email: 'teketel.atamo@gracemountainagency.com' },
  { id: 'p2', name: 'Will Barnette', email: 'will.barnette@gracemountainagency.com' },
  { id: 'p3', name: 'Jess Barnette', email: 'jess.barnette@gracemountainagency.com' },
  { id: 'p4', name: 'Cherinet Daba', email: 'cherinet.daba@gracemountainagency.com' },
  { id: 'p5', name: 'Tena Demeke', email: 'tenagne.demeke@gracemountainagency.com' },
  { id: 'p6', name: 'Tabby Etanee', email: 'tabby.etanee@gracemountainagency.com' },
  { id: 'p7', name: 'Nancy Faltermeier', email: 'nancy.faltermeier@gracemountainagency.com' },
  { id: 'p8', name: 'Abeselom Gamo', email: 'abeselom.gamo@gracemountainagency.com' },
  { id: 'p9', name: 'Sunny Gebrgiabher', email: 'berhan.gebrgziabher@gracemountainagency.com' },
  { id: 'p10', name: 'Ash Gelaw', email: 'ash.gelaw@gracemountainagency.com' },
  { id: 'p11', name: 'David George', email: 'david.george@gracemountainagency.com' },
  { id: 'p12', name: 'Kim Larson', email: 'kim.larson@gracemountainagency.com' },
  { id: 'p13', name: 'Daniel Lefe', email: 'daniel.lefe@gracemountainagency.com' },
  { id: 'p14', name: 'Ramey Lengkong', email: 'ramey.lengkong@gracemountainagency.com' },
  { id: 'p15', name: 'Maya Lim', email: 'maya.lim@gracemountainagency.com' },
  { id: 'p16', name: 'Grace Lumowa', email: 'grace.lumowa@gracemountainagency.com' },
  { id: 'p17', name: 'Jonas Mancho', email: 'jonas@gracemountainagency.com' },
  { id: 'p18', name: 'Meidy Rangingisan', email: 'meidy.rangingisan@gracemountainagency.com' },
  { id: 'p19', name: 'Abby Tesfaye', email: 'abby.tesfaye@gracemountainagency.com' },
  { id: 'p20', name: 'Grace Torres', email: 'grace.torres@gracemountainagency.com' },
  { id: 'p21', name: 'Pam Trent', email: 'pam.trent@gracemountainagency.com' },
  { id: 'p22', name: 'Yidnekachew Emebet Jambo (Emma) Tsegaye', email: 'emebet.tsegaye@gracemountainagency.com' },
  { id: 'p23', name: 'Mimi Yalew', email: 'mimi.yalew@gracemountainagency.com' },
  { id: 'p24', name: 'Yejulanche Yalew', email: 'yejulanche.yalew@gracemountainagency.com' },
  { id: 'p25', name: 'Elias Yerdaw', email: 'elias.yerdaw@gracemountainagency.com' },
  { id: 'p26', name: 'Meron Zegeye', email: 'meron.zegeye@gracemountainagency.com' },
];

const SAMPLE_CLIENTS: Client[] = [
  // Teketel Atamo
  { id: 'c1', name: 'Jenesa Claycomb', providerId: 'p1' },
  // Will Barnette
  { id: 'c2', name: 'Hazel Addams', providerId: 'p2' },
  // Jess Barnette
  { id: 'c3', name: 'Hazel Addams', providerId: 'p3' },
  // Cherinet Daba
  { id: 'c4', name: 'Charlie Comstock', providerId: 'p4' },
  { id: 'c5', name: 'Jacob Whitson', providerId: 'p4' },
  // Tena Demeke
  { id: 'c6', name: 'Mary Katherine Winter', providerId: 'p5' },
  // Tabby Etanee
  { id: 'c7', name: 'Sergio Alexandro Gonzalez', providerId: 'p6' },
  { id: 'c8', name: 'Jennifer Boyer', providerId: 'p6' },
  // Nancy Faltermeier
  { id: 'c9', name: 'Shawna Faltermeier', providerId: 'p7' },
  // Abeselom Gamo
  { id: 'c10', name: 'Jawon Hudson', providerId: 'p8' },
  // Sunny Gebrgiabher
  { id: 'c11', name: 'Derek Powers', providerId: 'p9' },
  // Ash Gelaw
  { id: 'c12', name: 'Jonathan Kopec', providerId: 'p10' },
  { id: 'c13', name: 'Gryffyn Raven', providerId: 'p10' },
  { id: 'c14', name: 'Nathaniel Weldon', providerId: 'p10' },
  // David George
  { id: 'c15', name: 'Josiah Lee', providerId: 'p11' },
  // Kim Larson
  { id: 'c16', name: 'Silas Larson', providerId: 'p12' },
  // Daniel Lefe
  { id: 'c17', name: 'Dennis Sisson', providerId: 'p13' },
  // Ramey Lengkong
  { id: 'c18', name: 'Sonya Espinoza', providerId: 'p14' },
  // Maya Lim
  { id: 'c19', name: 'Elijah Smith', providerId: 'p15' },
  // Grace Lumowa
  { id: 'c20', name: 'Renee Valdez', providerId: 'p16' },
  // Jonas Mancho
  { id: 'c21', name: 'Jonathan Kopec', providerId: 'p17' },
  // Meidy Rangingisan
  { id: 'c22', name: 'Joshua Quammen', providerId: 'p18' },
  // Abby Tesfaye
  { id: 'c23', name: 'William Blevins', providerId: 'p19' },
  { id: 'c24', name: 'Derek Powers', providerId: 'p19' },
  { id: 'c25', name: 'Jessi De Jesus Cruz', providerId: 'p19' },
  // Grace Torres
  { id: 'c26', name: 'Chance Gordon', providerId: 'p20' },
  { id: 'c27', name: 'Aaron Saldana-Spiegle', providerId: 'p20' },
  // Pam Trent
  { id: 'c28', name: 'Sherry Ivaska', providerId: 'p21' },
  // Yidnekachew Emebet Jambo (Emma) Tsegaye
  { id: 'c29', name: 'Travis Colman', providerId: 'p22' },
  // Mimi Yalew
  { id: 'c30', name: 'Travis Howell', providerId: 'p23' },
  // Yejulanche Yalew
  { id: 'c31', name: 'Travis Howell', providerId: 'p24' },
  // Elias Yerdaw
  { id: 'c32', name: 'Robert Cope', providerId: 'p25' },
  // Meron Zegeye
  { id: 'c33', name: 'Theodore Atkinson', providerId: 'p26' },
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
  const clients = getAllClients();
  return maskClientNameStr(name, id, clients);
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
