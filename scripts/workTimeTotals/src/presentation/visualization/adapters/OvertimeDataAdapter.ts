import { MonthlyData } from '../types/MonthlyData';
import { OvertimeSummary } from '../../../application/OvertimeCalculationService';
import { dayjsLib } from '../../../libs/dayjs';

export class OvertimeDataAdapter {
  static toMonthlyData(summary: OvertimeSummary[]): MonthlyData[] {
    return summary.map(monthSummary => {
      const yearMonth = dayjsLib.formatDate(new Date(monthSummary.period.startDate), 'YYYY/MM');
      
      return {
        yearMonth,
        monthly: {
          date: yearMonth,
          employeeHours: new Map(monthSummary.employees.map(emp => [emp.name, emp.total])),
          average: monthSummary.average,
          total: monthSummary.total
        },
        weekly: monthSummary.employees[0]?.weekly.map(week => ({
          date: `${yearMonth}-${week.weekNumber}`,
          employeeHours: new Map(monthSummary.employees.map(emp => [
            emp.name,
            emp.weekly.find(w => w.weekNumber === week.weekNumber)?.hours || 0
          ])),
          average: monthSummary.weeklyAverages.get(week.weekNumber) || 0,
          total: monthSummary.employees.reduce((sum, emp) => 
            sum + (emp.weekly.find(w => w.weekNumber === week.weekNumber)?.hours || 0), 0
          )
        })) || []
      };
    });
  }
} 