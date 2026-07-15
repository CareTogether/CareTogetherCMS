import {
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Toolbar,
} from '@mui/material';
import {
  AddCircle as AddCircleIcon,
  CloudUpload as CloudUploadIcon,
  MoreVert as MoreVertIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import type { MouseEvent, ReactNode } from 'react';
import { personFullName, type PrintableFamilyMember } from './FamilyMemberPrintData';

type RoleActionV2 = {
  key: string;
  label: string;
  onClick: () => void;
};

type FamilyScreenActionsMenuV2Props = {
  canAddNotes: boolean;
  canEditFamilyInfo: boolean;
  canUploadDocuments: boolean;
  familyMemberPrintInformationEnabled: boolean;
  hasFamilyActions: boolean;
  hasMoreMenuActions: boolean;
  header: ReactNode;
  isDesktop: boolean;
  menuAnchor: Element | null;
  onAddAdult: () => void;
  onAddChild: () => void;
  onAddNote: () => void;
  onCloseMenu: () => void;
  onCompleteOther: () => void;
  onDeleteFamily: () => void;
  onOpenMenu: (event: MouseEvent<HTMLElement>) => void;
  onPrintFamilyMemberInformation: (member: PrintableFamilyMember) => void;
  onPrintNotes: () => void;
  onToggleTestFamily: () => void;
  onUploadDocuments: () => void;
  printableFamilyMembers: PrintableFamilyMember[];
  roleRemovalActions: RoleActionV2[];
  roleResetActions: RoleActionV2[];
  showCompleteOtherAction: boolean;
  showDeleteFamilyAction: boolean;
  showToggleTestFamilyAction: boolean;
  toggleTestFamilyLabel: string;
};

export function FamilyScreenActionsMenuV2({
  canAddNotes,
  canEditFamilyInfo,
  canUploadDocuments,
  familyMemberPrintInformationEnabled,
  hasFamilyActions,
  hasMoreMenuActions,
  header,
  isDesktop,
  menuAnchor,
  onAddAdult,
  onAddChild,
  onAddNote,
  onCloseMenu,
  onCompleteOther,
  onDeleteFamily,
  onOpenMenu,
  onPrintFamilyMemberInformation,
  onPrintNotes,
  onToggleTestFamily,
  onUploadDocuments,
  printableFamilyMembers,
  roleRemovalActions,
  roleResetActions,
  showCompleteOtherAction,
  showDeleteFamilyAction,
  showToggleTestFamilyAction,
  toggleTestFamilyLabel,
}: FamilyScreenActionsMenuV2Props) {
  return (
    <Toolbar
      variant="dense"
      disableGutters={true}
      sx={{
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        py: 1,
      }}
    >
      <Box sx={{ flex: '1 1 320px', minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          {header}
          {!isDesktop && hasFamilyActions && (
            <IconButton
              aria-label="family actions"
              onClick={onOpenMenu}
              size="small"
              sx={{
                border: 1,
                borderColor: 'primary.main',
                borderRadius: 1,
                color: 'primary.main',
                flex: '0 0 auto',
                width: 36,
                height: 36,
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flex: '0 1 auto',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          gap: 1,
        }}
      >
        {isDesktop && canUploadDocuments && (
          <Button
            className="ph-unmask"
            onClick={onUploadDocuments}
            variant="contained"
            size="small"
            startIcon={<CloudUploadIcon />}
          >
            Upload
          </Button>
        )}
        {isDesktop && canEditFamilyInfo && (
          <Button
            className="ph-unmask"
            onClick={onAddAdult}
            variant="contained"
            size="small"
            startIcon={<AddCircleIcon />}
          >
            Adult
          </Button>
        )}
        {isDesktop && canEditFamilyInfo && (
          <Button
            className="ph-unmask"
            onClick={onAddChild}
            variant="contained"
            size="small"
            startIcon={<AddCircleIcon />}
          >
            Child
          </Button>
        )}
        {isDesktop && canAddNotes && (
          <Button
            className="ph-unmask"
            onClick={onAddNote}
            variant="contained"
            size="small"
            startIcon={<AddCircleIcon />}
          >
            Note
          </Button>
        )}
        {isDesktop && hasMoreMenuActions && (
          <IconButton onClick={onOpenMenu} size="small">
            <MoreVertIcon />
          </IconButton>
        )}
      </Box>
      <Menu
        id="family-more-menu"
        anchorEl={menuAnchor}
        keepMounted
        open={Boolean(menuAnchor)}
        onClose={onCloseMenu}
      >
        <MenuList dense={isDesktop}>
          {!isDesktop && canUploadDocuments && (
            <MenuItem onClick={onUploadDocuments}>
              <ListItemIcon>
                <CloudUploadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText className="ph-unmask" primary="Upload" />
            </MenuItem>
          )}
          {!isDesktop && canEditFamilyInfo && (
            <MenuItem onClick={onAddAdult}>
              <ListItemIcon>
                <AddCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText className="ph-unmask" primary="Adult" />
            </MenuItem>
          )}
          {!isDesktop && canEditFamilyInfo && (
            <MenuItem onClick={onAddChild}>
              <ListItemIcon>
                <AddCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText className="ph-unmask" primary="Child" />
            </MenuItem>
          )}
          {!isDesktop && canAddNotes && (
            <MenuItem onClick={onAddNote}>
              <ListItemIcon>
                <AddCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText className="ph-unmask" primary="Note" />
            </MenuItem>
          )}
          {!isDesktop &&
            (canUploadDocuments || canEditFamilyInfo || canAddNotes) &&
            hasMoreMenuActions && <Divider />}
          {roleRemovalActions.map((action) => (
            <MenuItem key={action.key} onClick={action.onClick}>
              <ListItemText primary={action.label} />
            </MenuItem>
          ))}
          {roleResetActions.map((action) => (
            <MenuItem key={action.key} onClick={action.onClick}>
              <ListItemText primary={action.label} />
            </MenuItem>
          ))}

          <MenuItem onClick={onPrintNotes}>
            <ListItemText primary="Print notes" />
          </MenuItem>

          {familyMemberPrintInformationEnabled &&
            printableFamilyMembers.map((member) => (
              <MenuItem
                key={`${member.kind}:${member.person.id}`}
                onClick={() => onPrintFamilyMemberInformation(member)}
              >
                <ListItemIcon>
                  <PrintIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <>
                      <span className="ph-unmask">Print </span>
                      {personFullName(member.person)}
                      <span className="ph-unmask"> information</span>
                    </>
                  }
                />
              </MenuItem>
            ))}

          {showCompleteOtherAction && (
            <MenuItem onClick={onCompleteOther}>
              <ListItemText primary="Complete other..." />
            </MenuItem>
          )}

          {showToggleTestFamilyAction && (
            <MenuItem onClick={onToggleTestFamily}>
              <ListItemText className="ph-unmask" primary={toggleTestFamilyLabel} />
            </MenuItem>
          )}

          {showDeleteFamilyAction && (
            <MenuItem onClick={onDeleteFamily}>
              <ListItemText className="ph-unmask" primary="Delete family" />
            </MenuItem>
          )}
        </MenuList>
      </Menu>
    </Toolbar>
  );
}
