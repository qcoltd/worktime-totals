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
    const date = dayjsLib.parse(targetDate);
    const startDate = date.set('date', 1).toDate();
    const endDate = date.endOf('month').toDate();

    // 対象月のエントリーのみをフィルタリング
    const filteredEntries = new Map<string, WorkEntry[]>();
    employeeEntries.forEach((entries, name) => {
      const monthlyEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      });
      filteredEntries.set(name, monthlyEntries);
    });

    // 全体の集計
    const totalsByCategory = this.calculateTotalsByCategory(
      Array.from(filteredEntries.values()).flat()
    );

    // 従業員ごとの集計
    const employeeTotals: EmployeeCategoryTotals[] = [];
    filteredEntries.forEach((entries, name) => {
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