export interface MonthlyData {
  yearMonth: string;
  monthly: {
    date: string;
    employeeHours: Map<string, number>;
    average: number;
    total: number;
  };
  weekly: {
    date: string;
    employeeHours: Map<string, number>;
    average: number;
    total: number;
  }[];
} 