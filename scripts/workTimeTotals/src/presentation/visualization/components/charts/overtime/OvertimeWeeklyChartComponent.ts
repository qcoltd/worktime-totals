import { ChartComponent } from '../../base/ChartComponent';

export class OvertimeWeeklyChartComponent extends ChartComponent {
  render(dataRange: { row: number; column: number; numRows: number; numColumns: number }): void {
    // データの範囲を取得
    const chartRange = this.sheet.getRange(
      dataRange.row,
      dataRange.column,
      dataRange.numRows,
      dataRange.numColumns - 1, // 合計のカラムは出力に含めないため -1
    );

    // グラフの開始位置を計算（テーブルの最終行の次の行）
    const graphRowPosition = dataRange.row + dataRange.numRows;

    // --- 個別の残業時間（週）を折れ線グラフで出力 ---
    const lineChart = this.sheet
      .newChart()
      .addRange(chartRange)
      .asLineChart()
      .setNumHeaders(1)
      .setOption('title', '残業時間(週)')
      .setOption('hAxis', { slantedTextAngle: 30 })
      .setOption('hAxis.gridlines.count', dataRange.numRows - 1)
      .setPosition(graphRowPosition, dataRange.column, this._offsetX, this._offsetY)
      .build();

    if (lineChart) {
      this.sheet.insertChart(lineChart);
    } else {
      throw new Error(`Not found lineChart for '残業時間(週)' graph.`);
    }

    // --- 全体の残業時間（週）を折れ線グラフで出力 ---
    // 日付のカラムと合計カラムの範囲を取得
    const allChartRangeColumn = this.sheet.getRange(
      dataRange.row,
      dataRange.column,
      dataRange.numRows,
    );

    const allChartRangeRow = this.sheet.getRange(
      dataRange.row,
      dataRange.column + dataRange.numColumns - 1, // 合計カラムの位置
      dataRange.numRows,
    );

    // 折れ線グラフを出力
    const allLineChart = this.sheet
      .newChart()
      .addRange(allChartRangeColumn)
      .addRange(allChartRangeRow)
      .asLineChart()
      .setNumHeaders(1)
      .setOption('title', '残業時間の合計(週)')
      .setOption('hAxis', { slantedTextAngle: 30 })
      .setOption('hAxis.gridlines.count', dataRange.numRows - 1)
      .setPosition(
        graphRowPosition,
        dataRange.column + this._chartWidth,
        this._offsetX,
        this._offsetY,
      )
      .build();

    if (allLineChart) {
      this.sheet.insertChart(allLineChart);
    } else {
      throw new Error(`Not found allLineChart for '残業時間の合計(週)' graph.`);
    }
  }
} 