import { WorkEntry } from '../domain/workEntry/WorkEntry';
import { WorkEntryCollection } from '../domain/workEntry/WorkEntryCollection';
import { WorktimeError, ErrorCodes } from '../domain/error/WorktimeError';
import { dayjsLib } from '../libs/dayjs';

export interface SpreadsheetAdapterInterface {
  readWorkEntries(): WorkEntryCollection;
  writeWorkEntries(entries: WorkEntryCollection): void;
  setSheetName(sheetName: string): void;
  getColumnValues(column: string): any[];
  getSheetNames(): string[];
  getValues(range?: string): any[][]
}

export class SpreadsheetAdapter implements SpreadsheetAdapterInterface {
  constructor(
    private _spreadsheetId: string,
    private _sheetName: string
  ) {}

  get spreadsheetId(): string {
    return this._spreadsheetId;
  }

  get sheetName(): string {
    return this._sheetName;
  }

  readWorkEntries(): WorkEntryCollection {
    try {
      const sheet = SpreadsheetApp.openById(this.spreadsheetId).getSheetByName(this.sheetName);
      if (!sheet) {
        throw new WorktimeError(
          `Sheet not found: ${this.sheetName}`,
          ErrorCodes.SHEET_NOT_FOUND
        );
      }

      const dataRange = sheet.getRange('I3:N');
      const rows = dataRange.getValues();

      const headers = [
        'date', 'startTime', 'endTime',
        'mainCategory', 'subCategory', 'description'
      ];

      const collection = new WorkEntryCollection();
      rows.forEach((row, index) => {
        if (!row[0] && !row[1] && !row[2]) return;

        try {
          const entry = this.createWorkEntryFromRow(row, headers);
          collection.add(entry);
        } catch (error) {
          throw new WorktimeError(
            `Failed to parse row ${index + 3}`,
            ErrorCodes.INVALID_SHEET_FORMAT,
            {
              errorLocation: `行: ${index + 3}`,
              message: error instanceof Error ? error.message : '不明なエラー',
              cellData: {
                row: index + 3,
                values: row,
                expectedFormat: '日付 | 開始時刻 | 終了時刻 | メインカテゴリ | サブカテゴリ | 説明'
              }
            }
          );
        }
      });

      return collection;
    } catch (error) {
      if (error instanceof WorktimeError) {
        throw error;
      }
      throw new WorktimeError(
        'Failed to read work entries',
        ErrorCodes.SHEET_ACCESS_ERROR,
        error
      );
    }
  }

  writeWorkEntries(entries: WorkEntryCollection): void {
    const sheet = SpreadsheetApp.openById(this.spreadsheetId).getSheetByName(this.sheetName);
    if (!sheet) {
      throw new WorktimeError(
        `Sheet not found: ${this.sheetName}`,
        ErrorCodes.SHEET_NOT_FOUND
      );
    }

    const headers = [
      'date', 'startTime', 'endTime',
      'mainCategory', 'subCategory', 'description'
    ];

    const rows = entries.entries.map(entry => [
      entry.date,
      entry.startTime,
      entry.endTime,
      entry.mainCategory,
      entry.subCategory,
      entry.description
    ]);

    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
  }

  private createWorkEntryFromRow(row: (string | Date | null)[], headers: string[]): WorkEntry {
    try {
      const dateValue = row[0];
      let parsedDate: Date;
      if (typeof dateValue === 'string') {
        parsedDate = dayjsLib.parse(dateValue).toDate();
      } else if (dateValue instanceof Date) {
        parsedDate = dateValue;
      } else {
        throw new Error('Invalid date format');
      }

      const formatTime = (date: Date): string => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      const startTime = row[1] instanceof Date ? formatTime(row[1]) : row[1]?.toString() || '';
      const endTime = row[2] instanceof Date ? formatTime(row[2]) : row[2]?.toString() || '';

      return new WorkEntry({
        date: parsedDate,
        startTime,
        endTime,
        mainCategory: row[3]?.toString() || '',
        subCategory: row[4]?.toString() || '',
        description: row[5]?.toString() || ''
      });
    } catch (error) {
      if (error instanceof WorktimeError) {
        throw error;
      }
      throw new WorktimeError(
        'Failed to parse row data',
        ErrorCodes.INVALID_SHEET_FORMAT,
        {
          message: error instanceof Error ? error.message : '不明なエラー'
        }
      );
    }
  }

  setSheetName(sheetName: string): void {
    this._sheetName = sheetName;
  }

  getColumnValues(column: string): any[] {
    const sheet = this.getSheet();
    const range = sheet.getRange(`${column}:${column}`);
    return range.getValues().map(row => row[0]);
  }

  private getSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    try {
      const spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
      if (!spreadsheet) {
        throw new WorktimeError(
          `Spreadsheet not found: ${this.spreadsheetId}`,
          ErrorCodes.SHEET_NOT_FOUND
        );
      }

      if (this.sheetName) {
        const sheet = spreadsheet.getSheetByName(this.sheetName);
        if (!sheet) {
          throw new WorktimeError(
            `Sheet not found: ${this.sheetName}`,
            ErrorCodes.SHEET_NOT_FOUND
          );
        }
        return sheet;
      }

      throw new WorktimeError(
        'Sheet name is required for this operation',
        ErrorCodes.SHEET_NOT_FOUND
      );
    } catch (error) {
      if (error instanceof WorktimeError) {
        throw error;
      }
      throw new WorktimeError(
        'Failed to access spreadsheet',
        ErrorCodes.SHEET_ACCESS_ERROR,
        error
      );
    }
  }

  getSheetNames(): string[] {
    try {
      const spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
      if (!spreadsheet) {
        throw new WorktimeError(
          'Failed to get spreadsheet',
          ErrorCodes.SHEET_ACCESS_ERROR
        );
      }
      return spreadsheet.getSheets().map(sheet => sheet.getName());
    } catch (error) {
      if (error instanceof WorktimeError) {
        throw error;
      }
      throw new WorktimeError(
        'Failed to get sheet names',
        ErrorCodes.SHEET_ACCESS_ERROR,
        error
      );
    }
  }

  getValues(range?: string): any[][] {
    const sheet = this.getSheet();
    const dataRange = range ? sheet.getRange(range) : sheet.getDataRange();
    return dataRange.getValues();
  }
}  