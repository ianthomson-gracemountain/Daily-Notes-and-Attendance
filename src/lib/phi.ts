import { Client, UserRole } from './types';

/**
 * Get a display name for a client based on PHI protection settings.
 * Admins always see full names. Providers see initials + ID when PHI is on.
 */
export function getClientDisplayName(
  client: Client,
  role: UserRole,
  phiProtectionEnabled: boolean
): string {
  if (role === 'admin') return client.name;
  if (!phiProtectionEnabled) return client.name;
  return generateClientCode(client);
}

/**
 * Generate a coded identifier from a client name + ID.
 * Uses first initial + last initial + numeric code.
 * e.g., "James Carter" with id "c1" -> "JC-001"
 * e.g., "Mary Jane Watson" with id "c5" -> "MW-005"
 */
function generateClientCode(client: Client): string {
  const parts = client.name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0).toUpperCase() || 'X';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : 'X';
  const numericId = client.id.replace(/\D/g, '') || '0';
  return `${first}${last}-${numericId.padStart(3, '0')}`;
}

/**
 * Get initials from a name string for avatar display (first + last initial).
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) || '';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

/**
 * Mask a client name string directly (for notes/exports where we don't have the Client object).
 * Uses first initial + last initial + numeric code.
 */
export function maskClientNameStr(name: string, clientId: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0).toUpperCase() || 'X';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : 'X';
  const numericId = clientId.replace(/\D/g, '') || '0';
  return `${first}${last}-${numericId.padStart(3, '0')}`;
}
