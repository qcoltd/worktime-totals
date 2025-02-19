import { WorkEntry } from '../../../domain/workEntry/WorkEntry';
import { WorktimeError, ErrorCodes } from '../../../domain/error/WorktimeError';
import { CategoryTotalingService } from '../../../application/CategoryTotalingService';
import { CategoryRatioTableComponent } from '../components/tables/category/CategoryRatioTableComponent';
import { dayjsLib } from '../../../libs/dayjs';
import { MonthlyCategorySummary, CategoryRatioData } from '../../../domain/category/types';

export class CategoryVisualizationService {
  constructor(
    private startDate: Date,
    private categoryTotalingService: CategoryTotalingService
  ) {}

  visualize(entriesForOvertime: Map<string, WorkEntry[]>, sheet: GoogleAppsScript.Spreadsheet.Sheet, startRow: number): void {
    try {
      // 月ごとの集計データを作成
      const monthlySummaries: MonthlyCategorySummary[] = [];
      let currentDate = new Date(this.startDate);
      const endDate = new Date(this.startDate);
      endDate.setFullYear(this.startDate.getFullYear(), this.startDate.getMonth() + 2, 0);  // 翌月末に修正

      while (currentDate <= endDate) {
        const summary = this.categoryTotalingService.calculateMonthlySummary(
          entriesForOvertime,
          currentDate
        );

        monthlySummaries.push({
          month: dayjsLib.formatDate(currentDate, 'YYYY/MM'),
          totalsByCategory: summary.totalsByCategory
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      const ratioData: CategoryRatioData = {
        period: {
          startDate: dayjsLib.formatDate(this.startDate),
          endDate: dayjsLib.formatDate(endDate)
        },
        monthlySummaries
      };

      const ratioTable = new CategoryRatioTableComponent(sheet, startRow, 1, ratioData);
      ratioTable.renderTable();
    } catch (error) {
      throw new WorktimeError(
        'Failed to visualize category data',
        ErrorCodes.SHEET_ACCESS_ERROR,
        { error }
      );
    }
  }
} 