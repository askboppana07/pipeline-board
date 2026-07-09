# DevSecOps Pipeline Board — real product

Live release-pipeline board sourced from **Jira** and **Salesforce**. Backend proxies the
APIs (holds credentials, normalizes statuses); the web board renders the live train.

```
product/
├── package.json
├── .env.example            ← copy to .env, fill credentials
├── server/
│   ├── index.js            ← Express: /api/pipelines, /api/test-connection, /api/config + serves web/
│   ├── store.js            ← config + pipeline definitions (swap for a DB)
│   └── connectors/
│       ├── jira.js         ← real Jira REST v3
│       └── salesforce.js   ← real Salesforce SOQL (jsforce)
├── web/
│   └── index.html          ← the board UI (put the exported board here; see WIRING)
├── BUILD_WITH_COPILOT.md   ← master prompt to finish + host in GitHub Copilot
└── DEPLOY.md               ← hosting + SharePoint embed
```

## Run locally
```bash
cd product
cp .env.example .env      # fill in Jira + Salesforce credentials
npm install
npm start                 # http://localhost:8080
```

## The API (what the board consumes)
- `GET  /api/pipelines` → `{ asOf, pipelines:[{ key,tech,name,release,envs:[{name,owner,branch,st}],items:[{id,title,type,source,st,reason}],gates,fork,degraded }] }`
- `POST /api/test-connection/:source` (`jira`|`salesforce`) → `{ ok, detail }`
- `GET  /api/config` / `PUT /api/config` (admin) → pipeline defs, source settings, sync toggles

`st` (normalized state): `deployed | deploying | queued | standby | blocked`.

## WIRING the board to live data
The board UI you designed currently ships with a `pipelineConfigs()` mock. To go live, replace it
with a fetch:
```js
const res = await fetch('/api/pipelines');
const { pipelines } = await res.json();
```
Then feed `pipelines` into the same render (the shapes match the contract above).
`BUILD_WITH_COPILOT.md` has the exact prompt to do this wiring.

## Access model
- **Anyone with a valid session** (internal GitHub SSO) can **view**.
- **Only GitHub admins** can register/edit sources or toggle sync (`PUT /api/config`).
- `requireAdmin` in `server/index.js` is a **stub** (reads `x-role`); replace with a real GitHub
  OAuth session + org/team check before production. See BUILD_WITH_COPILOT.md.

## Honest boundaries
- Real API calls require these server credentials; never put tokens in the browser.
- `store.js` uses a JSON file — fine for a single instance; use a DB for multi-instance/HA.
- Jira status→state and Salesforce `Status__c`→state maps live in the connectors — tune to your workflow.
