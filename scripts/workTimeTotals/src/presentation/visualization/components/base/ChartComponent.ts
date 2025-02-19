export abstract class ChartComponent {
  constructor(
    protected sheet: GoogleAppsScript.Spreadsheet.Sheet,
    protected offsetX: number = 5,
    protected offsetY: number = 5,
    protected chartWidth: number = 6
  ) {}

  protected abstract render(dataRange: {
    row: number;
    column: number;
    numRows: number;
    numColumns: number;
  }): void;
} 