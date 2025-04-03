import { Route, Routes } from 'react-router-dom';
import { OpenTicketForm } from './OpenTicketForm';

export function Support() {
  return (
    <Routes>
      <Route path="*" element={<OpenTicketForm />} />
    </Routes>
  );
}
