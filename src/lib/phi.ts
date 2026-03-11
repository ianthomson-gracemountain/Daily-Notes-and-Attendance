import { Client, UserRole } from './types';

/**
 * Build a map of clientId → PHI code for all clients.
 * Clients sharing the same initials get sequential numbers (JS-001, JS-002, JS-003)
 * based on their order in the client list (creation order).
 */
export function buildPhiCodeMap(clients: Client[]): Map<string, string> {
  const map = new Map<string, string>();
  // Track count per initial pair
  const initialCounts = new Map<string, number>();

  for (const client of clients) {
    const initials = getNameInitials(client.name);
    const count = (initialCounts.get(initials) || 0) + 1;
    initialCounts.set(initials, count);
    map.set(client.id, `${initials}-${String(count).padStart(3, '0')}`);
  }

  return map;
}

/**
 * Get a display name for a client based on PHI protection settings.
 * Admins always see full names. Providers see initials + sequential code when PHI is on.
 * Pass allClients so the sequential numbering is consistent across the app.
 */
export function getClientDisplayName(
  client: Client,
  role: UserRole,
  phiProtectionEnabled: boolean,
  allClients?: Client[]
): string {
  if (role === 'admin') return client.name;
  if (!phiProtectionEnabled) return client.name;

  if (allClients) {
    const codeMap = buildPhiCodeMap(allClients);
    return codeMap.get(client.id) || generateFallbackCode(client);
  }
  return generateFallbackCode(client);
}

/**
 * Get first + last initials from a full name.
 * e.g., "John Smith" -> "JS", "Mary Jane Watson" -> "MW"
 */
function getNameInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0).toUpperCase() || 'X';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : 'X';
  return `${first}${last}`;
}

/**
 * Fallback code when full client list isn't available.
 * Uses initials + client ID hash.
 */
function generateFallbackCode(client: Client): string {
  const initials = getNameInitials(client.name);
  const numericId = client.id.replace(/\D/g, '') || '0';
  return `${initials}-${numericId.padStart(3, '0')}`;
}

/**
 * Get initials from a name string for avatar display (first + last initial).
 */
export function getInitials(name: string): string {
  return getNameInitials(name);
}

/**
 * Mask a client name string for exports/sheets sync.
 * Pass allClients for consistent sequential numbering.
 * Falls back to ID-based numbering if client list not provided.
 */
export function maskClientNameStr(
  name: string,
  clientId: string,
  allClients?: Client[]
): string {
  if (allClients) {
    const codeMap = buildPhiCodeMap(allClients);
    return codeMap.get(clientId) || `${getNameInitials(name)}-${clientId.replace(/\D/g, '').padStart(3, '0') || '000'}`;
  }
  // Fallback when client list not available
  const initials = getNameInitials(name);
  const numericId = clientId.replace(/\D/g, '') || '0';
  return `${initials}-${numericId.padStart(3, '0')}`;
}
