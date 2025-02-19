import { WorkEntry } from '../../../domain/workEntry/WorkEntry';
import { WorktimeError, ErrorCodes } from '../../../domain/error/WorktimeError';
import { CategoryTotalingService } from '../../../application/CategoryTotalingService';
import { CategoryRatioTableComponent } from '../components/tables/category/CategoryRatioTableComponent';

export class CategoryVisualizationService {
  constructor(
    private startDate: Date,
    private categoryTotalingService: CategoryTotalingService
  ) {}

  visualize(entriesForOvertime: Map<string, WorkEntry[]>, sheet: GoogleAppsScript.Spreadsheet.Sheet, startRow: number): void {
    try {
      const categorySummary = this.categoryTotalingService.calculateMonthlySummary(
        entriesForOvertime,
        this.startDate
      );

      const ratioTable = new CategoryRatioTableComponent(sheet, startRow, 1, categorySummary);
      ratioTable.renderTable();
    } catch (error) {
      throw new WorktimeError(
        'Failed to visualize category data',
        ErrorCodes.SHEET_ACCESS_ERROR,
        { error }
      );
    }
  }
} 