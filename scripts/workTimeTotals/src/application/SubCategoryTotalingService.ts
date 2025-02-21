import { WorkEntry } from '../domain/workEntry/WorkEntry';
import { CategoryCalculator } from '../domain/category/CategoryCalculator';
import { dayjsLib } from '../libs/dayjs';
import { CategoryRepository } from '../domain/category/CategoryRepository';

interface SubCategoryTotal {
  subCategory: string;
  hours: number;
}

interface EmployeeSubCategoryTotals {
  name: string;
  totals: SubCategoryTotal[];
}

interface SubCategorySummary {
  mainCategories: string[];
  period: {
    startDate: string;
    endDate: string;
  };
  totalsBySubCategory: SubCategoryTotal[];
  employeeTotals: EmployeeSubCategoryTotals[];
}

export class SubCategoryTotalingService {
  /**
   * 指定期間の複数メインカテゴリに対するサブカテゴリ別作業時間サマリーを計算
   */
  calculateSummary(
    employeeEntries: Map<string, WorkEntry[]>,
    mainCategories: string[],
    startDate: Date,
    endDate: Date
  ): SubCategorySummary {
    // 全体の集計
    const totalsBySubCategory = this.calculateTotalsBySubCategory(
      Array.from(employeeEntries.values()).flat(),
      mainCategories
    );

    // 従業員ごとの集計
    const employeeTotals: EmployeeSubCategoryTotals[] = [];
    employeeEntries.forEach((entries, name) => {
      employeeTotals.push({
        name,
        totals: this.calculateTotalsBySubCategory(entries, mainCategories)
      });
    });

    return {
      mainCategories,
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
    mainCategories: string[]
  ): SubCategoryTotal[] {
    // 各メインカテゴリの集計結果をマージ
    const mergedTotals = new Map<string, number>();

    mainCategories.forEach(mainCategory => {
      const totals = CategoryCalculator.calculateTotalsBySubCategory(entries, mainCategory);
      totals.forEach((hours, subCategory) => {
        const current = mergedTotals.get(subCategory) || 0;
        mergedTotals.set(subCategory, current + hours);
      });
    });

    return Array.from(mergedTotals.entries()).map(([subCategory, hours]) => ({
      subCategory,
      hours
    }));
  }

  getSubCategories(): string[] {
    const categoryRepo = new CategoryRepository();
    return categoryRepo.subCategories;
  }
} 