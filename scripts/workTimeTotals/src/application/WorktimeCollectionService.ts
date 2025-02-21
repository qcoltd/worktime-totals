import { EmployeeSheetRepository } from '../domain/employee/EmployeeSheetRepository';
import { WorkEntryRepository } from '../domain/workEntry/WorkEntryRepository';
import { WorkEntryCollection } from '../domain/workEntry/WorkEntryCollection';
import { SpreadsheetAdapter } from '../infrastructure/SpreadsheetAdapter';
import { WorktimeError, ErrorCodes } from '../domain/error/WorktimeError';
import { dayjsLib } from '../libs/dayjs';

export class WorktimeCollectionService {
  constructor(
    private readonly employeeSheetRepo: EmployeeSheetRepository
  ) {}

  private getDateSheetNames(spreadsheetId: string): string[] {
    const adapter = new SpreadsheetAdapter(spreadsheetId, '');
    const sheetNames = adapter.getSheetNames();
    const datePattern = /^\d{8}$/;  // 8桁の数字のみ

    return sheetNames.filter(name => {
      // 数字以外の文字を削除
      const numbersOnly = name.replace(/\D/g, '');
      // 8桁の数字かどうかをチェック
      return datePattern.test(numbersOnly);
    });
  }

  collectWorkEntries(startDate: Date, endDate: Date): Map<string, WorkEntryCollection> {
    try {
      const results = new Map<string, WorkEntryCollection>();
      
      // 全従業員のシート情報を取得
      const employeeSheets = this.employeeSheetRepo.findAll();

      // 各従業員の作業時間を取得
      employeeSheets.forEach(sheet => {
        // 従業員の作業データスプレッドシートから日付シートを取得
        const dateSheets = this.getDateSheetNames(sheet.spreadsheetId);
        const allEntries = new WorkEntryCollection();

        // 各日付シートからデータを取得
        dateSheets.forEach(sheetName => {
          const repository = new WorkEntryRepository(sheet.spreadsheetId);
          repository.setSheetName(sheetName);
          try {
            const entries = repository.findAll();
            entries.entries.forEach(entry => {
              allEntries.add(entry);
            });
          } catch (error) {
            console.error(`Failed to read sheet ${sheetName} for ${sheet.name}:`, error);  // ログにエラーを出力
            throw new WorktimeError(
              `Failed to read sheet ${sheetName} for ${sheet.name}`,
              ErrorCodes.SHEET_ACCESS_ERROR,
              {
                spreadsheetId: sheet.spreadsheetId,
                spreadsheetName: sheet.name,
                sheetName: sheetName,  // エラーが発生した実際のシート名
                errorLocation: `従業員: ${sheet.name}, シート: ${sheetName}`,
                message: error instanceof Error ? error.message : '不明なエラー'
              }
            );
          }
        });

        // 期間でフィルタリング
        const filteredEntries = new WorkEntryCollection(
          allEntries.entries.filter(entry => {
            return entry.date >= startDate && entry.date <= endDate;
          })
        );

        results.set(sheet.name, filteredEntries);
      });

      return results;
    } catch (error) {
      if (error instanceof WorktimeError) {
        // 元のエラー情報を保持
        const errorDetails = error.details;
        throw new WorktimeError(
          error.message,  // 元のエラーメッセージを保持
          ErrorCodes.SHEET_ACCESS_ERROR,
          {
            spreadsheetId: errorDetails?.spreadsheetId,
            spreadsheetName: errorDetails?.spreadsheetName,
            sheetName: errorDetails?.sheetName,
            errorLocation: errorDetails?.errorLocation,
            message: errorDetails?.message
          }
        );
      }
      throw error;
    }
  }
} 