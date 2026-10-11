#!/bin/bash
# Lintas - Initial Push Script
# Run this script to initialize git and push to GitHub

echo "🚀 Lintas - Initial Git Setup & Push"
echo "======================================"
echo ""

# Initialize git
echo "📦 Initializing git repository..."
git init
git branch -M main

# Add remote
echo "🔗 Adding GitHub remote..."
git remote add origin https://github.com/AkihikoIzuru/Lintas.git

# Stage all files
echo "📝 Staging all files..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
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
echo "🚀 Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Successfully pushed to GitHub!"
echo ""
echo "📋 Next steps:"
echo "1. Visit: https://github.com/AkihikoIzuru/Lintas"
echo "2. Setup branch protection (see docs/GIT_WORKFLOW.md)"
echo "3. Run: npm install && npm run db:setup"
echo "4. Start development: npm run dev"
echo ""
echo "🌿 For future changes, always use branches:"
echo "   git checkout -b feature/your-feature"
echo "   (see docs/GIT_WORKFLOW.md for full workflow)"
