# Contributing to Superwall Docs

Thank you for your interest in contributing to the Superwall documentation! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository** and clone your fork locally
2. **Set up the development environment**:
   ```bash
   bun install
   bun run build
   bun run dev
   ```
3. **Create a branch** for your changes:
   ```bash
   git checkout -b your-branch-name
   ```

## Development Workflow

### Running Locally

```bash
bun run dev
```

The docs will be available at http://localhost:8293

### Making Changes

- Documentation content is located in `/content/docs/`
- Source files use `.mdx` format
- Changes to content are automatically rebuilt in development mode
- Some changes (like redirects or remark plugins) may require restarting the dev server

### Building

Before submitting a pull request, please ensure the build succeeds:
```bash
bun run build
```

And the site works in local development mode:
```bash
bun run dev
```

## Code Style

- Follow existing code patterns and conventions
- Ensure all code examples are accurate and tested
- Use clear, concise language in documentation

## Submitting Changes

1. **Commit your changes** with clear, descriptive commit messages
2. **Push to your fork** and create a pull request
3. **Describe your changes** in the PR description, including:
   - What changed and why
   - Any relevant context or screenshots
   - Testing performed

Your pull request will be reviewed by the maintainers and merged if approved.


---

Thank you for contributing! 🎉
