// Simple JSON config store (pipeline definitions + source settings + sync toggles).
// Swap for a real DB (Postgres, Salesforce custom object, etc.) in production.
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const FILE = new URL('./config.json', import.meta.url);

const DEFAULT = {
  sources: {
    jira: { connected: false, syncOn: true, baseUrl: '', projectKeys: '', statusMap: {} },
    salesforce: { connected: false, syncOn: true, instanceUrl: '', blockedCriteria: 'Validation Failed OR Approval Rejected' }
  },
  // Pipelines are config-driven — each maps a technology to its stages, gates, fork, and source.
  pipelines: [
    { key: 'sf',  tech: 'Salesforce', source: 'salesforce', envs: ['Dev Orgs','DevInt & Refresh','QA','UAT','Production'], fork: ['Training','Prod Fix'], gates: ['PMD / SAST','Coverage 75%','Security sign-off'] },
    { key: 'uip', tech: 'UiPath', source: 'jira', jql: 'project = RPA', envs: ['Dev','Test','UAT','Prod Orchestrator'], fork: [], gates: ['Workflow lint'] },
    { key: 'si',  tech: 'Integrations', source: 'jira', jql: 'project = INT', envs: ['Dev','QA','Pre-Prod','Prod'], fork: [], gates: ['Contract tests'] },
    { key: 'data',tech: 'Data', source: 'jira', jql: 'project = DAT', envs: ['Dev','Test','Prod'], fork: [], gates: [] },
    { key: 'mob', tech: 'Mobile', source: 'jira', jql: 'project = MOB', envs: ['Dev','QA','Beta','Prod'], fork: [], gates: [] }
  ]
};

export async function loadConfig() {
  if (!existsSync(FILE)) { await saveConfig(DEFAULT); return structuredClone(DEFAULT); }
  return JSON.parse(await readFile(FILE, 'utf8'));
}
export async function saveConfig(cfg) {
  await writeFile(FILE, JSON.stringify(cfg, null, 2));
  return cfg;
}
