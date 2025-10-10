# Contributing to MYMAPS

First off, thank you for considering contributing to MYMAPS! 🎉

It's people like you that make MYMAPS such a great tool for sharing and discovering locations.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples** to demonstrate the steps
* **Describe the behavior you observed** and explain what you expected to see instead
* **Include screenshots and animated GIFs** if possible
* **Include your environment details** (OS, browser, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a step-by-step description** of the suggested enhancement
* **Provide specific examples** to demonstrate the steps
* **Describe the current behavior** and **explain the behavior you expected** to see instead
* **Explain why this enhancement would be useful**

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Follow the TypeScript and React coding style
* Include screenshots and animated GIFs in your pull request whenever possible
* End all files with a newline
* Ensure your code passes all tests

## Development Process

### 1. Fork and Clone

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR-USERNAME/MYMAPS.git
cd MYMAPS

# Add upstream remote
git remote add upstream https://github.com/Stevenalenga/MYMAPS.git
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Set Up Development Environment

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### 4. Make Your Changes

* Write clean, readable code
* Follow existing code style and conventions
* Add comments for complex logic
* Update documentation if needed

### 5. Test Your Changes

```bash
# Run tests
npm test

# Run linter
npm run lint

# Type check
npm run type-check

# Test specific feature
npm run test:expiration
```

### 6. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug in location dialog"
git commit -m "docs: update API documentation"
git commit -m "refactor: improve map container performance"
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, semicolons, etc)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

### 7. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Go to GitHub and create a Pull Request
```

## Code Style Guidelines

### TypeScript

```typescript
// ✅ Good
interface LocationProps {
  name: string
  lat: number
  lng: number
  visibility: "public" | "followers" | "private"
}

// ❌ Bad
interface LocationProps {
  name: any
  lat: any
  lng: any
}
```

### React Components

```typescript
// ✅ Good - Use functional components with TypeScript
export function LocationDialog({ open, onClose }: LocationDialogProps) {
  const [name, setName] = useState("")
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* component content */}
    </Dialog>
  )
}

// ❌ Bad - Don't use class components
class LocationDialog extends React.Component {
  // ...
}
```

### Naming Conventions

* **Components**: PascalCase (`LocationDialog`, `MapContainer`)
* **Functions**: camelCase (`deleteLocation`, `formatCoordinates`)
* **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_LOCATIONS`)
* **Files**: kebab-case (`location-dialog.tsx`, `map-container.tsx`)

### File Organization

```typescript
// ✅ Good - Organize imports
"use client" // If needed

// 1. React and Next.js imports
import { useState, useEffect } from "react"
import Link from "next/link"

// 2. Third-party libraries
import { useToast } from "@/hooks/use-toast"

// 3. Local components
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"

// 4. Types
import type { Location } from "@/types"

// 5. Utils and constants
import { formatCoordinates } from "@/lib/format-coordinates"
```

## Testing Guidelines

### Unit Tests

```typescript
import { render, screen } from "@testing-library/react"
import { LocationDialog } from "./location-dialog"

describe("LocationDialog", () => {
  it("renders location dialog with correct title", () => {
    render(<LocationDialog open={true} />)
    expect(screen.getByText("Add Location")).toBeInTheDocument()
  })

  it("shows validation error for empty name", () => {
    // Test implementation
  })
})
```

### Integration Tests

Test user flows and component interactions:

```typescript
it("creates a new location successfully", async () => {
  const user = userEvent.setup()
  render(<MapContainer />)
  
  await user.click(screen.getByRole("button", { name: /add location/i }))
  await user.type(screen.getByLabelText(/name/i), "My Cafe")
  await user.click(screen.getByRole("button", { name: /save/i }))
  
  expect(await screen.findByText("Location saved")).toBeInTheDocument()
})
```

## Documentation

### Code Comments

```typescript
/**
 * Deletes expired public locations older than 24 hours
 * @returns Number of deleted locations
 */
export async function deleteExpiredLocations(): Promise<number> {
  // Implementation
}
```

### API Documentation

When adding new API routes, document them in `docs/api-reference.md`:

```markdown
### POST /api/locations

Creates a new location.

**Request:**
\`\`\`json
{
  "name": "My Location",
  "lat": 40.7128,
  "lng": -74.0060,
  "visibility": "public"
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "uuid",
  "name": "My Location",
  ...
}
\`\`\`
```

## Database Changes

When making database changes:

1. Create a new migration file in `supabase/migrations/`
2. Name it with timestamp: `YYYYMMDD_description.sql`
3. Document the changes in comments
4. Test locally before committing

```sql
-- Migration: Add location categories
-- Date: 2025-01-15
-- Description: Adds category field to locations table

ALTER TABLE locations 
ADD COLUMN category TEXT CHECK (category IN ('restaurant', 'cafe', 'park', 'other'));

CREATE INDEX idx_locations_category ON locations(category);
```

## Release Process

We use semantic versioning (MAJOR.MINOR.PATCH):

* **MAJOR**: Breaking changes
* **MINOR**: New features (backward compatible)
* **PATCH**: Bug fixes

## Getting Help

* 💬 [GitHub Discussions](https://github.com/Stevenalenga/MYMAPS/discussions) - Ask questions
* 🐛 [GitHub Issues](https://github.com/Stevenalenga/MYMAPS/issues) - Report bugs
* 📧 Email maintainers for sensitive issues

## Recognition

Contributors will be recognized in:
* README.md Contributors section
* Release notes
* GitHub contributors page

Thank you for contributing to MYMAPS! 🙏
