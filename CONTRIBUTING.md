# Contributing to Lintas

Thank you for considering contributing to Lintas! We welcome contributions from everyone.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](../../issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, Node version)

### Suggesting Features

1. Check if the feature has been suggested in [Issues](../../issues)
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Mockups or examples if applicable

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes following the code style guidelines
4. Write or update tests as needed
5. Ensure all tests pass: `npm test` and `npm run test:e2e`
6. Run linting: `npm run lint`
7. Run type checking: `npm run typecheck`
8. Commit with clear messages following [Conventional Commits](https://www.conventionalcommits.org/)
9. Push to your fork
10. Open a Pull Request with:
    - Clear description of changes
    - Link to related issue(s)
    - Screenshots/GIFs for UI changes

## Development Setup

See [README.md](README.md#quick-start) for development environment setup.

## Code Style

- Follow existing code patterns
- Use TypeScript strict mode
- Write descriptive variable/function names
- Add comments for complex logic
- Keep functions small and focused
- Use Prettier for formatting: `npm run format`

## Testing

- Write unit tests for utilities and hooks
- Write integration tests for API routes
- Write E2E tests for critical user flows
- Aim for meaningful coverage, not 100%

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add task filtering by label
fix: resolve drag-and-drop ordering issue
docs: update deployment guide
chore: upgrade dependencies
test: add tests for workspace permissions
```

## Code of Conduct

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

## Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

Thank you for contributing! 🎉