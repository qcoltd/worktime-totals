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