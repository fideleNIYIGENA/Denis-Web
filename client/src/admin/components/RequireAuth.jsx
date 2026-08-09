import { Link, Navigate, useLocation } from 'react-router-dom';
import Loader from '../../components/Loader.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

/** Shown when a signed-in token is not a valid admin session. */
function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-night-900">
      <div className="card w-full max-w-md p-8 text-center">
        <p className="text-5xl font-bold text-gold">403</p>
        <h1 className="mt-3 font-display text-xl font-bold text-slate-900 dark:text-white">Access denied</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          You must be signed in as an administrator to view this page.
        </p>
        <Link to="/" className="btn-primary mt-6 inline-flex">
          Back to home
        </Link>
      </div>
    </div>
  );
}

/**
 * Protects admin routes:
 * - Not signed in → redirect to the admin login screen.
 * - Signed in but not an admin account → deny access (Unauthorized).
 */
export default function RequireAuth({ children }) {
  const { isAuthenticated, admin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader fullScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (admin?.role !== 'admin') {
    return <Unauthorized />;
  }

  return children;
}
