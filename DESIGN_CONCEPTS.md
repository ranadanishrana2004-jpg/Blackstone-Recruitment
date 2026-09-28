# Blackstone Recruitment — three design concepts

Open `index.html` to compare the collection, or open a concept's own `index.html` directly. Each concept is independent and deployable without the other folders.

| Folder | Direction |
| --- | --- |
| `01-obsidian` | Architectural black, ivory and muted gold; editorial serif typography; tailored, premium feel |
| `02-signal` | Electric blue and lime; bold typography; energetic digital recruitment |
| `03-atelier` | Forest green and fresh neutrals; arched photography; refined, personal feel |

## Deploy to Netlify

1. Extract the ZIP for the chosen concept from `deployments`.
2. Drag the extracted folder containing `index.html` into Netlify's manual deployment area.
3. No build command, package installation, API key or environment variables are needed.

Alternatively deploy `blackstone-complete-collection.zip` to give the client one comparison URL with all three concepts. All internal navigation uses URL hashes, so individual concept deep links work without server routing rules.

For a Git-connected Netlify project, set the publish directory to the chosen concept folder (for example `01-obsidian`), with no build command. The deployment directories contain the finished static files.

## Included in each design

- Light mode by default, optional dark mode remembered per concept.
- Responsive mobile navigation and desktop layouts.
- Page transitions, reduced-motion support, keyboard focus styles and accessible modal dialogs.
- Subtle Blackstone watermark behind every page.
- Home, searchable opportunities, employers, approach, CV submission, recruiter workspace and privacy views.
- Six illustrative vacancies; keyword, location and specialism filtering; saved roles and job details.
- PDF/DOCX selection and drag-and-drop, 5 MB validation, application preview and recruiter file download.
- Candidate status changes, shortlisting, fictional profile previews and clearly labelled sample analysis.

## Demo boundaries

These are design-selection prototypes, not production recruitment systems. Job listings and initial candidate profiles are fictional. UK locations and GBP salary examples are illustrative and can be replaced after the client's market is confirmed.

CV files and submitted details remain in memory in the current tab. Refreshing or closing the tab clears them. No uploads, employer enquiries or applications are delivered to a server. Only theme preferences use localStorage. Use sample files and fictional contact details.

The recruiter workspace is deliberately open for presentation. It is not authenticated. The AI analysis is pre-written sample content for fictional profiles; uploaded CVs are not read, parsed, scored or sent to a model. Uploaded profiles instead show a manual review checklist and an explicit notice that analysis is not connected.

After a direction is selected, production work includes staff authentication, secure persistent CV storage, application management, real job data, email delivery, consent/retention policies and a properly integrated AI review service with human oversight.

## Editing and rebuilding

The delivered folders are already built. Shared source lives in `source`; each visual direction has a dedicated stylesheet. Run `npm run build` (or `node scripts/build.mjs`) to regenerate the independent folders. No npm dependencies are required to build. The build does not recreate deployment ZIPs; repackage the updated folders after changes.

Local preview: `python -m http.server 4173 --bind 127.0.0.1`, then open `http://127.0.0.1:4173/`.

QA screenshots are in `qa`. `scripts/qa.cjs` is a Playwright smoke test; it is not required for deployment. The checks cover all seven mobile routes, layout overflow, both themes, job search, saving, job application, CV selection, recruiter review, shortlist changes, employer enquiry and navigation, and collect browser runtime errors. Optional WebMCP registration is feature-detected; native WebMCP validation was unavailable in the installed browser.

## Image credits

- Obsidian: [Claudio Schwarz — architectural photograph](https://unsplash.com/photos/a-black-and-white-photo-of-a-tall-building-glXELTu1jY8).
- Atelier: [Deliberate Directions — modern workspace](https://unsplash.com/photos/modern-office-space-with-a-bright-sunny-interior-yTrgkVaY1TM).

Both source pages identify the photographs as free under the [Unsplash License](https://unsplash.com/license). The images are included locally in their respective deployment folders. Google Fonts loads DM Sans, Manrope and Playfair Display with system fallbacks if unavailable.
