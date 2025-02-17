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
      throw new Error('Invalid spreadsheet URL format');
    }
    return match[1];
  }
} 