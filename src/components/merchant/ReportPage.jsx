import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardContext } from "@/context/DashboardContext";
import {
  LineChart,
  Line,
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

// Custom Tooltip to show all three values on hover
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ReportPage() {
  const [activeTab, setActiveTab] = useState("sales");
  // 🔹 Date filter state
  const [dateType, setDateType] = useState("today");
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
    // Always include the type
    const params = { type: dateType };

    const ALL_CARDS = [
      { title: "Today", key: "today", type: "today" },
      { title: "This Week", key: "week", type: "week" },
      { title: "This Month", key: "month", type: "month" },
      { title: "This Year", key: "year", type: "year" },
    ];

    // If type is custom, both fromDate and toDate must be provided
    if (dateType === "custom") {
      if (!fromDate || !toDate) {
        return false; // missing required dates
      }
      params.fromDate = fromDate;
      params.toDate = toDate;
    }

    return params;
  };

  useEffect(() => {
    const filters = buildFilterParams();
    if (!filters) return; // invalid filters
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
        return [
          {
            title: "Custom Range",
            value: totals?.custom, // backend should send this
          },
        ];

      default:
        return [];
    }
  };

  if (loading || topProductsLoading || paymentLoading) return <Loader />;

  return (
    <div className="container py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Sales Report</h1>

      <Tabs Titles
        defaultValue="sales"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={dateType}
            onChange={(e) => setDateType(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="custom">Custom</option>
          </select>

          {dateType === "custom" && (
            <>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </>
          )}

          <button
            onClick={() => {
              setDateType("today");
              setFromDate("");
              setToDate("");
            }}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>

        <TabsList className="grid w-full max-w-md grid-cols-1  md:grid-cols-3 min-h-[80px]">
          <TabsTrigger value="sales">Total Sales</TabsTrigger>
          <TabsTrigger value="payment">Revenue by Payment</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
        </TabsList>

        {/* ── TOTAL SALES TAB ──────────────────────────────────────── */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {getStatCards().map((card, index) => (
              <StatCard
                key={index}
                title={card.title}
                value={`₹ ${card.value || 0} `}
              />
            ))}
          </div>

          {/* 3 Charts in One Row */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {/* Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sales Amount (₹)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => [
                          `₹${Number(value).toLocaleString()}`,
                          "Sales",
                        ]}
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

            {/* Products Sold Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Products Sold</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => [Number(value), "Sold"]}
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

            {/* Products Added Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Products Added</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => [Number(value), "Added"]}
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
        <TabsContent value="payment" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method Split</CardTitle>
              </CardHeader>
              <CardContent className="h-72 flex flex-col items-center justify-center gap-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-emerald-600">
                    {paymentAnalytics?.summary?.onlinePercent}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Online Payment
                  </p>
                  <div className="text-2xl font-semibold mt-2">
                    {paymentAnalytics?.summary?.onlineAmount}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-amber-600">
                    {paymentAnalytics?.summary?.codPercent}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">COD</p>
                  <div className="text-2xl font-semibold mt-2">
                    {paymentAnalytics?.summary?.codAmount}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentAnalytics?.timeline}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip
                        formatter={(v) => `₹${Number(v).toLocaleString()}`}
                      />
                      <Legend />
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
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProducts}
                    layout="vertical"
                    margin={{ left: 140, right: 20, top: 20, bottom: 20 }}
                  >
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 13 }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="units"
                      fill="#8b5cf6"
                      radius={[0, 4, 4, 0]}
                      name="Units Sold"
                      className="cursor-pointer "
                      barSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Units Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((p) => (
                    <TableRow key={p.rank}>
                      <TableCell className="font-medium">{p.rank}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="text-right">
                        {Number(p.units).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {p.revenue}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <Badge variant={variant} className="mt-1.5">
          {change}
        </Badge>
      </CardContent>
    </Card>
  );
}
