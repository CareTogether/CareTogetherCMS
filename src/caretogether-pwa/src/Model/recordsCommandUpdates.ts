import {
  FamilyRecordsAggregate,
  FamilyRecordsCommand,
  UndoCreateFamily,
  type AtomicRecordsCommand,
  type RecordsAggregate,
  type RecordsClient,
} from '../GeneratedClient.ts';
import type { LocationScope } from './LocationScope';

export function mergeRecordsCommandResult(
  current: RecordsAggregate[],
  aggregateId: string,
  updates: readonly (RecordsAggregate | null)[]
): RecordsAggregate[] {
  return updates.reduce((records, update) => {
    if (update == null) {
      return records.filter((record) => record.id !== aggregateId);
    }
    const matches = (record: RecordsAggregate) =>
      record.id === update.id && record.constructor === update.constructor;
    return records.some(matches)
      ? records.map((record) => (matches(record) ? update : record))
      : records.concat(update);
  }, current);
}

export async function runAtomicRecordsCommand(
  client: Pick<RecordsClient, 'submitAtomicRecordsCommand'>,
  scope: LocationScope,
  aggregateId: string,
  command: AtomicRecordsCommand,
  updateScope: (
    scope: LocationScope,
    update: (current: RecordsAggregate[]) => RecordsAggregate[]
  ) => Promise<void>
) {
  const updates = await client.submitAtomicRecordsCommand(
    scope.organizationId,
    scope.locationId,
    command
  );
  if (!Array.isArray(updates)) {
    throw new Error('Records command returned no aggregate collection.');
  }

  const deletedFamilyId =
    command instanceof FamilyRecordsCommand &&
    command.command instanceof UndoCreateFamily
      ? command.command.familyId
      : undefined;

  await updateScope(scope, (current) => {
    const merged = mergeRecordsCommandResult(current, aggregateId, updates);
    return deletedFamilyId
      ? merged.filter(
          (record) =>
            !(
              record instanceof FamilyRecordsAggregate &&
              record.id === deletedFamilyId
            )
        )
      : merged;
  });
}
