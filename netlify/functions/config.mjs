// GET  /api/config  -> read (any session)
// PUT  /api/config  -> write (GitHub admin only)
import { loadConfig, saveConfig } from './_shared/store.mjs';

// TODO: replace with real GitHub OAuth session + org/team check.
// Stub reads an x-role header so the UI can be exercised end-to-end.
function isAdmin(req) { return (req.headers.get('x-role') || 'viewer') === 'admin'; }

export default async function handler(req) {
  if (req.method === 'GET') {
    return Response.json(await loadConfig());
  }
  if (req.method === 'PUT') {
    if (!isAdmin(req)) return Response.json({ error: 'GitHub admin required' }, { status: 403 });
    const body = await req.json();
    const cfg = await loadConfig();
    return Response.json(await saveConfig({ ...cfg, ...body }));
  }
  return new Response('Method not allowed', { status: 405 });
}
