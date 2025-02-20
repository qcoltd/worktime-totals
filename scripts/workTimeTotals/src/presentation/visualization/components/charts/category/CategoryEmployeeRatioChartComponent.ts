import { ChartComponent } from '../../base/ChartComponent';

export class CategoryEmployeeRatioChartComponent extends ChartComponent {
  render(dataRange: {
    row: number;
    column: number;
    numRows: number;
    numColumns: number;
    month: string;
    employeeName: string;
    index: number;
  }): void {
    const { row, column, numRows, numColumns, month, employeeName, index } = dataRange;

    try {
      console.log('=== CategoryEmployeeRatioChartComponent.render ===');
      console.log('データ範囲:', JSON.stringify(dataRange));

      // グラフ用の範囲（従業員名列を除く）
      const headerRange = this.sheet.getRange(row, column + 1, 1, numColumns - 1);
      console.log('ヘッダー範囲:', `${row}, ${column + 1}, 1, ${numColumns - 1}`);

      const chartRange = this.sheet.getRange(row + 1 + index, column + 1, 1, numColumns - 1);
      console.log('データ範囲:', `${row + 1 + index}, ${column + 1}, 1, ${numColumns - 1}`);

      // グラフの位置を計算
      const position = this.getChartPosition(row + numRows, 1, index);
      console.log('グラフ位置:', JSON.stringify(position));

      const chart = this.sheet
        .newChart()
        .addRange(headerRange)
        .addRange(chartRange)
        .setChartType(Charts.ChartType.PIE)
        .setMergeStrategy(Charts.ChartMergeStrategy.MERGE_ROWS)
        .setTransposeRowsAndColumns(true)
        .setOption('title', `${month} ${employeeName}の業務比率`)
        .setPosition(position.row, position.column, this._offsetX, this._offsetY)
        .build();

      this.sheet.insertChart(chart);
    } catch (error) {
      console.error('グラフ作成エラー:', error);
      console.error('エラー発生場所: CategoryEmployeeRatioChartComponent.render');
      throw error;
    }
  }
}
