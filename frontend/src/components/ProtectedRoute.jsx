import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = (localStorage.getItem('role') || 'VISITANTE').toUpperCase();

  // Si no hay sesión iniciada y la ruta exige autenticación
  if (!token && allowedRoles && !allowedRoles.includes('VISITANTE')) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si un cliente intenta entrar a administración
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'CLIENTE') {
      return <Navigate to="/" replace />;
    }
    if (role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}