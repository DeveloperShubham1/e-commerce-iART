import { useNavigate } from "react-router-dom";
import { Construction, ArrowLeft } from "lucide-react";
import { Button, Card } from "../components/ui";

const Placeholder = ({ title, description }) => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-warning-100 text-warning-600">
          <Construction className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">Coming Soon</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          This module is under construction. It will be available in a future release.
        </p>
        <Button variant="secondary" className="mt-5" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
      </Card>
    </div>
  );
};

export default Placeholder;
