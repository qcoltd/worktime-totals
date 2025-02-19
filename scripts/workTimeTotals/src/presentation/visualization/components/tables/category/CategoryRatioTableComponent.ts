import { TableComponent, TableData } from '../../base/TableComponent';
import { CategorySummary } from '../../../../../domain/category/types';
import { dayjsLib } from '../../../../../libs/dayjs';

interface CategoryRatioData extends Pick<CategorySummary, 'period' | 'totalsByCategory'> {}

export class CategoryRatioTableComponent extends TableComponent {
  constructor(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    startRow: number,
    startColumn: number,
    private data: CategoryRatioData
  ) {
    super(sheet, startRow, startColumn);
  }

  renderTable(): number {
    const categories = this.data.totalsByCategory.map(total => total.category);
    const total = this.data.totalsByCategory.reduce((sum, total) => sum + total.hours, 0);

    // 月ごとの比率を計算
    const monthlyRatios: (string | number)[][] = [];
    let currentDate = new Date(this.data.period.startDate);
    const endDate = new Date(this.data.period.endDate);

    while (currentDate <= endDate) {
      const monthlyTotal = this.data.totalsByCategory.reduce((sum, total) => sum + total.hours, 0);
      const ratios = this.data.totalsByCategory.map(categoryTotal => {
        return Math.round((categoryTotal.hours / monthlyTotal) * 1000) / 10; // 小数点1位まで
      });

      monthlyRatios.push([
        dayjsLib.formatDate(currentDate, 'YYYY/MM'),
        ...ratios
      ]);

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    const tableData: TableData = {
      title: '全体の業務比率',
      headers: ['日付', ...categories],
      rows: monthlyRatios
    };

    this.renderData(tableData);
    return this.getLastRow();
  }
} 