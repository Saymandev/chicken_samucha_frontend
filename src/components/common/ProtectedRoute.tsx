import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { authAPI } from '../../utils/api';
import { PageSkeleton, ProfileSkeleton } from './Skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = false 
}) => {
  const { isAuthenticated, user, token, setUser, logout } = useStore();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const location = useLocation();

  // Debug logging
  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated);
  console.log('ProtectedRoute - user:', user);
  console.log('ProtectedRoute - token:', token);
  console.log('ProtectedRoute - adminOnly:', adminOnly);
  console.log('ProtectedRoute - location:', location.pathname);

  useEffect(() => {
    const verifyAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.getMe();
        if (response.data.success) {
          setUser(response.data.user);
          setVerified(true);
        } else {
          logout();
          toast.error('Session expired. Please login again.');
        }
      } catch (error) {
        logout();
        toast.error('Session expired. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    if (token && !verified) {
      verifyAuth();
    } else {
      setLoading(false);
    }
  }, [token, verified, setUser, logout]);

  // Show skeleton while verifying authentication
  if (loading) {
    return (
      <PageSkeleton>
        <ProfileSkeleton />
      </PageSkeleton>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin access
  if (adminOnly && user.role !== 'admin') {
    toast.error('You do not have permission to access this page');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 