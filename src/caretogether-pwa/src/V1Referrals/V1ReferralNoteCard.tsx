import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  Typography,
  Box,
  Collapse,
} from '@mui/material';
import { useState } from 'react';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import { ChevronRight } from '@mui/icons-material';
import { format } from 'date-fns';

import { V1ReferralNoteEntry, V1ReferralNoteStatus } from '../GeneratedClient';

import { useUserLookup } from '../Model/DirectoryModel';
import { PersonName } from '../Families/PersonName';

import { AddEditV1ReferralNoteDialog } from './AddEditV1ReferralNoteDialog';
import { ApproveV1ReferralNoteDialog } from './ApproveV1ReferralNoteDialog';
import { DiscardV1ReferralNoteDialog } from './DiscardV1ReferralNoteDialog';

type V1ReferralNoteCardProps = {
  referralId: string;
  note: V1ReferralNoteEntry;

  canEdit?: boolean;
  canDiscard?: boolean;
  canApprove?: boolean;
};

export function V1ReferralNoteCard({
  referralId,
  note,
  canEdit = false,
  canDiscard = false,
  canApprove = false,
}: V1ReferralNoteCardProps) {
  const userLookup = useUserLookup();

  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const statusLabel =
    note.status === V1ReferralNoteStatus.Draft ? 'Draft note' : 'Approved note';

  return (
    <Card sx={{ margin: 0 }} variant="outlined">
      <CardHeader
        sx={{ padding: 1 }}
        subheader={
          <>
            {statusLabel} -{' '}
            <span
              style={{
                cursor: 'pointer',
                userSelect: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              onClick={() => setShowMoreDetails(!showMoreDetails)}
            >
              {showMoreDetails ? 'hide details' : 'more details'}{' '}
              <ChevronRight
                sx={{
                  transform: showMoreDetails
                    ? 'rotate(-90deg)'
                    : 'rotate(90deg)',
                  transition: 'transform 0.2s ease-in-out',
                  fontSize: 'inherit',
                }}
              />
            </span>
          </>
        }
      />

      <CardContent
        sx={{
          padding: 1,
          paddingTop: 0,
          paddingBottom: 0,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
        }}
      >
        <Collapse in={showMoreDetails} timeout={300}>
          <Box
            sx={{
              backgroundColor: '#f5f5f5',
              padding: 1,
              marginBottom: 1,
              borderRadius: 1,
            }}
          >
            <Typography variant="caption">
              <>
                Author: <PersonName person={userLookup(note.authorId)} />
                <br />
                Created at:{' '}
                {note.createdTimestampUtc
                  ? format(note.createdTimestampUtc, 'M/d/yy h:mm a')
                  : 'N/A'}
                <br />
                Last edited at:{' '}
                {note.lastEditTimestampUtc
                  ? format(note.lastEditTimestampUtc, 'M/d/yy h:mm a')
                  : 'N/A'}
                <br />
                Backdated as:{' '}
                {note.backdatedTimestampUtc
                  ? format(note.backdatedTimestampUtc, 'M/d/yy h:mm a')
                  : 'N/A'}
                <hr />
                Approved by:{' '}
                {note.approverId ? (
                  <PersonName person={userLookup(note.approverId)} />
                ) : (
                  'N/A'
                )}
                <br />
                Approved at:{' '}
                {note.approvedTimestampUtc
                  ? format(note.approvedTimestampUtc, 'M/d/yy h:mm a')
                  : 'N/A'}
              </>
            </Typography>
          </Box>
        </Collapse>

        <Typography variant="body2" component="p">
          {note.contents}
        </Typography>
      </CardContent>

      <CardActions
        sx={{ paddingTop: 0, justifyContent: 'flex-end', flexWrap: 'wrap' }}
      >
        {note.status === V1ReferralNoteStatus.Draft && (
          <>
            {canDiscard && (
              <Button
                onClick={() => setShowDiscardDialog(true)}
                variant="outlined"
                size="small"
                color="error"
                sx={{ marginTop: 1 }}
                startIcon={<DeleteForeverIcon />}
              >
                Delete
              </Button>
            )}

            {canEdit && (
              <Button
                onClick={() => setShowEditDialog(true)}
                variant="outlined"
                size="small"
                sx={{ marginTop: 1 }}
                startIcon={<EditIcon />}
              >
                Edit
              </Button>
            )}

            {canApprove && (
              <Button
                onClick={() => setShowApproveDialog(true)}
                variant="contained"
                size="small"
                sx={{ marginTop: 1 }}
                startIcon={<CheckIcon />}
              >
                Approve
              </Button>
            )}
          </>
        )}
      </CardActions>

      {showDiscardDialog && (
        <DiscardV1ReferralNoteDialog
          referralId={referralId}
          note={note}
          onClose={() => setShowDiscardDialog(false)}
        />
      )}

      {showApproveDialog && (
        <ApproveV1ReferralNoteDialog
          referralId={referralId}
          note={note}
          onClose={() => setShowApproveDialog(false)}
        />
      )}

      {showEditDialog && (
        <AddEditV1ReferralNoteDialog
          referralId={referralId}
          note={note}
          onClose={() => setShowEditDialog(false)}
        />
      )}
    </Card>
  );
}
