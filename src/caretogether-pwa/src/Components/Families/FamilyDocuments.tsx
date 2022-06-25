import React, { useState } from 'react';
import { Menu, MenuItem } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { format } from 'date-fns';
import { useRecoilValue } from 'recoil';
import { CombinedFamilyInfo, Permission, UploadedDocumentInfo } from '../../GeneratedClient';
import { downloadFile } from '../../Model/FilesModel';
import { currentOrganizationState, currentLocationState, usePermissions } from '../../Model/SessionModel';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';

const useStyles = makeStyles((theme) => ({
  familyDocumentsList: {
    listStyle: 'none',
    paddingLeft: 22,
    textIndent: -22
  }
}));

type FamilyDocumentsProps = {
  family: CombinedFamilyInfo
}

export function FamilyDocuments({ family }: FamilyDocumentsProps) {
  const classes = useStyles();
  const organizationId = useRecoilValue(currentOrganizationState);
  const locationId = useRecoilValue(currentLocationState);

  const [moreMenuAnchor, setMoreMenuAnchor] = useState<{anchor: Element, document: UploadedDocumentInfo} | null>(null);
  const [deleteParameter, setDeleteParameter] = useState<{familyId: string, document: UploadedDocumentInfo} | null>(null);
  function selectDelete(document: UploadedDocumentInfo) {
    setMoreMenuAnchor(null);
    setDeleteParameter({familyId: family.family!.id!, document: document});
  }

  const permissions = usePermissions();
  
  return (
    <>
      <ul className={classes.familyDocumentsList}>
        {family.uploadedDocuments?.map((uploaded, i) =>
          permissions(Permission.ReadFamilyDocuments)
          ? <li key={i} style={{ clear: 'both' }}
              onContextMenu={(e) => { e.preventDefault(); setMoreMenuAnchor({ anchor: e.currentTarget, document: uploaded }); }}
              onClick={() => downloadFile(organizationId, locationId, uploaded.uploadedDocumentId!)}>
              📃 {uploaded.uploadedFileName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {uploaded.timestampUtc && <span style={{float:'right',marginRight:20}}>{format(uploaded.timestampUtc, "M/d/yy")}</span>}
            </li>
          : <li key={i} style={{ clear: 'both' }}>
              📃 {uploaded.uploadedFileName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {uploaded.timestampUtc && <span style={{float:'right',marginRight:20}}>{format(uploaded.timestampUtc, "M/d/yy")}</span>}
            </li>
        )}
      </ul>
      <Menu id="documents-more-menu"
        anchorEl={moreMenuAnchor?.anchor}
        keepMounted
        open={Boolean(moreMenuAnchor)}
        onClose={() => setMoreMenuAnchor(null)}>
        <MenuItem onClick={() => selectDelete(moreMenuAnchor!.document)}>Delete</MenuItem>
      </Menu>
      {(deleteParameter && <DeleteDocumentDialog familyId={deleteParameter.familyId} document={deleteParameter.document}
        onClose={() => setDeleteParameter(null)} />) || null}
    </>
  );
}
