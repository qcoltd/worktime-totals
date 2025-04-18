// NOTE: 内容未調整
export const TOTALING_SHEET = {
  SS_ID: SpreadsheetApp.getActiveSpreadsheet().getId(),
  SHEET_NAME: {
    EMPLOYEE_LIST: '棚卸しシートリスト',
    WORK_ENTRIES: 'WorkEntries',
    DASHBOARD: 'ダッシュボード'
  },
  COLUMNS: {
    // 棚卸しシートリスト用
    EMPLOYEE_LIST: {
      NAME: 'A',
      SHEET_URL: 'B'
    },
    // 作業時間エントリー用
    WORK_ENTRIES: {
      DATE: 'A',
      START_TIME: 'B',
      END_TIME: 'C',
      MAIN_CATEGORY: 'D',
      SUB_CATEGORY: 'E',
      DESCRIPTION: 'F'
    },
    DASHBOARD: {
      START_DATE: 'A2',
      END_DATE: 'B2',
      PROJECTS: 'C2',
      OUTPUT_OVERTIME_AND_CATEGORY: 'B5', // 残業時間と業務比率の出力チェックボックス
      OUTPUT_PROJECT_BREAKDOWN: 'B6'      // 案件別作業時間の内訳の出力チェックボックス
    }
  }
} as const;

export const CATEGORY_MASTER = {
  MAIN: {
    SS_ID: import.meta.env.VITE_SS_ID_CATEGORY_MAIN,
  },
  SUB: {
    SS_ID: import.meta.env.VITE_SS_ID_CATEGORY_SUB,
  },
  SHEET_NAMES: ['WEB運用', 'WEB開発', 'WEB受託'] as const
} as const;

export const WORK_TIME = {
  REGULAR_HOURS_PER_DAY: 8, // 1日の所定労働時間
} as const;