# CareTogether CMS - AI Agent Instructions

CareTogether is an open-source case management system for nonprofits connecting families to caring communities. Built with ASP.NET Core, React/TypeScript, and Azure Blob Storage.

## Architecture Overview

**Three-Layer Backend Architecture:**

- **API Layer** (`src/CareTogether.Api`): ASP.NET Core controllers expose REST endpoints
- **Managers Layer** (`src/CareTogether.Core/Managers`): Business logic orchestration (`CommunicationsManager`, `MembershipManager`, `RecordsManager`)
- **Resources Layer** (`src/CareTogether.Core/Resources`): Domain data access with event sourcing via `IEventLog<T>` interfaces

**Event-Sourced Persistence:**
All domain state changes are persisted as immutable events in append-only blob logs (`AppendBlobEventLog<T>`). Each resource (Accounts, Directory, Approvals, Goals, Notes, Communities, V1Cases) maintains its own event log stored in Azure Blob Storage (or Azurite locally). Events inherit from `DomainEvent(Guid UserId, DateTime TimestampUtc)`.

**Frontend Architecture:**

- React 19 SPA built with Vite 7, TypeScript, and MUI v7 in `src/caretogether-pwa2`
- **Directly consumes `ui-components` library** via local package reference (workspace:\*)
- Uses CareTogether theme and all available UI components (Shell, ContextHeader, IntakeStepNav, etc.)
- Includes Storybook 10 for component development and documentation (port 6007)
- ESLint and Prettier configured for code quality
- Development: `npm run dev` (Vite on port 5173), `npm run storybook` (Storybook on port 6007)
- Serves as a reference implementation showing how to use ui-components in a real application

**UI Components Library:**

