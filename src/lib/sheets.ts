import { DailyNote } from './types';
import { maskClientNameStr } from './phi';
import { getAllClients } from './store';

const SHEET_URL_KEY = 'gm_google_sheet_url';
const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbwUSQx00lIxPxSsu1i0GdYLKJeeEofAD9xrc4yndDd3dTIJ9SRg5d-I9y2Tm2U3EJy2/exec';

export function getSheetUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SHEET_URL_KEY) || DEFAULT_SHEET_URL;
}

export function setSheetUrl(url: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SHEET_URL_KEY, url);
}

export function clearSheetUrl(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SHEET_URL_KEY);
}

interface SyncOptions {
  maskClientName?: boolean;
}

function preparePayload(note: DailyNote, options?: SyncOptions): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...note };
  if (options?.maskClientName) {
    const allClients = getAllClients();
    payload.clientName = maskClientNameStr(note.clientName, note.clientId, allClients);
  }
  // Ensure AI fields are included (even if undefined)
  payload.aiEnhanced = note.aiEnhanced || false;
  payload.originalNotes = note.originalNotes || '';
  return payload;
}

export async function syncNoteToSheet(
  note: DailyNote,
  options?: SyncOptions
): Promise<{ success: boolean; error?: string }> {
  const url = getSheetUrl();
  if (!url) return { success: false, error: 'No Google Sheet URL configured' };

  try {
    const payload = preparePayload(note, options);
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function fetchNotesFromSheet(): Promise<{ success: boolean; data: DailyNote[]; error?: string }> {
  const url = getSheetUrl();
  if (!url) return { success: false, data: [], error: 'No Google Sheet URL configured' };

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (!result.success || !result.data) {
      return { success: false, data: [], error: result.error || 'Failed to fetch notes' };
    }

    // Transform sheet data to DailyNote format
    // The headerToKey function in the Apps Script produces these keys:
    // "ID" → "iD", "Provider ID" → "providerID", "Client ID" → "clientID",
    // "AI Enhanced" → "aIEnhanced", etc.
    const notes: DailyNote[] = result.data
      .filter((row: Record<string, unknown>) => row.iD && row.date)
      .map((row: Record<string, unknown>) => ({
        id: String(row.iD || ''),
        providerId: String(row.providerID || ''),
        providerName: String(row.providerName || ''),
        clientId: String(row.clientID || ''),
        clientName: String(row.clientName || ''),
        date: String(row.date || '').split('T')[0],
        servicesProvided: row.servicesProvided === 'Yes' || row.servicesProvided === true,
        notes: String(row.notes || ''),
        createdAt: String(row.createdAt || ''),
        updatedAt: String(row.updatedAt || ''),
        aiEnhanced: row.aIEnhanced === 'Yes' || row.aIEnhanced === true,
        originalNotes: row.originalNotes ? String(row.originalNotes) : undefined,
      }));

    return { success: true, data: notes };
  } catch (error) {
    return { success: false, data: [], error: String(error) };
  }
}

export async function syncAllNotesToSheet(
  notes: DailyNote[],
  options?: SyncOptions
): Promise<{ success: boolean; error?: string }> {
  const url = getSheetUrl();
  if (!url) return { success: false, error: 'No Google Sheet URL configured' };
  if (notes.length === 0) return { success: false, error: 'No notes to sync' };

  try {
    const payloads = notes.map(n => preparePayload(n, options));
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloads),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
