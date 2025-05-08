import { WorkEntry } from '../../../domain/workEntry/WorkEntry';
import { WorktimeError, ErrorCodes } from '../../../domain/error/WorktimeError';
import { CategoryTotalingService } from '../../../application/CategoryTotalingService';
import { CategoryRatioTableComponent } from '../components/tables/category/CategoryRatioTableComponent';
import { dayjsLib } from '../../../libs/dayjs';
import { MonthlyCategorySummary, CategoryRatioData } from '../../../domain/category/types';
import { CategoryRatioChartComponent } from '../components/charts/category/CategoryRatioChartComponent';
import { CategoryEmployeeRatioTableComponent } from '../components/tables/category/CategoryEmployeeRatioTableComponent';
import { CategoryEmployeeRatioChartComponent } from '../components/charts/category/CategoryEmployeeRatioChartComponent';

export class CategoryVisualizationService {
  constructor(
    private startDate: Date,
    private endDate: Date,
    private categoryTotalingService: CategoryTotalingService,
  ) {}

  visualize(
    entriesForOvertime: Map<string, WorkEntry[]>,
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    startRow: number,
  ): void {
    try {
      // 全体の業務比率の月次データを作成
      const ratioData = this.createRatioData(entriesForOvertime);

      // 全体の業務比率の月次データの可視化（テーブルとグラフ）を作成し、最終行を取得
      const totalRatioLastRow = this.visualizeTotalRatio(sheet, ratioData, startRow);

      // 従業員別の業務比率の可視化（テーブル）を1行空けて作成
      this.visualizeEmployeeRatio(sheet, ratioData, totalRatioLastRow + 1);
    } catch (error) {
      const e = new WorktimeError(
        'Failed to visualize category data',
        ErrorCodes.SHEET_ACCESS_ERROR,
        {
          message: error instanceof Error ? error.message : '不明なエラー'
        }
      );
      console.error(e.formatForLog());
      throw e;
    }
  }

  private createRatioData(entriesForOvertime: Map<string, WorkEntry[]>): CategoryRatioData {
    const monthlySummaries: MonthlyCategorySummary[] = [];
    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);

    while (startDate <= endDate) {
      const summary = this.categoryTotalingService.calculateMonthlySummary(
        entriesForOvertime,
        startDate,
      );

      monthlySummaries.push({
        month: dayjsLib.formatDate(startDate, 'YYYY/MM'),
        totalsByCategory: summary.totalsByCategory,
        employeeTotals: summary.employeeTotals,
      });

      startDate.setMonth(startDate.getMonth() + 1);
    }

    return {
      period: {
        startDate: dayjsLib.formatDate(this.startDate),
        endDate: dayjsLib.formatDate(endDate),
      },
      monthlySummaries,
    };
  }

  private visualizeTotalRatio(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    ratioData: CategoryRatioData,
    startRow: number,
  ): number {
    // テーブルの出力
    const ratioTable = new CategoryRatioTableComponent(sheet, startRow, 1, ratioData);
    const tableLastRow = ratioTable.renderTable();

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

    // グラフの高さを考慮した最終行を返す
    return tableLastRow + chartComponent.chartHeight;
  }

  private visualizeEmployeeRatio(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    ratioData: CategoryRatioData,
    startRow: number,
  ): void {
    let currentRow = startRow;
    ratioData.monthlySummaries.forEach((monthly) => {
      try {
        console.log('\n=== 従業員別業務比率の可視化 ===');
        console.log('月:', monthly.month);
        console.log('開始行:', currentRow);

        // テーブルの出力
        const employeeTable = new CategoryEmployeeRatioTableComponent(
          sheet,
          currentRow + 1,
          1,
          ratioData,
          monthly.month,
        );
        const tableLastRow = employeeTable.renderTable();
        console.log('テーブル最終行:', tableLastRow);
        console.log('テーブルデータ:', employeeTable.rows.length);
        console.log('テーブルヘッダー:', employeeTable.headers.length);

        // グラフの出力
        const chartComponent = new CategoryEmployeeRatioChartComponent(sheet);
        monthly.employeeTotals.forEach((employee, index) => {
          console.log(`\n従業員グラフ作成: ${employee.name} (${index + 1}/${monthly.employeeTotals.length})`);
          chartComponent.render({
            row: currentRow + 2,
            column: 1,
            numRows: employeeTable.rows.length,
            numColumns: employeeTable.headers.length,
            month: monthly.month,
            employeeName: employee.name,
            index,
          });
        });

        currentRow = tableLastRow + chartComponent.chartHeight;
        console.log('次の開始行:', currentRow);
      } catch (error) {
        console.error('エラー発生月:', monthly.month);
        console.error('エラー詳細:', error);
        const e = new WorktimeError(
          'Failed to visualize employee ratio',
          ErrorCodes.SHEET_ACCESS_ERROR,
          {
            message: `${monthly.month}の処理中にエラーが発生: ${error instanceof Error ? error.message : '不明なエラー'}`
          }
        );
        console.error(e.formatForLog());
        throw e;
      }
    });
  }
}
