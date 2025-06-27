import { Route, Routes } from 'react-router-dom';
import { ReportsScreen } from './ReportsScreen';

function Reports() {
  return (
    <Routes>
      <Route path="" element={<ReportsScreen />} />
    </Routes>
  );
}

export { Reports };
