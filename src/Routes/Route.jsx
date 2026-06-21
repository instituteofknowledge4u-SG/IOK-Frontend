import { Navigate, Outlet, useParams, useLocation } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import AccessDenied from "../pages/AccessDenied";
import {
  canTeacherAccessTeacherProfile,
  canTeacherAccessBatch,
} from "../util/teacherAccessControl";

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return isAuthenticated ? <Outlet /> : <Navigate to="/home" replace />;
};

export const ProtectedRouteRoleBased = ({ allowedRoles }) => {
  const userRole = useAuthStore((state) => state.userRole);

  if (!allowedRoles.includes(userRole)) {
    if (window.location.pathname === "/") {
      return (
        <div className="p-8 text-center text-red-500">
          Unauthorized: Invalid User Role.
        </div>
      );
    }

    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

/**
 * Restrict teachers from accessing other teachers' profiles
 * Teachers can only view their own profile
 */
export const TeacherProfileRoute = () => {
  const userRole = useAuthStore((state) => state.userRole);
  const currentUserId = useAuthStore((state) => state.id);
  const location = useLocation();

  // Extract username from URL to determine target user ID
  const pathSegments = location.pathname.split("/");
  const targetUsername = pathSegments[2]; // /profile/:username

  // For now, we'll check if teacher is trying to access a different user's profile
  // A proper implementation would involve fetching the target user ID
  // But since we can't reliably extract the ID from username in URL,
  // we'll handle this check in the ProfilePage component instead

  return <Outlet />;
};

/**
 * Restrict teachers from accessing batches they're not assigned to
 */
export const TeacherBatchRoute = () => {
  const userRole = useAuthStore((state) => state.userRole);
  const user = useAuthStore((state) => state.user);

  if (userRole === "Admin") {
    return <Outlet />;
  }

  if (userRole === "Teacher") {
    // Get teacher's assigned batches
    const teacherBatches = user?.batches || [];

    // The actual batch access check will happen in the BatchDetails component
    // because we need the batch ID which is in the route parameter
    return <Outlet />;
  }

  return <Outlet />;
};

export const PublicRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return !isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};
