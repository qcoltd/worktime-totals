export interface TableData {
  title?: string;
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

    // タイトルの有無で開始行を調整
    const headerRow = data.title ? this.startRow + 1 : this.startRow;

    // タイトル行を出力（存在する場合のみ）
    if (data.title) {
      this.sheet.getRange(this.startRow, this.startColumn).setValue(data.title);
    }
    
    // ヘッダー行を出力
    this.sheet.getRange(headerRow, this.startColumn, 1, data.headers.length)
      .setValues([data.headers]);

    // データ行を出力
    if (data.rows.length > 0) {
      this.sheet.getRange(
        headerRow + 1,
        this.startColumn,
        data.rows.length,
        data.headers.length
      ).setValues(data.rows);
    }

    this.lastRow = headerRow + data.rows.length;

    // 書式設定
    const dataRange = this.sheet.getRange(
      data.title ? this.startRow : headerRow,  // タイトルがない場合はヘッダー行から
      this.startColumn,
      data.rows.length + (data.title ? 2 : 1),  // タイトルがない場合は1行減らす
      data.headers.length
    );
    this.applyFormat(dataRange, !!data.title);  // titleの有無を渡す
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

  private applyFormat(range: GoogleAppsScript.Spreadsheet.Range, hasTitle: boolean): void {
    // ヘッダー行は文字列として扱う
    const headerRow = this.sheet.getRange(
      hasTitle ? range.getRow() + 1 : range.getRow(),  // タイトルがある場合は1行下
      range.getColumn(),
      1,
      range.getNumColumns()
    );
    headerRow.setNumberFormat('@STRING@');

    // データ行の数値セルに書式を適用
    if (range.getNumRows() > 1) {
      const dataRange = this.sheet.getRange(
        headerRow.getRow() + 1,  // ヘッダー行の次から
        range.getColumn() + 1,  // 従業員名列を除く
        range.getNumRows() - (hasTitle ? 2 : 1),  // タイトルとヘッダー行 or ヘッダー行を除く
        range.getNumColumns() - 1  // 従業員名列を除く
      );
      dataRange.setNumberFormat('#,##0.0');
    }
  }
} 