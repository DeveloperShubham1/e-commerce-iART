import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FullPageSpinner } from "../components/ui/Spinner";

const PublicRoute = ({ children }) => {
  const { isAuthenticated, profileLoading } = useSelector(
    (state) => state.auth
  );

  if (profileLoading) return <FullPageSpinner />;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;