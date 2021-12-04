import React from 'react';
import { makeStyles } from '@material-ui/core';
import { format } from 'date-fns';
import { useRecoilValue } from 'recoil';
import { CombinedFamilyInfo } from '../../GeneratedClient';
import { downloadFile } from '../../Model/FilesModel';
import { currentOrganizationState, currentLocationState } from '../../Model/SessionModel';

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
  
  return (
    <ul className={classes.familyDocumentsList}>
      {family.uploadedDocuments?.map((uploaded, i) => (
        <li key={i}
          onClick={() => downloadFile(organizationId, locationId, uploaded.uploadedDocumentId!)}>
          📃 {uploaded.uploadedFileName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          {uploaded.timestampUtc && <span style={{float:'right',marginRight:20}}>{format(uploaded.timestampUtc, "MM/dd/yyyy hh:mm aa")}</span>}
        </li>
      ))}
    </ul>
  );
}
