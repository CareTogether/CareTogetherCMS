import { Drawer } from "@mui/material";
import { useState } from "react";

export function useDrawer() {
  const [open, setOpen] = useState(false);

  return ({
    openDrawer: () => setOpen(true),
    closeDrawer: () => setOpen(false),
    drawerFor: (children: React.ReactNode) =>
      <Drawer
        anchor='right'
        open={open}
        onClose={() => setOpen(false)}
        sx={{ '.MuiDrawer-paper': { padding: 2, paddingTop: { xs: 7, sm: 8, md: 6 } } }}>
        {children}
      </Drawer>
  });
}