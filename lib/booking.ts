// lib/booking.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Generate unique booking reference like BK-A7X9K2
export function generateBookingReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars (I, O, 0, 1)
  let reference = "BK-";
  for (let i = 0; i < 6; i++) {
    reference += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return reference;
}

// Calculate deposit amount based on business settings
export function calculateDeposit(
  totalPrice: number | Prisma.Decimal,
  depositType: string,
  depositAmount: number | Prisma.Decimal | null,
  depositPercentage: number
): number {
  const price = typeof totalPrice === "object" ? Number(totalPrice) : totalPrice;
  
  if (depositType === "fixed" && depositAmount !== null) {
    const amount = typeof depositAmount === "object" ? Number(depositAmount) : depositAmount;
    return Math.min(amount, price); // Don't exceed total price
  }
  
  // Percentage
  return Math.round((price * depositPercentage / 100) * 100) / 100;
}

// Calculate payment deadline based on appointment date and deadline hours
export function calculatePaymentDeadline(
  appointmentDate: Date,
  deadlineHours: number
): Date {
  const deadline = new Date(appointmentDate);
  deadline.setHours(deadline.getHours() - deadlineHours);
  return deadline;
}

// Create notification for business
export async function createNotification(
  businessId: string,
  type: string,
  title: string,
  message: string,
  data?: object,
  isUrgent: boolean = false
) {
  return prisma.notification.create({
    data: {
      businessId,
      type: type as any,
      title,
      message,
      data: data || undefined,
      isUrgent,
    },
  });
}

// Format currency
export function formatCurrency(
  amount: number | Prisma.Decimal,
  currencySymbol: string = "$"
): string {
  const num = typeof amount === "object" ? Number(amount) : amount;
  return `${currencySymbol}${num.toFixed(2)}`;
}

// Check if deposit deadline is approaching (within 30 minutes)
export function isDeadlineApproaching(deadline: Date): boolean {
  const now = new Date();
  const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
  return deadline.getTime() - now.getTime() <= thirtyMinutes && deadline > now;
}

// Check if deposit deadline has passed
export function isDeadlinePassed(deadline: Date): boolean {
  return new Date() > deadline;
}
