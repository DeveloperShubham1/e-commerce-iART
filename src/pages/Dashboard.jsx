import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Plus,
  UserX,
  UserRoundCheck
} from "lucide-react";
import { Card, Badge, Button, Skeleton, SkeletonCard, StatCard } from "../components/ui";
import { useDispatch, useSelector } from "react-redux";
import { getDashboard } from "../Components/Redux/AuthSlice";

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    dashboardLoading: loading,
    dashboardData,
  } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getDashboard());
  }, [dispatch]);

  const stats = dashboardData?.stats || {};

  const totalMerchant = stats.totalMerchants
  const subscribed = stats.subscribedMerchants
  const unSubscribed = stats.unSubscribedMerchants
  const customer = stats.totalCustomers
  const order = stats.totalOrders;


  const merchants = dashboardData?.merchants || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-sm text-slate-500">Overview of your platform performance</p>
        </div>
        <Button onClick={() => navigate("/merchants")}>
          <Plus className="h-4 w-4" /> Add Merchant
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard label="Total Merchants" value={totalMerchant} icon={Store} trend="+12.5%" trendUp color="bg-primary-100 text-primary-600" />
            <StatCard label="Subscribed" value={subscribed} icon={UserRoundCheck} trend="+8.2%" trendUp color="bg-accent-100 text-accent-600" />
            <StatCard label="Unsubscribed" value={unSubscribed} icon={UserX} trend="+8.2%" trendUp color="bg-red-100 text-red-600 " />
            <StatCard label="Total Customers" value={customer} icon={Users} trend="+5.1%" trendUp color="bg-success-100 text-success-600" />
            <StatCard label="Total Orders" value={order} icon={ShoppingCart} trend="-2.3%" trendUp={false} color="bg-warning-100 text-warning-600" />
          </>
        )}
      </div>

      {/* Recent merchants */}
      <Card
        title="Recent Merchants"
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate("/merchants")}>
            View all
          </Button>
        }
      >
        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : merchants.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">No merchants found</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {merchants.slice(0, 5).map((m) => (
              <div key={m._id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">
                    {m.MerchantName?.charAt(0).toUpperCase() || "M"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{m.MerchantName}</p>
                    <p className="text-xs text-slate-500">{m.email}</p>
                  </div>
                </div>
                <Badge variant={m.isSubscribed ? "success" : "neutral"}>
                  {m.isSubscribed ? "Subscribed" : "Unsubscribed"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
