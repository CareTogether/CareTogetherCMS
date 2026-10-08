# Location routing

Most pages live under `/org/:organizationId/:locationId/`. `src/caretogether-pwa/src/AppRoutes.tsx` handles the outer URL, access checks, and legacy redirects. `src/caretogether-pwa/src/LocationScopedRoutes.tsx` assembles the pages inside a selected location. Each feature keeps its own route definitions near its screens and exports them to that list.

## Choosing a location switch policy

Every route in this location-scoped tree, including index, child, and wildcard routes, declares `locationSwitch`:

| Policy | When the user switches location | Use for |
| --- | --- | --- |
| `same-path` | Keep the path after the location ID, plus its query string and hash. | Pages whose URL still makes sense in the next location, such as list pages and organization-wide settings. |
| `dashboard` | Open the next location's dashboard. | Details identified by a location-specific family, referral, client, or other entity ID; unknown paths. |

The policy of the **last matched route** controls the switch. A parent layout's policy does not override a matched child. Decide explicitly for each child, even when it has the same policy as its parent.

For example, `/settings/locations` edits the selected location, so it uses `same-path`: after a switch it edits the newly selected location. The explicit `/settings/locations/:editingLocationId` route edits a named organization location and also uses `same-path`.

## Adding a location-scoped page

1. Add its route to the relevant feature's route array, or create an array beside the new feature. Use `satisfies LocationRoute[]` from `Shell/LocationRoute.ts` so TypeScript requires a policy on the route and its children.
2. Export that array and spread it into `locationScopedRoutes` in `LocationScopedRoutes.tsx`.
3. Choose `same-path` only if that exact URL remains meaningful after changing location. Otherwise choose `dashboard`. Give wildcard and redirect routes a policy too.
4. Run `npm run type-check` from `src/caretogether-pwa`. When changing switch behavior, also run `npm run test:unit` and check the affected paths in the browser.

For example:

```tsx
export const reportsRoutes = [
  {
    path: 'reports',
    element: <ReportsScreen />,
    locationSwitch: 'same-path',
  },
] satisfies LocationRoute[];
```

Use a parent route with `<Outlet />` when several child URLs share a layout. The outlet is where React Router renders the matched child. A stable parent can also keep list or filter state mounted while moving between its child pages. Feature-flag variants of a page should select their component within the same route definition, so both variants share the same location switch policy.

The type check covers routes in the typed location-scoped tree. `AppRoutes.tsx` and `UserProfile/UserProfile.tsx` have separate JSX routes. The lint rule restricts importing JSX `Route` and `Routes` elsewhere, so new location pages follow the typed route definitions.
