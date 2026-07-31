import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FullPageSpinner } from "./ui/Spinner";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  const { isAuthenticated, profileLoading } = useSelector(
    (state) => state.auth
  );

  if (profileLoading) return <FullPageSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;