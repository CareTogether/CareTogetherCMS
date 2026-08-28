import { useEffect, useState } from 'react';
import {
  ActionRequirement,
  DocumentLinkRequirement,
  NoteEntryRequirement,
} from '../GeneratedClient';

type RequirementCompletionFormInput = {
  canComplete?: boolean;
  hasValidArrangementSelection?: boolean;
  policy: ActionRequirement | undefined;
  resetCompletionKey?: unknown;
  resetOnWorkflowChange?: boolean;
  uploadNewDocumentId: string;
  workflowOpen?: boolean;
};

export function useRequirementCompletionForm({
  canComplete = true,
  hasValidArrangementSelection = true,
  policy,
  resetCompletionKey,
  resetOnWorkflowChange = false,
  uploadNewDocumentId,
  workflowOpen = true,
}: RequirementCompletionFormInput) {
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState('');
  const [completedAtLocal, setCompletedAtLocal] = useState<Date | null>(null);
  const [completedAtError, setCompletedAtError] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!resetOnWorkflowChange || !workflowOpen) return;

    setDocumentFile(null);
    setDocumentId('');
    setCompletedAtLocal(null);
    setCompletedAtError(false);
    setNotes('');
  }, [resetCompletionKey, resetOnWorkflowChange, workflowOpen]);

  const hasRequiredDocument =
    (documentId === uploadNewDocumentId && documentFile !== null) ||
    (documentId !== uploadNewDocumentId && documentId !== '') ||
    policy?.documentLink !== DocumentLinkRequirement.Required;
  const hasRequiredNote =
    notes !== '' || policy?.noteEntry !== NoteEntryRequirement.Required;
  const hasValidCompletion =
    completedAtLocal !== null &&
    !completedAtError &&
    hasRequiredDocument &&
    hasRequiredNote;
  const canCompleteRequirement =
    canComplete && hasValidArrangementSelection && hasValidCompletion;

  return {
    canCompleteRequirement,
    completedAtError,
    completedAtLocal,
    documentFile,
    documentId,
    hasRequiredDocument,
    hasRequiredNote,
    hasValidCompletion,
    notes,
    setCompletedAtError,
    setCompletedAtLocal,
    setDocumentFile,
    setDocumentId,
    setNotes,
  };
}
