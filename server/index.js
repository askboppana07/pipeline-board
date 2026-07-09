import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadConfig, saveConfig } from './store.js';
import { testJira, fetchJiraItems, normalizeJiraStatus } from './connectors/jira.js';
import { testSalesforce, fetchSalesforcePipeline } from './connectors/salesforce.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean) }));

const __dirname = dirname(fileURLToPath(import.meta.url));

/* ---------------- access control ----------------
 * Everyone with a valid session can READ. Only GitHub-admin can WRITE.
 * Wire requireAdmin to your real auth (GitHub OAuth session -> org/team check).
 * The stub reads an x-role header so the UI can be exercised; REPLACE for production. */
function requireAdmin(req, res, next) {
  const role = req.get('x-role') || 'viewer';          // TODO: derive from GitHub session/team
  if (role !== 'admin') return res.status(403).json({ error: 'GitHub admin required' });
  next();
}

/* ---------------- API ---------------- */

// Board data: assemble every pipeline from its source.
app.get('/api/pipelines', async (req, res) => {
  try {
    const cfg = await loadConfig();
    const out = [];
    for (const p of cfg.pipelines) {
      if (p.source === 'salesforce') {
        const sf = await fetchSalesforcePipeline().catch(() => null);
        if (sf) out.push({ ...p, ...sf });
        else out.push({ ...p, release: '—', items: [], degraded: true });
      } else if (p.source === 'jira') {
        const items = await fetchJiraItems(p.jql).catch(() => null);
        out.push({ ...p, items: items || [], degraded: !items });
      }
    }
    res.json({ asOf: new Date().toISOString(), pipelines: out });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Test a source connection (real).
app.post('/api/test-connection/:source', async (req, res) => {
  const src = req.params.source;
  const result = src === 'jira' ? await testJira()
              : src === 'salesforce' ? await testSalesforce()
              : { ok: false, detail: 'Unknown source' };
  res.status(result.ok ? 200 : 502).json(result);
});

// Read config (any session).
app.get('/api/config', async (req, res) => res.json(await loadConfig()));

// Update config (admin only) — Configure modal + toggles + Add source persist here.
app.put('/api/config', requireAdmin, async (req, res) => {
  const cfg = await loadConfig();
  const next = { ...cfg, ...req.body };
  await saveConfig(next);
  res.json(next);
});

/* ---------------- static web ---------------- */
app.use('/', express.static(join(__dirname, '..', 'web')));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Pipeline board on http://localhost:${port}`));
