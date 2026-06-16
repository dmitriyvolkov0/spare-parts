import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../../widgets/Layout/AppLayout.jsx';
import { LoginPage } from '../../pages/LoginPage/index.jsx';
import { DashboardPage } from '../../pages/DashboardPage/index.jsx';
import { PartsPage } from '../../pages/PartsPage/index.jsx';
import { EquipmentPage } from '../../pages/EquipmentPage/index.jsx';
import { RepairsPage } from '../../pages/RepairsPage/index.jsx';
import { RepairCreatePage } from '../../pages/RepairsPage/create.jsx';
import { UsersPage } from '../../pages/UsersPage/index.jsx';

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="parts" element={<PartsPage />} />
          <Route path="equipment" element={<EquipmentPage />} />
          <Route path="repairs" element={<RepairsPage />} />
          <Route path="repairs/create" element={<RepairCreatePage />} />
          <Route path="repairs/:id/edit" element={<RepairCreatePage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
