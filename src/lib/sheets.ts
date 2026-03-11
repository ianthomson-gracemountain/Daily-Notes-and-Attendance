import { DailyNote } from './types';

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

export async function syncNoteToSheet(note: DailyNote): Promise<{ success: boolean; error?: string }> {
  const url = getSheetUrl();
  if (!url) return { success: false, error: 'No Google Sheet URL configured' };

  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Apps Script requires no-cors from client
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });

    // no-cors returns opaque response, so we can't read it
    // but if fetch didn't throw, it was sent successfully
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function syncAllNotesToSheet(notes: DailyNote[]): Promise<{ success: boolean; error?: string }> {
  const url = getSheetUrl();
  if (!url) return { success: false, error: 'No Google Sheet URL configured' };
  if (notes.length === 0) return { success: false, error: 'No notes to sync' };

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notes),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
