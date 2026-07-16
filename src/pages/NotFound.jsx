import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <p className="text-7xl font-extrabold text-primary-600">404</p>
      <h1 className="mt-4 text-xl font-bold text-slate-800">Page Not Found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button className="mt-6" onClick={() => navigate("/dashboard")}>
        Go to Dashboard
      </Button>
    </div>
  );
};

export default NotFound;
