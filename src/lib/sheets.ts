import { DailyNote } from './types';
import { maskClientNameStr } from './phi';

const SHEET_URL_KEY = 'gm_google_sheet_url';

export function getSheetUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SHEET_URL_KEY);
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
    payload.clientName = maskClientNameStr(note.clientName, note.clientId);
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
