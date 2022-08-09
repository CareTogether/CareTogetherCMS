import React, { useState } from 'react';
import { Menu, MenuItem } from '@mui/material';
import { format } from 'date-fns';
import { useRecoilValue } from 'recoil';
import { CombinedFamilyInfo, Permission, UploadedDocumentInfo } from '../GeneratedClient';
import { downloadFile } from '../Model/FilesModel';
import { currentOrganizationState, currentLocationState, usePermissions } from '../Model/SessionModel';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';

type FamilyDocumentsProps = {
  family: CombinedFamilyInfo
}

export function FamilyDocuments({ family }: FamilyDocumentsProps) {
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
      <ul style={{listStyle: 'none', paddingLeft: 22, textIndent: -22}}>
        {family.uploadedDocuments?.map((uploaded, i) =>
          permissions(Permission.ReadFamilyDocuments)
          ? <li key={i} style={{ clear: 'both', cursor: 'pointer' }}
              onContextMenu={(e) => {
                if (!permissions(Permission.DeleteFamilyDocuments))
                  return;
                e.preventDefault();
                setMoreMenuAnchor({ anchor: e.currentTarget, document: uploaded });
              }}
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
