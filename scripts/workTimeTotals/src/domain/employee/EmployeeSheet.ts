import { WorktimeError, ErrorCodes } from '../error/WorktimeError';

export interface EmployeeSheetProps {
  name: string;
  spreadsheetUrl: string;
}

export class EmployeeSheet {
  readonly name: string;
  readonly spreadsheetId: string;

  constructor(props: EmployeeSheetProps) {
    this.name = props.name;
    this.spreadsheetId = this.extractSpreadsheetId(props.spreadsheetUrl);
  }

  private extractSpreadsheetId(url: string): string {
    const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      const e = new WorktimeError(
        'Invalid spreadsheet URL format',
        ErrorCodes.INVALID_SHEET_FORMAT,
        { message: `URL: ${url}` }
      );
      console.error(e.formatForLog());
      throw e;
    }
    return match[1];
  }
}