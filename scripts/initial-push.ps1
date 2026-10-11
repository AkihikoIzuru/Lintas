# Lintas - Initial Push Script (Windows)
# Run this in PowerShell to initialize git and push to GitHub

Write-Host "🚀 Lintas - Initial Git Setup & Push" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Initialize git
Write-Host "📦 Initializing git repository..." -ForegroundColor Yellow
git init
git branch -M main

# Add remote
Write-Host "🔗 Adding GitHub remote..." -ForegroundColor Yellow
git remote add origin https://github.com/AkihikoIzuru/Lintas.git

# Stage all files
Write-Host "📝 Staging all files..." -ForegroundColor Yellow
git add .

# Create initial commit
Write-Host "💾 Creating initial commit..." -ForegroundColor Yellow
git commit -m "feat: phase 1-3 complete - foundation, auth, and kanban board

- Complete project scaffolding with Next.js 15 + TypeScript
- Prisma schema with 15+ models for full project management
- 35+ shadcn/ui components with dark mode support
- NextAuth.js v5 authentication (credentials + OAuth)
- Workspace management with role-based access control
- Project CRUD with permission checking
- Drag-and-drop Kanban board with @dnd-kit
- Task management (CRUD, assignees, labels, subtasks)
- Fractional indexing for persistent task ordering
- Comment system with @mentions support
- Activity log tracking all changes
- Task detail panel with inline editing
- 15 API routes for complete backend
- Indonesian localization (id-ID)
- Docker setup for PostgreSQL
- Complete documentation and deployment guides

Co-Authored-By: Claude Code <noreply@anthropic.com>"

# Push to GitHub
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host ""
Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Visit: https://github.com/AkihikoIzuru/Lintas"
Write-Host "2. Setup branch protection (see docs/GIT_WORKFLOW.md)"
Write-Host "3. Run: npm install && npm run db:setup"
Write-Host "4. Start development: npm run dev"
Write-Host ""
Write-Host "🌿 For future changes, always use branches:" -ForegroundColor Cyan
Write-Host "   git checkout -b feature/your-feature"
Write-Host "   (see docs/GIT_WORKFLOW.md for full workflow)"
