// Jira connector — real REST API v3 calls.
// Auth: API token (Basic). For production SSO, swap buildAuthHeader() to an OAuth bearer token.
import fetch from 'node-fetch';

function buildAuthHeader() {
  const token = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
  return `Basic ${token}`;
}

// Map a Jira status (or statusCategory) to the board's normalized state.
// Tune this to your workflow.
export function normalizeJiraStatus(status, category) {
  const s = (status || '').toLowerCase();
  if (s.includes('block') || s.includes('reject') || s.includes('fail')) return 'blocked';
  if (category === 'Done') return 'deployed';
  if (category === 'In Progress') return 'deploying';
  return 'queued';
}

// Test the connection — returns { ok, detail }.
export async function testJira() {
  try {
    const res = await fetch(`${process.env.JIRA_BASE_URL}/rest/api/3/myself`, {
      headers: { Authorization: buildAuthHeader(), Accept: 'application/json' }
    });
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
    const me = await res.json();
    return { ok: true, detail: `Authenticated as ${me.displayName}` };
  } catch (e) {
    return { ok: false, detail: e.message };
  }
}

// Fetch work items (stories + defects) via JQL.
export async function fetchJiraItems(jql = process.env.JIRA_JQL) {
  const url = `${process.env.JIRA_BASE_URL}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=200&fields=summary,status,issuetype,project`;
  const res = await fetch(url, { headers: { Authorization: buildAuthHeader(), Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Jira search failed: HTTP ${res.status}`);
  const data = await res.json();
  return (data.issues || []).map(i => ({
    id: i.key,
    title: i.fields.summary,
    type: /bug|defect/i.test(i.fields.issuetype?.name) ? 'Defect' : 'Story',
    source: 'Jira',
    project: i.fields.project?.key,
    st: normalizeJiraStatus(i.fields.status?.name, i.fields.status?.statusCategory?.name),
    reason: /* set when blocked */ undefined
  }));
}
