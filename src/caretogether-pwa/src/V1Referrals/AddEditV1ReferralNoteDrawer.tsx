import { Drawer, Button, TextField, Box, Typography } from "@mui/material";
import { useEffect, useId, useMemo, useState } from "react";
import { V1ReferralNoteEntry, V1ReferralNoteStatus } from "../GeneratedClient";
import { useV1ReferralNotesModel } from "../Model/V1ReferralNotesModel";

type AddEditV1ReferralNoteDrawerProps = {
  referralId: string;
  note?: V1ReferralNoteEntry;
  onClose: (didSave?: boolean) => void;
};

export function AddEditV1ReferralNoteDrawer({
  referralId,
  note,
  onClose,
}: AddEditV1ReferralNoteDrawerProps) {
  const { createDraftReferralNote, editDraftReferralNote } =
    useV1ReferralNotesModel();

  const titleId = useId();
  const isEdit = !!note;

  const [contents, setContents] = useState("");
  const [accessLevel, setAccessLevel] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContents(note?.contents ?? "");
    setAccessLevel(note?.accessLevel ?? "");
  }, [note]);

  const disabled =
    saving ||
    contents.trim().length === 0 ||
    (isEdit && note?.status !== V1ReferralNoteStatus.Draft);

  const drawerTitle = useMemo(() => {
    if (!isEdit) return "Add referral note";
    return "Edit referral note";
  }, [isEdit]);

  async function onSave() {
    if (disabled) return;

    setSaving(true);
    try {
      const noteId = isEdit ? note!.id : crypto.randomUUID();
      const trimmedAccessLevel =
        accessLevel.trim() === "" ? undefined : accessLevel.trim();

      if (isEdit) {
        await editDraftReferralNote(
          referralId,
          noteId,
          contents,
          undefined,
          trimmedAccessLevel,
        );
      } else {
        await createDraftReferralNote(
          referralId,
          noteId,
          contents,
          undefined,
          trimmedAccessLevel,
        );
      }

      onClose(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      anchor="right"
      open
      onClose={() => !saving && onClose()}
      slotProps={{
        paper: {
          role: "dialog",
          "aria-modal": true,
          "aria-labelledby": titleId,
          sx: {
            width: { xs: "100%", sm: 600 },
            top: 45,
            height: "calc(100% - 45px)",
            display: "flex",
          },
        },
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 3 }}>
        <Typography id={titleId} variant="h6" sx={{ mb: 2 }}>
          {drawerTitle}
        </Typography>
        {isEdit && note?.status !== V1ReferralNoteStatus.Draft && (
          <Box sx={{ mb: 2, fontSize: 13 }}>
            Only draft notes can be edited.
          </Box>
        )}

        <TextField
          autoFocus
          label="Note"
          value={contents}
          onChange={(e) => setContents(e.target.value)}
          fullWidth
          multiline
          minRows={6}
          margin="normal"
        />

        <TextField
          label="Access level (optional)"
          value={accessLevel}
          onChange={(e) => setAccessLevel(e.target.value)}
          fullWidth
          margin="normal"
          placeholder="Leave blank for default"
        />
      </Box>

      <Box
        sx={{
          borderTop: 1,
          borderColor: "divider",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1,
          justifyContent: "flex-end",
          p: 2,
          pb: "calc(16px + env(safe-area-inset-bottom))",
          backgroundColor: "background.paper",
        }}
      >
        <Button onClick={() => !saving && onClose()} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSave} disabled={disabled}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </Box>
    </Drawer>
  );
}
