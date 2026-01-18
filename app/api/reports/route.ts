// app/api/reports/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = session.user.businessId;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "month";

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Determine date filter based on range
    let dateFilter: Date;
    switch (range) {
      case "today":
        dateFilter = today;
        break;
      case "week":
        dateFilter = weekStart;
        break;
      case "year":
        dateFilter = yearStart;
        break;
      default:
        dateFilter = monthStart;
    }

    // ============================================
    // APPOINTMENTS DATA
    // ============================================
    const allAppointments = await prisma.appointment.findMany({
      where: { businessId },
      include: { services: true, client: true },
    });

    const appointmentsThisMonth = allAppointments.filter(
      a => a.requestedDate >= monthStart && a.status === "COMPLETED"
    );
    const appointmentsLastMonth = allAppointments.filter(
      a => a.requestedDate >= lastMonthStart && a.requestedDate < monthStart && a.status === "COMPLETED"
    );
    const appointmentsToday = allAppointments.filter(
      a => a.requestedDate >= today && a.requestedDate < tomorrow
    );
    const appointmentsThisWeek = allAppointments.filter(
      a => a.requestedDate >= weekStart
    );
    const appointmentsInRange = allAppointments.filter(
      a => a.requestedDate >= dateFilter && a.status === "COMPLETED"
    );

    // Calculate revenue
    const revenueThisMonth = appointmentsThisMonth.reduce((sum, apt) => 
      sum + apt.services.reduce((s, svc) => s + Number(svc.price), 0), 0
    );
    const revenueLastMonth = appointmentsLastMonth.reduce((sum, apt) => 
      sum + apt.services.reduce((s, svc) => s + Number(svc.price), 0), 0
    );

    const appointmentStats = {
      today: appointmentsToday.length,
      thisWeek: appointmentsThisWeek.length,
      completed: appointmentsThisWeek.filter(a => a.status === "COMPLETED").length,
      cancelled: appointmentsThisWeek.filter(a => a.status === "CANCELLED").length,
      noShow: appointmentsThisWeek.filter(a => a.status === "NO_SHOW").length,
    };

    // ============================================
    // ORDERS DATA
    // ============================================
    const allOrders = await prisma.order.findMany({
      where: { businessId },
      include: { items: true, client: true },
    });

    const ordersToday = allOrders.filter(
      o => o.createdAt >= today && o.createdAt < tomorrow && o.status === "COMPLETED"
    ).length;
    const ordersThisWeek = allOrders.filter(
      o => o.createdAt >= weekStart && o.status === "COMPLETED"
    ).length;
    const ordersInRange = allOrders.filter(
      o => o.createdAt >= dateFilter && o.status === "COMPLETED" && o.paymentStatus === "PAID"
    );
    const orderRevenue = ordersInRange.reduce((sum, order) => sum + Number(order.total), 0);

    // ============================================
    // CLIENTS DATA
    // ============================================
    const allClients = await prisma.client.findMany({
      where: { businessId },
      orderBy: { totalSpent: "desc" },
    });

    const topSpenders = allClients.slice(0, 5).map(c => ({
      name: `${c.firstName} ${c.lastName}`,
      totalSpent: Number(c.totalSpent),
      visits: c.totalVisits,
      isVip: c.isVip,
    }));

    // ============================================
    // TOP SERVICES (manual aggregation)
    // ============================================
    const serviceCount: Record<string, { count: number; revenue: number }> = {};
    appointmentsInRange.forEach(apt => {
      apt.services.forEach(svc => {
        if (!serviceCount[svc.serviceName]) {
          serviceCount[svc.serviceName] = { count: 0, revenue: 0 };
        }
        serviceCount[svc.serviceName].count += 1;
        serviceCount[svc.serviceName].revenue += Number(svc.price);
      });
    });

    const topServices = Object.entries(serviceCount)
      .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // ============================================
    // TOP PRODUCTS (manual aggregation)
    // ============================================
    const productCount: Record<string, { sold: number; revenue: number }> = {};
    ordersInRange.forEach(order => {
      order.items.forEach(item => {
        if (!productCount[item.productName]) {
          productCount[item.productName] = { sold: 0, revenue: 0 };
        }
        productCount[item.productName].sold += item.quantity;
        productCount[item.productName].revenue += Number(item.lineTotal);
      });
    });

    const topProducts = Object.entries(productCount)
      .map(([name, data]) => ({ name, sold: data.sold, revenue: data.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // ============================================
    // RECENT ACTIVITY
    // ============================================
    const recentAppointments = allAppointments
      .filter(a => a.status === "COMPLETED")
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 3);

    const recentOrders = allOrders
      .filter(o => o.status === "COMPLETED")
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 3);

    const recentActivity = [
      ...recentAppointments.map((apt) => ({
        type: "appointment",
        description: `${apt.client?.firstName || "Client"} - Appointment completed`,
        amount: apt.services.reduce((s, svc) => s + Number(svc.price), 0),
        time: formatTimeAgo(apt.updatedAt),
      })),
      ...recentOrders.map((order) => ({
        type: "order",
        description: `Order #${order.orderNumber} completed`,
        amount: Number(order.total),
        time: formatTimeAgo(order.updatedAt),
      })),
    ].slice(0, 5);

    // ============================================
    // SALES DATA
    // ============================================
    const byPaymentMethod = {
      cash: ordersInRange.filter(o => o.paymentMethod === "CASH").reduce((s, o) => s + Number(o.total), 0),
      card: ordersInRange.filter(o => o.paymentMethod === "CARD").reduce((s, o) => s + Number(o.total), 0),
      transfer: ordersInRange.filter(o => o.paymentMethod === "TRANSFER").reduce((s, o) => s + Number(o.total), 0),
    };

    // Revenue by service category
    const allServices = await prisma.service.findMany({
      where: { businessId },
      include: { category: true },
    });

    const categoryRevenue: Record<string, { revenue: number; count: number }> = {};
    appointmentsInRange.forEach(apt => {
      apt.services.forEach(svc => {
        const service = allServices.find(s => s.name === svc.serviceName);
        const categoryName = service?.category?.name || "Uncategorized";
        if (!categoryRevenue[categoryName]) {
          categoryRevenue[categoryName] = { revenue: 0, count: 0 };
        }
        categoryRevenue[categoryName].revenue += Number(svc.price);
        categoryRevenue[categoryName].count += 1;
      });
    });

    const byCategory = Object.entries(categoryRevenue)
      .map(([category, data]) => ({ category, revenue: data.revenue, count: data.count }))
      .sort((a, b) => b.revenue - a.revenue);

    // Average ticket
    const avgAppointment = appointmentsInRange.length > 0
      ? appointmentsInRange.reduce((sum, apt) => 
          sum + apt.services.reduce((s, svc) => s + Number(svc.price), 0), 0
        ) / appointmentsInRange.length
      : 0;

    const avgOrder = ordersInRange.length > 0
      ? orderRevenue / ordersInRange.length
      : 0;

    const totalTransactions = appointmentsInRange.length + ordersInRange.length;
    const totalRevenue = appointmentsInRange.reduce((sum, apt) => 
      sum + apt.services.reduce((s, svc) => s + Number(svc.price), 0), 0
    ) + orderRevenue;
    const avgOverall = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Busiest days
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayStats: Record<number, { appointments: number; revenue: number }> = {};
    for (let i = 0; i < 7; i++) {
      dayStats[i] = { appointments: 0, revenue: 0 };
    }
    appointmentsInRange.forEach(apt => {
      const day = apt.requestedDate.getDay();
      dayStats[day].appointments += 1;
      dayStats[day].revenue += apt.services.reduce((s, svc) => s + Number(svc.price), 0);
    });
    const busiestDays = dayNames.map((day, index) => ({
      day,
      appointments: dayStats[index].appointments,
      revenue: dayStats[index].revenue,
    }));

    // ============================================
    // INVENTORY DATA
    // ============================================
    const products = await prisma.product.findMany({
      where: { businessId, isActive: true },
      orderBy: { name: "asc" },
    });

    const inventoryProducts = products.map(p => {
      const available = p.stockOnHand - p.stockReserved;
      let status: "ok" | "low" | "out" = "ok";
      if (available <= 0) status = "out";
      else if (available <= p.reorderLevel) status = "low";

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        stockOnHand: p.stockOnHand,
        stockReserved: p.stockReserved,
        reorderLevel: p.reorderLevel,
        costPrice: Number(p.costPrice),
        retailPrice: Number(p.retailPrice),
        value: Number(p.costPrice) * p.stockOnHand,
        status,
      };
    });

    const totalValue = inventoryProducts.reduce((sum, p) => sum + p.value, 0);
    const retailValue = inventoryProducts.reduce((sum, p) => sum + (p.retailPrice * p.stockOnHand), 0);
    const lowStockCount = inventoryProducts.filter(p => p.status === "low").length;
    const outOfStockCount = inventoryProducts.filter(p => p.status === "out").length;

    // Product movements
    const productMovements: Record<string, { productId: string; sold: number; revenue: number }> = {};
    ordersInRange.forEach(order => {
      order.items.forEach(item => {
        if (!productMovements[item.productName]) {
          productMovements[item.productName] = { productId: item.productId, sold: 0, revenue: 0 };
        }
        productMovements[item.productName].sold += item.quantity;
        productMovements[item.productName].revenue += Number(item.lineTotal);
      });
    });

    const movements = Object.entries(productMovements).map(([name, data]) => {
      const product = products.find(p => p.id === data.productId);
      const costPrice = product ? Number(product.costPrice) : 0;
      const cost = costPrice * data.sold;
      const profit = data.revenue - cost;
      const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
      return { product: name, sold: data.sold, revenue: data.revenue, profit, margin };
    }).sort((a, b) => b.revenue - a.revenue);

    // ============================================
    // STYLIST PERFORMANCE
    // ============================================
    const allStylists = await prisma.stylist.findMany({
      where: { businessId, isActive: true },
    });

    const stylistData = allStylists.map(stylist => {
      const stylistAppointments = allAppointments.filter(
        a => a.stylistId === stylist.id && a.requestedDate >= dateFilter
      );
      const completed = stylistAppointments.filter(a => a.status === "COMPLETED");
      const cancelled = stylistAppointments.filter(a => a.status === "CANCELLED");
      const noShow = stylistAppointments.filter(a => a.status === "NO_SHOW");

      const revenue = completed.reduce((sum, apt) => 
        sum + apt.services.reduce((s, svc) => s + Number(svc.price), 0), 0
      );

      const avgTicket = completed.length > 0 ? revenue / completed.length : 0;
      const completionRate = stylistAppointments.length > 0 
        ? (completed.length / stylistAppointments.length) * 100 
        : 0;

      // Top services for this stylist
      const stylistServiceCount: Record<string, number> = {};
      completed.forEach(apt => {
        apt.services.forEach(svc => {
          stylistServiceCount[svc.serviceName] = (stylistServiceCount[svc.serviceName] || 0) + 1;
        });
      });

      const stylistTopServices = Object.entries(stylistServiceCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      return {
        id: stylist.id,
        name: `${stylist.firstName} ${stylist.lastName}`,
        appointments: stylistAppointments.length,
        completed: completed.length,
        cancelled: cancelled.length,
        noShow: noShow.length,
        revenue,
        averageTicket: avgTicket,
        completionRate,
        topServices: stylistTopServices,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // ============================================
    // TODAY/WEEK REVENUE
    // ============================================
    const todayApptsRevenue = allAppointments
      .filter(a => a.requestedDate >= today && a.requestedDate < tomorrow && a.status === "COMPLETED")
      .reduce((sum, apt) => sum + apt.services.reduce((s, svc) => s + Number(svc.price), 0), 0);
    const todayOrdersRevenue = allOrders
      .filter(o => o.createdAt >= today && o.createdAt < tomorrow && o.status === "COMPLETED" && o.paymentStatus === "PAID")
      .reduce((sum, o) => sum + Number(o.total), 0);
    const revenueToday = todayApptsRevenue + todayOrdersRevenue;

    const weekApptsRevenue = allAppointments
      .filter(a => a.requestedDate >= weekStart && a.status === "COMPLETED")
      .reduce((sum, apt) => sum + apt.services.reduce((s, svc) => s + Number(svc.price), 0), 0);
    const weekOrdersRevenue = allOrders
      .filter(o => o.createdAt >= weekStart && o.status === "COMPLETED" && o.paymentStatus === "PAID")
      .reduce((sum, o) => sum + Number(o.total), 0);
    const revenueThisWeek = weekApptsRevenue + weekOrdersRevenue;

    // ============================================
    // RETURN COMPLETE DATA
    // ============================================
    return NextResponse.json({
      revenue: {
        today: revenueToday,
        thisWeek: revenueThisWeek,
        thisMonth: revenueThisMonth + orderRevenue,
        lastMonth: revenueLastMonth,
      },
      appointments: appointmentStats,
      orders: {
        today: ordersToday,
        thisWeek: ordersThisWeek,
        totalRevenue: orderRevenue,
      },
      clients: {
        total: allClients.length,
        newThisMonth: allClients.filter(c => c.createdAt >= monthStart).length,
        returning: allClients.filter(c => c.totalVisits > 1).length,
        topSpenders,
      },
      topServices,
      topProducts,
      recentActivity,
      sales: {
        byPaymentMethod,
        byCategory,
        averageTicket: {
          appointments: avgAppointment,
          orders: avgOrder,
          overall: avgOverall,
        },
        busiestDays,
      },
      inventory: {
        totalProducts: products.length,
        totalValue,
        retailValue,
        lowStockCount,
        outOfStockCount,
        potentialProfit: retailValue - totalValue,
        products: inventoryProducts,
        movements,
      },
      stylists: stylistData,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports", details: String(error) },
      { status: 500 }
    );
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
