import type {
  GridColDef,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid-premium';
import { useGridApiRef } from '@mui/x-data-grid-premium';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccountInfo } from '../Authentication/Auth';
import { useSelectedLocationContext } from '../Model/Data';

const persistedColumnPreferencesVersion = 1;

type PersistedGridColumnPreferences = {
  version: typeof persistedColumnPreferencesVersion;
  orderedFields: string[];
  columnVisibilityModel: GridColumnVisibilityModel;
};

type UsePersistedGridColumnPreferencesOptions = {
  columns: GridColDef[];
  defaultColumnVisibilityModel?: GridColumnVisibilityModel;
  namespace: string;
};

type GridColumnPreferencesScope = {
  locationId?: string;
  organizationId?: string;
  userId?: string;
};

function persistedColumnPreferencesStorageKey(
  namespace: string,
  { locationId, organizationId, userId }: GridColumnPreferencesScope
) {
  if (!userId || !organizationId || !locationId) return null;

  return [
    'caretogether:dataGridColumnPreferences',
    `v${persistedColumnPreferencesVersion}`,
    namespace,
    userId,
    organizationId,
    locationId,
  ].join(':');
}

function readPreferences(
  key: string | null
): PersistedGridColumnPreferences | null {
  if (!key) return null;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? 'null');
    if (
      !parsed ||
      parsed.version !== persistedColumnPreferencesVersion ||
      !Array.isArray(parsed.orderedFields) ||
      typeof parsed.columnVisibilityModel !== 'object' ||
      parsed.columnVisibilityModel === null
    )
      return null;

    return {
      version: persistedColumnPreferencesVersion,
      orderedFields: parsed.orderedFields.filter(
        (field: unknown): field is string => typeof field === 'string'
      ),
      columnVisibilityModel: parsed.columnVisibilityModel,
    };
  } catch {
    return null;
  }
}

function columnOrderFor(fields: string[], columns: GridColDef[]): string[] {
  const currentFields = columns.map((column) => column.field);
  const currentFieldSet = new Set(currentFields);
  const savedFields = fields.filter((field) => currentFieldSet.has(field));
  const savedFieldSet = new Set(savedFields);

  return [
    ...savedFields,
    ...currentFields.filter((field) => !savedFieldSet.has(field)),
  ];
}

function writePreferences(
  key: string | null,
  preferences: PersistedGridColumnPreferences
) {
  if (!key) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(preferences));
  } catch {
    // Local storage may be unavailable or full; the grid remains usable.
  }
}

