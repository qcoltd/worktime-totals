import { TableComponent, TableData } from '../../base/TableComponent';
import { MonthlyData } from '../../../types/MonthlyData';

export class OvertimeMonthlyTableComponent extends TableComponent {
  constructor(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    startRow: number,
    startColumn: number,
    private data: MonthlyData[]
  ) {
    super(sheet, startRow, startColumn);
  }

  renderTable(): number {
    // 全ての月で共通の従業員名リストを作成
    const employeeNames = Array.from(
      new Set(this.data.flatMap(month => 
        Array.from(month.monthly.employeeHours.keys())
      ))
    );
    
    const tableData: TableData = {
      title: '残業時間 (月)',
      headers: ['日付', ...employeeNames, '平均', '合計'],
      rows: this.data.map(month => [
        month.monthly.date,
        ...employeeNames.map(name => month.monthly.employeeHours.get(name) || 0),
        month.monthly.average,
        month.monthly.total
      ])
    };

    this.renderData(tableData);
    return this.getLastRow();
  }
} 