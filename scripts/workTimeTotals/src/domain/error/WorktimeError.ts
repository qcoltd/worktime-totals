export class WorktimeError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'WorktimeError';
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
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]; 