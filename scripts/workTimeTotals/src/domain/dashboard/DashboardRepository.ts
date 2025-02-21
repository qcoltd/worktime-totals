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

  /**
   * ダッシュボードシートを初期化（存在しない場合は作成）
   */
  initializeSheet(): void {
    try {
      const spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
      let sheet = spreadsheet.getSheetByName(TOTALING_SHEET.SHEET_NAME.DASHBOARD);

      if (!sheet) {
        sheet = spreadsheet.insertSheet(TOTALING_SHEET.SHEET_NAME.DASHBOARD);
        
        // ヘッダーの設定
        sheet.getRange('A1').setValue('集計開始日');
        sheet.getRange('B1').setValue('集計終了日');
        sheet.getRange('C1').setValue('案件選択');

        // 書式の設定
        sheet.getRange('A2:B2').setNumberFormat('yyyy/mm/dd');
        
        // 列幅の調整
        sheet.setColumnWidth(1, 120);
        sheet.setColumnWidth(2, 120);
        sheet.setColumnWidth(3, 300);
      }
    } catch (error) {
      throw new WorktimeError(
        'Failed to initialize dashboard sheet',
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