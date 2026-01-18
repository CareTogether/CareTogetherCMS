# CareTogether UI Components

A standalone UI component library for CareTogether projects, built with React, TypeScript, MUI v7, and Vite.

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
cd ui-components
npm install
```

### Run Storybook

```bash
npm run storybook
```

Storybook will start on [http://localhost:6006](http://localhost:6006)

### Build Library

```bash
npm run build
```

Outputs to `dist/` directory.

### Type Checking

```bash
npm run type-check
```

### Linting & Formatting

```bash
npm run lint          # Check for lint errors
npm run lint:fix      # Auto-fix lint errors
npm run format        # Format code
npm run format:check  # Check formatting
```

## Usage in Monorepo

### As a Local Package (Recommended)

Add this to your React app's `package.json`:

```json
{
  "dependencies": {
    "@caretogether/ui-components": "file:../ui-components"
  }
}
```

Then install dependencies:

```bash
npm install
```

### Import Components

```typescript
import { Shell, ContextHeader, ColoredChip, ExpandableText } from "@caretogether/ui-components";
import { theme } from "@caretogether/ui-components/theme";
import type { ShellProps, BreadcrumbItem } from "@caretogether/ui-components";
```

### Example Usage

```tsx
import { ThemeProvider } from "@mui/material";
import { Shell, ContextHeader } from "@caretogether/ui-components";
import { theme } from "@caretogether/ui-components/theme";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Shell>
        <Shell.Header leftContent={<MenuButton />} rightContent={<UserMenu />} />
        <Shell.Sidebar>
          <Navigation />
        </Shell.Sidebar>
        <Shell.Content>
          <ContextHeader>
            <ContextHeader.Breadcrumbs
              items={[{ label: "Home", onClick: () => navigate("/") }, { label: "Current Page" }]}
            />
            <ContextHeader.Title>Page Title</ContextHeader.Title>
          </ContextHeader>
          {/* Your content here */}
        </Shell.Content>
      </Shell>
    </ThemeProvider>
  );
}
```

## Development Guidelines

### Creating New Components

1. Use `Pick<MuiComponentProps, ...>` for prop inheritance
2. Export both component and TypeScript interface
3. Create comprehensive Storybook stories
4. Organize stories by category: Layout, Navigation, Display, or Feedback
5. Write JSDoc documentation for all props
6. Keep components generic - avoid hardcoding business logic
7. Run `npm run type-check` before committing

### Compound Component Pattern

For complex layouts (Shell, ContextHeader), use the compound component pattern:

```tsx
// ✅ Good - Compound pattern
<Shell>
  <Shell.Header leftContent={<Menu />} />
  <Shell.Content>{children}</Shell.Content>
</Shell>

// ❌ Avoid - Too many props
<Shell
  headerLeft={<Menu />}
  headerRight={<User />}
  sidebarContent={<Nav />}
  showFooter={true}
  // ... 20 more props
/>
```
