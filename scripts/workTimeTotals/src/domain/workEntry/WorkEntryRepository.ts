import { WorkEntryCollection } from './WorkEntryCollection';
import { SpreadsheetAdapter } from '../../infrastructure/SpreadsheetAdapter';
import { TOTALING_SHEET } from '../../define';
import { WorktimeError, ErrorCodes } from '../error/WorktimeError';

export interface WorkEntryRepositoryInterface {
  save(entries: WorkEntryCollection): void;
  findByDateRange(startDate: Date, endDate: Date): WorkEntryCollection;
  findAll(): WorkEntryCollection;
  setSheetName(sheetName: string): void;
}

export class WorkEntryRepository implements WorkEntryRepositoryInterface {
  private readonly adapter: SpreadsheetAdapter;

  constructor(spreadsheetId: string) {
    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID is required');
    }

    this.adapter = new SpreadsheetAdapter(
      spreadsheetId,
      TOTALING_SHEET.SHEET_NAME.WORK_ENTRIES
    );
  }

  save(entries: WorkEntryCollection): void {
    try {
      this.adapter.writeWorkEntries(entries);
    } catch (error) {
      if (error instanceof WorktimeError) {
        throw error;
      }
      throw new WorktimeError(
        'Failed to save work entries',
        ErrorCodes.SHEET_ACCESS_ERROR,
        error
      );
    }
  }

  findByDateRange(startDate: Date, endDate: Date): WorkEntryCollection {
    try {
      const allEntries = this.findAll();
      return new WorkEntryCollection(
        allEntries.entries.filter(entry => {
          const entryDate = entry.date;
          return entryDate >= startDate && entryDate <= endDate;
        })
      );
    } catch (error) {
      if (error instanceof WorktimeError) {
        throw error;
      }
      throw new WorktimeError(
        'Failed to find work entries',
        ErrorCodes.SHEET_ACCESS_ERROR,
        error
      );
    }
  }

  private getDateSheetNames(): string[] {
    const sheetNames = this.adapter.getSheetNames();
    const datePattern = /^\d{8}$/;  // 8桁の数字のみ

    return sheetNames.filter(name => {
      // 数字以外の文字を削除
      const numbersOnly = name.replace(/\D/g, '');
      // 8桁の数字かどうかをチェック
      return datePattern.test(numbersOnly);
    });
  }

  setSheetName(sheetName: string): void {
    this.adapter.setSheetName(sheetName);
  }

  findAll(): WorkEntryCollection {
    try {
      return this.adapter.readWorkEntries();
    } catch (error) {
      if (error instanceof WorktimeError) {
        throw error;
      }
      throw new WorktimeError(
        'Failed to find work entries',
        ErrorCodes.SHEET_ACCESS_ERROR,
        error
      );
    }
  }
} 