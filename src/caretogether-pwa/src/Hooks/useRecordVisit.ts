import { atom, useSetAtom, useStore } from 'jotai';
import { useEffect, useRef } from 'react';
import { api } from '../Api/Api';
import { useAccountInfo } from '../Authentication/Auth';
import { RecentRecordKey, type RecentRecordType } from '../GeneratedClient';
import {
  selectedLocationContextState,
  useRequiredSelectedLocationContext,
} from '../Model/Data';
import { isSameLocationScope } from '../Model/LocationScope';
import { nextRecordVisit } from './recentRecordVisits';

export const recentRecordsRevisionAtom = atom(0);

export function useRecordVisit(type: RecentRecordType, id?: string) {
  const { organizationId, locationId } = useRequiredSelectedLocationContext();
  const userId = useAccountInfo()?.userId;
  const lastVisit = useRef<string | null>(null);
  const refresh = useSetAtom(recentRecordsRevisionAtom);
  const store = useStore();

  useEffect(() => {
    const scope = { organizationId, locationId };
    const visit = nextRecordVisit(lastVisit.current, scope, userId, type, id);
    if (!visit || !id) return;
    lastVisit.current = visit;

    void api.recentRecords
      .record(organizationId, locationId, new RecentRecordKey({ type, id }))
      .then(() => {
        const activeScope = store.get(selectedLocationContextState);
        if (activeScope && isSameLocationScope(activeScope, scope)) {
          refresh((revision) => revision + 1);
        }
      })
      .catch(() => undefined);
  }, [id, locationId, organizationId, refresh, store, type, userId]);
}
