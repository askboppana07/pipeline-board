// POST /api/test-connection/:source  (source passed as ?source=jira|salesforce)
import { testJira } from './_shared/jira.mjs';
import { testSalesforce } from './_shared/salesforce.mjs';

export default async function handler(req) {
  const url = new URL(req.url);
  const src = url.searchParams.get('source');
  const result = src === 'jira' ? await testJira()
              : src === 'salesforce' ? await testSalesforce()
              : { ok: false, detail: 'Unknown source' };
  return Response.json(result, { status: result.ok ? 200 : 502 });
}
