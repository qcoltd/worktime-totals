export abstract class ChartComponent {
  constructor(
    protected sheet: GoogleAppsScript.Spreadsheet.Sheet,
    protected _offsetX: number = 5,
    protected _offsetY: number = 5,
    protected _chartWidth: number = 6,
  ) {}

  // グラフの縦幅を取得するためのgetter
  get chartHeight(): number {
    return 18; // 出力されるグラフの縦幅の大きさ 単位は行 テーブルを縦に並べて出力する時などに使用
  }

  // グラフの横幅を取得するためのgetter
  get chartWidth(): number {
    return this._chartWidth; // 出力されるグラフの横幅の大きさ 単位は列 テーブルを横に並べて出力する時などに使用
  }

  protected getChartPosition(
    baseRow: number,
    baseColumn: number,
    index: number,
  ): { row: number; column: number } {
    return {
      row: baseRow + 1, // テーブルの下に1行空けて配置
      column: baseColumn + this.chartWidth * index, // グラフを横に並べて配置
    };
  }

  protected abstract render(dataRange: {
    row: number;
    column: number;
    numRows: number;
    numColumns: number;
  }): void;
}
