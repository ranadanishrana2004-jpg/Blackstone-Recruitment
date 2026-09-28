# Blackstone UK Recruitment — delivery and operations

## What is implemented

This is a working, single-service recruitment application, not the earlier static concepts. It includes candidate registration and login, persistent sessions, profiles, saved jobs, private CV storage, PDF/DOCX/TXT text extraction, applications, candidate status tracking, recruiter notes, job publishing, a hiring pipeline, interview scheduling with conflict checks, calendar-file downloads, in-app notifications, hiring enquiries, staff access management and an administrator audit log.

Data is stored in SQLite with WAL, foreign keys and full synchronous writes. CVs are stored as database blobs so document records, backups and permissions share one system. Application CVs are retained as the original selected document. A new CV upload never silently replaces the CV already attached to an application.

The previous three design concepts remain in their own folders and ZIPs. They are independent demonstrations and do not run this platform.

## Run locally

Requires Node 24.11 or newer. Install with `npm ci`.

- `npm run dev`: starts the local demonstration at **http://127.0.0.1:4174** and seeds fictional roles and users into `platform/data` once.
- The sign-in page has candidate and recruiter demo buttons. These use ordinary authenticated accounts, not an authorisation bypass.
- Demo administrator: `recruiter@blackstone.demo`; candidate: `candidate@blackstone.demo`; password for both: `BlackstoneDemo!2026`.
- These publicly documented demo credentials must never be used with real data. Production startup refuses both demo mode and a database marked as demo-seeded.
- `npm start`: runs without seeding data. Use a separate, clean DATA_DIR for production.
- `npm test`: runs backend access-control, workflow, document extraction and backup tests.
- `npm run build`: checks JavaScript and makes a deployable `dist` package without data or secrets.
- `node scripts/qa-platform.mjs`: optional browser E2E suite. Install browser test dependencies with `npm ci` and `npx playwright install chromium`. An alternative Playwright installation can be supplied with `PLAYWRIGHT_PATH`.

## Hosting recommendation

Use a paid **Render Node web service with a persistent disk** for this initial, single-instance release. `render.yaml` describes a starting configuration; select the final plan after observing memory/CPU under realistic traffic. The GoDaddy domain can stay registered at GoDaddy and point to the custom domain records provided by Render. Use HTTPS and set APP_ORIGIN to the exact public origin, without a trailing slash.

This architecture is deliberately single-instance. A Render disk cannot be shared across instances and disk-backed services have a short interruption during deploys. It is **not a high-availability or horizontally scalable architecture**. If Blackstone needs uninterrupted deploys, multiple app instances or a larger traffic target, migrate persistence to managed PostgreSQL and private object storage before scaling. Do not try to share this SQLite file over network storage.

