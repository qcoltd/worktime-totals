import { WorkEntry } from '../../../domain/workEntry/WorkEntry';
import { WorktimeError, ErrorCodes } from '../../../domain/error/WorktimeError';
import { CategoryTotalingService } from '../../../application/CategoryTotalingService';
import { CategoryRatioTableComponent } from '../components/tables/category/CategoryRatioTableComponent';
import { dayjsLib } from '../../../libs/dayjs';
import { MonthlyCategorySummary, CategoryRatioData } from '../../../domain/category/types';
import { CategoryRatioChartComponent } from '../components/charts/category/CategoryRatioChartComponent';

export class CategoryVisualizationService {
  constructor(
    private startDate: Date,
    private endDate: Date,
    private categoryTotalingService: CategoryTotalingService
  ) {}

  visualize(entriesForOvertime: Map<string, WorkEntry[]>, sheet: GoogleAppsScript.Spreadsheet.Sheet, startRow: number): void {
    try {
      // 月ごとの集計データを作成
      const monthlySummaries: MonthlyCategorySummary[] = [];
      const startDate = new Date(this.startDate);
      const endDate = new Date(this.endDate);

      while (startDate <= endDate) {
        const summary = this.categoryTotalingService.calculateMonthlySummary(
          entriesForOvertime,
          startDate
        );

        monthlySummaries.push({
          month: dayjsLib.formatDate(startDate, 'YYYY/MM'),
          totalsByCategory: summary.totalsByCategory
        });

        startDate.setMonth(startDate.getMonth() + 1);
      }

      const ratioData: CategoryRatioData = {
        period: {
          startDate: dayjsLib.formatDate(this.startDate),
          endDate: dayjsLib.formatDate(endDate)
        },
        monthlySummaries
      };

      // テーブルの出力
      const ratioTable = new CategoryRatioTableComponent(sheet, startRow, 1, ratioData);
      const lastRow = ratioTable.renderTable();

      // 月ごとに円グラフを出力
      const chartComponent = new CategoryRatioChartComponent(sheet);
      ratioData.monthlySummaries.forEach((monthly, index) => {
        chartComponent.render({
          row: startRow + 1,
          column: 1,
          numRows: ratioTable.rows.length,
          numColumns: ratioTable.headers.length,
          month: monthly.month,
          index,
        });
      });

    } catch (error) {
      throw new WorktimeError(
        'Failed to visualize category data',
        ErrorCodes.SHEET_ACCESS_ERROR,
        { error }
      );
    }
  }
} 