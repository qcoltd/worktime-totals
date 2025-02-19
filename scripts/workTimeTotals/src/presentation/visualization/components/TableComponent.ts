export interface TableData {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export class TableComponent {
  private lastRow: number = 0;

  constructor(
    private sheet: GoogleAppsScript.Spreadsheet.Sheet,
    private startRow: number,
    private startColumn: number
  ) {}

  render(data: TableData): void {
    // タイトル行を出力
    this.sheet.getRange(this.startRow, this.startColumn).setValue(data.title);
    
    // ヘッダー行を出力
    this.sheet.getRange(this.startRow + 1, this.startColumn, 1, data.headers.length)
      .setValues([data.headers]);

    // データ行を出力
    if (data.rows.length > 0) {
      this.sheet.getRange(
        this.startRow + 2,
        this.startColumn,
        data.rows.length,
        data.headers.length
      ).setValues(data.rows);
    }

    this.lastRow = this.startRow + data.rows.length + 1;  // 最終行を記録

    // 書式設定
    const dataRange = this.sheet.getRange(
      this.startRow,
      this.startColumn,
      data.rows.length + 2,
      data.headers.length
    );
    this.applyFormat(dataRange);
  }

  getLastRow(): number {
    return this.lastRow;
  }

  private applyFormat(range: GoogleAppsScript.Spreadsheet.Range): void {
    // タイトル行とヘッダー行は文字列として扱う
    const titleAndHeaderRows = this.sheet.getRange(
      range.getRow(),
      range.getColumn(),
      2,
      range.getNumColumns()
    );
    titleAndHeaderRows.setNumberFormat('@STRING@');

    // データ行がある場合のみ数値書式を適用
    if (range.getNumRows() > 2) {
      // データ行の数値セルに書式を適用
      const dataRange = this.sheet.getRange(
        range.getRow() + 2,
        range.getColumn() + 1,  // 日付列を除く
        range.getNumRows() - 2,
        range.getNumColumns() - 1
      );
      dataRange.setNumberFormat('#,##0.0');

      // データ行の日付列のみ文字列として扱う
      const dateColumn = this.sheet.getRange(
        range.getRow() + 2,
        range.getColumn(),
        range.getNumRows() - 2,
        1
      );
      dateColumn.setNumberFormat('@STRING@');
    }
    
    // 列幅の自動調整
    this.sheet.autoResizeColumns(range.getColumn(), range.getNumColumns());
  }
} 