# Manual Setup Steps

Since npm install is currently unavailable through automation, please run these commands manually:

## 1. Install Dependencies

```bash
npm install next@15.1.0 react@19.0.0 react-dom@19.0.0 @prisma/client @tanstack/react-query @tanstack/react-query-devtools next-themes next-auth@beta bcryptjs zod react-hook-form @hookform/resolvers lucide-react clsx tailwind-merge class-variance-authority date-fns @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities cmdk sonner recharts framer-motion

npm install -D typescript @types/node @types/react @types/react-dom @types/bcryptjs tailwindcss postcss autoprefixer tailwindcss-animate prisma vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test eslint eslint-config-next prettier prettier-plugin-tailwindcss tsx

npm install -D @radix-ui/react-slot @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-tooltip
```

## 2. Initialize Git

```bash
git init
git add .
git commit -m "feat: initial project setup - Phase 1 foundation"
```

## 3. Start Development

```bash
# Start PostgreSQL
docker compose up -d

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Start dev server
npm run dev
```

## 4. Verify Setup

Open http://localhost:3000 and verify:
- Landing page loads correctly
- Dark/light theme toggle works
- Navigation is responsive
- No console errors

## Next Steps

Once Phase 1 is complete, proceed with Phase 2:
- Set up NextAuth.js authentication
- Implement workspace management
- Build permission layer
- Add API health endpoint