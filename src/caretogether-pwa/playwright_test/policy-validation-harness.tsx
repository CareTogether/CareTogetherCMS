import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'jotai';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { LocationEdit } from '../src/Settings/Locations/LocationEdit';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider>
      <BrowserRouter>
        <Link to="/org/org/a/settings/locations/a?tab=basic">Location A</Link>
        <Link to="/org/org/a/settings/locations/b?tab=basic">Location B</Link>
        <Suspense fallback={<p>Loading policy...</p>}>
          <Routes>
            <Route
              path="/org/:organizationId/:locationId/settings/locations/:editingLocationId"
              element={<LocationEdit />}
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
