// NOTE: 内容未調整
export const TOTALING_SHEET = {
  SS_ID: import.meta.env.VITE_SS_ID_TOTALING_SHEET,
  SHEET_NAME: {
    EMPLOYEE_LIST: '棚卸しシートリスト',
    WORK_ENTRIES: 'WorkEntries'
  },
  COLUMNS: {
    // 棚卸しシートリスト用
    EMPLOYEE_LIST: {
      NAME: 'A',
      SHEET_URL: 'B'
    },
    // 作業時間エントリー用
    WORK_ENTRIES: {
      DATE: 'date',
      START_TIME: 'startTime',
      END_TIME: 'endTime',
      MAIN_CATEGORY: 'mainCategory',
      SUB_CATEGORY: 'subCategory',
      DESCRIPTION: 'description'
    }
  }
} as const;

export const CATEGORY_MASTER = {
  MAIN: {
    SS_ID: import.meta.env.VITE_SS_ID_CATEGORY_MASTER,
  },
  SUB: {
    SS_ID: import.meta.env.VITE_SS_ID_CATEGORY_SUB,
  },
  SHEET_NAMES: ['WEB運用', 'WEB開発', 'WEB受託'] as const
} as const;

export const WORK_TIME = {
  REGULAR_HOURS_PER_DAY: 8, // 1日の所定労働時間
} as const;