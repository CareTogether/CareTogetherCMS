import { Button, Grid, List, ListItem, ListItemText } from '@mui/material';
import { Community, UploadCommunityDocument } from '../GeneratedClient';
import { useCommunityCommand } from '../Model/DirectoryModel';
import { uploadCommunityFileToTenant } from '../Model/FilesModel';
import { useState } from 'react';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useRecoilValue } from 'recoil';
import { selectedLocationContextState } from '../Model/Data';

interface DrawerProps {
  onClose: () => void;
}
interface CommunityDocumentUploadProps extends DrawerProps {
  community: Community;
}
export function CommunityDocumentUpload({ community, onClose }: CommunityDocumentUploadProps) {
  const [documentFiles, setDocumentFiles] = useState<FileList | null>(null);
  const { organizationId, locationId } = useRecoilValue(selectedLocationContextState);
  
  const withBackdrop = useBackdrop();

  const uploadCommunityDocument = useCommunityCommand((communityId, documentId: string, fileName: string) => {
    const command = new UploadCommunityDocument();
    command.communityId = communityId;
    command.uploadedDocumentId = documentId;
    command.uploadedFileName = fileName;
    return command;
  });

  async function upload() {
    await withBackdrop(async () => {
      for (const documentFile of Array.from(documentFiles!)) {
        const documentId = await uploadCommunityFileToTenant(organizationId, locationId, community.id!, documentFile);
        await uploadCommunityDocument(community.id!, documentId, documentFile.name);
      }
      //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
      onClose();
    });
  }

  function formatSize(size: number) {
    if (size / 1024 / 1024 / 1024 > 1) {
      return (size / 1024 / 1024 / 1024).toFixed(1) + " GB";
    } else if (size / 1024 / 1024 > 1) {
      return (size / 1024 / 1024).toFixed(1) + " MB";
    } else if (size / 1024 > 1) {
      return (size / 1024).toFixed(1) + " kB";
    } else {
      return size.toFixed(0) + " B";
    }
  }

  return (
    <Grid container spacing={2} maxWidth={500}>
      <Grid item xs={12}>
        <h3>Upload Community Documents</h3>
      </Grid>
      <Grid item xs={12}>
        <p>Select one or more documents to upload for this community.</p>
      </Grid>
      <Grid item xs={12}>
        <input
          accept="*/*"
          multiple={true}
          id="community-document-file"
          type="file"
          onChange={async (e) => {
            setDocumentFiles(e.target.files);
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <List dense disablePadding>
          {documentFiles && Array.from(documentFiles).map((documentFile, i) =>
            <ListItem key={i}>
              <ListItemText primary={documentFile.name} secondary={formatSize(documentFile.size)} />
            </ListItem>)}
        </List>
      </Grid>
      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button color='secondary' variant='contained'
          sx={{ marginRight: 2 }}
          onClick={onClose}>
          Cancel
        </Button>
        <Button color='primary' variant='contained'
          disabled={documentFiles == null || documentFiles.length === 0}
          onClick={upload}>
          Upload
        </Button>
      </Grid>
    </Grid>
  );
}
