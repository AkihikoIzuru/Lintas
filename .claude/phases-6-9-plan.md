# Phases 6-9 Implementation Plan

## Phase 6 — Search & Advanced Features

### Database Schema Changes
1. **TaskDependency Model** (blocking relationships)
   - id, taskId, dependsOnTaskId, type (blocks, is_blocked_by)
   - Indexes on both foreign keys
   
2. **CustomField Model**
   - id, name, type (text, number, date, select, multi_select), options (JSON), projectId/workspaceId
   - position for ordering
   
3. **CustomFieldValue Model**
   - id, customFieldId, taskId, value (JSON to handle different types)
   
4. **AutomationRule Model**
   - id, name, trigger (JSON), conditions (JSON), actions (JSON), enabled, projectId/workspaceId
   
5. **Webhook Model**
   - id, url, events[], secret, enabled, projectId/workspaceId

### API Routes
- `/api/search` - Global search endpoint with filters
- `/api/tasks/[id]/dependencies` - GET, POST, DELETE dependencies
- `/api/custom-fields` - CRUD for custom fields
- `/api/custom-fields/[id]/values` - Set values for tasks
- `/api/automation-rules` - CRUD for automation rules
- `/api/webhooks` - CRUD for webhooks
- `/api/webhooks/[id]/test` - Test webhook

### Components
- `GlobalSearch` - Command palette style search (Cmd+K)
- `DependencyGraph` - Visualize task dependencies
- `CustomFieldEditor` - Manage custom fields
- `CustomFieldInput` - Render custom field inputs in TaskDetail
- `AutomationRuleBuilder` - Visual rule builder
- `WebhookManager` - Webhook management UI

### Features
- Search across all workspaces, projects, tasks by title/description/comments
- Task dependencies with cycle detection
- Custom fields per project with validation
- Automation rules: trigger → conditions → actions
- Webhook events: task.created, task.updated, task.moved, etc.

---

## Phase 7 — Notifications & Real-time

### Database Schema Changes
Already have Notification model, may need to add:
1. **NotificationSetting Model**
   - userId, channel (email, push, in_app), eventType, enabled
   
2. Update **Activity** model if needed for real-time events

### API Routes
- `/api/notifications` - GET unread, mark as read, mark all read
- `/api/notifications/settings` - User notification preferences
- `/api/notifications/subscribe` - Push notification subscription
- `/api/sse` or WebSocket endpoint for real-time updates
- `/api/activities/feed` - Activity feed endpoint

### Components
- `NotificationBell` - Bell icon with unread count
- `NotificationList` - Dropdown list of notifications
- `NotificationSettings` - User preferences panel
- `ActivityFeed` - Timeline of recent activities
- `RealtimeProvider` - Context for real-time updates

### Features
- In-app notifications with toast for real-time events
- Email notifications for: assignments, mentions, due dates, sprint events
- Push notifications (if PWA installed)
- Activity feed showing workspace/project activity
- Real-time task updates across browser tabs (polling or WebSocket)
- @mention autocomplete with user search

---

## Phase 8 — Advanced Project Features

### Database Schema Changes
1. **TimeEntry Model**
   - id, taskId, userId, duration (minutes), description, startedAt, endedAt
   
2. **RecurringTask Model**
   - id, taskId (template), frequency (daily, weekly, monthly), interval, nextOccurrence
   
3. **TaskTemplate Model**
   - id, name, templateData (JSON), projectId/workspaceId
   
4. **ProjectTemplate Model**
   - id, name, columns (JSON), labelTemplate (JSON), workspaceId
   
5. **Milestone Model**
   - id, name, dueDate, projectId, completedAt

### API Routes
- `/api/tasks/[id]/time-entries` - CRUD time entries
- `/api/tasks/[id]/timer` - Start/stop timer
- `/api/recurring-tasks` - CRUD recurring tasks
- `/api/templates/tasks` - Task templates CRUD
- `/api/templates/projects` - Project templates CRUD
- `/api/projects/[id]/milestones` - Milestone CRUD
- `/api/reports/time` - Time tracking reports
- `/api/reports/velocity` - Team velocity reports

