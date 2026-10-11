# Lintas

Modern, beautiful project management for small teams and freelancers. Built with Next.js, TypeScript, Prisma, and PostgreSQL.

🚧 **Status:** In active development

## Features

🎯 **Kanban Boards** — Customizable columns with drag-and-drop  
📋 **Multiple Views** — Board, List, Calendar, Timeline  
👥 **Team Collaboration** — Comments, @mentions, real-time updates  
🔐 **Role-Based Access** — Owner, Admin, Member, Viewer roles  
🏃 **Sprints & Burndown** — Simple sprint cycles with progress tracking  
📊 **Dashboard & Reports** — Workload, progress, activity charts  
🌐 **PWA Support** — Installable, works offline  
🌙 **Dark Mode** — System-aware theme switching  
🇮🇩 **Indonesian First** — Primary language with i18n ready

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui (Radix UI)
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** NextAuth.js v5
- **State:** TanStack Query
- **DnD:** dnd-kit
- **Animation:** Framer Motion
- **Testing:** Vitest, Playwright

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (for local PostgreSQL)
- npm or yarn

### Local Development

```bash
# Clone repository
git clone <repository-url>
cd FullStack

# Install dependencies
npm install

# Start PostgreSQL
docker compose up -d

# Set up database
npm run db:setup

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lintas"
AUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

## Project Structure

```
/app                    # Next.js App Router pages & API
  /api                  # API routes
  /auth                 # Authentication pages
  /w/[slug]             # Workspace pages
  layout.tsx            # Root layout
  page.tsx              # Landing page
/components             # React components
  /ui                   # shadcn/ui base components
  /layout               # Layout components (Sidebar, TopBar)
  /board                # Kanban board components
  /providers            # Context providers
/lib                    # Utilities & helpers
  /validations.ts       # Zod schemas
  /constants.ts         # App constants
  /utils.ts             # Helper functions
  /prisma.ts            # Prisma client
/hooks                  # Custom React hooks
/prisma                 # Database schema & migrations
  schema.prisma         # Prisma schema
  /migrations           # Migration files
/public                 # Static assets
/docs                   # Documentation
/tests                  # Tests (Vitest + Playwright)
```

## Available Scripts

```bash
npm run dev              # Start dev server (Turbopack)
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
npm run typecheck        # TypeScript type checking
npm test                 # Run Vitest tests
npm run test:e2e         # Run Playwright E2E tests
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Create migration
npm run db:seed          # Seed database
npm run db:setup         # Full database setup
npm run db:studio        # Open Prisma Studio
npm run format           # Format with Prettier
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `C` | New task |
| `⌘/Ctrl + K` | Command palette / Search |
| `1-4` | Switch views (Board/List/Calendar/Timeline) |
| `Enter` | Open task |
| `Esc` | Close modal |
| `B` | Toggle sidebar |
| `?` | Show shortcuts |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

See [docs/DEPLOY.md](docs/DEPLOY.md) for detailed instructions.

### Docker Self-Host

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test
3. Run linting: `npm run lint`
4. Run tests: `npm test`
5. Commit: `git commit -m "feat: your feature"`
6. Push and create PR

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Lintas** — Manajemen proyek modern untuk tim kecil dan freelancer. Cepat, indah, dan powerful.

Built with ❤️ using Next.js and TypeScript.