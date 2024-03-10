import Dexie, { Table } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';

interface Collapsed {
  id?: string;
  collapsed: boolean;
}

class CollapsedDb extends Dexie {
  items!: Table<Collapsed>;

  constructor() {
    super('collapsedItems');
    this.version(1).stores({
      items: '++id' // Primary key and indexed props (no indexed props in this case)
    });
  }
}

const db = new CollapsedDb();

// Credit: https://usehooks.com/useLocalStorage/
export function useCollapsed(key: string, initialValue: boolean) {

  async function upsertSavedValue(newValue: boolean) {
    try {
      await db.items.put({ id: key, collapsed: newValue }, key);
    } catch (error) {
      console.warn("prefixDb encountered an error");
      console.warn(error);
      /* Silently swallow errors */
    }
  }

  const savedValue = useLiveQuery(async () => {
    const item = await db.items.get(key);
    return item?.collapsed;
  }, [key]);

  const value = typeof savedValue === 'undefined' ? initialValue : savedValue;

  return [value, upsertSavedValue] as const;
}
