import { describe, expect, it, vi } from 'vitest';
import { DashboardRepository } from '../../../src/domain/dashboard/DashboardRepository';
import { WorktimeError } from '../../../src/domain/error/WorktimeError';

describe('DashboardRepository', () => {
  const mockSpreadsheetId = 'mock-spreadsheet-id';
  const repository = new DashboardRepository(mockSpreadsheetId);

  describe('getSettings', () => {
    it('ダッシュボードの設定を取得できること', () => {
      // モックの設定
      const mockSheet = {
        getRange: vi.fn().mockReturnValueOnce({
          getValue: () => new Date('2024/03/01')
        }).mockReturnValueOnce({
          getValue: () => new Date('2024/03/31')
        }).mockReturnValueOnce({
          getValue: () => '福島駅再開発, 109_新規ページ制作'
        })
      };

      const mockSpreadsheet = {
        getSheetByName: vi.fn().mockReturnValue(mockSheet)
      };

      global.SpreadsheetApp = {
        openById: vi.fn().mockReturnValue(mockSpreadsheet)
      } as any;

      const settings = repository.getSettings();

      expect(settings.startDate).toEqual(new Date('2024/03/01'));
      expect(settings.endDate).toEqual(new Date('2024/03/31'));
      expect(settings.targetProjects).toEqual(['福島駅再開発', '109_新規ページ制作']);
    });

    it('シートが存在しない場合はエラーを投げること', () => {
      const mockSpreadsheet = {
        getSheetByName: vi.fn().mockReturnValue(null)
      };

      global.SpreadsheetApp = {
        openById: vi.fn().mockReturnValue(mockSpreadsheet)
      } as any;

      expect(() => repository.getSettings()).toThrow(WorktimeError);
    });
  });
}); 