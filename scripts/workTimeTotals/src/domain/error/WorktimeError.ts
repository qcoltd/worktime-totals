export interface SpreadsheetErrorDetails {
  spreadsheetId?: string;
  spreadsheetName?: string;
  sheetName?: string;
  errorLocation?: string;
  message?: string;
  cellData?: {
    row: number;
    values: any[];
    expectedFormat: string;
  };
}

export class WorktimeError extends Error {
  constructor(
    message: string,
    public readonly code: typeof ErrorCodes[keyof typeof ErrorCodes],
    public readonly details?: SpreadsheetErrorDetails
  ) {
    super(message);
    this.name = 'WorktimeError';
  }

  getErrorUrl(): string | undefined {
    if (this.details?.spreadsheetId) {
      return `https://docs.google.com/spreadsheets/d/${this.details.spreadsheetId}`;
    }
    return undefined;
  }

  formatForLog(): string {
    let logMessage = `[${this.code}] ${this.message}`;

    if (this.details) {
      if (this.details.spreadsheetName) {
        logMessage += `\nSpreadsheet: ${this.details.spreadsheetName}`;
      }
      if (this.details.sheetName) {
        logMessage += `\nSheet: ${this.details.sheetName}`;
      }
      if (this.details.errorLocation) {
        logMessage += `\nLocation: ${this.details.errorLocation}`;
      }
      if (this.details.message) {
        logMessage += `\nDetails: ${this.details.message}`;
      }
    }

    return logMessage;
  }
}

export const ErrorCodes = {
  // スプレッドシート関連
  SHEET_NOT_FOUND: 'SHEET_NOT_FOUND',
  INVALID_SHEET_FORMAT: 'INVALID_SHEET_FORMAT',
  SHEET_ACCESS_ERROR: 'SHEET_ACCESS_ERROR',

  // WorkEntry関連
  INVALID_TIME_FORMAT: 'INVALID_TIME_FORMAT',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',

  // その他
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
  DASHBOARD_ERROR: 'DASHBOARD_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];