export function usePersistedGridColumnPreferences({
  columns,
  defaultColumnVisibilityModel = {},
  namespace,
}: UsePersistedGridColumnPreferencesOptions) {
  const userId = useAccountInfo()?.userId;
  const locationContext = useSelectedLocationContext();
  const storageKey = useMemo(
    () =>
      persistedColumnPreferencesStorageKey(namespace, {
        locationId: locationContext?.locationId,
        organizationId: locationContext?.organizationId,
        userId,
      }),
    [locationContext, namespace, userId]
  );
  const [loadedPreferences, setLoadedPreferences] = useState(() => ({
    preferences: readPreferences(storageKey),
    storageKey,
  }));
  const preferencesLoaded = loadedPreferences.storageKey === storageKey;
  const savedPreferences = preferencesLoaded
    ? loadedPreferences.preferences
    : null;
  const [columnVisibilityModel, setColumnVisibilityModel] = useState(
    () => savedPreferences?.columnVisibilityModel ?? {}
  );
  const apiRef = useGridApiRef();
  const restoringOrderRef = useRef(false);
  const currentVisibilityModelRef = useRef(columnVisibilityModel);
  const currentOrderRef = useRef(
    columnOrderFor(savedPreferences?.orderedFields ?? [], columns)
  );
  const restoredPreferencesStorageKeyRef = useRef<string | null>(storageKey);
  const appliedOrderRef = useRef<string | null>(null);

  const currentColumns = useMemo(
    () => new Set(columns.map((column) => column.field)),
    [columns]
  );
  const currentDefaultOrder = useMemo(
    () => columns.map((column) => column.field),
    [columns]
  );
  const visibleColumnModel = useMemo(
    () => ({
      ...defaultColumnVisibilityModel,
      ...(preferencesLoaded ? columnVisibilityModel : {}),
    }),
    [columnVisibilityModel, defaultColumnVisibilityModel, preferencesLoaded]
  );

  const savePreferences = useCallback(
    (nextVisibilityModel: GridColumnVisibilityModel, nextOrder: string[]) => {
      if (!storageKey || !preferencesLoaded) return;

      writePreferences(storageKey, {
        version: persistedColumnPreferencesVersion,
        orderedFields: nextOrder,
        columnVisibilityModel: nextVisibilityModel,
      });
    },
    [preferencesLoaded, storageKey]
  );

  useEffect(() => {
    setLoadedPreferences({
      preferences: readPreferences(storageKey),
      storageKey,
    });
  }, [storageKey]);

  useEffect(() => {
    if (
      !preferencesLoaded ||
      restoredPreferencesStorageKeyRef.current === storageKey
    )
      return;

    const nextVisibilityModel = savedPreferences?.columnVisibilityModel ?? {};
    const nextOrder = columnOrderFor(
      savedPreferences?.orderedFields ?? [],
      columns
    );
    restoredPreferencesStorageKeyRef.current = storageKey;
    currentVisibilityModelRef.current = nextVisibilityModel;
    currentOrderRef.current = nextOrder;
    setColumnVisibilityModel(nextVisibilityModel);
    appliedOrderRef.current = null;
  }, [columns, preferencesLoaded, savedPreferences, storageKey]);

  useEffect(() => {
    if (!preferencesLoaded) return;

    const nextOrder = columnOrderFor(currentOrderRef.current, columns);
    currentOrderRef.current = nextOrder;

    const orderSignature = `${storageKey}:${nextOrder.join('|')}`;
    if (appliedOrderRef.current === orderSignature) return;

    const gridColumns = apiRef.current?.getAllColumns();
    if (!gridColumns) return;

    appliedOrderRef.current = orderSignature;
    restoringOrderRef.current = true;
    const gridFields = gridColumns.map((column) => column.field);
    const managedFields = new Set(nextOrder);
    let nextManagedFieldIndex = 0;
    const fullOrder = gridFields.map((field) =>
      managedFields.has(field) ? nextOrder[nextManagedFieldIndex++] : field
    );
    fullOrder.forEach((field, index) => {
      apiRef.current?.setColumnIndex(field, index);
    });
    restoringOrderRef.current = false;
  }, [apiRef, columns, preferencesLoaded, storageKey]);

  const handleColumnVisibilityModelChange = useCallback(
    (nextVisibilityModel: GridColumnVisibilityModel) => {
      currentVisibilityModelRef.current = nextVisibilityModel;
      setColumnVisibilityModel(nextVisibilityModel);
      savePreferences(nextVisibilityModel, currentOrderRef.current);
    },
    [savePreferences]
  );

  const handleColumnOrderChange = useCallback(() => {
    if (restoringOrderRef.current) return;

    const nextOrder = columnOrderFor(
      apiRef.current
        ?.getAllColumns()
        .map((column) => column.field)
        .filter((field) => currentColumns.has(field)) ?? currentDefaultOrder,
      columns
    );
    currentOrderRef.current = nextOrder;
    savePreferences(currentVisibilityModelRef.current, nextOrder);
  }, [apiRef, currentColumns, currentDefaultOrder, columns, savePreferences]);

  return {
    apiRef,
    columnVisibilityModel: visibleColumnModel,
    onColumnOrderChange: handleColumnOrderChange,
    onColumnVisibilityModelChange: handleColumnVisibilityModelChange,
  };
}
