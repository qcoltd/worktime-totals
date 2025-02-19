export abstract class ChartComponent {
  constructor(
    protected sheet: GoogleAppsScript.Spreadsheet.Sheet,
    protected offsetX: number = 5,
    protected offsetY: number = 5,
    protected chartWidth: number = 6
  ) {}

  // グラフの縦幅を取得するためのgetter
  get chartHeight(): number {
    return 18; // 出力されるグラフの縦幅の大きさ 単位は行 テーブルを縦に並べて出力する時などに使用
  }

  protected abstract render(dataRange: {
    row: number;
    column: number;
    numRows: number;
    numColumns: number;
  }): void;
} 