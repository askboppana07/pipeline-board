# Deploy + embed

## Host the app (backend + web together)
The Express server serves both the API and the web board, so host it as one Node service:

- **Azure App Service / AWS Elastic Beanstalk / internal Node host**: deploy the `product/` folder,
  set env vars from `.env.example` in the host's config, expose port 8080.
- **Docker** (recommended): have Copilot generate a Dockerfile, then push to your registry and run.
- Put it behind your **internal SSO** so only staff reach it.

Do **not** use plain Netlify static hosting for the real product — it can't run the backend. (Netlify
is fine only for the disconnected mock.) If you want serverless, port `server/` routes to Netlify/
Azure Functions and host `web/` statically alongside.

## Embed in SharePoint
1. Confirm the app's origin is allowed to be framed (set framing/CSP to permit your SharePoint host).
2. On the SharePoint page, add the **Embed** web part:
   ```html
   <iframe src="https://your-host/#board" width="100%" height="900" style="border:0;"
           title="DevSecOps Pipeline"></iframe>
   ```
3. SharePoint only frames allow-listed domains — ask your SharePoint admin to add the app origin.

## Wall display / kiosk
Point a browser at `https://your-host/#board` (or `#integrations`). The board auto-refreshes; no
reload needed. Deep-link a single pipeline with `#pipeline=<key>`.
