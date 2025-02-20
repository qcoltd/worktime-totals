import { ChartComponent } from '../../base/ChartComponent';

export class OvertimeMonthlyChartComponent extends ChartComponent {
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

    // 2ヶ月以上のデータがあれば trueを返す
    // 見出し行、最初の1ヶ月分の行を合わせた2行よりも行数が多い場合を想定
    const hasMultipleMonths = dataRange.numRows > 2;

    // --- 総残業時間 を積み上げグラフ(棒グラフ)で出力 ---
    const columnChart = this.sheet
      .newChart()
      .addRange(chartRange)
      .asColumnChart()
      .setStacked() // 積み上げグラフにするために必要
      .setNumHeaders(1)
      .setOption('title', '総残業時間')
      .setTransposeRowsAndColumns(true) // 行列反転
      .setPosition(
        graphRowPosition,
        hasMultipleMonths ? dataRange.column + this.chartWidth : dataRange.column, // グラフを横並べした時に2番目に出力したい
        this._offsetX,
        this._offsetY,
      )
      .build();

    if (columnChart) {
      this.sheet.insertChart(columnChart);
    } else {
      throw new Error(`Not found columnChart for "総残業時間" graph.`);
    }

    // 折れ線グラフの出力は、2ヶ月以上のデータが存在する時のみ出力する。データが単月の場合は出力しない。
    if (hasMultipleMonths) {
      // --- 個別の残業時間（月）を折れ線グラフで出力 ---
      const lineChart = this.sheet
        .newChart()
        .addRange(chartRange)
        .asLineChart()
        .setNumHeaders(1)
        .setOption('title', '個別の残業時間(月)')
        .setOption('hAxis', { slantedTextAngle: 30 })
        .setOption('hAxis.gridlines.count', dataRange.numRows - 1) // 見出し行を除くため-1
        .setPosition(graphRowPosition, dataRange.column, this._offsetX, this._offsetY)
        .build();

      if (lineChart) {
        this.sheet.insertChart(lineChart);
      } else {
        throw new Error(`Not found lineChart for '個別の残業時間(月)' graph.`);
      }

      // --- 全体の残業時間（月）を折れ線グラフで出力 ---
      // 日付のカラムの範囲を取得
      const allChartRangeColumn = this.sheet.getRange(
        dataRange.row,
        dataRange.column,
        dataRange.numRows,
      );

      // 合計のカラムの範囲を取得
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
        .setOption('title', '全体の残業時間(月)')
        .setOption('hAxis', { slantedTextAngle: 30 })
        .setOption('hAxis.gridlines.count', dataRange.numRows - 1) // 見出し行を除くため-1
        .setPosition(
          graphRowPosition,
          dataRange.column + this.chartWidth * 2,
          this._offsetX,
          this._offsetY,
        )
        .build();

      if (allLineChart) {
        this.sheet.insertChart(allLineChart);
      } else {
        throw new Error(`Not found allLineChart for '全体の残業時間(月)' graph.`);
      }
    }
  }
} 