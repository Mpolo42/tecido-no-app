import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import CadastroPage from '../pages/CadastroPage';
import Login from '../pages/Login';
import AdminDashboard from '../pages/AdminDashboard';
import AdminGate from '../components/AdminGate';
import ResetPassword from '../pages/ResetPassword';
import PrivacyPage from '../pages/PrivacyPage';
import NotFound from '../pages/NotFound';

export default function AppRoutes({ session, authLoading, ...formProps }) {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cadastro" element={<CadastroPage {...formProps} />} />
      <Route path="/privacidade" element={<PrivacyPage />} />
      <Route path="/login" element={authLoading ? <p role="status" className="text-center p-12">Verificando sessão…</p> : session ? <Navigate to="/admin" replace /> : <Login />} />
      <Route path="/admin" element={authLoading ? <p role="status" className="text-center p-12">Verificando sessão…</p> : <AdminGate session={session}><AdminDashboard session={session} /></AdminGate>} />
      <Route path="/redefinir-senha" element={<ResetPassword />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