### Components
- `TimeTracker` - Start/stop timer, manual time entry
- `TimeReport` - Time tracking visualization
- `RecurringTaskForm` - Setup recurring tasks
- `TaskTemplateLibrary` - Browse and apply templates
- `ProjectTemplateSelector` - Choose template on project creation
- `MilestoneTimeline` - Milestone visualization
- `DependencyGraphView` - Network graph of dependencies

### Features
- Time tracking with timer and manual entry
- Recurring tasks (auto-create next instance)
- Task templates (save and reuse task structures)
- Project templates (workspace-level reusable projects)
- Milestones with progress tracking
- Dependency visualization (network graph with d3 or reactflow)
- Gantt chart improvements with dependencies shown

---

## Phase 9 — Polish & Optimization

### Performance
- Implement React.memo for expensive components
- Virtual scrolling for large task lists
- Lazy loading for images/attachments
- Code splitting for routes
- Optimize Prisma queries (select only needed fields)
- Add Redis caching for frequently accessed data
- Implement pagination for large datasets

### UX Improvements
- Error boundaries with retry logic
- Skeleton loaders for all async content
- Empty states with helpful CTAs
- Loading indicators for all actions
- Optimistic updates for better perceived performance
- Keyboard shortcuts panel (? to show)
- Enhanced mobile responsive design
- Touch gestures for mobile drag-and-drop

### Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation for all features
- Focus management in modals/dialogs
- Screen reader announcements for state changes
- Color contrast compliance (WCAG AA)
- Semantic HTML throughout

### Analytics & Monitoring
- Track user actions (project created, task completed, etc.)
- Performance monitoring (API response times)
- Error tracking and logging
- Usage analytics dashboard for workspace owners

### Additional Features
- Bulk export project data (JSON/CSV)
- Import from other tools (Trello, Jira, Asana)
- Dark mode refinements
- Custom themes (color schemes)
- Workspace-level settings
- User profile page
- User avatar upload
- Keyboard shortcuts customization
- Quick actions menu (Cmd+K enhancements)

### Testing
- Unit tests for utilities and hooks
- Integration tests for API routes
- E2E tests for critical user flows
- Accessibility tests with axe-core

### Documentation
- API documentation
- User guide
- Admin guide
- Developer guide for self-hosting
- Video tutorials

---

## Implementation Strategy

### Order of Implementation
1. **Phase 6** (Search & Advanced) - 2 days
   - Global search first (high value)
   - Task dependencies second
   - Custom fields third
   - Automation rules & webhooks last (optional)

2. **Phase 7** (Notifications) - 1.5 days
   - Notification system infrastructure
   - In-app notifications
   - Email notifications setup
   - Activity feed

3. **Phase 8** (Advanced Features) - 2 days
   - Time tracking (high demand)
   - Task/project templates
   - Milestones
   - Recurring tasks

4. **Phase 9** (Polish) - 1.5 days
   - Performance optimization
   - Error boundaries and loading states
   - Empty states
   - Keyboard shortcuts
   - Accessibility audit
   - Analytics

### Database Migration Strategy
- Create all new models incrementally
- Use Prisma migrations for each phase
- Ensure backward compatibility
- Add indexes for performance

### Testing Strategy
- Write tests alongside features
- Test API routes with mock data
- Test components in isolation
- E2E tests for complete flows

### Optional Features (If Time Permits)
- Markdown editor for descriptions
- File attachments with preview
- Real-time collaborative editing
- Video call integration
- Calendar sync (Google Calendar, Outlook)
- Slack/Discord integration
- GitHub integration (link issues)
- API rate limiting
- Advanced security features (2FA, SSO)
