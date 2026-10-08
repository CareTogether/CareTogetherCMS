import { ReportsScreen } from './ReportsScreen';
import type { LocationRoute } from '../Shell/LocationRoute';

export const reportsRoutes = [
  {
    path: 'reports',
    element: <ReportsScreen />,
    locationSwitch: 'same-path',
  },
] satisfies LocationRoute[];
