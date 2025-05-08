import { TableComponent, TableData } from '../components/base/TableComponent';
import { MonthlyData } from '../types/MonthlyData';
import { WorktimeError, ErrorCodes } from '../../../domain/error/WorktimeError';
import { OvertimeSummary } from '../../../application/OvertimeCalculationService';
import { OvertimeDataAdapter } from '../adapters/OvertimeDataAdapter';
import { OvertimeMonthlyChartComponent } from '../components/charts/overtime/OvertimeMonthlyChartComponent';
import { OvertimeWeeklyChartComponent } from '../components/charts/overtime/OvertimeWeeklyChartComponent';
import { OvertimeMonthlyTableComponent } from '../components/tables/overtime/OvertimeMonthlyTableComponent';
import { OvertimeWeeklyTableComponent } from '../components/tables/overtime/OvertimeWeeklyTableComponent';

export class OvertimeVisualizationService {
  constructor(
    private startDate: Date,
    private endDate: Date
  ) {}

  visualize(monthlyData: OvertimeSummary[], sheet: GoogleAppsScript.Spreadsheet.Sheet): number {
    try {
      // データをMonthlyData形式に変換してから処理
      const monthlyDataArray = OvertimeDataAdapter.toMonthlyData(monthlyData);

      // 月次の可視化（テーブルとグラフ）を作成し、最終行を取得
      const monthlyLastRow = this.visualizeMonthlyOvertime(sheet, monthlyDataArray);

      // 週次の可視化（テーブルとグラフ）を2行空けて作成
      const weeklyLastRow = this.visualizeWeeklyOvertime(sheet, monthlyDataArray, monthlyLastRow + 2);

      return weeklyLastRow;
    } catch (error) {
      const e = new WorktimeError(
        'Failed to visualize overtime data',
        ErrorCodes.SHEET_ACCESS_ERROR,
        {
          message: error instanceof Error ? error.message : '不明なエラー'
        }
      );
      console.error(e.formatForLog());
      throw e;
    }
  }

  private visualizeMonthlyOvertime(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    data: MonthlyData[]
  ): number {
    const table = new OvertimeMonthlyTableComponent(sheet, 1, 1, data);
    const lastRow = table.renderTable();

    // テーブルの下にグラフを出力
    const chartComponent = new OvertimeMonthlyChartComponent(sheet);
    chartComponent.render({
      row: 2,
      column: 1,
      numRows: data.length + 1,
      numColumns: table.headers.length
    });

    // グラフの高さを考慮した最終行を返す
    return lastRow + chartComponent.chartHeight;
  }

  private visualizeWeeklyOvertime(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    data: MonthlyData[],
    startRow: number
  ): number {
    const table = new OvertimeWeeklyTableComponent(sheet, startRow, 1, data, this.startDate, this.endDate);
    const lastRow = table.renderTable();

    // テーブルの下にグラフを出力
    const chartComponent = new OvertimeWeeklyChartComponent(sheet);
    chartComponent.render({
      row: startRow + 1,  // ヘッダー行の位置
      column: 1,
      numRows: table.rows.length + 1,
      numColumns: table.headers.length
    });

    // グラフの高さを考慮した最終行を返す
    return lastRow + chartComponent.chartHeight;
  }
}