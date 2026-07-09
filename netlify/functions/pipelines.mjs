// GET /api/pipelines — assemble every pipeline from its source.
import { loadConfig } from './_shared/store.mjs';
import { fetchJiraItems } from './_shared/jira.mjs';
import { fetchSalesforcePipeline } from './_shared/salesforce.mjs';

export default async function handler() {
  try {
    const cfg = await loadConfig();
    const out = [];
    for (const p of cfg.pipelines) {
      if (p.source === 'salesforce') {
        const sf = await fetchSalesforcePipeline().catch(() => null);
        out.push(sf ? { ...p, ...sf } : { ...p, release: '—', items: [], degraded: true });
      } else if (p.source === 'jira') {
        const items = await fetchJiraItems(p.jql).catch(() => null);
        out.push({ ...p, items: items || [], degraded: !items });
      }
    }
    return Response.json({ asOf: new Date().toISOString(), pipelines: out });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
