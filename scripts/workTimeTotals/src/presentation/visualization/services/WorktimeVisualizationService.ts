import { WorkEntry } from '../../../domain/workEntry/WorkEntry';
import { WorktimeError, ErrorCodes } from '../../../domain/error/WorktimeError';
import { OvertimeVisualizationService } from './OvertimeVisualizationService';
import { CategoryVisualizationService } from './CategoryVisualizationService';
import { OvertimeSummary } from '../../../application/OvertimeCalculationService';

export class WorktimeVisualizationService {
  constructor(
    private spreadsheetId: string,
    private overtimeVisualizationService: OvertimeVisualizationService,
    private categoryVisualizationService: CategoryVisualizationService
  ) {}

  visualize(overtimeSummaries: OvertimeSummary[], entriesForOvertime: Map<string, WorkEntry[]>): void {
    try {
      const sheet = this.createSheet();
      
      // 残業時間の集計結果を出力
      const lastRow = this.overtimeVisualizationService.visualize(
        overtimeSummaries,
        sheet
      );

      // 業務比率の集計結果を出力（2行空けて）
      this.categoryVisualizationService.visualize(
        entriesForOvertime,
        sheet,
        lastRow + 2
      );
    } catch (error) {
      throw new WorktimeError(
        'Failed to visualize worktime data',
        ErrorCodes.SHEET_ACCESS_ERROR,
        { error }
      );
    }
  }

  private createSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyyMMddHHmm');
    return spreadsheet.insertSheet(`集計_${timestamp}`, 3);
  }
} 