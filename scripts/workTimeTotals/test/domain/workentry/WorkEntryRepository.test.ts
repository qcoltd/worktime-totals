import { describe, expect, it, vi, beforeEach } from 'vitest';
import { WorkEntryRepository } from '../../../src/domain/workEntry/WorkEntryRepository';
import { WorkEntryCollection } from '../../../src/domain/workEntry/WorkEntryCollection';
import { WorkEntry } from '../../../src/domain/workEntry/WorkEntry';
import { WorktimeError, ErrorCodes } from '../../../src/domain/error/WorktimeError';
import { SpreadsheetAdapter } from '../../../src/infrastructure/SpreadsheetAdapter';

// SpreadsheetAdapterのモック
vi.mock('../../../src/infrastructure/SpreadsheetAdapter', () => {
  const MockSpreadsheetAdapter = vi.fn();
  MockSpreadsheetAdapter.prototype.writeWorkEntries = vi.fn();
  MockSpreadsheetAdapter.prototype.readWorkEntries = vi.fn();
  MockSpreadsheetAdapter.prototype.setSheetName = vi.fn();
  MockSpreadsheetAdapter.prototype.getValues = vi.fn();
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
    }
  }
}));

describe('WorkEntryRepository', () => {
  const TEST_SPREADSHEET_ID = 'test-spreadsheet-id';
  let repository: WorkEntryRepository;
  let mockAdapter: any;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new WorkEntryRepository(TEST_SPREADSHEET_ID);
    mockAdapter = vi.mocked(SpreadsheetAdapter).mock.instances[0];
  });

  describe('constructor', () => {
    it('スプレッドシートIDが未指定の場合はエラーを投げること', () => {
      expect(() => new WorkEntryRepository('')).toThrow('Spreadsheet ID is required');
    });
  });

  describe('findByDateRange', () => {
    it('指定された期間内のWorkEntryを取得できること', () => {
      // getValuesのモックデータを設定 - I3:N の範囲のデータ形式に合わせる
      const mockValues = [
        [new Date('2024/03/01'), '09:00', '17:30', 'WEB開発', 'コーディング', 'タスク1'],
        [new Date('2024/03/15'), '10:00', '18:00', 'WEB運用', '定例作業', 'タスク2']
      ];
      vi.mocked(mockAdapter.getValues).mockReturnValue(mockValues);

      const result = repository.findByDateRange(
        new Date('2024/03/10'),
        new Date('2024/03/20')
      );

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].description).toBe('タスク2');
    });
  });

  describe('save', () => {
    it('WorkEntryCollectionを保存できること', () => {
      const entries = new WorkEntryCollection();
      entries.add(new WorkEntry({
        date: new Date('2024/03/01'),
        startTime: '09:00',
        endTime: '17:30',
        mainCategory: 'WEB開発',
        subCategory: 'コーディング',
        description: 'タスク1'
      }));

      repository.save(entries);
      expect(mockAdapter.writeWorkEntries).toHaveBeenCalledWith(entries);
    });

    it('保存時にエラーが発生した場合はWorkTimeErrorを投げること', () => {
      const entries = new WorkEntryCollection();
      vi.mocked(mockAdapter.writeWorkEntries).mockImplementation(() => {
        throw new Error('Some error');
      });

      expect(() => repository.save(entries))
        .toThrow(WorktimeError);
      expect(() => repository.save(entries))
        .toThrow('Failed to save work entries');
    });
  });

  describe('findAll', () => {
    it('WorkEntriesシートからデータを取得できること', () => {
      // getValuesのモックデータを設定 - I3:N の範囲のデータ形式に合わせる
      const mockValues = [
        [new Date('2024/03/01'), '09:00', '17:30', 'WEB開発', 'コーディング', 'タスク1']  // ヘッダー行なし
      ];
      vi.mocked(mockAdapter.getValues).mockReturnValue(mockValues);

      const result = repository.findAll();
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].description).toBe('タスク1');
    });
  });
}); 