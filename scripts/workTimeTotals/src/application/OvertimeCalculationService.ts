import { OvertimeCalculator } from '../domain/overtime/OvertimeCalculator';
import { WorkEntry } from '../domain/workEntry/WorkEntry';
import { dayjsLib } from '../libs/dayjs';
import { WorktimeError, ErrorCodes } from '../domain/error/WorktimeError';

interface WeeklyOvertime {
  weekNumber: number;
  startDate: string;
  endDate: string;
  hours: number;
}

interface EmployeeOvertime {
  name: string;
  total: number;
  weekly: WeeklyOvertime[];
}

export interface OvertimeSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  total: number;
  average: number;
  weeklyAverages: Map<number, number>;
  employees: {
    name: string;
    total: number;
    weekly: {
      weekNumber: number;
      startDate: string;
      endDate: string;
      hours: number;
    }[];
  }[];
}

export class OvertimeCalculationService {
  /**
   * 月次の残業時間サマリーを計算
   */
  calculateMonthlySummary(
    employeeEntries: Map<string, WorkEntry[]>,
    targetDate: Date
  ): OvertimeSummary {
    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    return this.calculateSummary(employeeEntries, startDate, endDate);
  }

  /**
   * 週次の残業時間サマリーを計算
   */
  calculateWeeklySummary(
    employeeEntries: Map<string, WorkEntry[]>,
    weekNumber: number,
    targetDate: Date
  ): OvertimeSummary {
    const { startDate, endDate } = this.getWeekDates(weekNumber, targetDate);
    return this.calculateSummary(employeeEntries, startDate, endDate);
  }

  private calculateSummary(
    employeeEntries: Map<string, WorkEntry[]>,
    startDate: Date,
    endDate: Date
  ): OvertimeSummary {
    const employees: EmployeeOvertime[] = [];
    let totalOvertime = 0;

    // 従業員ごとの集計
    employeeEntries.forEach((entries, name) => {
      const weeklyOvertime = this.calculateWeeklyOvertime(entries, startDate, endDate);
      const total = weeklyOvertime.reduce((sum, week) => sum + week.hours, 0);

      employees.push({
        name,
        total,
        weekly: weeklyOvertime
      });

      totalOvertime += total;
    });

    // 週ごとの平均を計算
    const weeklyAverages = new Map<number, number>();
    const employeeCount = employeeEntries.size;

    if (employeeCount > 0) {
      employees.forEach(employee => {
        employee.weekly.forEach(week => {
          const current = weeklyAverages.get(week.weekNumber) || 0;
          weeklyAverages.set(
            week.weekNumber,
            current + (week.hours / employeeCount)
          );
        });
      });
    }

    return {
      period: {
        startDate: dayjsLib.formatDate(startDate),
        endDate: dayjsLib.formatDate(endDate)
      },
      employees,
      total: totalOvertime,
      average: employeeCount > 0 ? totalOvertime / employeeCount : 0,
      weeklyAverages
    };
  }

  private calculateWeeklyOvertime(
    entries: WorkEntry[],
    startDate: Date,
    endDate: Date
  ): WeeklyOvertime[] {
    const weeklyOvertime: WeeklyOvertime[] = [];
    const weeks = this.getWeeksInPeriod(startDate, endDate);

    weeks.forEach(({ weekNumber, start, end }) => {
      // その週の作業エントリーをフィルタリング
      const weekEntries = entries.filter(entry => {
        const entryDate = entry.date;
        return entryDate >= start && entryDate <= end;
      });

      const hours = OvertimeCalculator.calculateTotal(weekEntries);

      weeklyOvertime.push({
        weekNumber,
        startDate: dayjsLib.formatDate(start),
        endDate: dayjsLib.formatDate(end),
        hours
      });
    });

    return weeklyOvertime;
  }

  private getWeeksInPeriod(startDate: Date, endDate: Date): {
    weekNumber: number;
    start: Date;
    end: Date;
  }[] {
    const weeks: { weekNumber: number; start: Date; end: Date; }[] = [];
    let currentDate = new Date(startDate);
    let weekNumber = 1;

    while (currentDate <= endDate) {
      const weekStart = new Date(currentDate);
      // 週の終わりを計算（土曜日）
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + (6 - weekEnd.getDay()));

      // 月末を超えないように調整
      const adjustedEnd = weekEnd > endDate ? endDate : weekEnd;

      weeks.push({
        weekNumber,
        start: weekStart,
        end: adjustedEnd
      });

      // 次の週の開始日に移動
      currentDate = new Date(weekEnd);
      currentDate.setDate(currentDate.getDate() + 1);
      weekNumber++;
    }

    return weeks;
  }

  private getWeekDates(weekNumber: number, targetDate: Date): {
    startDate: Date;
    endDate: Date;
  } {
    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const weeks = this.getWeeksInPeriod(
      monthStart,
      new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
    );

    const targetWeek = weeks.find(week => week.weekNumber === weekNumber);
    if (!targetWeek) {
      const e = new WorktimeError(
        `Week ${weekNumber} not found in the month`,
        ErrorCodes.UNEXPECTED_ERROR
      );
      console.error(e.formatForLog());
      throw e;
    }

    return {
      startDate: targetWeek.start,
      endDate: targetWeek.end
    };
  }
}