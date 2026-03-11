export interface Provider {
  id: string;
  name: string;
  email: string;
}

export interface Client {
  id: string;
  name: string;
  providerId: string;
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
}

export interface DayStatus {
  date: string;
  clientId: string;
  clientName: string;
  status: 'completed' | 'missed';
  note?: DailyNote;
}
