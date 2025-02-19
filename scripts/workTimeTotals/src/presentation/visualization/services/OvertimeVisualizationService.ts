import { TableComponent, TableData } from '../components/TableComponent';
import { MonthlyData } from '../types/MonthlyData';
import { WorktimeError, ErrorCodes } from '../../../domain/error/WorktimeError';
import { OvertimeSummary } from '../../../application/OvertimeCalculationService';
import { OvertimeDataAdapter } from '../adapters/OvertimeDataAdapter';

export class OvertimeVisualizationService {
  constructor(
    private spreadsheetId: string,
    private startDate: Date,
    private endDate: Date
  ) {}

  visualize(monthlyData: OvertimeSummary[]): void {
    try {
      const spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
      
      // 現在時刻を取得してフォーマット
      const now = new Date();
      const timestamp = Utilities.formatDate(
        now,
        'Asia/Tokyo',
        'yyyyMMddHHmm'
      );
      const sheetName = `集計_${timestamp}`;

      // 新しいシートを作成
      const sheet = spreadsheet.insertSheet(sheetName, 3);

      // データをMonthlyData形式に変換してから処理
      const monthlyDataArray = OvertimeDataAdapter.toMonthlyData(monthlyData);
      
      // 月次テーブルを作成し、最終行を取得
      const lastRow = this.createMonthlyTable(sheet, monthlyDataArray);
      
      // 週次テーブルを1行空けて作成
      this.createWeeklyTable(sheet, monthlyDataArray, lastRow + 2);

    } catch (error) {
      throw new WorktimeError(
        'Failed to visualize overtime data',
        ErrorCodes.SHEET_ACCESS_ERROR,
        { error }
      );
    }
  }

  private createMonthlyTable(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    data: MonthlyData[]
  ): number {
    // 全ての月で共通の従業員名リストを作成
    const employeeNames = Array.from(
      new Set(data.flatMap(month => 
        Array.from(month.monthly.employeeHours.keys())
      ))
    );
    
    const tableData: TableData = {
      title: '残業時間 (月)',
      headers: ['日付', ...employeeNames, '平均', '合計'],
      rows: data.map(month => [
        month.monthly.date,
        ...employeeNames.map(name => month.monthly.employeeHours.get(name) || 0),
        month.monthly.average,
        month.monthly.total
      ])
    };

    const table = new TableComponent(sheet, 1, 1);
    table.render(tableData);

    return table.getLastRow();
  }

  // 週番号から週の開始日と終了日を計算
  private getWeekDates(yearMonth: string, weekNum: number): { start: Date; end: Date } {
    const [year, month] = yearMonth.split('/').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    
    // 月初めの日が属する週の日曜日を見つける
    const firstSunday = new Date(firstDay);
    while (firstSunday.getDay() !== 0) {  // 0は日曜日
      firstSunday.setDate(firstSunday.getDate() - 1);
    }

    // 該当週の開始日を計算
    const weekStart = new Date(firstSunday);
    weekStart.setDate(weekStart.getDate() + (weekNum - 1) * 7);

    // 該当週の終了日を計算
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);  // 土曜日まで

    return { start: weekStart, end: weekEnd };
  }

  private createWeeklyTable(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    data: MonthlyData[],
    startRow: number
  ): void {
    const employeeNames = Array.from(
      new Set(data.flatMap(month => 
        Array.from(month.monthly.employeeHours.keys())
      ))
    );
    
    // 期間内の週データのみをフィルタリング
    const weeklyRows = data.flatMap(month => 
      month.weekly.filter(week => {
        const [yearMonth, weekNum] = week.date.split('-');
        const { start: weekStart, end: weekEnd } = this.getWeekDates(yearMonth, parseInt(weekNum));

        // 週の開始日または終了日が集計期間内にあるかチェック
        return (weekStart <= this.endDate && weekEnd >= this.startDate);
      }).map(week => [
        week.date,
        ...employeeNames.map(name => week.employeeHours.get(name) || 0),
        week.average,
        week.total
      ])
    );

    const tableData: TableData = {
      title: '残業時間 (週)',
      headers: ['日付', ...employeeNames, '平均', '合計'],
      rows: weeklyRows
    };

    const table = new TableComponent(sheet, startRow, 1);
    table.render(tableData);
  }
} 