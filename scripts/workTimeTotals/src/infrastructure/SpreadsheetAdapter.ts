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
        const e = new WorktimeError(
          `Sheet not found: ${this.sheetName}`,
          ErrorCodes.SHEET_NOT_FOUND
        );
        console.error(e.formatForLog());
        throw e;
      }

      // 全てのデータを取得してから必要な列を選別する方法も試す
      // データの詳細をログに出力
      console.log(`シート「${this.sheetName}」のデータ取得を開始`);

      // まずは通常の範囲でデータを取得
      const dataRange = sheet.getRange('J3:P');
      console.log(`範囲 J3:P を読み込み`);
      const rows = dataRange.getValues();

      // データサンプルをログに出力
      if (rows.length > 0) {
        console.log(`行数: ${rows.length}, 列数: ${rows[0].length}`);
        console.log(`データサンプル (1行目):`, JSON.stringify(rows[0], (key, value) => {
          if (value instanceof Date) {
            return `Date(${value.toISOString()})`;
          }
          return value;
        }));
      } else {
        console.log('データが見つかりませんでした');
      }

      const headers = [
        'date', 'startTime', 'endTime',
        'mainCategory', 'subCategory', 'meeting', 'workContent'
      ];

      const collection = new WorkEntryCollection();
      rows.forEach((row, index) => {
        // 完全に空の行はスキップ
        if (row.every(cell => !cell)) return;
        // 最初の3つが空の場合もスキップ（従来の条件）
        if (!row[0] && !row[1] && !row[2]) return;

        try {
          const entry = this.createWorkEntryFromRow(row, headers);
          collection.add(entry);
        } catch (error) {
          console.error(`行 ${index + 3} の処理中にエラー:`, error);
          // ここでの例外は上に投げずにログに残し、処理を続行することもできる
          // この例ではエラーを上に投げる従来の挙動を維持
          const e = new WorktimeError(
            `Failed to parse row ${index + 3}`,
            ErrorCodes.INVALID_SHEET_FORMAT,
            {
              errorLocation: `行: ${index + 3}`,
              message: error instanceof Error ? error.message : '不明なエラー',
              cellData: {
                row: index + 3,
                values: row,
                expectedFormat: '日付 | 開始時刻 | 終了時刻 | メインカテゴリ | サブカテゴリ | MTG | 業務内容'
              }
            }
          );
          console.error(e.formatForLog());
          throw e;
        }
      });

      return collection;
    } catch (error) {
      if (error instanceof WorktimeError) {
        console.error(error.formatForLog());
        throw error;
      }
      const e = new WorktimeError(
        'Failed to read work entries',
        ErrorCodes.SHEET_ACCESS_ERROR,
        error
      );
      console.error(e.formatForLog());
      throw e;
    }
  }

  writeWorkEntries(entries: WorkEntryCollection): void {
    const sheet = SpreadsheetApp.openById(this.spreadsheetId).getSheetByName(this.sheetName);
    if (!sheet) {
      const e = new WorktimeError(
        `Sheet not found: ${this.sheetName}`,
        ErrorCodes.SHEET_NOT_FOUND
      );
      console.error(e.formatForLog());
      throw e;
    }

    const headers = [
      'date', 'startTime', 'endTime',
      'mainCategory', 'subCategory', 'meeting', 'workContent'
    ];

    const rows = entries.entries.map(entry => [
      entry.date,
      entry.startTime,
      entry.endTime,
      entry.mainCategory,
      entry.subCategory,
      entry.meeting,
      entry.workContent
    ]);

    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
  }

  // TODO: any型を解決する
  private createWorkEntryFromRow(row: any[], headers: string[]): WorkEntry {
    try {
      // デバッグログを追加
      console.log('createWorkEntryFromRow - 元データ:', JSON.stringify(row, (key, value) => {
        if (value instanceof Date) {
          return `Date(${value.toISOString()})`;
        }
        return value;
      }));

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

      // 日時型データの処理を改善
      let startTime = '';
      if (row[1] instanceof Date) {
        startTime = formatTime(row[1]);
      } else if (typeof row[1] === 'string') {
        startTime = row[1];
      }

      let endTime = '';
      if (row[2] instanceof Date) {
        endTime = formatTime(row[2]);
      } else if (typeof row[2] === 'string') {
        endTime = row[2];
      }

      // カテゴリなどの位置が正しいか確認
      const mainCategory = row[3]?.toString() || '';
      const subCategory = row[4]?.toString() || '';
      const meeting = row[5]?.toString() || '';
      const workContent = row[6]?.toString() || '';

      // データの内容をデバッグ
      console.log('処理後データ:', {
        date: parsedDate,
        startTime,
        endTime,
        mainCategory,
        subCategory,
        meeting,
        workContent
      });

      return new WorkEntry({
        date: parsedDate,
        startTime,
        endTime,
        mainCategory,
        subCategory,
        meeting,
        workContent
      });
    } catch (error) {
      if (error instanceof WorktimeError) {
        console.error(error.formatForLog());
        throw error;
      }
      const e = new WorktimeError(
        'Failed to parse row data',
        ErrorCodes.INVALID_SHEET_FORMAT,
        {
          message: error instanceof Error ? error.message : '不明なエラー'
        }
      );
      console.error(e.formatForLog());
      throw e;
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
        const e = new WorktimeError(
          `Spreadsheet not found: ${this.spreadsheetId}`,
          ErrorCodes.SHEET_NOT_FOUND
        );
        console.error(e.formatForLog());
        throw e;
      }

      if (this.sheetName) {
        const sheet = spreadsheet.getSheetByName(this.sheetName);
        if (!sheet) {
          const e = new WorktimeError(
            `Sheet not found: ${this.sheetName}`,
            ErrorCodes.SHEET_NOT_FOUND
          );
          console.error(e.formatForLog());
          throw e;
        }
        return sheet;
      }

      const e = new WorktimeError(
        'Sheet name is required for this operation',
        ErrorCodes.SHEET_NOT_FOUND
      );
      console.error(e.formatForLog());
      throw e;
    } catch (error) {
      if (error instanceof WorktimeError) {
        console.error(error.formatForLog());
        throw error;
      }
      const e = new WorktimeError(
        'Failed to access spreadsheet',
        ErrorCodes.SHEET_ACCESS_ERROR,
        error
      );
      console.error(e.formatForLog());
      throw e;
    }
  }

  getSheetNames(): string[] {
    try {
      const spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
      if (!spreadsheet) {
        const e = new WorktimeError(
          'Failed to get spreadsheet',
          ErrorCodes.SHEET_ACCESS_ERROR
        );
        console.error(e.formatForLog());
        throw e;
      }
      return spreadsheet.getSheets().map(sheet => sheet.getName());
    } catch (error) {
      if (error instanceof WorktimeError) {
        console.error(error.formatForLog());
        throw error;
      }
      const e = new WorktimeError(
        'Failed to get sheet names',
        ErrorCodes.SHEET_ACCESS_ERROR,
        error
      );
      console.error(e.formatForLog());
      throw e;
    }
  }

  getValues(range?: string): any[][] {
    const sheet = this.getSheet();
    const dataRange = range ? sheet.getRange(range) : sheet.getDataRange();
    return dataRange.getValues();
  }
}