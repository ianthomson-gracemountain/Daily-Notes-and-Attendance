import { v4 as uuidv4 } from 'uuid';
import { Provider, Client, DailyNote, DayStatus, AdminUser, AppSession, AppSettings } from './types';
import { maskClientNameStr } from './phi';
import { getDateRange, getMountainToday } from './dates';

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
  { id: 'c12', name: 'Jonathan Kopec', providerId: 'p10', archived: true, archivedAt: '2026-04-20T00:00:00.000Z', archivedReason: 'Left the agency' },
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
  { id: 'c34', name: 'Jacob Koldeway', providerId: 'p16' },
  // Jonas Mancho
  { id: 'c21', name: 'Nathaniel Weldon', providerId: 'p17' },
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

  // Data fix (2026-04-20 v3):
  //   - Jonas Mancho (p17) now has Nathaniel Weldon as a separate client (slot c21).
  //   - Jonathan Kopec has left the agency — ARCHIVE (do not delete).
  //     Archiving preserves his record and all historical notes for §8.7405
  //     compliance while removing him from active daily-log flows.
  //   - If the earlier v2 migration already deleted him from this device,
  //     restore him from the seed as archived so no data is lost.
  const migrationKey = 'gm_migration_roster_20260420_v3';
  if (typeof window !== 'undefined' && !localStorage.getItem(migrationKey)) {
    const clients = getItem<Client[]>(STORAGE_KEYS.clients) || [];
    const isJonathanKopec = (name: string) => /jonathan\s*kope?ck?/i.test(name);

    // 1. Rename c21 (Jonas's slot) if it still says Jonathan Kopec.
    for (const c of clients) {
      if (c.id === 'c21' && c.providerId === 'p17' && isJonathanKopec(c.name)) {
        c.name = 'Nathaniel Weldon';
      }
    }

    // 2. Archive any remaining Jonathan Kopec records (do NOT delete).
    for (const c of clients) {
      if (isJonathanKopec(c.name) && !c.archived) {
        c.archived = true;
        c.archivedAt = new Date().toISOString();
        c.archivedReason = 'Left the agency';
      }
    }

    // 3. If the v2 migration already dropped Jonathan from this device,
    //    restore the canonical c12 record from the seed as archived.
    if (!clients.some(c => c.id === 'c12')) {
      const restored = SAMPLE_CLIENTS.find(c => c.id === 'c12');
      if (restored) {
        clients.push({ ...restored });
      }
    }

    setItem(STORAGE_KEYS.clients, clients);
    localStorage.setItem(migrationKey, '1');
  }

  // Data fix (2026-07-09 v4):
  //   - Grace Lumowa (p16) now has Jacob Koldeway as a client (slot c34).
  //     The seed above only applies to first-time devices with an empty
  //     roster, so add him to devices seeded before this change — otherwise
  //     the assignment never reaches browsers that already have a roster.
  const migrationKeyV4 = 'gm_migration_roster_20260709_v4';
  if (typeof window !== 'undefined' && !localStorage.getItem(migrationKeyV4)) {
    const clients = getItem<Client[]>(STORAGE_KEYS.clients) || [];
    const hasJacob = clients.some(
      c => c.id === 'c34' || (/jacob\s+koldeway/i.test(c.name) && c.providerId === 'p16')
    );
    if (!hasJacob) {
      const seeded = SAMPLE_CLIENTS.find(c => c.id === 'c34');
      if (seeded) {
        clients.push({ ...seeded });
        setItem(STORAGE_KEYS.clients, clients);
      }
    }
    localStorage.setItem(migrationKeyV4, '1');
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
// Active (non-archived) clients assigned to a provider — used by daily-log
// flows (dashboard, log view, day statuses) where archived clients must be hidden.
export function getClientsForProvider(providerId: string): Client[] {
  const clients = getItem<Client[]>(STORAGE_KEYS.clients) || SAMPLE_CLIENTS;
  return clients.filter(c => c.providerId === providerId && !c.archived);
}

// Every client record including archived — used by note history, exports,
// and anywhere the client name must still resolve from historical data.
export function getAllClients(): Client[] {
  return getItem<Client[]>(STORAGE_KEYS.clients) || SAMPLE_CLIENTS;
}

// Active clients across the whole agency (non-archived). Default for admin
// dashboards, assignment views, and provider-client counts.
export function getActiveClients(): Client[] {
  return getAllClients().filter(c => !c.archived);
}

// Admin-only view of archived clients (for the "Archived Clients" section).
export function getArchivedClients(): Client[] {
  return getAllClients().filter(c => c.archived);
}

export function getUnassignedClients(): Client[] {
  return getAllClients().filter(c => (!c.providerId || c.providerId === '') && !c.archived);
}

// Archive/unarchive — preserves the row and all linked notes.
export function archiveClient(id: string, reason?: string): Client {
  return updateClient(id, {
    archived: true,
    archivedAt: new Date().toISOString(),
    archivedReason: reason || 'Archived',
  });
}

export function unarchiveClient(id: string): Client {
  return updateClient(id, {
    archived: false,
    archivedAt: undefined,
    archivedReason: undefined,
  });
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
export function getDayStatuses(providerId: string, startDateStr: string, endDateStr: string): DayStatus[] {
  const clients = getClientsForProvider(providerId);
  const notes = getNotesForProvider(providerId);
  const statuses: DayStatus[] = [];
  const today = getMountainToday();

  const dates: string[] = getDateRange(startDateStr, endDateStr);

  for (const dateStr of dates) {
    for (const client of clients) {
      const note = notes.find(n => n.clientId === client.id && n.date === dateStr);
      let status: 'completed' | 'missed' | 'pending';
      if (note) {
        status = 'completed';
      } else if (dateStr > today) {
        status = 'pending';
      } else {
        status = 'missed';
      }
      statuses.push({
        date: dateStr,
        clientId: client.id,
        clientName: client.name,
        status,
        note: note || undefined,
      });
    }
  }

  return statuses;
}

// --- Merge notes from Google Sheet ---
export function mergeNotesFromSheet(sheetNotes: DailyNote[]): void {
  const localNotes = getAllNotes();
  const merged = [...localNotes];

  for (const sheetNote of sheetNotes) {
    const existingIdx = merged.findIndex(
      n => n.clientId === sheetNote.clientId && n.date === sheetNote.date
    );

    if (existingIdx >= 0) {
      // Keep the most recently updated version
      if (sheetNote.updatedAt > merged[existingIdx].updatedAt) {
        merged[existingIdx] = sheetNote;
      }
    } else {
      merged.push(sheetNote);
    }
  }

  setItem(STORAGE_KEYS.notes, merged);
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
