// lib/date-ranges.ts
// Shared date range utility for P&L and Payroll APIs

export interface DateRange {
  from: Date;
  to: Date;
  prevFrom: Date;
  prevTo: Date;
  label: string;
}

export function getDateRange(
  period: string,
  dateFrom?: string,
  dateTo?: string
): DateRange {
  const now = new Date();

  if (period === "custom" && dateFrom && dateTo) {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    const duration = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime() - 1);
    prevTo.setHours(23, 59, 59, 999);
    const prevFrom = new Date(prevTo.getTime() - duration);
    prevFrom.setHours(0, 0, 0, 0);
    return {
      from,
      to,
      prevFrom,
      prevTo,
      label: `${from.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${to.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    };
  }

  if (period === "lastMonth") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const prevFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const prevTo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      0,
      23,
      59,
      59,
      999
    );
    return {
      from,
      to,
      prevFrom,
      prevTo,
      label: from.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };
  }

  if (period === "quarter") {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const from = new Date(now.getFullYear(), currentQuarter * 3, 1);
    const to = new Date(
      now.getFullYear(),
      currentQuarter * 3 + 3,
      0,
      23,
      59,
      59,
      999
    );
    const prevFrom = new Date(
      now.getFullYear(),
      (currentQuarter - 1) * 3,
      1
    );
    const prevTo = new Date(
      now.getFullYear(),
      currentQuarter * 3,
      0,
      23,
      59,
      59,
      999
    );
    const qNum = currentQuarter + 1;
    return {
      from,
      to,
      prevFrom,
      prevTo,
      label: `Q${qNum} ${now.getFullYear()}`,
    };
  }

  if (period === "lastQuarter") {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const lastQ = currentQuarter - 1;
    const year = lastQ < 0 ? now.getFullYear() - 1 : now.getFullYear();
    const q = lastQ < 0 ? 3 : lastQ;
    const from = new Date(year, q * 3, 1);
    const to = new Date(year, q * 3 + 3, 0, 23, 59, 59, 999);
    const prevQ = q - 1;
    const prevYear = prevQ < 0 ? year - 1 : year;
    const pq = prevQ < 0 ? 3 : prevQ;
    const prevFrom = new Date(prevYear, pq * 3, 1);
    const prevTo = new Date(prevYear, pq * 3 + 3, 0, 23, 59, 59, 999);
    return {
      from,
      to,
      prevFrom,
      prevTo,
      label: `Q${q + 1} ${year}`,
    };
  }

  if (period === "ytd") {
    const from = new Date(now.getFullYear(), 0, 1);
    const to = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );
    const prevFrom = new Date(now.getFullYear() - 1, 0, 1);
    const prevTo = new Date(
      now.getFullYear() - 1,
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );
    return {
      from,
      to,
      prevFrom,
      prevTo,
      label: `Jan 1 – Today, ${now.getFullYear()}`,
    };
  }

  if (period === "year") {
    const from = new Date(now.getFullYear(), 0, 1);
    const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    const prevFrom = new Date(now.getFullYear() - 1, 0, 1);
    const prevTo = new Date(
      now.getFullYear() - 1,
      11,
      31,
      23,
      59,
      59,
      999
    );
    return {
      from,
      to,
      prevFrom,
      prevTo,
      label: `${now.getFullYear()}`,
    };
  }

  // Default: this month
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  const prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevTo = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999
  );
  return {
    from,
    to,
    prevFrom,
    prevTo,
    label: now.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
  };
}