Official references: [Render persistent disks](https://render.com/docs/disks), [Render custom domains](https://render.com/docs/custom-domains).

A static Netlify ZIP is not sufficient for this platform: authentication, uploads and private data require the running backend. Do not deploy `platform/public` alone and expect the platform to function.

## Production setup

1. Use a fresh data directory on the persistent disk. Do not copy the development database or its known accounts.
2. Set `NODE_ENV=production`, `HOST=0.0.0.0`, `DATA_DIR=/var/data/blackstone`, and `APP_ORIGIN=https://your-confirmed-domain`. The host normally provides PORT.
3. From the source checkout, install dependencies with `npm ci`, run `npm test`, and run `npm run build`. If using the already-built deployment ZIP instead, extract it and run `npm ci --omit=dev`; the ZIP is already built and intentionally excludes the test suite.
4. In the server shell, temporarily set a strong `ADMIN_PASSWORD` environment variable, run `npm run setup`, and enter the administrator's real name and email. Clear ADMIN_PASSWORD afterwards. The password is never hardcoded or printed by the setup script.
5. Start with `npm start`; verify `/api/health`, then sign in and create the real jobs and staff accounts.
6. Configure the domain and TLS. Match APP_ORIGIN to the actual domain before testing forms. A different origin is intentionally rejected for writes.

The Dockerfile is an alternative container deployment. It runs as the non-root `node` user and expects a writable persistent volume at `/var/data/blackstone`. Configure HTTPS at the reverse proxy and forward only through a trusted single proxy, matching the Express trust-proxy configuration.

## Integrations and honest availability

### AI review

Set `OPENAI_API_KEY` and optionally `OPENAI_MODEL` in the server's secret settings. The configured default is `gpt-4.1-mini`; verify your account can use the chosen model. Keys never reach the browser. The implementation uses the Responses API with structured output, `store:false`, a 45-second deadline and a candidate-consent check. It requests evidence and follow-up questions, not scores, rankings or automated hiring decisions. Names and email addresses are removed on a best-effort basis, but the CV text may contain other personal information: approve the data-processing arrangement before enabling it.

Without a key, the interface explicitly offers a local **literal keyword checklist**. It is not represented as AI. Missing keywords are not treated as proof of missing ability. Scanned/image-only PDFs may require manual review; OCR is not implemented.

Live AI output has not been exercised with a paid key in this environment. The integration requires an account-level end-to-end test before launch. Official API reference: [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

### Password reset email

Set `RESEND_API_KEY` and `EMAIL_FROM` after verifying a sending domain in Resend. Password-reset tokens are random, hashed at rest, one-time, expire in 30 minutes and revoke existing sessions when used. Without email configuration, recovery reports that it is unavailable; it never exposes a reset link in the browser.

Live email delivery is not verified without a provider account. Interview/application updates currently use **in-app notifications**. Downloaded `.ics` files can be added to a calendar; this is not Google/Outlook calendar synchronisation. No video interviews, audio recording or automatic email campaign is implied.

## Security and reliability already in code

- Scrypt password hashing with per-password salts; timing-safe verification.
- Random sessions stored by hash, HTTP-only cookies, SameSite protection, Secure cookies in production, session revocation on password changes and staff deactivation.
- Origin checks and a custom request header for writes; rate limits; restrictive HTTP security headers and a content-security policy.
- Backend role/ownership checks for staff APIs, candidate applications and document downloads.
- Parameterised SQL, transactions for coupled hiring changes, uniqueness constraints, foreign keys and persisted audit events.
- Upload size/type checks, PDF/DOCX signature checks and bounded parser workers. These are not an antivirus service; configure malware scanning before accepting untrusted public CVs at production scale.
- Text output is HTML-escaped in the client. CVs download as attachments and are not served from a public uploads directory.
- Interview timezone conversion, future-time validation and conflict detection for candidate/recruiter overlaps. Joining details and candidate-facing notes are explicit.
- Error and empty states, reduced-motion support, light/dark mode and responsive navigation.

## Backups and recovery

In production the running server creates an online, integrity-checked SQLite backup shortly after startup and once per day. The latest seven backups are retained under DATA_DIR/backups. Manual backup: `node --env-file-if-exists=.env platform/backup.mjs`.

These local backups alone do not protect against loss of the whole disk. Configure encrypted **off-host replication**, access controls and retention before accepting live data, and test a restore on a separate instance. Render's disk documentation explicitly cautions against relying on raw disk restores for custom database recovery.

Restore procedure: stop the service, take a safety copy of the current data directory, restore a verified online backup as `blackstone.sqlite` into a fresh directory (without old `-wal` or `-shm` files), point DATA_DIR there, start and verify account, application and CV access. Do not replace a live SQLite file while the service is running.

The current defaults target a daily recovery point and a manual restore. There is no claim of zero data loss or automatic failover. Monitor health checks, disk usage, error logs and backup success; alerts and off-host replication need the hosting account.

## Before opening to real candidates

Complete real domain/TLS and administrator setup; replace sample jobs; verify live email and optional AI; obtain the master SVG/transparent logo; configure off-host backups and upload malware scanning; confirm the actual legal entity, privacy contact, data retention policy and approved hosting region for the countries where the business operates. The site's privacy page is an operational description, not a completed jurisdiction-specific legal policy. Password reset is implemented but email verification and multi-factor authentication are not part of this release. Add them if required by the client's access policy.

The local app and automated tests do not constitute a production penetration test, load test or availability guarantee. Test with realistic traffic and real integrations before launch.


## Worldwide market migration
On first startup with the earlier three-market database, the application creates a consistent before-global-*.sqlite backup inside DATA_DIR, then rebuilds the jobs table transactionally to remove the old country and currency restrictions. Job IDs and application relationships are preserved and foreign keys are checked before commit. These private migration backups must stay outside public web storage. The country/territory and currency catalogue lives in platform/public/markets.json; review it when updating the platform runtime.
