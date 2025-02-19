import { ErrorCodes, WorktimeError } from "../error/WorktimeError";
import { CATEGORY_MASTER } from "../../define";
import { SpreadsheetAdapter } from "../../infrastructure/SpreadsheetAdapter";

export interface CategoryRepositoryInterface {
  get mainCategories(): string[];
  get subCategories(): string[];
}

export class CategoryRepository implements CategoryRepositoryInterface {
  private readonly mainAdapter: SpreadsheetAdapter;
  private readonly subAdapter: SpreadsheetAdapter;

  constructor() {
    if (!CATEGORY_MASTER.MAIN.SS_ID || !CATEGORY_MASTER.SUB.SS_ID) {
      throw new Error('Spreadsheet IDs are not configured');
    }

    this.mainAdapter = new SpreadsheetAdapter(
      CATEGORY_MASTER.MAIN.SS_ID,
      CATEGORY_MASTER.SHEET_NAMES[0] // デフォルトシート
    );
    this.subAdapter = new SpreadsheetAdapter(
      CATEGORY_MASTER.SUB.SS_ID,
      CATEGORY_MASTER.SHEET_NAMES[0] // デフォルトシート
    );
  }

  get mainCategories(): string[] {
    return this.getUniqueCategories(this.mainAdapter);
  }

  get subCategories(): string[] {
    return this.getUniqueCategories(this.subAdapter);
  }

  private getUniqueCategories(adapter: SpreadsheetAdapter): string[] {
    try {
      // 全シートからカテゴリを収集
      const allCategories = CATEGORY_MASTER.SHEET_NAMES.flatMap(sheetName => {
        // シートを切り替え
        adapter.setSheetName(sheetName);
        
        // A列のデータを取得
        const values = adapter.getColumnValues('A');
        
        // 空の値を除外して返す
        return values
          .map(value => value?.toString().trim())
          .filter(value => value !== '');
      });

      // 重複を削除してソート
      return [...new Set(allCategories)].sort();

    } catch (error) {
      if (error instanceof WorktimeError) {
        throw error;
      }
      throw new WorktimeError(
        'Failed to fetch categories',
        ErrorCodes.SHEET_ACCESS_ERROR,
        error
      );
    }
  }
} 