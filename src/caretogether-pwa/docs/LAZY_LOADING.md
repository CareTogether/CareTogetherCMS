# Lazy Loading Patterns

This project uses a row-level lazy loading pattern for large table-style screens.

## Current Standard

Use one `LazyLoad` instance to gate an entire row group, not individual data cells.

That means:

- Render a placeholder `TableRow` with a single `TableCell` using `colSpan`.
- Put `LazyLoad` inside that placeholder cell.
- Use local `isVisible` state to swap the placeholder row for the real row group once it is near the viewport.
- Call `forceCheck()` when filters change so `react-lazyload` reevaluates which row groups should mount.

## Why Row-Level Instead Of Cell-Level

The expensive unit in these screens is usually the whole family row group, not one cell.

Row-level lazy loading:

- Keeps table structure valid while content is still deferred.
- Reduces the number of `LazyLoad` instances significantly.
- Avoids partial row rendering where some cells are mounted and others are not.
- Makes expanded row groups behave predictably.

## Required Pieces

### 1. Placeholder row

The placeholder must stay a valid table row:

- compute the expected row-group height
- compute the correct `colSpan`
- render a single placeholder `TableCell`

### 2. Mount trigger

Use the shared utility:

- `src/caretogether-pwa/src/Utilities/LazyLoadMountTrigger.tsx`

This exists because `react-lazyload` needs a mounted child to trigger visibility, but the real row group should not render until it becomes visible.

### 3. Visibility state

Each lazy row-group item keeps local state:

- `const [isVisible, setIsVisible] = useState(false);`

Before visibility:

- render the placeholder row

After visibility:

- render the actual row group

### 4. Filter refresh

When filters or search text change, call:

```ts
useEffect(() => {
  forceCheck();
}, [/* filter dependencies */]);
```

Without this, `react-lazyload` may not immediately reevaluate rows after the filtered list changes.

## Implementation Checklist

When adding lazy loading to a new table:

1. Extract the row-group rendering into a dedicated table item component.
2. Add a placeholder row with the right `colSpan` and approximate height.
3. Use `LazyLoadMountTrigger` inside the placeholder row.
4. Swap placeholder and real rows with `isVisible`.
5. Add `forceCheck()` in the screen component for search/filter changes.
6. Keep comments explaining why the placeholder row and `isVisible` state exist.

## Current Examples

Reference implementations:

- `src/caretogether-pwa/src/Volunteers/VolunteerApprovalTab/VolunteerApprovalTableItem.tsx`
- `src/caretogether-pwa/src/Volunteers/VolunteerProgressTab/VolunteerProgressTableItem.tsx`
- `src/caretogether-pwa/src/V1Cases/PartneringFamilies/PartneringFamilyTableItem.tsx`

Shared utility:

- `src/caretogether-pwa/src/Utilities/LazyLoadMountTrigger.tsx`

## Avoid

Avoid mixing patterns in the same screen:

- do not lazy load both whole row groups and individual cells
- do not wrap actual `tr` groups directly in arbitrary non-table container elements
- do not skip `forceCheck()` when the visible dataset can change due to filters
