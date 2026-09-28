# User journey review

Reviewed the public website, jobs and filters, registration/sign-in/recovery entry points, candidate profile and CV library, saving and applying, application tracking, recruiter review and notes, pipeline, job editor, interviews/calendar, hiring enquiries, team management and notifications using the existing end-to-end browser suite and a dedicated journey suite.

## Changes

- A job selected before sign-in survives switching from sign-in to registration. The account flow explains the return destination. The general Submit your CV entry point returns new candidates to their CV library.
- CVs can be uploaded directly in the application dialog. File validation and upload status appear in place; the introduction and consent controls remain in the same form. Failed uploads can be retried without starting again. A selected CV is required before submission.
- Previously applied jobs show the application status and a link to the existing application. Recruiters see Manage this role instead of candidate actions.
- Search keywords, country, specialism and workplace are reflected in the jobs URL and restored on reload/back. The All opportunities link retains the current in-session search. Clear filters gives an immediate way out of empty results.
- Candidate overview includes optional, actionable profile/CV/application next steps without blocking applications behind profile completion.
- Recruiter pipeline stages link to filtered applications. Stage, search and table/pipeline view persist in the URL.
- Password visibility controls, active-page navigation semantics and focused inline form errors improve keyboard and form use. HTTP(S) interview URLs open directly in a separate tab; other venue text stays plain text.
- The staff header shortcut points directly to the staff workspace. The highlighted dashboard metric has corrected light-theme contrast.
- The user-requested one-second branded page transition and reduced-motion behavior are retained.

## Validation

- `node scripts/qa-platform.mjs`: public and private flows, real signup/login, uploads, applications, review/notes/checklist, scheduling/calendar, team/enquiries, desktop/dark/mobile navigation.
- `node scripts/qa-journey.mjs`: job context through registration, persisted filters, inline invalid/valid CV upload, preserved introduction, application tracking, duplicate-action visibility, mobile dialog layout, onboarding and recruiter stage/view persistence.
- `npm run check`: frontend and backend syntax checks, including the new journey helper.

Browser tests use fictional records in isolated temporary databases. Live email and AI integrations remain dependent on provider configuration; this review does not claim to have tested those external services.
