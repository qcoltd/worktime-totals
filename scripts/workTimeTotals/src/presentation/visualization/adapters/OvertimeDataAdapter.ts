import { OvertimeSummary } from '../../../application/OvertimeCalculationService';
import { MonthlyData } from '../types/MonthlyData';
import { dayjsLib } from '../../../libs/dayjs';

export class OvertimeDataAdapter {
  static toMonthlyData(summary: OvertimeSummary): MonthlyData {
    const yearMonth = dayjsLib.formatDate(new Date(summary.period.startDate), 'YYYY/MM');
    
    return {
      yearMonth,
      monthly: {
        date: yearMonth,
        employeeHours: new Map(summary.employees.map(emp => [emp.name, emp.total])),
        average: summary.average,
        total: summary.total
      },
      weekly: summary.employees[0]?.weekly.map(week => ({
        date: `${yearMonth}-${week.weekNumber}`,
        employeeHours: new Map(summary.employees.map(emp => [
          emp.name,
          emp.weekly.find(w => w.weekNumber === week.weekNumber)?.hours || 0
        ])),
        average: summary.weeklyAverages.get(week.weekNumber) || 0,
        total: summary.employees.reduce((sum, emp) => 
          sum + (emp.weekly.find(w => w.weekNumber === week.weekNumber)?.hours || 0), 0
        )
      })) || []
    };
  }
} 