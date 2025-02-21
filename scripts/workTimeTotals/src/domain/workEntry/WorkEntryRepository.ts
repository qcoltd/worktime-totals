import { WorkEntryCollection } from './WorkEntryCollection';
import { SpreadsheetAdapter } from '../../infrastructure/SpreadsheetAdapter';
import { TOTALING_SHEET } from '../../define';
import { WorktimeError, ErrorCodes } from '../error/WorktimeError';
import { WorkEntry } from './WorkEntry';

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
      const values = this.adapter.getValues('I3:N');
      const entries = new WorkEntryCollection();

      values.forEach((row, index) => {
        try {
          if (!row[0] && !row[1] && !row[2]) return;

          const entry = new WorkEntry({
            date: row[0],
            startTime: row[1] instanceof Date ? this.formatTime(row[1]) : row[1],
            endTime: row[2] instanceof Date ? this.formatTime(row[2]) : row[2],
            mainCategory: row[3]?.toString() || '',
            subCategory: row[4]?.toString() || '',
            description: row[5]?.toString() || ''
          });
          entries.add(entry);
        } catch (error) {
          if (error instanceof WorktimeError) {
            // エラーの詳細情報を含めた新しいエラーを作成
            const details = {
              errorLocation: `行: ${index + 3}`,
              message: error.details?.message || error.message,
              cellData: {
                row: index + 3,
                values: row,
                expectedFormat: '日付 | 開始時刻 | 終了時刻 | メインカテゴリ | サブカテゴリ | 説明'
              },
              // 元のエラーの詳細情報も保持
              originalError: error.details
            };

            throw new WorktimeError(
              `行${index + 3}のデータ読み込みに失敗: ${error.details?.message || error.message}`,
              ErrorCodes.INVALID_SHEET_FORMAT,
              details
            );
          }
          throw error;
        }
      });

      return entries;
    } catch (error) {
      if (error instanceof WorktimeError) {
        throw error;
      }
      throw new WorktimeError(
        'Failed to read work entries',
        ErrorCodes.SHEET_ACCESS_ERROR,
        { 
          message: error instanceof Error ? error.message : '不明なエラー',
          sheetName: this.adapter.sheetName,
          spreadsheetId: this.adapter.spreadsheetId
        }
      );
    }
  }

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
} 