# TASK: Build "Lintas" — a modern, beautiful project management app (fullstack, deployable)

You are building a complete production-quality fullstack web app from scratch in this empty folder.
The environment is Windows: use cross-platform commands only (npm scripts, no bash-only syntax).

## 0. Working rules (READ FIRST, follow strictly)

1. Work in PHASES (below). Finish one phase completely before starting the next.
2. At the end of each phase: run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Fix every failure.
   Then `git commit` with a clear conventional message (feat:, fix:, docs:, chore:).
3. Maintain `PROGRESS.md` at the repo root. After every phase update it with: phases done, current phase,
   decisions made, known issues, exact next steps. If you lose context or the model changes, READ `PROGRESS.md` and `TASK.md` first and continue.
4. No placeholders, no TODO stubs, no fake data in production code paths, no "lorem ipsum". Every button must work.
5. Never hardcode secrets. Use `.env` + a committed `.env.example` with every variable documented.
6. Never claim something works unless you ran it. If you cannot do something (e.g. no cloud credentials), do not fake it:
   prepare everything and write the exact manual steps for me in `docs/DEPLOY.md`.
7. Prefer simple, boring, well-maintained solutions. Keep files small and organized. Add short comments only where logic is non-obvious.

## 1. Product

**Lintas** is a project management tool for small teams and freelancers: plan work on Kanban boards, track tasks,
collaborate with comments, and see progress at a glance. Think a lighter, faster, prettier mix of Trello + Linear.
Default language: Indonesian (id-ID). Structure strings in a simple i18n dictionary so adding English later is easy.
Dates formatted for Indonesia (e.g. `12 Okt 2026`), timezone-aware.

### Features (all required)
- **Auth**: email + password (argon2 or bcrypt), sessions, logout, protected routes, password reset flow
  (email sending optional via env; log link to console in dev). Optional GitHub/Google login only if env vars are set.
- **Workspaces & members**: create workspace, invite members by link/email, roles (Owner, Admin, Member, Viewer) enforced server-side.
- **Projects**: create/edit/archive, color + icon, description, per-project members.
- **Kanban board**: customizable columns (status), drag-and-drop for cards AND columns (dnd-kit), smooth animation, keyboard-accessible DnD,
  WIP limit per column (optional), persistent ordering (use fractional indexing or similar; no full reorder on every drag).
- **Tasks**: title, rich description (markdown or tiptap), assignee(s), priority (Urgent/High/Medium/Low), labels, due date, estimate,
  subtasks/checklist, attachments (local disk or S3-compatible via env; size/type limits), activity log per task.
- **Task detail**: side panel/modal with inline editing, comments with @mentions, activity timeline, copyable deep link.
- **Multiple views** of the same data: Board, List (table with sort/group/filter), Calendar (by due date), and a simple Timeline/Gantt-lite.
- **Filters & search**: global search (Ctrl/Cmd+K command palette) across tasks/projects; saved filters; filter by assignee, label, priority, due date.
- **Sprints/Cycles** (simple): create a sprint with date range, add tasks, burndown chart.
- **Dashboard**: my tasks today/overdue, workload per member, project progress, completed-per-week chart, recent activity.
- **Notifications**: in-app notification center (assigned, mentioned, due soon, comment), unread badge, mark all read. Email digest optional via env.
- **Real-time-ish updates**: when a teammate changes a board, others see it without a manual refresh (SSE or polling with ETag; document the choice).
- **Import/Export**: export project to CSV/JSON; import tasks from CSV with column mapping + validation preview.
- **Templates**: "Software sprint", "Marketing campaign", "Personal to-do" project templates.
- **Demo mode**: "Coba demo" button creates a demo workspace with realistic sample projects, tasks, comments, and a fake teammate.
- **PWA**: installable, offline app shell, good mobile experience.
- **Settings**: profile, avatar, theme, notification prefs, workspace settings, delete account/workspace.

## 2. Stack (use unless there is a strong reason not to; document any deviation in PROGRESS.md)
- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS + shadcn/ui (Radix) + lucide-react
- dnd-kit for drag-and-drop, framer-motion for subtle animation, Recharts for charts
- PostgreSQL + Prisma (migrations committed). Local dev DB via `docker-compose.yml`.
- Auth.js (NextAuth) or equivalent solid library
- Zod validation on every server boundary; TanStack Query (or server actions + revalidation) with optimistic updates
- Vitest (unit/integration) + Playwright (critical e2e flows)
- ESLint + Prettier

## 3. UI / UX bar (this is a priority, not an afterthought)
- Modern, clean, premium look comparable to Linear/Notion/Height: consistent design tokens (color, radius, spacing, type scale),
  one cohesive accent palette, tasteful gradients/glass only where it helps, crisp typography (e.g. Inter / Geist).
- **Dark and light themes**, system default, no flash on load.
- **Mobile-first and fully responsive**: on mobile the board becomes horizontally snap-scrollable columns, bottom tab bar, big touch targets (>= 44px);
  on desktop a collapsible sidebar. Drag-and-drop must work with touch.
