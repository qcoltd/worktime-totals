import { TableComponent, TableData } from '../../base/TableComponent';
import { MonthlyData } from '../../../types/MonthlyData';

export class OvertimeWeeklyTableComponent extends TableComponent {
  constructor(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    startRow: number,
    startColumn: number,
    private data: MonthlyData[],
    private startDate: Date,
    private endDate: Date
  ) {
    super(sheet, startRow, startColumn);
  }

  renderTable(): number {
    const employeeNames = Array.from(
      new Set(this.data.flatMap(month => 
        Array.from(month.monthly.employeeHours.keys())
      ))
    );
    
    const weeklyRows = this.data.flatMap(month => 
      month.weekly.filter(week => {
        const [yearMonth, weekNum] = week.date.split('-');
        const { start: weekStart, end: weekEnd } = this.getWeekDates(yearMonth, parseInt(weekNum));
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

    this.renderData(tableData);
    return this.getLastRow();
  }

  // 週番号から週の開始日と終了日を計算
  private getWeekDates(yearMonth: string, weekNum: number): { start: Date; end: Date } {
    const [year, month] = yearMonth.split('/').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    
    const firstSunday = new Date(firstDay);
    while (firstSunday.getDay() !== 0) {
      firstSunday.setDate(firstSunday.getDate() - 1);
    }

    const weekStart = new Date(firstSunday);
    weekStart.setDate(weekStart.getDate() + (weekNum - 1) * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return { start: weekStart, end: weekEnd };
  }
} 