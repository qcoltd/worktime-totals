import { WorkEntry } from '../../../domain/workEntry/WorkEntry';
import { WorktimeError, ErrorCodes } from '../../../domain/error/WorktimeError';
import { OvertimeVisualizationService } from './OvertimeVisualizationService';
import { CategoryVisualizationService } from './CategoryVisualizationService';
import { OvertimeSummary } from '../../../application/OvertimeCalculationService';
import { SubCategoryVisualizationService } from './SubCategoryVisualizationService';

export class WorktimeVisualizationService {
  constructor(
    private spreadsheetId: string,
    private overtimeVisualizationService: OvertimeVisualizationService,
    private categoryVisualizationService: CategoryVisualizationService,
    private subCategoryVisualizationService: SubCategoryVisualizationService
  ) {}

  // 残業時間と業務比率の出力
  visualizeOvertimeAndCategory(overtimeSummaries: OvertimeSummary[], entriesForOvertime: Map<string, WorkEntry[]>): void {
    try {
      // 残業時間シートの作成と出力
      const overtimeSheet = this.createSheet('集計', 3);
      const lastRowOvertime = this.overtimeVisualizationService.visualize(
        overtimeSummaries,
        overtimeSheet
      );

      // 業務比率の出力
      this.categoryVisualizationService.visualize(
        entriesForOvertime,
        overtimeSheet,
        lastRowOvertime + 2
      );
    } catch (error) {
      const details = error instanceof WorktimeError ? {
        ...error.details,
        spreadsheetId: this.spreadsheetId,
        spreadsheetName: SpreadsheetApp.openById(this.spreadsheetId).getName(),
        message: '残業時間と業務比率の出力中にエラーが発生しました'
      } : undefined;

      throw new WorktimeError(
        'Failed to visualize overtime and category data',
        ErrorCodes.SHEET_ACCESS_ERROR,
        details
      );
    }
  }

  // サブカテゴリ別の出力
  visualizeProjectBreakdown(entries: Map<string, WorkEntry[]>): void {
    try {
      const subCategorySheet = this.createSheet('案件別', 4);
      this.subCategoryVisualizationService.visualize(
        entries,
        subCategorySheet
      );
    } catch (error) {
      const details = error instanceof WorktimeError ? {
        ...error.details,
        spreadsheetId: this.spreadsheetId,
        spreadsheetName: SpreadsheetApp.openById(this.spreadsheetId).getName(),
        message: '案件別作業時間の出力中にエラーが発生しました'
      } : undefined;

      throw new WorktimeError(
        'Failed to visualize project breakdown data',
        ErrorCodes.SHEET_ACCESS_ERROR,
        details
      );
    }
  }

  private createSheet(prefix: string, insertPosition: number): GoogleAppsScript.Spreadsheet.Sheet {
    const spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyyMMddHHmm');
    return spreadsheet.insertSheet(`${prefix}_${timestamp}`, insertPosition);
  }
} 