import { EmployeeSheetRepository } from '../domain/employee/EmployeeSheetRepository';
import { WorkEntryRepository } from '../domain/workEntry/WorkEntryRepository';
import { WorkEntryCollection } from '../domain/workEntry/WorkEntryCollection';
import { SpreadsheetAdapter } from '../infrastructure/SpreadsheetAdapter';

export class WorktimeCollectionService {
  constructor(
    private readonly employeeSheetRepo: EmployeeSheetRepository
  ) {}

  private getDateSheetNames(spreadsheetId: string): string[] {
    const adapter = new SpreadsheetAdapter(spreadsheetId, '');
    console.log('adapter', adapter);
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
    const results = new Map<string, WorkEntryCollection>();
    
    // 全従業員のシート情報を取得
    const employeeSheets = this.employeeSheetRepo.findAll();
    console.log(employeeSheets);

    // 各従業員の作業時間を取得
    employeeSheets.forEach(sheet => {
      // 従業員の作業データスプレッドシートから日付シートを取得
      console.log('sheet.spreadsheetId', sheet.spreadsheetId);
      const dateSheets = this.getDateSheetNames(sheet.spreadsheetId);
      console.log('dateSheets', dateSheets);
      const allEntries = new WorkEntryCollection();
      console.log('allEntries', allEntries.entries);

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
          console.error(`Failed to read sheet ${sheetName} for ${sheet.name}: ${error}`);
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
  }
} 