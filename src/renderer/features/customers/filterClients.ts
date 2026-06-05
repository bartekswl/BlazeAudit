import type { Client } from '../../../shared/types';

/** Case-insensitive match on client name, contact name, or formatted address. */
export function filterClients(clients: Client[], query: string): Client[] {
  const q = query.trim().toLowerCase();
  if (!q) return clients;

  return clients.filter((client) => {
    const haystack = [client.name, client.contactName, client.address]
      .join('\n')
      .toLowerCase();
    return haystack.includes(q);
  });
}
