import { WorkEntry } from '../domain/workEntry/WorkEntry';
import { WorkEntryCollection } from '../domain/workEntry/WorkEntryCollection';
import { WorktimeError, ErrorCodes } from '../domain/error/WorktimeError';
import {dayjsLib} from '../libs/dayjs';

export interface SpreadsheetAdapterInterface {
  readWorkEntries(): WorkEntryCollection;
  writeWorkEntries(entries: WorkEntryCollection): void;
}

export class SpreadsheetAdapter implements SpreadsheetAdapterInterface {
  constructor(
    private readonly spreadsheetId: string,
    private readonly sheetName: string
  ) {}

  readWorkEntries(): WorkEntryCollection {
    try {
      const sheet = SpreadsheetApp.openById(this.spreadsheetId).getSheetByName(this.sheetName);
      if (!sheet) {
        throw new WorktimeError(
          `Sheet not found: ${this.sheetName}`,
          ErrorCodes.SHEET_NOT_FOUND
        );
      }

      const [headers, ...rows] = sheet.getDataRange().getValues();
      if (!this.validateHeaders(headers)) {
        throw new WorktimeError(
          'Invalid sheet format: Required columns are missing',
          ErrorCodes.INVALID_SHEET_FORMAT,
          { headers }
        );
      }

      const collection = new WorkEntryCollection();
      rows.forEach((row, index) => {
        try {
          const entry = this.createWorkEntryFromRow(row, headers);
          collection.add(entry);
        } catch (error) {
          throw new WorktimeError(
            `Failed to parse row ${index + 2}`,
            ErrorCodes.INVALID_SHEET_FORMAT,
            { row, error }
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
      throw new Error(`Sheet not found: ${this.sheetName}`);
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

    sheet.clearContents();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
  }

  private createWorkEntryFromRow(row: any[], headers: string[]): WorkEntry {
    const getColumnValue = (columnName: string) => {
      const index = headers.indexOf(columnName);
      return index >= 0 ? row[index] : null;
    };

    try {
      const dateValue = getColumnValue('date');
      const parsedDate = dayjsLib.parse(dateValue).toDate();

      return new WorkEntry({
        date: parsedDate,
        startTime: getColumnValue('startTime'),
        endTime: getColumnValue('endTime'),
        mainCategory: getColumnValue('mainCategory'),
        subCategory: getColumnValue('subCategory'),
        description: getColumnValue('description')
      });
    } catch (error) {
      if (error instanceof WorktimeError) {
        throw error;
      }
      throw new WorktimeError(
        'Failed to parse row data',
        ErrorCodes.INVALID_SHEET_FORMAT,
        { error }
      );
    }
  }

  private validateHeaders(headers: unknown[]): boolean {
    const requiredColumns = [
      'date', 'startTime', 'endTime',
      'mainCategory', 'subCategory', 'description'
    ];
    return requiredColumns.every(col => headers.includes(col));
  }
} 