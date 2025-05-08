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

  // 指定された期間内のシート名のみを取得
  private getTargetDateSheets(spreadsheetId: string, startDate: Date, endDate: Date): string[] {
    const adapter = new SpreadsheetAdapter(spreadsheetId, '');
    const sheetNames = adapter.getSheetNames();
    const datePattern = /^\d{4}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/;  // YYYYMMDDの形式のみ

    return sheetNames.filter(name => {
      // YYYYMMDDの形式でない場合はスキップ
      if (!datePattern.test(name)) {
        console.info(`${name} is not a valid date format. skipping...`);
        return false;
      }

      // シート名から日付を取得（すでにYYYYMMDD形式であることは確認済み）
      const year = parseInt(name.substring(0, 4));
      const month = parseInt(name.substring(4, 6)) - 1;
      const day = parseInt(name.substring(6, 8));
      const sheetDate = new Date(year, month, day);

      // 週半ばで月が変わった場合にもれないように１週間分ずつ余分に前後を取得する
      const expandedStartDate = dayjsLib.addDays(startDate, -7).toDate();
      const expandedEndDate = dayjsLib.addDays(endDate, 7).toDate();

      // 日付文字列に変換して比較
      const sheetDateStr = dayjsLib.formatDate(sheetDate);
      const startDateStr = dayjsLib.formatDate(expandedStartDate);
      const endDateStr = dayjsLib.formatDate(expandedEndDate);

      return sheetDateStr >= startDateStr && sheetDateStr <= endDateStr;
    });
  }

  collectWorkEntries(startDate: Date, endDate: Date): Map<string, WorkEntryCollection> {
    try {
      const results = new Map<string, WorkEntryCollection>();

      // 全従業員のシート情報を取得
      const employeeSheets = this.employeeSheetRepo.findAll();

      // 各従業員の作業時間を取得
      employeeSheets.forEach(sheet => {
        // 対象期間内の日付シート(+前後一週間)のみを取得
        const targetDateSheets = this.getTargetDateSheets(sheet.spreadsheetId, startDate, endDate);
        console.log('targetDateSheets : ', targetDateSheets);
        const allEntries = new WorkEntryCollection();

        // 各シートからデータを取得
        targetDateSheets.forEach(sheetName => {
          const repository = new WorkEntryRepository(sheet.spreadsheetId);
          repository.setSheetName(sheetName);
          try {
            // findAllに期間を渡して、期間内のデータのみを取得・検証
            const entries = repository.findByDateRange(startDate, endDate);
            entries.entries.forEach(entry => {
              allEntries.add(entry);
            });
          } catch (error) {
            console.error(`Failed to read sheet ${sheetName} for ${sheet.name}:`, error);
            throw new WorktimeError(
              `Failed to read sheet ${sheetName} for ${sheet.name}`,
              ErrorCodes.SHEET_ACCESS_ERROR,
              {
                spreadsheetId: sheet.spreadsheetId,
                spreadsheetName: sheet.name,
                sheetName: sheetName,
                errorLocation: `従業員: ${sheet.name}, シート: ${sheetName}`,
                message: error instanceof Error ? error.message : '不明なエラー'
              }
            );
          }
        });

        console.log(`sheetName: ${sheet.name}, allEntries.entries.length : ${allEntries.entries.length}`);
        results.set(sheet.name, allEntries);
      });

      return results;
    } catch (error) {
      if (error instanceof WorktimeError) {
        const errorDetails = error.details;
        throw new WorktimeError(
          error.message,
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