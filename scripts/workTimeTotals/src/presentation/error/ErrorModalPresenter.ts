import { WorktimeError } from "../../domain/error/WorktimeError";

export class ErrorModalPresenter {
  static showError(error: WorktimeError): void {
    const ui = SpreadsheetApp.getUi();
    
    let message = `エラーが発生しました:\n${error.message}\n\n`;
    
    if (error.details) {
      if (error.details.spreadsheetName) {
        message += `スプレッドシート: ${error.details.spreadsheetName}\n`;
      }
      if (error.details.sheetName) {
        message += `シート: ${error.details.sheetName}\n`;
      }
      if (error.details.errorLocation) {
        message += `場所: ${error.details.errorLocation}\n`;
      }
      if (error.details.message) {
        message += `詳細: ${error.details.message}\n`;
      }
      
      // セルデータがある場合は表示
      if ('cellData' in error.details) {
        const cellData = error.details.cellData as { row: number; values: any[]; expectedFormat: string };
        message += `\n問題のある行: ${cellData.row}`;
        message += `\n取得したデータ: ${cellData.values.join(' | ')}`;
        message += `\n期待するフォーマット: ${cellData.expectedFormat}`;
      }
    }

    const errorUrl = error.getErrorUrl();
    if (errorUrl) {
      const htmlOutput = HtmlService
        .createHtmlOutput(
          `<p style="font-family: Arial, sans-serif;">
            ${message.replace(/\n/g, '<br>')}
            <br><br>
            <a href="${errorUrl}" target="_blank">スプレッドシートを開く</a>
           </p>`
        )
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
        .setWidth(450)
        .setHeight(250);

      ui.showModalDialog(htmlOutput, 'エラー');
    } else {
      ui.alert('エラー', message, ui.ButtonSet.OK);
    }
  }
} 