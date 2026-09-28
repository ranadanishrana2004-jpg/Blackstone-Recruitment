# Blackstone UK Recruitment

A black, gold and cream recruitment platform for worldwide hiring, incorporating the client's supplied BS logo reference.

## Start here

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:4174**. On the sign-in page, use **Explore recruiter workspace** or **Explore candidate account** to review the local demonstration. New actions persist in the local database; seeded jobs and people are fictional.

Node **24.11+** is required. Do not use the public demo credentials with real candidate information.

## Working journeys

- Candidate registration, sign-in, profiles and password changes.
- Worldwide job search across 249 countries and territories, with independently selected salary currencies and global interview time zones.
- Private PDF, DOCX and TXT CV library, text extraction and authenticated downloads.
- Saved opportunities, applications, progress tracking and withdrawal.
- Recruiter dashboard, application table/pipeline, private notes and evidence checklists.
- Optional consent-gated OpenAI evidence review, ready for a server-side API key.
- Job creation, editing, draft/published/closed states.
- Interviews with timezone handling, conflict detection and calendar downloads.
- Candidate in-app updates and employer hiring enquiries.
- Administrator team access controls and an audit log.
- Light/dark themes, page transitions, responsive layouts and Blackstone watermark.
- Persistent SQLite storage, online verified backups and production deployment files.

## Verification

```sh
npm run check
npm test
npm run build
```

Backend tests exercise access control, CV validation, ownership, applications, notes, hiring changes, scheduling conflicts, notifications, persistence, PDF/DOCX extraction and backup recovery. Browser E2E coverage is in `scripts/qa-platform.mjs`; screenshots are in `qa/platform`.

## Delivery

- [Deployment, integrations and operational limits](platform/DEPLOYMENT.md)
- [Client logo/reference treatment](platform/BRAND_REFERENCE.md)
- [Earlier design concepts](DESIGN_CONCEPTS.md)

`npm run build` creates the backend + frontend deployment package in `dist/`, excluding private databases, CVs, environment secrets and demo data. Docker and Render configuration are included at the repository root.

This application requires a Node server and persistent storage. It cannot be deployed as a static Netlify page. The current architecture is single-instance, not a high-availability deployment. Hosting, real domain/TLS setup, production administrator provisioning, live email/AI credentials and launch operations remain account-dependent; see the deployment guide.

## Source map

| Location | Purpose |
|---|---|
| `platform/app.mjs` | API, authentication, role checks and recruitment workflows |
| `platform/db.mjs` | Schema, password hashing and isolated local demo seed |
| `platform/public` | Public site, candidate dashboard and recruiter workspace |
| `platform/parse-worker.mjs` | Isolated document text extraction |
| `platform/backup.mjs` | Online backup and integrity verification |
| `platform/tests` | Backend and reliability checks |
| `01-obsidian`, `02-signal`, `03-atelier` | Preserved initial static design concepts |

Architecture and office photographs retain the credits recorded in DESIGN_CONCEPTS.md. The current logo display uses the unmodified client reference through CSS cropping; the master transparent/vector asset is still required for final brand production.
