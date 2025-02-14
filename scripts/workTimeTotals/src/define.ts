// NOTE: 内容未調整
export const WORK_ENTRIES = {
  SS_ID: import.meta.env.VITE_SS_ID_WORK_ENTRIES,
  SHEET_NAME: {
    ENTRIES: 'WorkEntries'
  },
  COLUMNS: {
    DATE: 'date',
    START_TIME: 'startTime',
    END_TIME: 'endTime',
    MAIN_CATEGORY: 'mainCategory',
    SUB_CATEGORY: 'subCategory',
    DESCRIPTION: 'description'
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