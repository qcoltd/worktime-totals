import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SpreadsheetAdapter } from '../../src/infrastructure/SpreadsheetAdapter';
import { WorkEntry } from '../../src/domain/workEntry/WorkEntry';
import { WorkEntryCollection } from '../../src/domain/workEntry/WorkEntryCollection';
import { WorktimeError, ErrorCodes } from '../../src/domain/error/WorktimeError';

// SpreadsheetAppのモック
const mockSheet = {
  getDataRange: vi.fn(),
  getValues: vi.fn(),
  clearContents: vi.fn(),
  getRange: vi.fn(),
  setValues: vi.fn(),
};

const mockSpreadsheet = {
  getSheetByName: vi.fn().mockReturnValue(mockSheet),
};

// @ts-ignore
global.SpreadsheetApp = {
  openById: vi.fn().mockReturnValue(mockSpreadsheet),
};

describe('SpreadsheetAdapter', () => {
  const TEST_SPREADSHEET_ID = 'test-spreadsheet-id';
  const TEST_SHEET_NAME = 'work-entries';
  let adapter: SpreadsheetAdapter;

  beforeEach(() => {
    adapter = new SpreadsheetAdapter(TEST_SPREADSHEET_ID, TEST_SHEET_NAME);
    vi.clearAllMocks();
  });

  describe('readWorkEntries', () => {
    it('スプレッドシートからWorkEntryを読み込めること', () => {
      // モックデータの準備
      const mockSheet = {
        getRange: vi.fn().mockReturnValue({
          getValues: vi.fn().mockReturnValue([
            [
              new Date('2025/02/12'),
              new Date('1899/12/30 10:00:00'),
              new Date('1899/12/30 12:00:00'),
              '学習',
              '開発',
              '技術研修'
            ]
          ])
        }),
        getName: vi.fn().mockReturnValue('20250212')
      };

      vi.mocked(SpreadsheetApp.openById).mockReturnValue({
        getSheetByName: vi.fn().mockReturnValue(mockSheet)
      } as any);

      const adapter = new SpreadsheetAdapter('test-id', '20250212');
      const result = adapter.readWorkEntries();

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].date.toISOString()).toBe(new Date('2025/02/12').toISOString());
      expect(result.entries[0].startTime).toBe('10:00');
      expect(result.entries[0].endTime).toBe('12:00');
      expect(result.entries[0].mainCategory).toBe('学習');
      expect(result.entries[0].subCategory).toBe('開発');
      expect(result.entries[0].description).toBe('技術研修');

      // 正しい範囲からデータを取得していることを確認
      expect(mockSheet.getRange).toHaveBeenCalledWith('I3:N');
    });

    it('空の行はスキップされること', () => {
      const mockSheet = {
        getRange: vi.fn().mockReturnValue({
          getValues: vi.fn().mockReturnValue([
            [
              new Date('2025/02/12'),
              new Date('1899/12/30 10:00:00'),
              new Date('1899/12/30 12:00:00'),
              '学習',
              '開発',
              '技術研修'
            ],
            [null, null, null, '', '', ''], // 空の行
            [
              new Date('2025/02/12'),
              new Date('1899/12/30 13:00:00'),
              new Date('1899/12/30 15:00:00'),
              '運用',
              '定例作業',
              '日次確認'
            ]
          ])
        }),
        getName: vi.fn().mockReturnValue('20250212')
      };

      vi.mocked(SpreadsheetApp.openById).mockReturnValue({
        getSheetByName: vi.fn().mockReturnValue(mockSheet)
      } as any);

      const adapter = new SpreadsheetAdapter('test-id', '20250212');
      const result = adapter.readWorkEntries();

      expect(result.entries).toHaveLength(2); // 空の行は除外される
    });

    it('行データのパースに失敗した場合はINVALID_SHEET_FORMATエラーを投げること', () => {
      const mockSheet = {
        getRange: vi.fn().mockReturnValue({
          getValues: vi.fn().mockReturnValue([
            [
              'invalid-date', // 不正な日付
              '10:00',
              '12:00',
              '学習',
              '開発',
              '技術研修'
            ]
          ])
        }),
        getName: vi.fn().mockReturnValue('20250212')
      };

      vi.mocked(SpreadsheetApp.openById).mockReturnValue({
        getSheetByName: vi.fn().mockReturnValue(mockSheet)
      } as any);

      const adapter = new SpreadsheetAdapter('test-id', '20250212');

      expect(() => adapter.readWorkEntries()).toThrow(WorktimeError);
      try {
        adapter.readWorkEntries();
      } catch (error) {
        expect(error instanceof WorktimeError).toBe(true);
        expect(error.code).toBe(ErrorCodes.INVALID_SHEET_FORMAT);
        expect(error.details).toBeDefined();
        expect(error.message).toContain('Failed to parse row 3');
      }
    });

    it('シートが存在しない場合はSHEET_NOT_FOUNDエラーを投げること', () => {
      vi.mocked(SpreadsheetApp.openById).mockReturnValue({
        getSheetByName: vi.fn().mockReturnValue(null)
      } as any);

      const adapter = new SpreadsheetAdapter('test-id', '20250212');
      expect(() => adapter.readWorkEntries()).toThrow(WorktimeError);
      try {
        adapter.readWorkEntries();
      } catch (error) {
        expect(error instanceof WorktimeError).toBe(true);
        expect(error.code).toBe(ErrorCodes.SHEET_NOT_FOUND);
      }
    });

    it('存在しない日付の場合はエラーを投げること', () => {
      const mockSheet = {
        getRange: vi.fn().mockReturnValue({
          getValues: vi.fn().mockReturnValue([
            [
              '2025/02/31', // 不正な日付
              new Date('1899/12/30 10:00:00'),
              new Date('1899/12/30 12:00:00'),
              '学習',
              '開発',
              '技術研修'
            ]
          ])
        }),
        getName: vi.fn().mockReturnValue('20250212')
      };

      vi.mocked(SpreadsheetApp.openById).mockReturnValue({
        getSheetByName: vi.fn().mockReturnValue(mockSheet)
      } as any);

      const adapter = new SpreadsheetAdapter('test-id', '20250212');
      expect(() => adapter.readWorkEntries()).toThrow(WorktimeError);
      
      try {
        adapter.readWorkEntries();
      } catch (error) {
        expect(error instanceof WorktimeError).toBe(true);
        expect(error.code).toBe(ErrorCodes.INVALID_SHEET_FORMAT);
        expect(error.details).toBeDefined();
        expect(error.message).toContain('Failed to parse row 3');
      }
    });
  });

  describe('writeWorkEntries', () => {
    it('WorkEntryCollectionをスプレッドシートに書き込めること', () => {
      const mockSheet = {
        getRange: vi.fn().mockReturnValue({
          setValues: vi.fn()
        }),
        clear: vi.fn() // clearContentsの代わりにclearを使用
      };

      vi.mocked(SpreadsheetApp.openById).mockReturnValue({
        getSheetByName: vi.fn().mockReturnValue(mockSheet)
      } as any);

      const adapter = new SpreadsheetAdapter('test-id', '20250212');
      const collection = new WorkEntryCollection();
      collection.add(new WorkEntry({
        date: new Date('2025/02/12'),
        startTime: '10:00',
        endTime: '12:00',
        mainCategory: '学習',
        subCategory: '開発',
        description: '技術研修'
      }));

      adapter.writeWorkEntries(collection);

      // シートのクリアが呼ばれたことを確認
      expect(mockSheet.clear).toHaveBeenCalled();

      // 正しい値が書き込まれたことを確認
      expect(mockSheet.getRange).toHaveBeenCalledTimes(2); // ヘッダーとデータ
      expect(mockSheet.getRange).toHaveBeenNthCalledWith(1, 1, 1, 1, 6); // ヘッダー
      expect(mockSheet.getRange).toHaveBeenNthCalledWith(2, 2, 1, 1, 6); // データ
    });

    it('空のコレクションの場合はヘッダーのみ書き込むこと', () => {
      const mockSheet = {
        getRange: vi.fn().mockReturnValue({
          setValues: vi.fn()
        }),
        clear: vi.fn()
      };

      vi.mocked(SpreadsheetApp.openById).mockReturnValue({
        getSheetByName: vi.fn().mockReturnValue(mockSheet)
      } as any);

      const adapter = new SpreadsheetAdapter('test-id', '20250212');
      const collection = new WorkEntryCollection();

      adapter.writeWorkEntries(collection);

      // シートのクリアが呼ばれたことを確認
      expect(mockSheet.clear).toHaveBeenCalled();

      // ヘッダーのみ書き込まれたことを確認
      expect(mockSheet.getRange).toHaveBeenCalledTimes(1);
      expect(mockSheet.getRange).toHaveBeenCalledWith(1, 1, 1, 6);
    });
  });
}); 