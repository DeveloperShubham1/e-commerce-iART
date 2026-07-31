import {
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import { Card } from "./index";

const StatCard = ({ label, value, icon: Icon, trend, trendUp, color }) => (
    <Card className="p-5">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
                {/* {trend && (
                    <div className="mt-2 flex items-center gap-1 text-xs">
                        {trendUp ? (
                            <TrendingUp className="h-3.5 w-3.5 text-success-600" />
                        ) : (
                            <TrendingDown className="h-3.5 w-3.5 text-error-600" />
                        )}
                        <span className={trendUp ? "text-success-600" : "text-error-600"}>{trend}</span>
                        <span className="text-slate-400">vs last month</span>
                    </div>
                )} */}
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
    </Card>
);

export default StatCard