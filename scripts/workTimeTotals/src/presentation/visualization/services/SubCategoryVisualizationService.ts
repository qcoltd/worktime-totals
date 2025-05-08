import { WorkEntry } from '../../../domain/workEntry/WorkEntry';
import { WorktimeError, ErrorCodes } from '../../../domain/error/WorktimeError';
import { SubCategoryTotalingService } from '../../../application/SubCategoryTotalingService';
import { dayjsLib } from '../../../libs/dayjs';
import { SubCategoryBarChartComponent } from '../components/charts/subcategory/SubCategoryBarChartComponent';
import { SubCategoryTableComponent } from '../components/tables/subcategory/SubCategoryTableComponent';

export class SubCategoryVisualizationService {
  constructor(
    private startDate: Date,
    private endDate: Date,
    private subCategoryService: SubCategoryTotalingService,
    private targetMainCategories: string[],
  ) {}

  visualize(
    entries: Map<string, WorkEntry[]>,
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    startRow: number = 1,
  ): number {
    try {
      // 集計期間と対象案件の行を追加
      const infoRow = [
        '集計開始日',
        dayjsLib.formatDate(this.startDate),
        '集計終了日',
        dayjsLib.formatDate(this.endDate),
        '対象案件',
        this.targetMainCategories.join(', '),
      ];
      sheet.getRange(startRow, 1, 1, infoRow.length).setValues([infoRow]);
      this.applyInfoRowStyles(sheet, startRow);

      // サブカテゴリの一覧を取得
      const subCategories = this.getUniqueSubCategories(entries);

      // テーブルの描画
      const table = new SubCategoryTableComponent(
        sheet,
        startRow + 2, // ヘッダー行の位置
        1,
        subCategories,
        entries,
      );
      const lastRow = table.renderTable();

      // グラフの描画
      const chart = new SubCategoryBarChartComponent(sheet);
      chart.render({
        row: startRow + 2, // ヘッダー行の位置
        column: 1,
        numRows: lastRow - (startRow + 2) + 1, // データ行数
        numColumns: subCategories.length + 1 + 1, // データ列数 + 従業員名列 + 合計列
      });

      return lastRow + chart.chartHeight;
    } catch (error) {
      const e = new WorktimeError(
        'Failed to visualize subcategory data',
        ErrorCodes.SHEET_ACCESS_ERROR,
        {
          message: error instanceof Error ? error.message : '不明なエラー'
        }
      );
      console.error(e.formatForLog());
      throw e;
    }
  }

  private getUniqueSubCategories(entries: Map<string, WorkEntry[]>): string[] {
    return this.subCategoryService.getSubCategories();
  }

  // 情報行のスタイル適用
  private applyInfoRowStyles(sheet: GoogleAppsScript.Spreadsheet.Sheet, startRow: number): void {
    sheet.getRange(startRow, 1).setBackground('#f3f3f3').setFontWeight('bold');
    sheet.getRange(startRow, 3).setBackground('#f3f3f3').setFontWeight('bold');
    sheet.getRange(startRow, 5).setBackground('#f3f3f3').setFontWeight('bold');
  }
}
