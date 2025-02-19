// export class OvertimeMonthlyChartComponent {
//   constructor(
//     private sheet: GoogleAppsScript.Spreadsheet.Sheet,
//     private offsetX: number = 5,
//     private offsetY: number = 5,
//     private chartWidth: number = 6
//   ) {}

// }

export class OvertimeMonthlyChartComponent {
  constructor(
    private sheet: GoogleAppsScript.Spreadsheet.Sheet,
    private offsetX: number = 5, // グラフの縦幅の設定 単位はpixel
    private offsetY: number = 5, // グラフの横幅の設定 単位はpixel
    private chartWidth: number = 6, // 出力されるグラフの横幅の大きさ 単位は列 グラフを並べて出力する時などに使用
  ) {}

  private _spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;

  render(dataRange: { row: number; column: number; numRows: number; numColumns: number }) {
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
        this.offsetX,
        this.offsetY,
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
        .setPosition(graphRowPosition, dataRange.column, this.offsetX, this.offsetY)
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
          this.offsetX,
          this.offsetY,
        )
        .build();

      if (allLineChart) {
        this.sheet.insertChart(allLineChart);
      } else {
        throw new Error(`Not found allLineChart for '全体の残業時間(月)' graph.`);
      }
    }
  }

  /**
   * グラフを出力する 残業時間 (月)
   * @param sheetName グラフを出力するシート名
   * @param numRowsOfData 対象データのrowの数
   * @param numColumnOfData 対象データのcolumnの数(headerの数と同じ)
   */
  output = ({
    sheetName,
    numRowsOfData,
    numColumnOfData,
  }: {
    sheetName: string;
    numRowsOfData: number;
    numColumnOfData: number;
  }) => {
    console.info(`Output monthly overtime chart graph to the sheet ${sheetName}.`);
    const sheet = this._spreadsheet.getSheetByName(sheetName);
    const lastRow = sheet?.getLastRow() ?? 0;
    const dataRange = {
      row: lastRow - numRowsOfData + 2, // 最終行に出力されているテーブルの見出し行を指定
      column: 1, // 左端固定
      numRows: numRowsOfData - 1, // タイトル行(残業時間 (月) の行)は含めないので -1
      numColumuns: numColumnOfData - 1, // 合計のカラムは出力に含めないため -1
    };

    // lastRowで十分そうだが、実際に出力すると1行分ズレてしまうので調整した定数を定義
    const graphRowPosition = lastRow + 1;

    // データの範囲を取得
    const chartRange = sheet?.getRange(
      dataRange.row,
      dataRange.column,
      dataRange.numRows,
      dataRange.numColumuns,
    );

    if (!chartRange) {
      // const messeage = `Not found chartRange for "総残業時間" graph.`
      // console.error(messeage);
      throw new Error(`Not found chartRange for "総残業時間" graph.`);
    }

    // 2ヶ月以上のデータがあれば trueを返す
    // タイトル行、見出し行、最初の1ヶ月分の行を合わせた3行よりも行数が多い場合を想定
    const hasMultipleMonths = numRowsOfData > 3;

    // --- 総残業時間 を積み上げグラフ(棒グラフ)で出力 ---
    const columnChart = sheet
      ?.newChart()
      .addRange(chartRange)
      .asColumnChart()
      .setStacked() // 積み上げグラフにするために必要
      .setNumHeaders(1)
      .setOption('title', '総残業時間')
      .setTransposeRowsAndColumns(true) // 行列反転
      .setPosition(
        graphRowPosition,
        hasMultipleMonths ? dataRange.column + this.chartWidth : dataRange.column, // // グラフを横並べした時に2番目に出力したい
        this.offsetX,
        this.offsetY,
      )
      .build();

    if (columnChart) {
      sheet?.insertChart(columnChart);
    } else {
      const messeage = `Not found columnChart for "総残業時間" graph.`;
      console.error(messeage);
      throw new Error(messeage);
    }

    // 折れ線グラフの出力は、2ヶ月以上のデータが存在する時のみ出力する。データが単月の場合は出力しない。
    if (hasMultipleMonths) {
      // --- 個別の残業時間（月）を折れ線グラフで出力 ---
      const lineChart = sheet
        ?.newChart()
        .addRange(chartRange) // グラフ作成時のデータ範囲
        .asLineChart() //グラフの種類
        .setNumHeaders(1) // ヘッダーにする列の設定
        .setOption('title', '個別の残業時間(月)') // グラフタイトルの設定
        .setOption('hAxis', { slantedTextAngle: 30 }) // テキストの傾斜
        .setOption('hAxis.gridlines.count', dataRange.numRows - 1) // 横軸のグリッド数の指定 見出し行を除くため-1
        .setPosition(graphRowPosition, dataRange.column, this.offsetX, this.offsetY) // グラフを配置する場所
        .build(); // グラフのビルド

      if (lineChart) {
        sheet?.insertChart(lineChart);
      } else {
        throw new Error(`Not found lineChart for '個別の残業時間(月)' graph.`);
      }

      // --- 全体の残業時間（月）を折れ線グラフで出力 ---
      // 日付のカラムの範囲を取得
      const allChartRangeColumn = sheet?.getRange(
        dataRange.row,
        dataRange.column,
        dataRange.numRows,
      );

      // 合計のカラムの範囲を取得
      const allChartRangeRow = sheet?.getRange(
        dataRange.row,
        dataRange.numColumuns + 1, // ここでは合計カラムを取得したいので +1
        dataRange.numRows,
      );

      if (allChartRangeColumn && allChartRangeRow) {
        // 折れ線グラフを出力
        const allLineChart = sheet
          ?.newChart()
          .addRange(allChartRangeColumn)
          .addRange(allChartRangeRow)
          .asLineChart()
          .setNumHeaders(1)
          .setOption('title', '全体の残業時間(月)')
          .setOption('hAxis', { slantedTextAngle: 30 }) // テキストの傾斜
          .setOption('hAxis.gridlines.count', dataRange.numRows - 1) // 横軸のグリッド数の指定 見出し行を除くため-1
          .setPosition(
            graphRowPosition,
            dataRange.column + this.chartWidth * 2, // グラフを横並べした時に3番目に出力したい
            this.offsetX,
            this.offsetY,
          )
          .build();

        if (allLineChart) {
          sheet?.insertChart(allLineChart);
        } else {
          throw new Error(`Not found allLineChart for '全体の残業時間(月)' graph.`);
        }
      } else {
        throw new Error(
          `Not found allChartRangeColumn or allChartRangeRow for '全体の残業時間(月)' graph.`,
        );
      }
    }
  };
}
