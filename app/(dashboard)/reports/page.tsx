// app/(dashboard)/reports/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  ShoppingBag,
  Package,
  Scissors,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Box,
  UserCircle,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Percent,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface ReportData {
  // Overview
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
  appointments: {
    today: number;
    thisWeek: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  orders: {
    today: number;
    thisWeek: number;
    totalRevenue: number;
  };
  clients: {
    total: number;
    newThisMonth: number;
    returning: number;
    topSpenders: Array<{
      name: string;
      totalSpent: number;
      visits: number;
      isVip: boolean;
    }>;
  };
  topServices: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  topProducts: Array<{
    name: string;
    sold: number;
    revenue: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    amount: number;
    time: string;
  }>;

  // Sales
  sales: {
    byPaymentMethod: {
      cash: number;
      card: number;
      transfer: number;
    };
    byCategory: Array<{
      category: string;
      revenue: number;
      count: number;
    }>;
    averageTicket: {
      appointments: number;
      orders: number;
      overall: number;
    };
    busiestDays: Array<{
      day: string;
      appointments: number;
      revenue: number;
    }>;
  };

  // Inventory
  inventory: {
    totalProducts: number;
    totalValue: number;
    retailValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    potentialProfit: number;
    products: Array<{
      id: string;
      name: string;
      sku: string;
      stockOnHand: number;
      stockReserved: number;
      reorderLevel: number;
      costPrice: number;
      retailPrice: number;
      value: number;
      status: "ok" | "low" | "out";
    }>;
    movements: Array<{
      product: string;
      sold: number;
      revenue: number;
      profit: number;
      margin: number;
    }>;
  };

  // Stylist Performance
  stylists: Array<{
    id: string;
    name: string;
    appointments: number;
    completed: number;
    cancelled: number;
    noShow: number;
    revenue: number;
    averageTicket: number;
    completionRate: number;
    topServices: Array<{
      name: string;
      count: number;
    }>;
  }>;
}

type DateRange = "today" | "week" | "month" | "year";
type TabType = "overview" | "sales" | "inventory" | "stylists";

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>("month");
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reports?range=${dateRange}`);
      if (response.ok) {
        const reportData = await response.json();
        setData(reportData);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "sales", label: "Sales", icon: DollarSign },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "stylists", label: "Stylist Performance", icon: UserCircle },
  ];

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Business analytics and insights</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const monthGrowth = calculateGrowth(data.revenue.thisMonth, data.revenue.lastMonth);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Business analytics and insights</p>
        </div>
        <div className="flex gap-2">
          {(["today", "week", "month", "year"] as DateRange[]).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(range)}
              className={dateRange === range ? "bg-teal-600 hover:bg-teal-700" : ""}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-teal-50 text-teal-700 border-b-2 border-teal-600"
                : ""
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(data.revenue.thisMonth)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {monthGrowth >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm ${monthGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {Math.abs(monthGrowth).toFixed(1)}%
                      </span>
                      <span className="text-xs text-muted-foreground">vs last month</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-teal-50">
                    <DollarSign className="w-6 h-6 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Appointments</p>
                    <p className="text-2xl font-bold">{data.appointments.thisWeek}</p>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 mt-1">
                      {data.appointments.completed} completed
                    </Badge>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Product Sales</p>
                    <p className="text-2xl font-bold">{formatCurrency(data.orders.totalRevenue)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {data.orders.thisWeek} orders this week
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50">
                    <ShoppingBag className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Clients</p>
                    <p className="text-2xl font-bold">{data.clients.total}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      +{data.clients.newThisMonth} new this month
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-50">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Top Services */}
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-teal-600" />
                  Top Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.topServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No service data yet</p>
                ) : (
                  <div className="space-y-4">
                    {data.topServices.map((service, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? "bg-yellow-100 text-yellow-700" :
                            index === 1 ? "bg-gray-100 text-gray-700" :
                            index === 2 ? "bg-orange-100 text-orange-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{service.name}</p>
                            <p className="text-xs text-muted-foreground">{service.count} bookings</p>
                          </div>
                        </div>
                        <p className="font-semibold text-teal-600">{formatCurrency(service.revenue)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  Top Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No product sales yet</p>
                ) : (
                  <div className="space-y-4">
                    {data.topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? "bg-yellow-100 text-yellow-700" :
                            index === 1 ? "bg-gray-100 text-gray-700" :
                            index === 2 ? "bg-orange-100 text-orange-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.sold} sold</p>
                          </div>
                        </div>
                        <p className="font-semibold text-purple-600">{formatCurrency(product.revenue)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Clients */}
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-orange-600" />
                  Top Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.clients.topSpenders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No client data yet</p>
                ) : (
                  <div className="space-y-4">
                    {data.clients.topSpenders.map((client, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? "bg-yellow-100 text-yellow-700" :
                            index === 1 ? "bg-gray-100 text-gray-700" :
                            index === 2 ? "bg-orange-100 text-orange-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm flex items-center gap-1">
                              {client.name}
                              {client.isVip && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                            </p>
                            <p className="text-xs text-muted-foreground">{client.visits} visits</p>
                          </div>
                        </div>
                        <p className="font-semibold text-orange-600">{formatCurrency(client.totalSpent)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Appointment Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Appointment Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <p className="text-2xl font-bold text-green-600">{data.appointments.completed}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-xl">
                    <p className="text-2xl font-bold text-red-600">{data.appointments.cancelled}</p>
                    <p className="text-sm text-muted-foreground">Cancelled</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-xl">
                    <p className="text-2xl font-bold text-yellow-600">{data.appointments.noShow}</p>
                    <p className="text-sm text-muted-foreground">No Show</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completion Rate</span>
                    <span className="font-semibold">
                      {data.appointments.thisWeek > 0 
                        ? ((data.appointments.completed / data.appointments.thisWeek) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                ) : (
                  <div className="space-y-3">
                    {data.recentActivity.slice(0, 4).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            activity.type === "appointment" ? "bg-blue-100" :
                            activity.type === "order" ? "bg-purple-100" :
                            "bg-green-100"
                          }`}>
                            {activity.type === "appointment" ? (
                              <Calendar className="w-4 h-4 text-blue-600" />
                            ) : activity.type === "order" ? (
                              <ShoppingBag className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Users className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                        {activity.amount > 0 && (
                          <p className="font-semibold text-teal-600">{formatCurrency(activity.amount)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Sales Tab */}
      {activeTab === "sales" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Sales Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Appointment</p>
                    <p className="text-2xl font-bold">{formatCurrency(data.sales.averageTicket.appointments)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Order</p>
                    <p className="text-2xl font-bold">{formatCurrency(data.sales.averageTicket.orders)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50">
                    <ShoppingBag className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Avg Ticket</p>
                    <p className="text-2xl font-bold">{formatCurrency(data.sales.averageTicket.overall)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-teal-50">
                    <DollarSign className="w-6 h-6 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Payment Methods */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-teal-600" />
                  Revenue by Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Banknote className="w-6 h-6 text-green-600" />
                      <span className="font-medium">Cash</span>
                    </div>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(data.sales.byPaymentMethod.cash)}</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                      <span className="font-medium">Card</span>
                    </div>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(data.sales.byPaymentMethod.card)}</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <ArrowRightLeft className="w-6 h-6 text-purple-600" />
                      <span className="font-medium">Transfer</span>
                    </div>
                    <p className="text-xl font-bold text-purple-600">{formatCurrency(data.sales.byPaymentMethod.transfer)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue by Category */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-teal-600" />
                  Revenue by Service Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.sales.byCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No category data yet</p>
                ) : (
                  <div className="space-y-3">
                    {data.sales.byCategory.map((cat, index) => {
                      const total = data.sales.byCategory.reduce((s, c) => s + c.revenue, 0);
                      const percentage = total > 0 ? (cat.revenue / total) * 100 : 0;
                      return (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{cat.category}</span>
                            <span className="text-muted-foreground">{cat.count} services</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-3">
                              <div
                                className="bg-teal-500 h-3 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="font-semibold text-sm w-24 text-right">
                              {formatCurrency(cat.revenue)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Busiest Days */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Busiest Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.sales.busiestDays.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {data.sales.busiestDays.map((day, index) => {
                    const maxAppts = Math.max(...data.sales.busiestDays.map(d => d.appointments));
                    const intensity = maxAppts > 0 ? (day.appointments / maxAppts) : 0;
                    return (
                      <div key={index} className="text-center">
                        <p className="text-xs text-muted-foreground mb-2">{day.day}</p>
                        <div
                          className={`p-4 rounded-xl ${
                            intensity > 0.7 ? "bg-teal-500 text-white" :
                            intensity > 0.4 ? "bg-teal-200 text-teal-800" :
                            intensity > 0 ? "bg-teal-50 text-teal-600" :
                            "bg-gray-50 text-gray-400"
                          }`}
                        >
                          <p className="text-lg font-bold">{day.appointments}</p>
                          <p className="text-xs">appts</p>
                        </div>
                        <p className="text-xs font-medium mt-1">{formatCurrency(day.revenue)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Inventory Tab */}
      {activeTab === "inventory" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Inventory Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    <p className="text-2xl font-bold">{data.inventory.totalProducts}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50">
                    <Box className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Inventory Value (Cost)</p>
                    <p className="text-2xl font-bold">{formatCurrency(data.inventory.totalValue)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-teal-50">
                    <DollarSign className="w-6 h-6 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Retail Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(data.inventory.retailValue)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Potential Profit</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(data.inventory.potentialProfit)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-50">
                    <Percent className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stock Alerts */}
          {(data.inventory.lowStockCount > 0 || data.inventory.outOfStockCount > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {data.inventory.lowStockCount > 0 && (
                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      <div>
                        <p className="font-semibold text-yellow-800">Low Stock Alert</p>
                        <p className="text-sm text-yellow-700">{data.inventory.lowStockCount} products below reorder level</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {data.inventory.outOfStockCount > 0 && (
                <Card className="border-red-200 bg-red-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                      <div>
                        <p className="font-semibold text-red-800">Out of Stock</p>
                        <p className="text-sm text-red-700">{data.inventory.outOfStockCount} products out of stock</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Product Stock Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Stock Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.inventory.products.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No products yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Product</th>
                        <th className="text-left py-3 px-2">SKU</th>
                        <th className="text-right py-3 px-2">In Stock</th>
                        <th className="text-right py-3 px-2">Reserved</th>
                        <th className="text-right py-3 px-2">Available</th>
                        <th className="text-right py-3 px-2">Cost</th>
                        <th className="text-right py-3 px-2">Retail</th>
                        <th className="text-right py-3 px-2">Value</th>
                        <th className="text-center py-3 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.inventory.products.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-accent/30">
                          <td className="py-3 px-2 font-medium">{product.name}</td>
                          <td className="py-3 px-2 text-muted-foreground">{product.sku}</td>
                          <td className="py-3 px-2 text-right">{product.stockOnHand}</td>
                          <td className="py-3 px-2 text-right">{product.stockReserved}</td>
                          <td className="py-3 px-2 text-right font-medium">{product.stockOnHand - product.stockReserved}</td>
                          <td className="py-3 px-2 text-right">{formatCurrency(product.costPrice)}</td>
                          <td className="py-3 px-2 text-right">{formatCurrency(product.retailPrice)}</td>
                          <td className="py-3 px-2 text-right font-medium">{formatCurrency(product.value)}</td>
                          <td className="py-3 px-2 text-center">
                            <Badge className={
                              product.status === "out" ? "bg-red-100 text-red-700" :
                              product.status === "low" ? "bg-yellow-100 text-yellow-700" :
                              "bg-green-100 text-green-700"
                            }>
                              {product.status === "out" ? "Out" : product.status === "low" ? "Low" : "OK"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Movement / Profit Margins */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Product Movement & Profit Margins
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.inventory.movements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No sales data yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Product</th>
                        <th className="text-right py-3 px-2">Units Sold</th>
                        <th className="text-right py-3 px-2">Revenue</th>
                        <th className="text-right py-3 px-2">Profit</th>
                        <th className="text-right py-3 px-2">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.inventory.movements.map((movement, index) => (
                        <tr key={index} className="border-b hover:bg-accent/30">
                          <td className="py-3 px-2 font-medium">{movement.product}</td>
                          <td className="py-3 px-2 text-right">{movement.sold}</td>
                          <td className="py-3 px-2 text-right">{formatCurrency(movement.revenue)}</td>
                          <td className="py-3 px-2 text-right text-green-600 font-medium">{formatCurrency(movement.profit)}</td>
                          <td className="py-3 px-2 text-right">
                            <Badge className={
                              movement.margin >= 50 ? "bg-green-100 text-green-700" :
                              movement.margin >= 30 ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }>
                              {movement.margin.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stylists Tab */}
      {activeTab === "stylists" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {data.stylists.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <UserCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No stylist data yet</h3>
                <p className="text-muted-foreground">Complete some appointments to see stylist performance</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {data.stylists.map((stylist) => (
                <Card key={stylist.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-teal-700">
                            {stylist.name.split(" ").map(n => n[0]).join("")}
                          </span>
                        </div>
                        {stylist.name}
                      </CardTitle>
                      <Badge className="bg-teal-100 text-teal-700 text-lg px-3 py-1">
                        {formatCurrency(stylist.revenue)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <p className="text-2xl font-bold text-blue-600">{stylist.appointments}</p>
                        <p className="text-xs text-muted-foreground">Appointments</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-xl">
                        <p className="text-2xl font-bold text-green-600">{stylist.completed}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      <div className="text-center p-3 bg-teal-50 rounded-xl">
                        <p className="text-2xl font-bold text-teal-600">{formatCurrency(stylist.averageTicket)}</p>
                        <p className="text-xs text-muted-foreground">Avg Ticket</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-xl">
                        <p className="text-2xl font-bold text-purple-600">{stylist.completionRate.toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">Completion Rate</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Appointment Breakdown */}
                      <div>
                        <p className="text-sm font-medium mb-2">Appointment Status</p>
                        <div className="flex gap-2">
                          <div className="flex-1 text-center p-2 bg-green-50 rounded">
                            <p className="font-bold text-green-600">{stylist.completed}</p>
                            <p className="text-xs text-muted-foreground">Done</p>
                          </div>
                          <div className="flex-1 text-center p-2 bg-red-50 rounded">
                            <p className="font-bold text-red-600">{stylist.cancelled}</p>
                            <p className="text-xs text-muted-foreground">Cancelled</p>
                          </div>
                          <div className="flex-1 text-center p-2 bg-yellow-50 rounded">
                            <p className="font-bold text-yellow-600">{stylist.noShow}</p>
                            <p className="text-xs text-muted-foreground">No Show</p>
                          </div>
                        </div>
                      </div>

                      {/* Top Services */}
                      <div>
                        <p className="text-sm font-medium mb-2">Top Services</p>
                        {stylist.topServices.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No services yet</p>
                        ) : (
                          <div className="space-y-1">
                            {stylist.topServices.slice(0, 3).map((service, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{service.name}</span>
                                <Badge variant="secondary">{service.count}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
