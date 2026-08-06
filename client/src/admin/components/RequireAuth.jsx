import { Navigate, useLocation } from 'react-router-dom';
import Loader from '../../components/Loader.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

/** Protects admin routes — redirects to the login screen when signed out. */
export default function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader fullScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
