import { IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { personNameString } from '../Families/PersonName';
import { CommunityInfo, DeleteUploadedCommunityDocument, Permission, UploadedDocumentInfo } from '../GeneratedClient';
import { useCommunityCommand, useUserLookup } from '../Model/DirectoryModel';
import { useCommunityPermissions } from '../Model/SessionModel';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { useBackdrop } from '../Hooks/useBackdrop';

interface CommunityDocumentsProps {
  communityInfo: CommunityInfo;
}
export function CommunityDocuments({ communityInfo }: CommunityDocumentsProps) {
  const permissions = useCommunityPermissions(communityInfo);
  const community = communityInfo.community!;

  const userLookup = useUserLookup();
  const documents = (community.uploadedDocuments || []).map(document => ({
    uploader: userLookup(document.userId),
    document: document
  }));

  const deleteCommunityDocument = useCommunityCommand((communityId, documentId: string) => {
    const command = new DeleteUploadedCommunityDocument();
    command.communityId = communityId;
    command.uploadedDocumentId = documentId;
    return command;
  });

  const withBackdrop = useBackdrop();
  async function deleteDocument(document: UploadedDocumentInfo) {
    //TODO: Use the DeleteDocumentDialog approach - potentially making it reusable?
    if (window.confirm("Are you sure you want to delete this document?\n\n" + document.uploadedFileName)) {
      await withBackdrop(async () => {
        await deleteCommunityDocument(community.id!, document.uploadedDocumentId!);
      });
    }
  }

  return <List sx={{ '& .MuiListItemIcon-root': { minWidth: 36 } }}>
    {documents.map(doc => <ListItem key={doc.document.uploadedDocumentId} disablePadding
      secondaryAction={permissions(Permission.DeleteCommunityDocuments)
        ? <IconButton edge="end" aria-label="delete"
          onClick={() => deleteDocument(doc.document)}>
          <DeleteIcon />
        </IconButton>
        : null}>
      {permissions(Permission.ReadCommunityDocuments)
        ? <ListItemButton disableGutters sx={{ paddingTop: 0, paddingBottom: 0 }}>
            <ListItemIcon>
              <InsertDriveFileOutlinedIcon />
            </ListItemIcon>
            <ListItemText
              primary={doc.document.uploadedFileName}
              secondary={`${format(doc.document.timestampUtc!, "PPp")} — ${personNameString(doc.uploader)}`}>
            </ListItemText>
          </ListItemButton>
        : <>
            <ListItemIcon>
              <InsertDriveFileOutlinedIcon />
            </ListItemIcon>
            <ListItemText
              primary={doc.document.uploadedFileName}
              secondary={`${format(doc.document.timestampUtc!, "PPp")} — ${personNameString(doc.uploader)}`}>
            </ListItemText>
          </>}
    </ListItem>)}
  </List>;
}
