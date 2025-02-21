import { ChartComponent } from '../../base/ChartComponent';

interface SubCategoryChartData {
  employeeNames: string[];
  subCategories: string[];
  values: number[][];
}

export class SubCategoryBarChartComponent extends ChartComponent {
  render(dataRange: { row: number; column: number; numRows: number; numColumns: number }): void {
    console.log('=== SubCategoryBarChartComponent.render ===');
    console.log('入力パラメータ:', JSON.stringify(dataRange));

    // ラベル（従業員名）の範囲を取得
    const labelRange = this.sheet.getRange(dataRange.row, dataRange.column, dataRange.numRows, 1);
    console.log('ラベル範囲:', `${dataRange.row}, ${dataRange.column}, ${dataRange.numRows}, 1`);
    console.log('ラベルの値:', labelRange.getValues());

    // データ範囲
    const chartRange = this.sheet.getRange(
      dataRange.row, // データ開始行
      dataRange.column, // 従業員名列から
      dataRange.numRows, // 全行（合計行含む）
      dataRange.numColumns - 1, // 合計のカラムは出力に含めないため -1
    );
    console.log(
      'データ範囲:',
      `${dataRange.row}, ${dataRange.column}, ${dataRange.numRows}, ${dataRange.numColumns - 1}`,
    );
    console.log('データの値:', chartRange.getValues());

    const columnChart = this.sheet
      .newChart()
      .addRange(chartRange)
      .asBarChart()
      .setStacked()
      .setNumHeaders(1)
      .setPosition(
        dataRange.row + dataRange.numRows + 1,
        dataRange.column,
        this._offsetX,
        this._offsetY,
      )
      .setOption('title', 'サブカテゴリ別作業時間')
      .setOption('legend', { position: 'right' })
      .setOption('series', Object.fromEntries(
        Array.from({ length: chartRange.getNumColumns() - 1 }, (_, i) => [
          i.toString(),
          { 
            dataLabel: "value",
            hasAnnotations: true,
          }
        ])
      ))
      .build();

    if (columnChart) {
      this.sheet.insertChart(columnChart);
    } else {
      throw new Error(`Not found columnChart for "サブカテゴリ別作業時間" graph.`);
    }
  }
}
