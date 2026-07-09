// Config store on Netlify Blobs (persists across function invocations).
import { getStore } from '@netlify/blobs';

const KEY = 'config';

const DEFAULT = {
  sources: {
    jira: { connected: false, syncOn: true, baseUrl: '', projectKeys: '', statusMap: {} },
    salesforce: { connected: false, syncOn: true, instanceUrl: '', blockedCriteria: 'Validation Failed OR Approval Rejected' }
  },
  pipelines: [
    { key: 'sf',  tech: 'Salesforce', source: 'salesforce', envs: ['Dev Orgs','DevInt & Refresh','QA','UAT','Production'], fork: ['Training','Prod Fix'], gates: ['PMD / SAST','Coverage 75%','Security sign-off'] },
    { key: 'uip', tech: 'UiPath', source: 'jira', jql: 'project = RPA', envs: ['Dev','Test','UAT','Prod Orchestrator'], fork: [], gates: ['Workflow lint'] },
    { key: 'si',  tech: 'Integrations', source: 'jira', jql: 'project = INT', envs: ['Dev','QA','Pre-Prod','Prod'], fork: [], gates: ['Contract tests'] },
    { key: 'data',tech: 'Data', source: 'jira', jql: 'project = DAT', envs: ['Dev','Test','Prod'], fork: [], gates: [] },
    { key: 'mob', tech: 'Mobile', source: 'jira', jql: 'project = MOB', envs: ['Dev','QA','Beta','Prod'], fork: [], gates: [] }
  ]
};

export async function loadConfig() {
  const store = getStore('pipeline-board');
  const saved = await store.get(KEY, { type: 'json' });
  return saved || DEFAULT;
}
export async function saveConfig(cfg) {
  const store = getStore('pipeline-board');
  await store.setJSON(KEY, cfg);
  return cfg;
}
