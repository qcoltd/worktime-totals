import { describe, expect, it } from 'vitest';
import { CategoryTotalingService } from '../../src/application/CategoryTotalingService';
import { WorkEntry } from '../../src/domain/workEntry/WorkEntry';

describe('CategoryTotalingService', () => {
  const service = new CategoryTotalingService();

  describe('calculateMonthlySummary', () => {
    it('月次のカテゴリ別作業時間サマリーを計算できること', () => {
      const employeeEntries = new Map<string, WorkEntry[]>();
      
      // 従業員1のエントリー
      employeeEntries.set('従業員1', [
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '09:00',
          endTime: '12:00', // 3時間
          mainCategory: 'WEB開発',
          subCategory: 'コーディング',
          meeting: '',
          workContent: 'タスク1'
        }),
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '13:00',
          endTime: '17:00', // 4時間
          mainCategory: '運用',
          subCategory: '定例作業',
          meeting: '',
          workContent: 'タスク2'
        })
      ]);

      // 従業員2のエントリー
      employeeEntries.set('従業員2', [
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '09:00',
          endTime: '18:00', // 9時間
          mainCategory: 'WEB開発',
          subCategory: 'テスト',
          meeting: '',
          workContent: 'タスク3'
        })
      ]);

      const summary = service.calculateMonthlySummary(
        employeeEntries,
        new Date('2024/03/01')
      );

      // 期間の確認
      expect(summary.period.startDate).toBe('2024/03/01');
      expect(summary.period.endDate).toBe('2024/03/31');

      // 全体の集計確認
      const webDev = summary.totalsByCategory.find(t => t.category === 'WEB開発');
      expect(webDev?.hours).toBe(12); // 3時間 + 9時間
      const operation = summary.totalsByCategory.find(t => t.category === '運用');
      expect(operation?.hours).toBe(4); // 4時間

      // 従業員ごとの集計確認
      const emp1 = summary.employeeTotals.find(e => e.name === '従業員1');
      expect(emp1?.totals.find(t => t.category === 'WEB開発')?.hours).toBe(3);
      expect(emp1?.totals.find(t => t.category === '運用')?.hours).toBe(4);

      const emp2 = summary.employeeTotals.find(e => e.name === '従業員2');
      expect(emp2?.totals.find(t => t.category === 'WEB開発')?.hours).toBe(9);
    });

    it('休憩時間を除外して計算すること', () => {
      const employeeEntries = new Map<string, WorkEntry[]>();
      
      employeeEntries.set('従業員1', [
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '09:00',
          endTime: '12:00', // 3時間
          mainCategory: 'WEB開発',
          subCategory: 'コーディング',
          meeting: '',
          workContent: 'タスク1'
        }),
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '12:00',
          endTime: '13:00', // 1時間（休憩）
          mainCategory: '休憩',
          subCategory: '休憩',
          meeting: '',
          workContent: 'お昼休憩'
        })
      ]);

      const summary = service.calculateMonthlySummary(
        employeeEntries,
        new Date('2024/03/01')
      );

      const webDev = summary.totalsByCategory.find(t => t.category === 'WEB開発');
      expect(webDev?.hours).toBe(3); // 休憩時間は除外

      const emp1 = summary.employeeTotals.find(e => e.name === '従業員1');
      expect(emp1?.totals.find(t => t.category === 'WEB開発')?.hours).toBe(3);
      expect(emp1?.totals.find(t => t.category === '休憩')).toBeUndefined();
    });
  });
});  