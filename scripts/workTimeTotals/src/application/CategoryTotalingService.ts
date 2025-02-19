import { WorkEntry } from '../domain/workEntry/WorkEntry';
import { dayjsLib } from '../libs/dayjs';
import { CategoryCalculator } from '../domain/category/CategoryCalculator';
import { CategoryTotal, CategorySummary, EmployeeCategoryTotals } from '../domain/category/types';

export class CategoryTotalingService {
  /**
   * 月次のカテゴリ別作業時間サマリーを計算
   */
  calculateMonthlySummary(
    employeeEntries: Map<string, WorkEntry[]>,
    targetDate: Date
  ): CategorySummary {
    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    // 全体の集計
    const totalsByCategory = this.calculateTotalsByCategory(
      Array.from(employeeEntries.values()).flat()
    );

    // 従業員ごとの集計
    const employeeTotals: EmployeeCategoryTotals[] = [];
    employeeEntries.forEach((entries, name) => {
      employeeTotals.push({
        name,
        totals: this.calculateTotalsByCategory(entries)
      });
    });

    return {
      period: {
        startDate: dayjsLib.formatDate(startDate),
        endDate: dayjsLib.formatDate(endDate)
      },
      totalsByCategory,
      employeeTotals
    };
  }

  private calculateTotalsByCategory(entries: WorkEntry[]): CategoryTotal[] {
    const totals = CategoryCalculator.calculateTotalsByCategory(entries);

    return Array.from(totals.entries()).map(([category, hours]) => ({
      category,
      hours
    }));
  }
} 