# Deploy on Netlify (Functions)

The API runs as **Netlify Functions** (`netlify/functions/`) and the board is served static from
`web/`. Config persists in **Netlify Blobs**. No always-on server.

## One-time setup
1. Push `product/` to a GitHub repo.
2. In Netlify: **Add new site → Import from GitHub** → pick the repo.
   - Build command: *(none)*  ·  Publish directory: `web`  ·  Functions: auto-detected from `netlify.toml`.
3. **Site settings → Environment variables** — add everything from `.env.example`:
   `JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_JQL,`
   `SF_LOGIN_URL, SF_USERNAME, SF_PASSWORD, SF_TOKEN, SF_*_OBJECT`.
4. **Enable Netlify Blobs** (Site config → Blobs) so `/api/config` can persist.
5. Deploy. Your site: `https://<name>.netlify.app`.

## Routes (via netlify.toml redirects)
- `GET  /api/pipelines`            → functions/pipelines
- `POST /api/test-connection/:src` → functions/test-connection
- `GET|PUT /api/config`            → functions/config

## Test locally first
```bash
cd product
npm install
npx netlify dev        # runs functions + web at http://localhost:8888
```
Open the site → Integrations → **Test connection** (hits real Jira/Salesforce).

## Important for your PERSONAL setup
- **Jira**: set `JIRA_JQL` (and per-pipeline `jql` in `netlify/functions/_shared/store.mjs`) to your
  real project keys.
- **Salesforce sandbox**: set the `SF_*_OBJECT` names and confirm the field API names used in
  `_shared/salesforce.mjs` (`Environment__c`, `Status__c`, `Branch__c`, `Deployment_Owner__c`,
  `Validation_Status__c`, `Approval_Status__c`) match your org — rename where they differ.

## Before sharing the URL
- `*.netlify.app` is public. The write-guard (`x-role`) is a **stub** — replace with real GitHub
  OAuth (see BUILD_WITH_COPILOT.md) before anyone can reach it, or keep the site password-protected
  (Netlify → Site config → Access control → Password protection) while it's personal.

## Note on CORS
When embedding elsewhere, the API is same-origin with the board (both on your Netlify site), so no
CORS config is needed. Cross-origin embeds need the framing/CSP allowances in DEPLOY.md.
