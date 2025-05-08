import { WorkEntryCollection } from './WorkEntryCollection';
import { SpreadsheetAdapter } from '../../infrastructure/SpreadsheetAdapter';
import { TOTALING_SHEET } from '../../define';
import { WorktimeError, ErrorCodes } from '../error/WorktimeError';
import { WorkEntry } from './WorkEntry';
import { dayjsLib } from '../../libs/dayjs';
import { logAndThrow } from '../../utils/errorUtils';

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
      const e = new WorktimeError(
        'Failed to save work entries',
        ErrorCodes.SHEET_ACCESS_ERROR,
        error
      );
      console.error(e.formatForLog());
      throw e;
    }
  }

  findByDateRange(startDate: Date, endDate: Date): WorkEntryCollection {
    try {
      const values = this.adapter.getValues('J3:P');
      const entries = new WorkEntryCollection();

      values.forEach((row, index) => {
        try {
          // 完全な空行はスキップ
          if (!row || row.length === 0 || this.isEmptyRow(row)) {
            return;
          }

          // 日付の処理
          const date = this.parseDate(row[0]);

          // 日付が無効な場合はスキップ
          if (!date) {
            return;
          }

          // 日付が期間外の場合はスキップ
          const dateStr = dayjsLib.formatDate(date);
          const startDateStr = dayjsLib.formatDate(startDate);
          const endDateStr = dayjsLib.formatDate(endDate);

          if (dateStr < startDateStr || dateStr > endDateStr) {
            return;
          }

          // 期間内のデータは必須項目をチェック
          this.validateRequiredFields(row, index);

          // 時刻の処理
          const startTimeValue = row[1];
          const endTimeValue = row[2];
          const startTime = startTimeValue instanceof Date
            ? this.formatTime(startTimeValue)
            : startTimeValue?.toString().trim() || '';

          const endTime = endTimeValue instanceof Date
            ? this.formatTime(endTimeValue)
            : endTimeValue?.toString().trim() || '';

          // エントリーを作成
          const entry = new WorkEntry({
            date,
            startTime,
            endTime,
            mainCategory: row[3]?.toString().trim() || '',
            subCategory: row[4]?.toString().trim() || '',
            meeting: row[5]?.toString().trim() || '',
            workContent: row[6]?.toString().trim() || ''
          });
          entries.add(entry);

        } catch (error) {
          if (error instanceof WorktimeError) {
            throw error;
          }
          const e = new WorktimeError(
            `行${index + 3}のデータ読み込みに失敗`,
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

      return entries;
    } catch (error) {
      if (error instanceof WorktimeError) {
        console.error(error.formatForLog());
        throw error;
      }
      const e = new WorktimeError(
        'Failed to read work entries',
        ErrorCodes.SHEET_ACCESS_ERROR,
        {
          message: error instanceof Error ? error.message : '不明なエラー',
          sheetName: this.adapter.sheetName,
          spreadsheetId: this.adapter.spreadsheetId
        }
      );
      console.error(e.formatForLog());
      throw e;
    }
  }

  findAll(): WorkEntryCollection {
    return this.findByDateRange(
      new Date(-8640000000000000), // 最小の日付
      new Date(8640000000000000)   // 最大の日付
    );
  }

  setSheetName(sheetName: string): void {
    this.adapter.setSheetName(sheetName);
  }

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // 完全な空行かどうかをチェック
  private isEmptyRow(row: any[]): boolean {
    return row.every(cell =>
      cell === undefined ||
      cell === null ||
      cell === '' ||
      (typeof cell === 'string' && cell.trim() === '')
    );
  }

  // 日付データをパースする
  private parseDate(dateValue: any): Date | null {
    if (!dateValue) return null;

    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }

    if (typeof dateValue === 'string') {
      try {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date;
      } catch {
        return null;
      }
    }

    return null;
  }

  // 必須項目のバリデーション
  private validateRequiredFields(row: any[], index: number): void {
    // 開始時刻のチェック
    if (!row[1]) {
      const e = new WorktimeError(
        '開始時刻が未入力です',
        ErrorCodes.INVALID_SHEET_FORMAT,
        {
          errorLocation: `行: ${index + 3}`,
          message: '開始時刻は必須項目です',
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

    // メインカテゴリのチェック
    if (!row[3]?.toString().trim()) {
      const e = new WorktimeError(
        'メインカテゴリが未入力です',
        ErrorCodes.INVALID_SHEET_FORMAT,
        {
          errorLocation: `行: ${index + 3}`,
          message: 'メインカテゴリは必須項目です',
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

    // サブカテゴリのチェック
    if (!row[4]?.toString().trim()) {
      const e = new WorktimeError(
        'サブカテゴリが未入力です',
        ErrorCodes.INVALID_SHEET_FORMAT,
        {
          errorLocation: `行: ${index + 3}`,
          message: 'サブカテゴリは必須項目です',
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
  }
}