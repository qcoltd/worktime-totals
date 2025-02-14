import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SpreadsheetAdapter } from '../../src/infrastructure/SpreadsheetAdapter';
import { WorkEntry } from '../../src/domain/workEntry/WorkEntry';
import { WorkEntryCollection } from '../../src/domain/workEntry/WorkEntryCollection';

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
      const mockData = [
        ['date', 'startTime', 'endTime', 'mainCategory', 'subCategory', 'description'],
        [new Date('2025/02/12'), '10:00', '12:00', '学習', '開発', '技術研修']
      ];

      mockSheet.getDataRange.mockReturnValue({ getValues: () => mockData });

      const collection = adapter.readWorkEntries();

      expect(collection.entries).toHaveLength(1);
      const entry = collection.entries[0];
      expect(entry.date).toEqual(new Date('2025/02/12'));
      expect(entry.startTime).toBe('10:00');
      expect(entry.mainCategory).toBe('学習');
    });

    it('シートが存在しない場合はエラーを投げること', () => {
      mockSpreadsheet.getSheetByName.mockReturnValue(null);

      expect(() => adapter.readWorkEntries()).toThrow('Sheet not found');
    });
  });

  describe('writeWorkEntries', () => {
    beforeEach(() => {
      // writeWorkEntries用のモックをリセット
      mockSpreadsheet.getSheetByName.mockReturnValue(mockSheet);
      const mockRange = {
        setValues: vi.fn(),
      };
      mockSheet.getRange.mockReturnValue(mockRange);
    });

    it('WorkEntryCollectionをスプレッドシートに書き込めること', () => {
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

      // ヘッダーの書き込みを確認
      expect(mockSheet.getRange).toHaveBeenCalledWith(1, 1, 1, 6);
      
      // データの書き込みを確認
      expect(mockSheet.getRange).toHaveBeenCalledWith(2, 1, 1, 6);
      
      // クリア処理の確認
      expect(mockSheet.clearContents).toHaveBeenCalled();
    });

    it('空のコレクションの場合はヘッダーのみ書き込むこと', () => {
      const collection = new WorkEntryCollection();

      adapter.writeWorkEntries(collection);

      // ヘッダーの書き込みのみ確認
      expect(mockSheet.getRange).toHaveBeenCalledTimes(1);
      expect(mockSheet.getRange).toHaveBeenCalledWith(1, 1, 1, 6);
    });
  });
}); 