// Salesforce connector (shared by Netlify functions). Real SOQL via jsforce.
import jsforce from 'jsforce';

let _conn = null;
async function conn() {
  if (_conn) return _conn;
  const c = new jsforce.Connection({ loginUrl: process.env.SF_LOGIN_URL });
  await c.login(process.env.SF_USERNAME, `${process.env.SF_PASSWORD}${process.env.SF_TOKEN}`);
  _conn = c;
  return c;
}

export function normalizeSfStatus(v) {
  const s = (v || '').toLowerCase();
  if (s.includes('complete')) return 'deployed';
  if (s.startsWith('ready')) return 'deploying';
  return 'queued';
}

export async function testSalesforce() {
  try {
    const c = await conn();
    const r = await c.identity();
    return { ok: true, detail: `Authenticated as ${r.username}` };
  } catch (e) { return { ok: false, detail: e.message }; }
}

export async function fetchSalesforcePipeline() {
  const c = await conn();
  const rel = process.env.SF_RELEASE_OBJECT, dep = process.env.SF_DEPLOYMENT_OBJECT;
  const story = process.env.SF_STORY_OBJECT, defect = process.env.SF_DEFECT_OBJECT;

  const releases = await c.query(`SELECT Id, Name, Status__c FROM ${rel} ORDER BY CreatedDate DESC LIMIT 1`);
  const release = releases.records[0];
  if (!release) return null;

  const deployments = await c.query(
    `SELECT Environment__c, Status__c, Branch__c, Deployment_Owner__c, LastModifiedDate
     FROM ${dep} WHERE Release__c = '${release.Id}'`);
  const bStories = await c.query(
    `SELECT Name, Validation_Status__c, Approval_Status__c FROM ${story}
     WHERE Release__c = '${release.Id}' AND (Validation_Status__c='Failed' OR Approval_Status__c='Rejected')`);
  const bDefects = await c.query(
    `SELECT Name, Validation_Status__c, Approval_Status__c FROM ${defect}
     WHERE Release__c = '${release.Id}' AND (Validation_Status__c='Failed' OR Approval_Status__c='Rejected')`);

  const blocked = [
    ...bStories.records.map(r => ({ type: 'User Story', name: r.Name, reason: r.Validation_Status__c === 'Failed' ? 'Validation failed' : 'Approval rejected' })),
    ...bDefects.records.map(r => ({ type: 'Defect', name: r.Name, reason: r.Validation_Status__c === 'Failed' ? 'Validation failed' : 'Approval rejected' }))
  ];
  return {
    key: 'sf', tech: 'Salesforce', name: 'Salesforce', color: '#00A1E0', release: release.Name,
    envs: deployments.records.map(d => ({ name: d.Environment__c, owner: d.Deployment_Owner__c || '—', branch: d.Branch__c, st: normalizeSfStatus(d.Status__c) })),
    blocked
  };
}
