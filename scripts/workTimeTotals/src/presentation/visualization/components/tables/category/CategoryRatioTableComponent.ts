import { TableComponent, TableData } from '../../base/TableComponent';
import { CategoryRatioData } from '../../../../../domain/category/types';
import { CategoryRepository } from '../../../../../domain/category/CategoryRepository';
import { getElementsAtIndices } from '../../../../../utils/utils';
export class CategoryRatioTableComponent extends TableComponent {
  constructor(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    startRow: number,
    startColumn: number,
    private data: CategoryRatioData
  ) {
    super(sheet, startRow, startColumn);
  }

  renderTable(): number {
    // メインカテゴリ一覧をヘッダーとして使用
    const categoryRepo = new CategoryRepository();
    const categories = categoryRepo.mainCategories;
    const headers = ['日付', ...categories]; // rowDataが0列に日付を付けているので合わせる

    const rowData = this.data.monthlySummaries.map(monthly => {
      const total = monthly.totalsByCategory.reduce((sum, t) => sum + t.hours, 0);

      // 各メインカテゴリの比率を計算（データがない場合は0%）
      const ratios = categories.map(category => {
        const categoryData = monthly.totalsByCategory.find(t => t.category === category);
        return categoryData
          ? Math.round((categoryData.hours / total) * 1000) / 10
          : 0;
      });

      return [monthly.month, ...ratios];
    });

    // 全員0のプロジェクトは除外する
    const includeProjectIndexes = headers.reduce((acc, category, projectIndex) => {
      const categoryValues = rowData.map(row => {
        return row[projectIndex];
      });
      const allzero = categoryValues.every(value => value === 0);
      if (allzero) {
        return acc;
      }
      acc.push(projectIndex);
      return acc;
    }, [] as number[]);

    console.log('includeProjectIndexes' , includeProjectIndexes);
    const headersContainingValues = getElementsAtIndices(headers, includeProjectIndexes);
    const rowsContainingValues = rowData.map(row => {
      return getElementsAtIndices(row, includeProjectIndexes);
    });

    const tableData: TableData = {
      title: '全体の業務比率',
      headers: headersContainingValues,
      rows: rowsContainingValues,
    };

    this.renderData(tableData);
    return this.getLastRow();
  }
}
