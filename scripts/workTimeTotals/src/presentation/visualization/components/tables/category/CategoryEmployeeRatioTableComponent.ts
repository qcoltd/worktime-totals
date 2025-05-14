import { TableComponent, TableData } from '../../base/TableComponent';
import { CategoryRatioData } from '../../../../../domain/category/types';
import { CategoryRepository } from '../../../../../domain/category/CategoryRepository';
import { getElementsAtIndices } from '@/scripts/workTimeTotals/src/utils/utils';

export class CategoryEmployeeRatioTableComponent extends TableComponent {
  private readonly data: CategoryRatioData;
  private readonly month: string;

  constructor(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    startRow: number,
    startColumn: number,
    data: CategoryRatioData,
    month: string,
  ) {
    super(sheet, startRow, startColumn);
    this.data = data;
    this.month = month;
  }

  renderTable(): number {
    // タイトル行の出力
    this.sheet.getRange(this.startRow, this.startColumn).setValue(`個別業務比率: ${this.month}`);

    // 対象月のデータを取得
    const monthlySummary = this.data.monthlySummaries.find(summary => summary.month === this.month);
    if (!monthlySummary) return this.startRow;

    // メインカテゴリ一覧をヘッダーとして使用
    const categoryRepo = new CategoryRepository();
    const categories = categoryRepo.mainCategories;

    // ヘッダー行の作成
    const headers = ['従業員名', ...categories];
    const headerRange = this.sheet.getRange(this.startRow + 1, this.startColumn, 1, headers.length);
    headerRange.setValues([headers]);

    // 従業員データの出力
    const employeeData = monthlySummary.employeeTotals.map(employee => {
      const hours = categories.map(category => {
        const employeeTotal = employee.totals.find(total => total.category === category);
        return employeeTotal?.hours || 0;
      });
      return [employee.name, ...hours];
    });

    if (employeeData.length > 0) {
      const dataRange = this.sheet.getRange(
        this.startRow + 2,
        this.startColumn,
        employeeData.length,
        headers.length
      );
      dataRange.setValues(employeeData);
    }

    // 全員0のプロジェクトは除外する
    const includeProjectIndexes = headers.reduce((acc, project, projectIndex) => {
      const categoryValues = employeeData.map(row => {
        return row[projectIndex];
      });
      const allzero = categoryValues.every(value => value === 0);
      if (allzero) {
        return acc;
      }
      acc.push(projectIndex);
      return acc;
    }, [] as number[]);

    console.log('CategoryEmployeeRatioTableComponent includeProjectIndexes' , includeProjectIndexes);
    const headersContainingValues = getElementsAtIndices(headers, includeProjectIndexes);
    console.log('🚀 ~ headersContainingValues:', headersContainingValues)
    const rowsContainingValues = employeeData.map(row => {
      return getElementsAtIndices(row, includeProjectIndexes);
    });
    console.log(rowsContainingValues);


    const tableData: TableData = {
      title: '個別業務比率２',
      headers: headersContainingValues,
      rows: rowsContainingValues
    };

    console.log('tableData');
    console.log(tableData);
    console.log('rendering ')
    this.renderData(tableData);

    // 最終行を返す
    return this.startRow + 2 + employeeData.length;
  }
}