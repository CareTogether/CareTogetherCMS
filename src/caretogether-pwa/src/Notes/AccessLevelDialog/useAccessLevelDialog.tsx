import { useState } from 'react';
import { AccessLevelDialog } from './AccessLevelDialog';
import { Note } from '../../GeneratedClient';

export function useAccessLevelDialog({ familyId }: { familyId: string }) {
  const [note, setNote] = useState<Note | null>(null);

  return {
    open: (note: Note) => setNote(note),
    noteAccessLevelDialog: note && (
      <AccessLevelDialog
        familyId={familyId}
        note={note}
        onClose={() => {
          setNote(null);
        }}
      />
    ),
  };
}
