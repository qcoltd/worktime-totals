import { TableComponent, TableData } from '../../base/TableComponent';
import { CategoryRatioData } from '../../../../../domain/category/types';
import { CategoryRepository } from '../../../../../domain/category/CategoryRepository';

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

    const tableData: TableData = {
      title: '全体の業務比率',
      headers: ['日付', ...categories],
      rows: this.data.monthlySummaries.map(monthly => {
        const total = monthly.totalsByCategory.reduce((sum, t) => sum + t.hours, 0);
        
        // 各メインカテゴリの比率を計算（データがない場合は0%）
        const ratios = categories.map(category => {
          const categoryData = monthly.totalsByCategory.find(t => t.category === category);
          return categoryData 
            ? Math.round((categoryData.hours / total) * 1000) / 10
            : 0;
        });

        return [monthly.month, ...ratios];
      })
    };

    this.renderData(tableData);
    return this.getLastRow();
  }
} 