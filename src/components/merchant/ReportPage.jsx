import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardContext } from "@/context/DashboardContext";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from "recharts";
import Loader from "../Loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Custom Tooltip to show all three values on hover
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg text-xs sm:text-sm">
        <p className="font-semibold text-gray-800">{data.period}</p>
        <p className="text-indigo-600">
          Sales: ₹{Number(data.sales).toLocaleString()}
        </p>
        <p className="text-green-600">Sold: {data.sold}</p>
        <p className="text-orange-600">Added: {data.added}</p>
      </div>
    );
  }
  return null;
};

export default function ReportPage() {
  const [activeTab, setActiveTab] = useState("sales");
  const [dateType, setDateType] = useState("month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const {
    salesTrend,
    totals,
    loading,
    fetchSalesTrend,
    fetchTopProducts,
    topProducts,
    topProductsLoading,
    paymentLoading,
    paymentAnalytics,
    fetchPaymentAnalytics,
  } = useDashboardContext();

  const buildFilterParams = () => {
    const params = { type: dateType };
    if (dateType === "custom") {
      if (!fromDate || !toDate) return false;
      params.fromDate = fromDate;
      params.toDate = toDate;
    }
    return params;
  };

  useEffect(() => {
    const filters = buildFilterParams();
    if (!filters) return;
    fetchSalesTrend(filters);
    fetchTopProducts(filters);
    fetchPaymentAnalytics(filters);
  }, [dateType, fromDate, toDate]);

  const getStatCards = () => {
    switch (dateType) {
      case "today":
        return [{ title: "Today", value: totals?.today }];
      case "week":
        return [{ title: "This Week", value: totals?.week }];
      case "month":
        return [{ title: "This Month", value: totals?.month }];
      case "year":
        return [{ title: "This Year", value: totals?.year }];
      case "custom":
        return [{ title: "Custom Range", value: totals?.custom }];
      default:
        return [];
    }
  };

  if (loading || topProductsLoading || paymentLoading) return <Loader />;

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-full ">
      <Tabs
        defaultValue="sales"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4 sm:space-y-6"
      >
        {/* ── STICKY HEADER ─────────────────────────────────────── */}
        <div className="sticky top-0 z-20 -mx-3 sm:-mx-4 px-3 sm:px-4 md:mx-0 md:px-0">
          <div className="bg-background/95 backdrop-blur-md border-b rounded-b-2xl md:rounded-2xl">
            <div className="py-3 sm:py-4 space-y-3 sm:space-y-4 px-3 sm:px-4">
              {/* Header */}
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
                  Sales Report
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Monitor sales performance, revenue and product performance.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                      Period :
                    </span>

                    <select
                      value={dateType}
                      onChange={(e) => setDateType(e.target.value)}
                      className="h-9 flex-1 sm:flex-none min-w-[120px] sm:min-w-[140px] rounded-md border bg-background px-2 sm:px-3 text-xs sm:text-sm font-medium outline-none cursor-pointer hover:bg-muted/50 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="year">This Year</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  {dateType === "custom" && (
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="h-9 flex-1 sm:flex-none rounded-md border bg-background px-2 sm:px-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        to
                      </span>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="h-9 flex-1 sm:flex-none rounded-md border bg-background px-2 sm:px-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setDateType("month");
                      setFromDate("");
                      setToDate("");
                    }}
                    className="h-9 px-3 rounded-md border bg-background text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Report Navigation */}
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto rounded-lg bg-muted/50 p-1 gap-1">
                <TabsTrigger
                  value="sales"
                  className="h-9 cursor-pointer rounded-md text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Total Sales
                </TabsTrigger>
                <TabsTrigger
                  value="payment"
                  className="h-9 rounded-md cursor-pointer text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Revenue by Payment
                </TabsTrigger>
                <TabsTrigger
                  value="products"
                  className="h-9 rounded-md cursor-pointer text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Top Products
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </div>

        {/* ── TOTAL SALES TAB ──────────────────────────────────────── */}
        <TabsContent value="sales" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {getStatCards().map((card, index) => (
              <StatCard
                key={index}
                title={card.title}
                value={`₹ ${card.value || 0} `}
              />
            ))}
          </div>

          {/* Charts */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardHeader className="py-4 sm:py-6">
                <CardTitle className="text-base sm:text-lg">
                  Sales Amount (₹)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-6 pt-0">
                <div className="h-64 sm:h-72 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis tick={{ fontSize: 11 }} width={40} />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                      />
                      <Bar
                        dataKey="sales"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                        name="Sales (₹)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  Products Sold
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-6 pt-0">
                <div className="h-64 sm:h-72 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis tick={{ fontSize: 11 }} width={40} />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                      />
                      <Bar
                        dataKey="sold"
                        fill="#22c55e"
                        radius={[4, 4, 0, 0]}
                        name="Products Sold"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 xl:col-span-1">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  Products Added
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-6 pt-0">
                <div className="h-64 sm:h-72 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis tick={{ fontSize: 11 }} width={40} />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                      />
                      <Bar
                        dataKey="added"
                        fill="#f97316"
                        radius={[4, 4, 0, 0]}
                        name="Products Added"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── REVENUE BY PAYMENT TAB ───────────────────────────────── */}
        <TabsContent value="payment" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  Payment Method Split
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-row md:flex-col items-center justify-center gap-6 sm:gap-8 py-6 sm:py-8">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-emerald-600">
                    {paymentAnalytics?.summary?.onlinePercent}%
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Online Payment
                  </p>
                  <div className="text-lg sm:text-xl md:text-2xl font-semibold mt-2">
                    {paymentAnalytics?.summary?.onlineAmount}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-amber-600">
                    {paymentAnalytics?.summary?.codPercent}%
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    COD
                  </p>
                  <div className="text-lg sm:text-xl md:text-2xl font-semibold mt-2">
                    {paymentAnalytics?.summary?.codAmount}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  Monthly Revenue Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-6 pt-0">
                <div className="h-64 sm:h-72 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentAnalytics?.timeline}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={40} />
                      <Tooltip
                        formatter={(v) => `₹${Number(v).toLocaleString()}`}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar
                        dataKey="cod"
                        name="COD"
                        fill="#f97316"
                        radius={[4, 4, 0, 0]}
                        barSize={18}
                      />
                      <Bar
                        dataKey="online"
                        name="Online"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        barSize={18}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── TOP PRODUCTS TAB ─────────────────────────────────────── */}
        <TabsContent value="products">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <div className="h-64 sm:h-72 md:h-80 mb-6 sm:mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProducts}
                    layout="vertical"
                    margin={{ left: 10, right: 20, top: 10, bottom: 10 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      width={70}
                      tickFormatter={(value) =>
                        value.length > 12
                          ? `${value.substring(0, 10)}...`
                          : value
                      }
                    />
                    <Tooltip />
                    <Bar
                      dataKey="units"
                      fill="#8b5cf6"
                      radius={[0, 4, 4, 0]}
                      name="Units Sold"
                      className="cursor-pointer"
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Responsive table: horizontal scroll on small screens */}
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <Table className="min-w-[480px] sm:min-w-0">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 sm:w-16 text-xs sm:text-sm">
                        Rank
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm">
                        Product
                      </TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">
                        Units Sold
                      </TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">
                        Revenue
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((p) => (
                      <TableRow key={p.rank}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {p.rank}
                        </TableCell>
                        <TableCell className="max-w-[140px] sm:max-w-[200px] truncate text-xs sm:text-sm">
                          {p.name}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">
                          {Number(p.units).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs sm:text-sm">
                          {p.revenue}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component
function StatCard({ title, value, change, variant = "outline" }) {
  return (
    <Card className="w-full min-h-[80px]">
      <CardContent className="p-3">
        <div className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
          {title}
        </div>
        <div className="text-base sm:text-lg font-semibold mt-1 truncate">
          {value}
        </div>
        {change && (
          <Badge variant={variant} className="mt-1 text-[11px] px-1.5 py-0">
            {change}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}