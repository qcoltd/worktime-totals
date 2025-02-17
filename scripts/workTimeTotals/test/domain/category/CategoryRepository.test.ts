import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CategoryRepository } from '../../../src/domain/category/CategoryRepository';

// SpreadsheetAppのモック
const mockSheet = {
  getRange: vi.fn(),
  getValues: vi.fn(),
};

const mockSpreadsheet = {
  getSheetByName: vi.fn().mockReturnValue(mockSheet),
};

// @ts-ignore
global.SpreadsheetApp = {
  openById: vi.fn().mockReturnValue(mockSpreadsheet),
};

// 環境変数のモックをファイルの先頭で定義
vi.mock('../../../src/define');

describe('CategoryRepository', () => {
  let repository: CategoryRepository;

  describe('constructor', () => {
    it('スプレッドシートIDが設定されていない場合はエラーを投げること', async () => {
      // 各テストケースでモックの実装を設定
      vi.mocked(await import('../../../src/define')).CATEGORY_MASTER = {
        MAIN: {
          SS_ID: null,
        },
        SUB: {
          SS_ID: 'sub-spreadsheet-id',
        },
        SHEET_NAMES: ['WEB運用', 'WEB開発', 'WEB受託']
      };

      expect(() => new CategoryRepository())
        .toThrow('Spreadsheet IDs are not configured');
    });
  });

  describe('getMainCategories', () => {
    beforeEach(async () => {
      // 正常系のテスト用にモックを設定
      vi.mocked(await import('../../../src/define')).CATEGORY_MASTER = {
        MAIN: {
          SS_ID: 'main-spreadsheet-id',
        },
        SUB: {
          SS_ID: 'sub-spreadsheet-id',
        },
        SHEET_NAMES: ['WEB運用', 'WEB開発', 'WEB受託']
      };

      repository = new CategoryRepository();
      vi.clearAllMocks();
    });

    it('メインカテゴリの一覧を取得できること', () => {
      // モックの設定
      const mockValues = [
        ['カテゴリA'],
        ['カテゴリB'],
        ['カテゴリA'], // 重複
        [''],         // 空値
        ['カテゴリC'],
      ];

      mockSheet.getRange.mockReturnValue({ getValues: () => mockValues });
      mockSpreadsheet.getSheetByName.mockReturnValue(mockSheet);

      const categories = repository.getMainCategories();

      expect(categories).toEqual(['カテゴリA', 'カテゴリB', 'カテゴリC']);
      expect(SpreadsheetApp.openById).toHaveBeenCalledWith('main-spreadsheet-id');
    });

    // ... 他のエラーケースのテスト
  });

  describe('getSubCategories', () => {
    beforeEach(async () => {
      // 正常系のテスト用にモックを設定
      vi.mocked(await import('../../../src/define')).CATEGORY_MASTER = {
        MAIN: {
          SS_ID: 'main-spreadsheet-id',
        },
        SUB: {
          SS_ID: 'sub-spreadsheet-id',
        },
        SHEET_NAMES: ['WEB運用', 'WEB開発', 'WEB受託']
      };

      repository = new CategoryRepository();
      vi.clearAllMocks();
    });

    it('サブカテゴリの一覧を取得できること', () => {
      // モックの設定
      const mockValues = [
        ['開発環境構築'],
        ['コードレビュー'],
        ['開発環境構築'], // 重複
        [''],            // 空値
        ['テスト実装'],
      ];

      mockSheet.getRange.mockReturnValue({ getValues: () => mockValues });
      mockSpreadsheet.getSheetByName.mockReturnValue(mockSheet);

      const categories = repository.getSubCategories();

      expect(categories).toEqual(['コードレビュー', 'テスト実装', '開発環境構築']); // アルファベット順
      expect(SpreadsheetApp.openById).toHaveBeenCalledWith('sub-spreadsheet-id');
    });

    it('全シートのカテゴリを統合して返すこと', () => {
      // 各シートのモックデータ
      const mockSheetData = {
        'WEB運用': [['運用A'], ['運用B']],
        'WEB開発': [['開発A'], ['開発B']],
        'WEB受託': [['受託A'], ['受託B']],
      };

      // シートごとに異なる値を返すようにモックを設定
      let currentSheetName = '';
      mockSpreadsheet.getSheetByName.mockImplementation((name: string) => {
        currentSheetName = name;
        return mockSheet;
      });

      mockSheet.getRange.mockReturnValue({
        getValues: () => mockSheetData[currentSheetName] || []
      });

      const categories = repository.getSubCategories();

      expect(categories).toEqual([
        '受託A', '受託B',
        '開発A', '開発B',
        '運用A', '運用B'
      ].sort());
      expect(SpreadsheetApp.openById).toHaveBeenCalledWith('sub-spreadsheet-id');
      expect(mockSpreadsheet.getSheetByName).toHaveBeenCalledTimes(3); // 3シート分
    });
  });
}); 