- Micro-interactions: skeleton loaders, optimistic updates, satisfying drag feedback, animated progress rings/bars, confetti or subtle celebration when a sprint completes (respect `prefers-reduced-motion`).
- Thoughtful empty states with a clear call to action; helpful error states; toasts with undo (e.g. undo task delete/move).
- Keyboard-first: shortcuts for new task (C), search (Ctrl/Cmd+K), switch view (1-4), open task (Enter), with an in-app shortcuts cheat sheet (?).
- Accessibility: WCAG AA contrast, keyboard navigable, labels/aria, visible focus rings.
- Performance: Lighthouse >= 90 on Performance/Accessibility/Best Practices for landing + main app pages. Virtualize very long lists. Avoid huge client bundles.
- Polished landing page (hero with animated board mock, feature highlights, CTA to sign up / try demo), favicon, app icons, OG image.

## 4. Quality & security requirements
- Strict authorization: every query/mutation checks workspace membership AND role. Test explicitly that user A can never read/write workspace B's data,
  and that Viewers cannot mutate.
- Server-side validation (Zod), rate limiting on auth + invite routes, secure cookies, CSRF-safe patterns, security headers, sanitize markdown/HTML (prevent XSS),
  validate uploads (type, size, randomized storage names), no sensitive data in logs.
- Concurrency: handle two users moving the same card (last-write-wins with clear conflict handling or versioning; document it).
- Tests: unit tests for ordering logic, permissions, sprint/burndown calc, filters; integration tests for key actions/API;
  at least 4 Playwright e2e flows (signup -> create project -> add/move task; invite & role restriction; comment with mention -> notification; CSV export).
- `GET /api/health` returns status, version, and DB connectivity.

## 5. Phases

### Phase 1 — Foundation
Scaffold project, tooling, lint/format/typecheck scripts, folder structure, design tokens, theme system, base layout (sidebar/bottom bar),
`docker-compose.yml` for Postgres, `.env.example`, `PROGRESS.md`. Commit.

### Phase 2 — Data, auth, workspaces
Prisma schema + migrations + seed, auth flows, workspaces/members/roles, permission layer, health endpoint. Tests for auth + authorization isolation. Commit.

### Phase 3 — Projects, tasks, board
Projects, columns, tasks, drag-and-drop with persistent ordering, task detail panel, labels, priorities, subtasks, comments, activity log. Tests for ordering + permissions. Commit.

### Phase 4 — Views, search, sprints, dashboard
List/Calendar/Timeline views, filters + saved filters, command palette, sprints + burndown, dashboard charts. Commit.

### Phase 5 — Collaboration & extras
Notifications, @mentions, real-time updates, attachments, import/export, templates, demo mode. Commit.

### Phase 6 — UI polish & PWA
Landing page, animations, empty/error/loading states, mobile + desktop responsive pass, accessibility pass, PWA manifest/service worker/icons, Lighthouse check. Commit.

### Phase 7 — Testing hardening
Playwright e2e flows, fix flaky tests, coverage on critical logic, security review checklist (results in `docs/SECURITY.md`). Commit.

### Phase 8 — DevOps: deploy + update workflow
- `Dockerfile` (multi-stage, small, non-root) and `docker-compose.prod.yml` (app + Postgres + Caddy reverse proxy with automatic HTTPS) as the self-host option.
- **Primary deploy path:** Vercel + hosted Postgres (Neon or Supabase free tier) + S3-compatible storage for attachments (or document the limitation of serverless disk).
  Write `docs/DEPLOY.md` with exact step-by-step instructions (create DB, env vars, `prisma migrate deploy`, first deploy, custom domain, verify via /api/health),
  including a Windows-friendly checklist.
- **CI/CD** with GitHub Actions: on PR run lint + typecheck + test + build; on push to `main` (or version tag) run migrations safely and deploy. Secrets documented, never committed.
- **Update workflow** (`docs/UPDATING.md`): semantic versioning, `CHANGELOG.md` (Keep a Changelog), how to ship a new feature, run production migrations safely
  (expand/contract pattern for risky changes), roll back, back up/restore the DB, update dependencies (Dependabot or Renovate config included).
- Show app version in settings/footer (read from package.json). Commit.

### Phase 9 — Docs & release
- **README.md** must be catchy and professional: banner/logo, one-line pitch, badges (CI, license, version), screenshots/GIFs that reference real files in `docs/images/`
  (generate real screenshots with Playwright), "Why Lintas", feature list with emojis, tech stack, **Quick Start in under 5 minutes** (local + Docker),
  deploy section (Vercel + self-host), project structure, scripts table, keyboard shortcuts, roadmap, contributing, license, and a short Indonesian summary at the bottom.
- `LICENSE` (MIT), `CONTRIBUTING.md`, issue/PR templates.
- Tag `v1.0.0` locally and update `CHANGELOG.md`.

## 6. Definition of Done (verify every item and report results honestly)
- [ ] Fresh clone -> `npm install` -> `docker compose up -d` -> `npm run db:setup` -> `npm run dev` works exactly as README says.
- [ ] lint, typecheck, unit/integration tests, e2e tests, and production build all pass.
- [ ] Authorization/role isolation is tested and passing.
- [ ] Drag-and-drop works with mouse, keyboard, and touch; board stays consistent after reload.
- [ ] Works well on a 375px viewport and on desktop; both themes look polished.
- [ ] PWA installable; Lighthouse >= 90 on main pages (record scores in PROGRESS.md).
- [ ] `docs/DEPLOY.md` and `docs/UPDATING.md` are complete and verified as far as possible without my cloud credentials.
- [ ] README is complete, accurate, and has no broken links or placeholder text.
- [ ] `PROGRESS.md` is current, and the final message lists: what was built, what I must do manually to go live, and known limitations.

Start now with Phase 1. After each phase, summarize briefly and continue automatically to the next unless blocked.