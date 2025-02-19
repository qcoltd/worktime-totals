export interface TableData {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export abstract class TableComponent {
  protected lastRow: number = 0;
  protected _headers: string[] = [];
  protected _rows: (string | number)[][] = [];

  constructor(
    protected sheet: GoogleAppsScript.Spreadsheet.Sheet,
    protected startRow: number,
    protected startColumn: number
  ) {}

  abstract renderTable(): number;

  protected renderData(data: TableData): void {
    // データを保存
    this._headers = data.headers;
    this._rows = data.rows;

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

    this.lastRow = this.startRow + data.rows.length + 1;

    // 書式設定
    const dataRange = this.sheet.getRange(
      this.startRow,
      this.startColumn,
      data.rows.length + 2,
      data.headers.length
    );
    this.applyFormat(dataRange);
  }

  get headers(): string[] {
    return this._headers;
  }

  get rows(): (string | number)[][] {
    return this._rows;
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
    }
  }
} 