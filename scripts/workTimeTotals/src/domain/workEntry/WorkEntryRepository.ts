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
      const values = this.adapter.getValues('J3:P');
      const entries = new WorkEntryCollection();

      values.forEach((row, index) => {
        try {
          if (!row[0] && !row[1] && !row[2]) return;

          // デバッグログを追加して行データの構造を確認
          console.log(`デバッグ: 行${index + 3}の値:`, JSON.stringify(row, (key, value) => {
            if (value instanceof Date) {
              return `Date(${value.toISOString()})`;
            }
            return value;
          }));

          // データ型の処理を改善
          let dateValue = row[0];
          let startTimeValue = row[1];
          let endTimeValue = row[2];

          // 日付の処理
          let date;
          if (dateValue instanceof Date) {
            date = dateValue;
          } else if (typeof dateValue === 'string') {
            try {
              // 文字列から日付への変換を試みる
              date = new Date(dateValue);
              if (isNaN(date.getTime())) {
                throw new Error(`Invalid date string: ${dateValue}`);
              }
            } catch (e) {
              console.error(`日付変換エラー: ${e}`, dateValue);
              // デフォルトの日付を使用（シート名から）
              date = this.extractDateFromSheetName();
            }
          } else {
            console.warn(`未知の日付フォーマット: ${typeof dateValue}`, dateValue);
            date = this.extractDateFromSheetName();
          }

          // 時刻の処理
          const startTime = startTimeValue instanceof Date 
            ? this.formatTime(startTimeValue) 
            : startTimeValue?.toString() || '';
          
          const endTime = endTimeValue instanceof Date 
            ? this.formatTime(endTimeValue) 
            : endTimeValue?.toString() || '';

          const entry = new WorkEntry({
            date,
            startTime,
            endTime,
            mainCategory: row[3]?.toString() || '',
            subCategory: row[4]?.toString() || '',
            meeting: row[5]?.toString() || '',
            workContent: row[6]?.toString() || ''
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
                expectedFormat: '日付 | 開始時刻 | 終了時刻 | メインカテゴリ | サブカテゴリ | MTG | 業務内容'
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

  // シート名から日付を抽出するメソッドを追加
  private extractDateFromSheetName(): Date {
    try {
      const sheetName = this.adapter.sheetName;
      if (!/^\d{8}$/.test(sheetName)) {
        throw new Error(`シート名が日付形式ではありません: ${sheetName}`);
      }
      
      const year = parseInt(sheetName.substring(0, 4), 10);
      const month = parseInt(sheetName.substring(4, 6), 10) - 1; // JavaScriptの月は0-11
      const day = parseInt(sheetName.substring(6, 8), 10);
      
      const date = new Date(year, month, day);
      
      if (isNaN(date.getTime())) {
        throw new Error(`無効な日付です: ${sheetName}`);
      }
      
      return date;
    } catch (error) {
      throw new WorktimeError(
        `シート名から日付を抽出できませんでした: ${this.adapter.sheetName}`,
        ErrorCodes.INVALID_SHEET_FORMAT,
        error
      );
    }
  }
} 