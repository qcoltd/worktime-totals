export interface CategoryTotal {
  category: string;
  hours: number;
}

export interface EmployeeCategoryTotals {
  name: string;
  totals: CategoryTotal[];
}

export interface CategorySummary {
  period: {
    startDate: string;
    endDate: string;
  };
  totalsByCategory: CategoryTotal[];
  employeeTotals: EmployeeCategoryTotals[];
}

export interface MonthlyCategorySummary {
  month: string;  // YYYY/MM形式
  totalsByCategory: Array<{ category: string; hours: number }>;
  employeeTotals: Array<{
    name: string;
    totals: Array<{ category: string; hours: number }>;
  }>;
}

export interface CategoryRatioData {
  period: {
    startDate: string;
    endDate: string;
  };
  monthlySummaries: MonthlyCategorySummary[];
} 