- Standalone component library in `ui-components/` built with Node.js, TypeScript, Vite, and MUI v7
- Local package for development (can be published to npm as private package)
- Custom CareTogether theme with Poppins font (Primary: #07666C, Secondary: #D32F2F, Background: #F6FCFC, Border Radius: 8px for shapes, 24px for buttons)
- Interactive development via Storybook on port 6006 (`npm run storybook`)
- 7 core components: Shell (with Header/Sidebar/Content/Footer), ContextHeader, IntakeStepNav, Progress, NavItem, ColoredChip, Steps
- Components follow **compound component pattern** (Shell, ContextHeader) for maximum flexibility
- All components use **MUI prop inheritance pattern** via `Pick<MuiComponentProps, "sx" | ...>` for selective prop inheritance
- Shell components provide layout primitives (not fully-integrated shells) - consumers compose their own layouts
- All components include TypeScript interfaces, comprehensive Storybook stories, and JSDoc documentation
- See `ui-components/README.md` for development guide

## Development Workflow

**Local Development Setup:**

1. Press F5 in VS Code to launch both frontend (port 3000) and backend simultaneously
2. Azurite storage emulator auto-starts via background task (see `.vscode/launch.json`)
3. Test credentials: `test@bynalogic.com` / `P@ssw0rd` (admin) or `test2@bynalogic.com` / `P@ssw0rd` (volunteer)

**Build & Test Commands:**

- Frontend (`src/caretogether-pwa2`): `npm run dev` (port 5173), `npm run storybook` (port 6007), `npm run type-check`
- Backend: `dotnet build CareTogetherCMS.sln`, `dotnet test` for unit tests
- UI Components: `npm run storybook` (in `ui-components/`) for Storybook (port 6006), `npm run build` to build library, `npm run type-check` for TypeScript validation
- Available VS Code tasks: Use Run Task menu for "npm install", "vite dev", "frontend type-check", "build", "restore"

**Testing:**

- Backend tests use MSTest framework (`[TestClass]`, `[TestMethod]` attributes)
- Test organization follows feature domains (e.g., `test/CareTogether.Core.Test/ApprovalCalculationTests/`)
- Use helper classes like `Helpers.cs` for test data construction

## Key Patterns & Conventions

**Permission-Based Authorization:**
Permission enum in [src/CareTogether.Core/Permission.cs](src/CareTogether.Core/Permission.cs) defines ~80 granular permissions. Authorization engine evaluates permissions based on user roles and family/person context. Controllers check permissions via `IAuthorizationEngine`.

**Policy Evaluation System:**
`PolicyEvaluationEngine` calculates volunteer/family approval statuses by evaluating requirements against completed/exempted requirement histories. Used extensively for volunteer onboarding workflows. See `src/CareTogether.Core/Engines/PolicyEvaluation/`.

**Environment Configuration:**

- Frontend uses Vite env vars: `VITE_APP_API_HOST`, `VITE_APP_AUTH_*` (see `src/caretogether-pwa2/src/env.d.ts`)
- Backend config in `appsettings.Development.json` for local dev (Azure AD B2C, Azurite storage, feature flags)
- Feature flags managed via Microsoft.FeatureManagement with `ITargetingContextAccessor`

**Timeline Utilities:**
`Timelines` project provides immutable timeline data structures (`DateOnlyTimeline`, `DateRange`) for managing time-based state changes (volunteer assignments, approval expirations, etc.).

## Project Structure Essentials

- [src/CareTogether.Api/Controllers](src/CareTogether.Api/Controllers): `RecordsController`, `CommunicationsController`, `ConfigurationController`, `UsersController`, `FilesController`
- [src/CareTogether.Core/Resources](src/CareTogether.Core/Resources): Domain resources with event sourcing (Directory, Approvals, Goals, Notes, Communities, etc.)
- [src/caretogether-pwa2/](src/caretogether-pwa2/): Modern PWA implementation consuming ui-components library
- [src/caretogether-pwa2/src/components](src/caretogether-pwa2/src/components): Application-specific React components
- [ui-components/](ui-components/): Standalone UI component library with Node.js, TypeScript, Vite, and MUI v7
- [ui-components/src/components](ui-components/src/components): All UI components (Shell, ContextHeader, IntakeStepNav, ProgressCard, NavItem, ColoredChip)
- [ui-components/src/theme](ui-components/src/theme): Custom MUI theme with CareTogether branding

## UI Component Library Patterns

**Compound Component Pattern (Shell Components):**
Shell layout components use the compound component pattern to provide flexible, composable primitives:

- `<Shell>` root container with `Shell.Header`, `Shell.Sidebar`, `Shell.Content`, `Shell.Footer` sub-components
- Components are **layout primitives only** - no built-in navigation, menus, or business logic
- Consumers compose their own layouts using render props pattern (leftContent, centerContent, rightContent)
- State management is the consumer's responsibility (optional `useShellState` hook provided for convenience)
- Example: `<Shell><Shell.Header leftContent={<MenuButton />} rightContent={<UserMenu />} /><Shell.Content>{children}</Shell.Content></Shell>`
- ContextHeader also uses compound pattern with `ContextHeader.Breadcrumbs`, `ContextHeader.Title`, `ContextHeader.Tabs` sub-components

**Available Components:**

- **Shell**: Layout primitives with Header (supports leftContent/centerContent/rightContent), Sidebar (open/collapsed via `open` prop), Content, Footer
- **ContextHeader**: Page header using compound pattern - compose with Breadcrumbs, Title, and Tabs sub-components
- **IntakeStepNav**: Multi-step wizard navigation with accordion groups, progress tracking, and step indicators
- **ProgressCard**: Vertical stepper with completion states, descriptions, and flexible content per step
- **NavItem**: Reusable navigation item with icon, text, collapsed state, and tooltip support
- **ColoredChip**: Generic chip with optional start icon and customizable colors (uses theme color keys or hex)
- **Steps**: Step indicator component (used within IntakeStepNav but also exported separately)
- **ExpandableText**: Text truncation component with line-based overflow detection and inline expand/collapse button - includes proper ARIA attributes for accessibility
- **ActivityIcon**: Circular icon container with colored background (accepts custom icon or defaults to Diversity2Icon)
- **ActivityItem**: Display component for activity entries with icon, timestamp, title, and optional action
- **ScheduleItem**: Flexible schedule display with colored indicator bar (can be link, button, or static)
- **RecentActivity**: Compound component card for displaying recent activity groups with header
- **TimelineCard**: Timeline card with optional header, sub-header, actions, and vertical timeline of events
- **TimelineItem**: Individual timeline entry with timestamp, icon, and content (for use in TimelineCard)

**MUI Prop Inheritance Pattern (All Components):**
All components selectively inherit MUI props using TypeScript's `Pick` utility for consistency and type safety:

```typescript
// Standard pattern for all components
type ComponentBaseProps = Pick<MuiComponentProps, "sx" | "size" | "variant">;

export interface ComponentProps extends ComponentBaseProps {
    // Custom component-specific props
    customProp: string;
}
```

- Always include `sx` for styling flexibility
- Include `className` for CSS module integration
- Selectively pick component-specific props (size, variant, color) based on underlying MUI component
- Never spread all MUI props unless you want the entire API surface
- Document inherited props in JSDoc

**Component Design Philosophy:**

> "Component libraries should be LEGO bricks, not pre-built castles."

- ✅ Create flexible primitives that can be assembled in different ways
- ✅ Keep business logic in the consuming application (PWA), not the component library
- ✅ Provide composition over configuration (use render props, not 50+ configuration props)
- ✅ Make components reusable across different CareTogether projects
- ❌ Don't bake in application-specific navigation, menus, or workflows
- ❌ Don't manage application state in components (leave it to consumers)
- ❌ Don't create monolithic components with too many responsibilities

**Storybook Organization:**
All component stories should follow this consistent hierarchical structure:

- **Components/Layout** - Structural components (Shell, ContextHeader)
- **Components/Navigation** - Navigation components (NavItem, IntakeStepNav, Steps)
- **Components/Display** - Content display components (ColoredChip, ActivityItem, RecentActivity)
- **Components/Feedback** - Progress/status indicators (Progress)
- **Theme** - Standalone category for theme/design system documentation

When creating Storybook stories, use the pattern: `title: "Components/[Category]/[ComponentName]"`

**Component Development Checklist:**
When creating new components in `ui-components/`:

1. Use `Pick<MuiComponentProps, ...>` for prop inheritance
2. Export both component and TypeScript interface (e.g., `export { MyComponent }; export type { MyComponentProps }`)
3. Create comprehensive Storybook stories showing all variants
4. **Organize stories using the proper category**: Layout, Navigation, Display, or Feedback
5. Write JSDoc documentation for all props
6. Consider whether the component should use compound component pattern (for complex layouts)
7. Keep components generic and unopinionated - avoid hardcoding business logic
8. Run `npm run type-check` before committing

## Common Gotchas

- **Storage Emulator:** If seeing "No connection could be made" errors, manually install Azurite: `npm install -g azurite`, then run `azurite-blob --loose` from repo root
- **Event Log Sequence Numbers:** When appending events, must provide expected sequence number for optimistic concurrency
- **Organization/Location Context:** Most API calls require `organizationId` and `locationId`
- **Git Commit Hash in Build:** Frontend build embeds git hash for versioning via `__APP_VERSION__` (see [vite.config.ts](src/caretogether-pwa2/vite.config.ts))
- **C# Records:** Core domain models use C# 9 record types extensively for immutability
- **UI Components Development:** Run `npm run storybook` from `ui-components/` directory to develop components in isolation before integrating with PWA
- **UI Components Dependencies:** If seeing MUI module errors, run `npm install` in `ui-components/` and restart TypeScript server in VS Code
