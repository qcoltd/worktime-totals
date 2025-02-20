import { ChartComponent } from '../../base/ChartComponent';

export class CategoryRatioChartComponent extends ChartComponent {
  private getChartPosition(baseRow: number, baseColumn: number, index: number): { row: number; column: number } {
    return {
      row: baseRow + 1, // テーブルの下に1行空けて配置
      column: baseColumn + (this.chartWidth * index) // グラフを横に並べて配置
    };
  }

  render(dataRange: {
    row: number;
    column: number;
    numRows: number;
    numColumns: number;
    month: string;
    index: number;
  }): void {
    const { row, column, numRows, numColumns, month, index } = dataRange;

    // 対象データ(例:2025/01)の行の位置
    const dateRow = row + 1 + index;

    // グラフ用の範囲（日付列を除く）
    const headerRange = this.sheet.getRange(row, column + 1, 1, numColumns);
    const chartRange = this.sheet.getRange(dateRow, column + 1, 1, numColumns);

    // グラフの位置を計算
    const position = this.getChartPosition(row + numRows, 1, index);

    const chart = this.sheet
      .newChart()
      .addRange(headerRange)
      .addRange(chartRange)
      .setChartType(Charts.ChartType.PIE)
      .setMergeStrategy(Charts.ChartMergeStrategy.MERGE_ROWS)
      .setTransposeRowsAndColumns(true)
      .setOption('title', `${month}の業務比率`)
      .setPosition(
        position.row,
        position.column,
        this._offsetX,
        this._offsetY,
      )
      .build();

    this.sheet.insertChart(chart);
  }
}
