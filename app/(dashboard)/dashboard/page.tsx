// app/(dashboard)/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  Users,
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  ArrowRight,
  ArrowUpRight,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  CalendarPlus,
  ShoppingCart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { PendingConfirmations } from "@/components/dashboard/pending-confirmations";

// Mock data - will be replaced with real data
const stats = [
  {
    name: "Today's Appointments",
    value: "12",
    change: "+2 from yesterday",
    changeType: "positive",
    icon: Calendar,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
  },
  {
    name: "Active Clients",
    value: "248",
    change: "+18 this month",
    changeType: "positive",
    icon: Users,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
  {
    name: "Today's Revenue",
    value: "EC$ 2,450",
    change: "+12% vs avg",
    changeType: "positive",
    icon: DollarSign,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    name: "Pending Orders",
    value: "5",
    change: "3 ready for pickup",
    changeType: "neutral",
    icon: Package,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
];

const todayAppointments = [
  {
    id: 1,
    client: "Maria Johnson",
    service: "Full Color + Cut",
    time: "9:00 AM",
    duration: "2h 30m",
    stylist: "Sarah",
    status: "confirmed",
    price: 280,
  },
  {
    id: 2,
    client: "Ashley Brown",
    service: "Brazilian Blowout",
    time: "10:30 AM",
    duration: "3h",
    stylist: "Jessica",
    status: "in_progress",
    price: 350,
  },
  {
    id: 3,
    client: "Jennifer Davis",
    service: "Balayage",
    time: "1:00 PM",
    duration: "3h",
    stylist: "Sarah",
    status: "pending",
    price: 320,
  },
  {
    id: 4,
    client: "Lisa Wilson",
    service: "Haircut & Style",
    time: "2:30 PM",
    duration: "1h",
    stylist: "Michelle",
    status: "confirmed",
    price: 85,
  },
];

const recentOrders = [
  {
    id: "ORD-240111-A1B2",
    customer: "Samantha Lee",
    items: 3,
    total: 245,
    status: "ready",
  },
  {
    id: "ORD-240111-C3D4",
    customer: "Nicole Brown",
    items: 1,
    total: 89,
    status: "pending",
  },
  {
    id: "ORD-240110-E5F6",
    customer: "Rachel Green",
    items: 2,
    total: 156,
    status: "confirmed",
  },
];

const quickActions = [
  {
    name: "New Appointment",
    icon: CalendarPlus,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    href: "/appointments",
  },
  {
    name: "Add Client",
    icon: UserPlus,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    href: "/clients",
  },
  {
    name: "New Order",
    icon: ShoppingCart,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    href: "/orders",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const userName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Page Header */}
      <motion.div variants={item} className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{getGreeting()}, {userName}!</h1>
        <p className="text-muted-foreground">
          Here's what's happening at your salon today.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={stat.name} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.name}</p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {stat.changeType === "positive" && (
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                )}
                <span className={cn(
                  "text-sm",
                  stat.changeType === "positive" ? "text-emerald-600" : "text-muted-foreground"
                )}>
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href}>
              <Card
                className="group cursor-pointer hover:shadow-md transition-all duration-200 hover:border-teal-300"
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl transition-colors", action.bgColor, "group-hover:bg-teal-100")}>
                    <action.icon className={cn("w-6 h-6", action.color, "group-hover:text-teal-600")} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{action.name}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Pending Deposit Confirmations */}
      <motion.div variants={item}>
        <PendingConfirmations />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Appointments */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Today's Appointments</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {todayAppointments.length} appointments scheduled
                </p>
              </div>
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-accent/50 hover:bg-accent transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-teal-700">
                          {appointment.client.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{appointment.client}</p>
                        <Badge
                          variant={
                            appointment.status === "confirmed" ? "info" :
                            appointment.status === "in_progress" ? "warning" :
                            "secondary"
                          }
                          className="capitalize"
                        >
                          {appointment.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {appointment.service} with {appointment.stylist}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{appointment.time}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {appointment.duration}
                      </p>
                    </div>
                    <div className="text-right pl-4 border-l">
                      <p className="font-bold text-teal-600">
                        {formatCurrency(appointment.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Orders */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Orders</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Product orders & pickups
                </p>
              </div>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{order.customer}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.id} · {order.items} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(order.total)}</p>
                      <Badge
                        variant={
                          order.status === "ready" ? "purple" :
                          order.status === "confirmed" ? "info" :
                          "warning"
                        }
                        className="capitalize mt-1"
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-4">
                View All Orders
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Low Stock Alert */}
      <motion.div variants={item}>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">Low Stock Alert</h3>
                <p className="text-sm text-amber-700 mt-1">
                  5 products are running low on stock and need to be reordered soon.
                </p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                    View Products
                  </Button>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                    Reorder Now
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
