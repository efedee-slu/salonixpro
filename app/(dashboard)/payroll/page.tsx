// app/(dashboard)/payroll/page.tsx
"use client";

import { motion } from "framer-motion";
import { DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PayrollPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
        <p className="text-muted-foreground">
          Manage stylist wages, commissions, and payroll runs.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="p-4 rounded-full bg-teal-50 mb-4">
            <DollarSign className="w-10 h-10 text-teal-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Payroll management is under development. You&apos;ll be able to
            track wages, commissions, and generate payslips here.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
