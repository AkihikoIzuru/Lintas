# Git Workflow & Branch Strategy

## Initial Setup (Run Once)

### 1. Initialize Repository
```bash
cd D:\anu\FullStack
git init
git branch -M main
```

### 2. Configure User (if needed)
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 3. Add Remote
```bash
git remote add origin https://github.com/AkihikoIzuru/Lintas.git
```

### 4. Initial Commit & Push
```bash
git add .
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

git push -u origin main
```

---

## Branch Strategy (For Future Development)

### Branch Types

1. **`main`** - Production-ready code
   - Always stable and deployable
   - Protected branch (no direct commits)
   - All changes via Pull Requests

2. **`develop`** - Integration branch
   - Latest development changes
   - Base for all feature branches
   - Merged to main when ready for release

3. **`feature/*`** - New features
   - Format: `feature/phase-4-views`
   - Branch from: `develop`
   - Merge to: `develop`

4. **`fix/*`** - Bug fixes
   - Format: `fix/task-drag-drop-issue`
   - Branch from: `develop` or `main` (hotfix)
   - Merge to: `develop` or both

5. **`chore/*`** - Maintenance tasks
   - Format: `chore/update-dependencies`
   - Branch from: `develop`
   - Merge to: `develop`

---

## Workflow for Future Changes

### Starting New Work (Phase 4 Example)

```bash
# 1. Ensure you're on main and up to date
git checkout main
git pull origin main

# 2. Create develop branch (first time only)
git checkout -b develop

# 3. Create feature branch
git checkout -b feature/phase-4-views

# 4. Work on your changes...
# (make edits, add files, etc.)

# 5. Commit frequently with conventional commits
git add .
git commit -m "feat(views): add list view component"

git add .
git commit -m "feat(views): add calendar view component"

# 6. Push feature branch to GitHub
git push -u origin feature/phase-4-views
```

### Creating Pull Request

```bash
# After pushing, create PR on GitHub:
# feature/phase-4-views -> develop

# PR Title: "feat: Phase 4 - Multiple Views & Filters"
# PR Description:
# - List view with filtering
# - Calendar view with date range
# - Timeline/Gantt view
# - Advanced filter system
# - Saved filters
```

### Merging & Cleanup

```bash
# After PR is merged on GitHub:

# 1. Switch back to develop
git checkout develop
git pull origin develop

# 2. Delete local feature branch
git branch -d feature/phase-4-views

# 3. Delete remote feature branch (optional, can keep for history)
git push origin --delete feature/phase-4-views
```

---

## Commit Message Convention

Format: `<type>(<scope>): <subject>`

### Types:
- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code style changes (formatting, no logic change)
- **refactor:** Code refactoring
- **perf:** Performance improvements
- **test:** Adding or updating tests
- **chore:** Maintenance tasks (deps, config)
- **ci:** CI/CD changes

### Examples:
```bash
git commit -m "feat(auth): add OAuth Google provider"
git commit -m "fix(board): resolve drag-drop position calculation"
git commit -m "docs(readme): update installation instructions"
git commit -m "refactor(api): extract permission checking utility"
git commit -m "perf(board): optimize task list rendering"
git commit -m "test(auth): add login integration tests"
git commit -m "chore(deps): update Next.js to 15.1.0"
```

---

## Quick Reference Commands

### Check Status
```bash
git status
git branch              # List local branches
git branch -r           # List remote branches
git log --oneline -10   # Last 10 commits
```

### Switch Branches
```bash
git checkout main
git checkout develop
git checkout -b feature/new-feature  # Create and switch
```

### Update Branch
```bash
git pull origin main
git pull origin develop
```

### Sync Feature Branch with Develop
```bash
# While on feature branch:
git checkout feature/my-feature
git merge develop
# Or rebase (cleaner history):
git rebase develop
```

### Stash Changes (temporary save)
```bash
git stash              # Save current changes
git stash list         # List stashes
git stash pop          # Apply and remove stash
git stash apply        # Apply but keep stash
```

### Undo Changes
```bash
git reset HEAD~1       # Undo last commit (keep changes)
git reset --hard HEAD~1  # Undo last commit (discard changes)
git checkout -- file.ts  # Discard changes in file
```

---

## Protected Branch Setup (GitHub)

After first push, configure on GitHub:

1. Go to: Settings → Branches
2. Add rule for `main`:
   - ✅ Require pull request before merging
   - ✅ Require approvals (1)
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Include administrators

3. Add rule for `develop`:
   - ✅ Require pull request before merging
   - ✅ Require status checks to pass

---

## Example: Phase 4 Development Flow

```bash
# 1. Start from main
git checkout main
git pull origin main

# 2. Create/update develop
git checkout -b develop  # or: git checkout develop && git pull

# 3. Create feature branch
git checkout -b feature/phase-4-views

# 4. Make changes and commit
git add app/w/[slug]/projects/[projectId]/list/page.tsx
git commit -m "feat(views): add list view with sorting"

git add app/w/[slug]/projects/[projectId]/calendar/page.tsx
git commit -m "feat(views): add calendar view with date picker"

git add components/filters/advanced-filter.tsx
git commit -m "feat(filters): add advanced filter component"

# 5. Push feature branch
git push -u origin feature/phase-4-views

# 6. Create PR on GitHub: feature/phase-4-views -> develop

# 7. After merge, cleanup
git checkout develop
git pull origin develop
git branch -d feature/phase-4-views

# 8. When ready for release, merge develop -> main via PR
```

---

## Git Aliases (Optional Shortcuts)

Add to `~/.gitconfig`:

```ini
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    cm = commit -m
    pl = pull
    ps = push
    lg = log --oneline --graph --decorate --all
    undo = reset HEAD~1
    amend = commit --amend --no-edit
```

Usage:
```bash
git st          # Instead of: git status
git co main     # Instead of: git checkout main
git cm "message"  # Instead of: git commit -m "message"
git lg          # Pretty log view
```

---

## Best Practices

1. **Commit Often:** Small, focused commits are better
2. **Write Clear Messages:** Follow conventional commit format
3. **Pull Before Push:** Always update your branch first
4. **Keep Branches Short-Lived:** Merge within 1-3 days
5. **Review Your Changes:** Use `git diff` before committing
6. **Test Before Pushing:** Run lint, typecheck, build
7. **Use PR Templates:** Consistent PR descriptions
8. **Delete Merged Branches:** Keep repository clean

---

## Current Repository State

```
main (after first push)
├── Phase 1: Foundation ✅
├── Phase 2: Auth & Workspaces ✅
└── Phase 3: Projects & Kanban Board ✅
```

## Next Development

```
develop (to be created)
└── feature/phase-4-views
    ├── List view
    ├── Calendar view
    ├── Timeline view
    └── Advanced filters
```

---

**Remember:** Always work on feature branches, never commit directly to `main`!

**Created:** 2026-10-11  
**Updated:** 2026-10-11