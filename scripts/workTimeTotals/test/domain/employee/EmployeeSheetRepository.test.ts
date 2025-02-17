import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EmployeeSheetRepository } from '../../../src/domain/employee/EmployeeSheetRepository';
import { SpreadsheetAdapter } from '../../../src/infrastructure/SpreadsheetAdapter';
import { WorktimeError, ErrorCodes } from '../../../src/domain/error/WorktimeError';

// SpreadsheetAdapterのモック
vi.mock('../../../src/infrastructure/SpreadsheetAdapter', () => {
  const MockSpreadsheetAdapter = vi.fn();
  MockSpreadsheetAdapter.prototype.setSheetName = vi.fn();
  MockSpreadsheetAdapter.prototype.getColumnValues = vi.fn();
  return {
    SpreadsheetAdapter: MockSpreadsheetAdapter
  };
});

// define.tsのモック
vi.mock('../../../src/define', () => ({
  TOTALING_SHEET: {
    SS_ID: 'test-spreadsheet-id',
    SHEET_NAME: {
      EMPLOYEE_LIST: '棚卸しシートリスト',
      WORK_ENTRIES: 'WorkEntries'
    },
    COLUMNS: {
      EMPLOYEE_LIST: {
        NAME: 'A',
        SHEET_URL: 'B'
      }
    }
  }
}));

describe('EmployeeSheetRepository', () => {
  let repository: EmployeeSheetRepository;
  let mockAdapter: SpreadsheetAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new EmployeeSheetRepository();
    mockAdapter = (SpreadsheetAdapter as any).mock.instances[0];
  });

  describe('findAll', () => {
    it('従業員シート一覧を取得できること', () => {
      // モックの戻り値を設定
      (mockAdapter.getColumnValues as any)
        .mockReturnValueOnce(['山田太郎', '鈴木花子']) // 名前の列
        .mockReturnValueOnce([  // URLの列
          'https://docs.google.com/spreadsheets/d/1234567890abcdef/edit',
          'https://docs.google.com/spreadsheets/d/abcdef1234567890/edit'
        ]);

      const sheets = repository.findAll();

      expect(sheets).toHaveLength(2);
      expect(sheets[0].name).toBe('山田太郎');
      expect(sheets[0].spreadsheetId).toBe('1234567890abcdef');
      expect(sheets[1].name).toBe('鈴木花子');
      expect(sheets[1].spreadsheetId).toBe('abcdef1234567890');

      // シート名とカラムの指定が正しいことを確認
      expect(mockAdapter.setSheetName).toHaveBeenCalledWith('棚卸しシートリスト');
      expect(mockAdapter.getColumnValues).toHaveBeenCalledWith('A');
      expect(mockAdapter.getColumnValues).toHaveBeenCalledWith('B');
    });

    it('空の行は除外されること', () => {
      (mockAdapter.getColumnValues as any)
        .mockReturnValueOnce(['山田太郎', '', '鈴木花子']) // 名前の列（空の行あり）
        .mockReturnValueOnce([  // URLの列
          'https://docs.google.com/spreadsheets/d/1234567890abcdef/edit',
          '',
          'https://docs.google.com/spreadsheets/d/abcdef1234567890/edit'
        ]);

      const sheets = repository.findAll();

      expect(sheets).toHaveLength(2);
      expect(sheets[0].name).toBe('山田太郎');
      expect(sheets[1].name).toBe('鈴木花子');
    });

    it('スプレッドシートへのアクセスに失敗した場合はエラーを投げること', () => {
      (mockAdapter.getColumnValues as any).mockImplementation(() => {
        throw new Error('Access denied');
      });

      expect(() => repository.findAll())
        .toThrow(WorktimeError);
      
      try {
        repository.findAll();
      } catch (error) {
        expect(error instanceof WorktimeError).toBe(true);
        expect(error.code).toBe(ErrorCodes.SHEET_ACCESS_ERROR);
      }
    });
  });
}); 