import { describe, expect, it } from 'vitest';
import { SubCategoryTotalingService } from '../../src/application/SubCategoryTotalingService';
import { WorkEntry } from '../../src/domain/workEntry/WorkEntry';

describe('SubCategoryTotalingService', () => {
  const service = new SubCategoryTotalingService();

  describe('calculateSummary', () => {
    it('指定期間のサブカテゴリ別作業時間サマリーを計算できること', () => {
      const employeeEntries = new Map<string, WorkEntry[]>();
      
      // 従業員1のエントリー
      employeeEntries.set('従業員1', [
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '09:00',
          endTime: '12:00', // 3時間
          mainCategory: 'WEB開発',
          subCategory: 'コーディング',
          description: 'タスク1'
        }),
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '13:00',
          endTime: '17:00', // 4時間
          mainCategory: 'WEB開発',
          subCategory: 'テスト',
          description: 'タスク2'
        })
      ]);

      // 従業員2のエントリー
      employeeEntries.set('従業員2', [
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '09:00',
          endTime: '18:00', // 9時間
          mainCategory: 'WEB開発',
          subCategory: 'コーディング',
          description: 'タスク3'
        })
      ]);

      const summary = service.calculateSummary(
        employeeEntries,
        'WEB開発',
        new Date('2024/03/01'),
        new Date('2024/03/31')
      );

      // 期間の確認
      expect(summary.period.startDate).toBe('2024/03/01');
      expect(summary.period.endDate).toBe('2024/03/31');
      expect(summary.mainCategory).toBe('WEB開発');

      // 全体の集計確認
      const coding = summary.totalsBySubCategory.find(t => t.subCategory === 'コーディング');
      expect(coding?.hours).toBe(12); // 3時間 + 9時間
      const testing = summary.totalsBySubCategory.find(t => t.subCategory === 'テスト');
      expect(testing?.hours).toBe(4);

      // 従業員ごとの集計確認
      const emp1 = summary.employeeTotals.find(e => e.name === '従業員1');
      expect(emp1?.totals.find(t => t.subCategory === 'コーディング')?.hours).toBe(3);
      expect(emp1?.totals.find(t => t.subCategory === 'テスト')?.hours).toBe(4);

      const emp2 = summary.employeeTotals.find(e => e.name === '従業員2');
      expect(emp2?.totals.find(t => t.subCategory === 'コーディング')?.hours).toBe(9);
    });
  });
}); 