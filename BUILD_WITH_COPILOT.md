# Build & host this in GitHub Copilot

Open this `product/` folder in VS Code with GitHub Copilot (Chat/Agent). Paste the prompt below.
It assumes the scaffold in this repo is present.

---

## Master prompt

> You are finishing a real, data-connected DevSecOps pipeline board. The repo has an Express
> backend (`server/`) with real Jira and Salesforce connectors and a web board (`web/index.html`).
> Do the following, keeping everything production-quality and typed where sensible:
>
> 1. **Wire the board to live data.** In `web/index.html`, replace the mock `pipelineConfigs()`
>    with a `fetch('/api/pipelines')` call and render from the response. Poll every 3 minutes and
>    on manual refresh. Preserve all existing visuals (train, gates, fork, portfolio, work-item
>    finder, themes). Match the API contract in `README.md`.
> 2. **Make Integrations real.** Wire the Integrations page so:
>    - **Test connection** calls `POST /api/test-connection/:source` and shows the real ok/fail + detail.
>    - **Configure** opens a modal bound to `GET/PUT /api/config` (Jira base URL, project keys,
>      status map; Salesforce instance URL, object/field names, blocked criteria). Save persists.
>    - **Sync toggles** and **Add a source** persist via `PUT /api/config`.
>    - All write actions are hidden/disabled unless the user is a GitHub admin.
> 3. **Real auth.** Replace the `requireAdmin` stub in `server/index.js` with GitHub OAuth:
>    authenticate via GitHub, read the user's org/team membership (`GITHUB_ORG`,
>    `GITHUB_ADMIN_TEAM`), allow reads for any valid session, allow writes only for admins.
>    Add login/logout and session middleware.
> 4. **Harden.** Add input validation, error boundaries, request logging, and rate limiting on the
>    API. Cache `/api/pipelines` for 60s to protect Jira/Salesforce rate limits.
> 5. **Tune the mappings.** Confirm the Jira status→state map and Salesforce `Status__c`→state map
>    against our workflow (statuses: Ready for Unit, Unit Complete, Ready for SIT, SIT Complete,
>    Ready for UAT, UAT Complete, Ready to Deploy).
> 6. **Host it.** Add a Dockerfile and a GitHub Actions workflow that builds and deploys to
>    {{Azure App Service | AWS | our internal host}}. Output the public URL.
>
> Objects confirmed: `Release__c`, `User_Story__c`, `Defect__c`, and a per-environment
> `Deployment__c`. Relationships: `User_Story__c.Release__c`, `Defect__c.Release__c`. Blocked =
> validation failed OR approval rejected. Don't invent field names you can't verify — leave clearly
> marked TODOs where a field name is uncertain.

---

## After it runs
- Fill real credentials in `.env` (or your host's secret store — never commit them).
- Run `POST /api/test-connection/jira` and `/salesforce` to confirm connectivity.
- Point the board at the hosted URL and embed per `DEPLOY.md`.
