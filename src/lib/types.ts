export interface Provider {
  id: string;
  name: string;
  email: string;
}

export interface Client {
  id: string;
  name: string;
  providerId: string;
  archived?: boolean;
  archivedAt?: string; // ISO datetime
  archivedReason?: string;
}

export interface DailyNote {
  id: string;
  providerId: string;
  providerName: string;
  clientId: string;
  clientName: string;
  date: string; // YYYY-MM-DD
  servicesProvided: boolean;
  notes: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  aiEnhanced?: boolean;
  originalNotes?: string;
}

export interface DayStatus {
  date: string;
  clientId: string;
  clientName: string;
  status: 'completed' | 'missed' | 'pending';
  note?: DailyNote;
}

export type UserRole = 'provider' | 'admin';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  pin: string;
}

export interface AppSession {
  role: UserRole;
  user: Provider | AdminUser;
}

export interface AppSettings {
  phiProtectionEnabled: boolean;
  aiApiKey: string;
  aiProvider: 'openai' | 'none';
}

export type AppView =
  | 'login'
  | 'dashboard'
  | 'log'
  | 'notes-history'
  | 'export'
  | 'settings'
  | 'admin-dashboard'
  | 'admin-providers'
  | 'admin-clients'
  | 'admin-assignments'
  | 'admin-notes';
