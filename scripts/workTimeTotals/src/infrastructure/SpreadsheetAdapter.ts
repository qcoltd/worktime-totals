import { WorkEntry } from '../domain/workEntry/WorkEntry';
import { WorkEntryCollection } from '../domain/workEntry/WorkEntryCollection';

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
    const sheet = SpreadsheetApp.openById(this.spreadsheetId).getSheetByName(this.sheetName);
    if (!sheet) {
      throw new Error(`Sheet not found: ${this.sheetName}`);
    }

    const [headers, ...rows] = sheet.getDataRange().getValues();
    const collection = new WorkEntryCollection();

    rows.forEach(row => {
      try {
        const entry = this.createWorkEntryFromRow(row, headers);
        collection.add(entry);
      } catch (error) {
        console.error(`Failed to parse row: ${error}`);
      }
    });

    return collection;
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

    return new WorkEntry({
      date: new Date(getColumnValue('date')),
      startTime: getColumnValue('startTime'),
      endTime: getColumnValue('endTime'),
      mainCategory: getColumnValue('mainCategory'),
      subCategory: getColumnValue('subCategory'),
      description: getColumnValue('description')
    });
  }
} 