import { SpreadsheetAdapter } from '../../infrastructure/SpreadsheetAdapter';
import { EmployeeSheet } from './EmployeeSheet';
import { WorktimeError, ErrorCodes } from '../error/WorktimeError';
import { TOTALING_SHEET } from '../../define';

export interface EmployeeSheetRepositoryInterface {
  findAll(): EmployeeSheet[];
}

export class EmployeeSheetRepository implements EmployeeSheetRepositoryInterface {
  private readonly adapter: SpreadsheetAdapter;

  constructor() {
    if (!TOTALING_SHEET.SS_ID) {
      throw new Error('Totaling sheet ID is not configured');
    }

    this.adapter = new SpreadsheetAdapter(
      TOTALING_SHEET.SS_ID,
      TOTALING_SHEET.SHEET_NAME.EMPLOYEE_LIST
    );
  }

  findAll(): EmployeeSheet[] {
    try {
      // シート名を設定
      this.adapter.setSheetName(TOTALING_SHEET.SHEET_NAME.EMPLOYEE_LIST);

      // 名前とURLを取得
      const names = this.adapter.getColumnValues(TOTALING_SHEET.COLUMNS.EMPLOYEE_LIST.NAME);
      const urls = this.adapter.getColumnValues(TOTALING_SHEET.COLUMNS.EMPLOYEE_LIST.SHEET_URL);

      // 空の行を除外して EmployeeSheet オブジェクトを作成
      return names.map((name, index) => {
        const url = urls[index];
        if (!name || !url) return null;

        return new EmployeeSheet({
          name: name.toString(),
          spreadsheetUrl: url.toString()
        });
      }).filter((sheet): sheet is EmployeeSheet => sheet !== null);

    } catch (error) {
      if (error instanceof WorktimeError) {
        throw error;
      }
      throw new WorktimeError(
        'Failed to fetch employee sheets',
        ErrorCodes.SHEET_ACCESS_ERROR,
        error
      );
    }
  }
} 