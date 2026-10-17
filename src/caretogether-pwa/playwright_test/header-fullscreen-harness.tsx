import { createRoot } from 'react-dom/client';
import { ShellAppBar } from '../src/Shell/ShellAppBar';

createRoot(document.getElementById('root')!).render(
  <ShellAppBar
    menuDrawerOpen={false}
    setMenuDrawerOpen={() => {}}
    drawerWidth="240px"
  />
);
