import { v4 as uuidv4 } from 'uuid';
import { Provider, Client, DailyNote, DayStatus } from './types';

const STORAGE_KEYS = {
  providers: 'gm_providers',
  clients: 'gm_clients',
  notes: 'gm_daily_notes',
  currentProvider: 'gm_current_provider',
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

// --- Clients ---
export function getClientsForProvider(providerId: string): Client[] {
  const clients = getItem<Client[]>(STORAGE_KEYS.clients) || SAMPLE_CLIENTS;
  return clients.filter(c => c.providerId === providerId);
}

export function getAllClients(): Client[] {
  return getItem<Client[]>(STORAGE_KEYS.clients) || SAMPLE_CLIENTS;
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

// --- Export ---
export function exportToCSV(): string {
  const notes = getAllNotes();
  if (notes.length === 0) return '';

  const headers = [
    'ID',
    'Provider Name',
    'Provider ID',
    'Client Name',
    'Client ID',
    'Date',
    'Services Provided',
    'Notes',
    'Created At',
    'Updated At',
  ];

  const rows = notes.map(n => [
    n.id,
    n.providerName,
    n.providerId,
    n.clientName,
    n.clientId,
    n.date,
    n.servicesProvided ? 'Yes' : 'No',
    `"${n.notes.replace(/"/g, '""')}"`,
    n.createdAt,
    n.updatedAt,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function exportToJSON(): string {
  const notes = getAllNotes();
  return JSON.stringify(notes, null, 2);
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
