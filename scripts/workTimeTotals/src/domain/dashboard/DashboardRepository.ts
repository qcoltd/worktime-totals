import { WorktimeError, ErrorCodes } from '../error/WorktimeError';
import { DashboardSettings } from './DashboardSettings';
import { dayjsLib } from '../../libs/dayjs';
import { TOTALING_SHEET } from '../../define';

export class DashboardRepository {
  constructor(
    private spreadsheetId: string
  ) {}

  /**
   * ダッシュボードの設定を取得
   */
  getSettings(): DashboardSettings {
    try {
      const sheet = this.getSheet();

      // 日付の取得
      const startDateValue = sheet.getRange(TOTALING_SHEET.COLUMNS.DASHBOARD.START_DATE).getValue();
      const endDateValue = sheet.getRange(TOTALING_SHEET.COLUMNS.DASHBOARD.END_DATE).getValue();

      // プロジェクトリストの取得
      const projectsValue = sheet.getRange(TOTALING_SHEET.COLUMNS.DASHBOARD.PROJECTS).getValue();
      
      // 日付の変換
      const startDate = dayjsLib.parse(startDateValue).toDate();
      const endDate = dayjsLib.parse(endDateValue).toDate();

      // プロジェクトリストの変換（カンマ区切りを配列に）
      const targetProjects = projectsValue
        .toString()
        .split(',')
        .map(project => project.trim())
        .filter(project => project !== '');

      return {
        startDate,
        endDate,
        targetProjects
      };
    } catch (error) {
      throw new WorktimeError(
        'Failed to get dashboard settings',
        ErrorCodes.DASHBOARD_ERROR,
        { message: error instanceof Error ? error.message : '不明なエラー' }
      );
    }
  }

  private getSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
    const sheet = spreadsheet.getSheetByName(TOTALING_SHEET.SHEET_NAME.DASHBOARD);

    if (!sheet) {
      throw new WorktimeError(
        'Dashboard sheet not found',
        ErrorCodes.SHEET_NOT_FOUND,
        { sheetName: TOTALING_SHEET.SHEET_NAME.DASHBOARD }
      );
    }

    return sheet;
  }
} 