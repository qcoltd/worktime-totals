import { WorkEntry } from '@/scripts/workTimeTotals/src/domain/workEntry/WorkEntry';
import { TableComponent, TableData } from '../../base/TableComponent';

export class SubCategoryTableComponent extends TableComponent {
  private readonly subCategories: string[];
  private readonly entries: Map<string, WorkEntry[]>;

  constructor(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    startRow: number,
    startColumn: number,
    subCategories: string[],
    entries: Map<string, WorkEntry[]>
  ) {
    super(sheet, startRow, startColumn);
    this.subCategories = subCategories;
    this.entries = entries;
  }

  renderTable(): number {
    // データ行の作成
    const rows: (string | number)[][] = [];
    let totalsBySubCategory = new Map<string, number>();
    let grandTotal = 0;

    // 従業員ごとの集計データを作成
    this.entries.forEach((workEntries, employeeName) => {
      const row: (string | number)[] = [employeeName];
      let employeeTotal = 0;

      this.subCategories.forEach(subCategory => {
        const hours = workEntries
          .filter(entry => entry.subCategory === subCategory)
          .reduce((sum, entry) => sum + entry.calculateDuration(), 0);

        employeeTotal += hours;
        totalsBySubCategory.set(
          subCategory,
          (totalsBySubCategory.get(subCategory) || 0) + hours
        );

        row.push(hours);
      });

      grandTotal += employeeTotal;
      row.push(employeeTotal);
      rows.push(row);
    });

    // 合計行の追加
    const totalRow: (string | number)[] = ['合計'];
    this.subCategories.forEach(subCategory => {
      totalRow.push(totalsBySubCategory.get(subCategory) || 0);
    });
    totalRow.push(grandTotal);
    rows.push(totalRow);

    const tableData: TableData = {
      headers: ['従業員名', ...this.subCategories, '合計'],
      rows
    };

    this.renderData(tableData);
    this.applyTableStyles();  // スタイルを適用
    return this.getLastRow();
  }

  private applyTableStyles(): void {
    const range = this.sheet.getRange(
      this.startRow,
      this.startColumn,
      this.getLastRow() - this.startRow + 1,
      this._headers.length
    );

    // 全体の罫線
    range.setBorder(true, true, true, true, true, true);

    // ヘッダー行のスタイル（タイトルがない場合は startRow から）
    const headerRange = this.sheet.getRange(this.startRow, this.startColumn, 1, this._headers.length);
    headerRange.setBackground('#f3f3f3');
    headerRange.setFontWeight('bold');

    // 合計行のスタイル
    const totalRange = this.sheet.getRange(this.getLastRow(), this.startColumn, 1, this._headers.length);
    totalRange.setBackground('#f3f3f3');
    totalRange.setFontWeight('bold');
  }
} 