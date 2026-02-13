// app/api/expenses/[id]/route.ts
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// GET single expense
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requirePermission("viewExpenses");
    if (error) return error;

    const expense = await prisma.expense.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense" },
      { status: 500 }
    );
  }
}

// PUT update expense
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requirePermission("manageExpenses");
    if (error) return error;

    const existing = await prisma.expense.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const body = await request.json();
    const { category, description, amount, date, currency, notes } = body;

    if (!category || !description || !amount || !date) {
      return NextResponse.json(
        { error: "Category, description, amount, and date are required" },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        category,
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        currency: currency || "XCD",
        notes: notes || null,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

// DELETE expense
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requirePermission("manageExpenses");
    if (error) return error;

    const existing = await prisma.expense.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await prisma.expense.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
