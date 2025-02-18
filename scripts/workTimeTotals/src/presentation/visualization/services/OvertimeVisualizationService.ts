import { TableComponent, TableData } from '../components/TableComponent';
import { MonthlyData } from '../types/MonthlyData';
import { WorktimeError, ErrorCodes } from '../../../domain/error/WorktimeError';

export class OvertimeVisualizationService {
  constructor(
    private spreadsheetId: string
  ) {}

  visualize(monthlyData: MonthlyData): void {
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

      // 月次データの表を作成
      this.createMonthlyTable(sheet, monthlyData);

      // 週次データの表を作成
      this.createWeeklyTable(sheet, monthlyData);

    } catch (error) {
      throw new WorktimeError(
        'Failed to visualize overtime data',
        ErrorCodes.SHEET_ACCESS_ERROR,
        { error, yearMonth: monthlyData.yearMonth }
      );
    }
  }

  private createMonthlyTable(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    data: MonthlyData
  ): void {
    const employeeNames: string[] = Array.from(data.monthly.employeeHours.keys());
    
    const tableData: TableData = {
      title: '残業時間 (月)',
      headers: ['日付', ...employeeNames, '平均', '合計'],
      rows: [[
        data.monthly.date,
        ...employeeNames.map(name => data.monthly.employeeHours.get(name) || 0),
        data.monthly.average,
        data.monthly.total
      ]]
    };

    const table = new TableComponent(sheet, 1, 1);
    table.render(tableData);
  }

  private createWeeklyTable(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    data: MonthlyData
  ): void {
    const employeeNames: string[] = Array.from(data.monthly.employeeHours.keys());
    
    const tableData: TableData = {
      title: '残業時間 (週)',
      headers: ['日付', ...employeeNames, '平均', '合計'],
      rows: data.weekly.map(week => [
        week.date,
        ...employeeNames.map(name => week.employeeHours.get(name) || 0),
        week.average,
        week.total
      ])
    };

    const table = new TableComponent(sheet, 5, 1);
    table.render(tableData);
  }
} 