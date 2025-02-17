import { WorkEntry } from '../domain/workEntry/WorkEntry';
import { CategoryCalculator } from '../domain/category/CategoryCalculator';
import { dayjsLib } from '../libs/dayjs';
interface SubCategoryTotal {
  subCategory: string;
  hours: number;
}

interface EmployeeSubCategoryTotals {
  name: string;
  totals: SubCategoryTotal[];
}

interface SubCategorySummary {
  mainCategory: string;
  period: {
    startDate: string;
    endDate: string;
  };
  totalsBySubCategory: SubCategoryTotal[];
  employeeTotals: EmployeeSubCategoryTotals[];
}

export class SubCategoryTotalingService {
  /**
   * 指定期間のサブカテゴリ別作業時間サマリーを計算
   */
  calculateSummary(
    employeeEntries: Map<string, WorkEntry[]>,
    mainCategory: string,
    startDate: Date,
    endDate: Date
  ): SubCategorySummary {
    // 全体の集計
    const totalsBySubCategory = this.calculateTotalsBySubCategory(
      Array.from(employeeEntries.values()).flat(),
      mainCategory
    );

    // 従業員ごとの集計
    const employeeTotals: EmployeeSubCategoryTotals[] = [];
    employeeEntries.forEach((entries, name) => {
      employeeTotals.push({
        name,
        totals: this.calculateTotalsBySubCategory(entries, mainCategory)
      });
    });

    return {
      mainCategory,
      period: {
        startDate: dayjsLib.formatDate(startDate),
        endDate: dayjsLib.formatDate(endDate)
      },
      totalsBySubCategory,
      employeeTotals
    };
  }

  private calculateTotalsBySubCategory(
    entries: WorkEntry[],
    mainCategory: string
  ): SubCategoryTotal[] {
    const totals = CategoryCalculator.calculateTotalsBySubCategory(entries, mainCategory);

    return Array.from(totals.entries()).map(([subCategory, hours]) => ({
      subCategory,
      hours
    }));
  }
} 