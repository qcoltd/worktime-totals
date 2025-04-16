import { describe, expect, it } from 'vitest';
import { OvertimeCalculationService } from '../../src/application/OvertimeCalculationService';
import { WorkEntry } from '../../src/domain/workEntry/WorkEntry';

describe('OvertimeCalculationService', () => {
  const service = new OvertimeCalculationService();

  describe('calculateMonthlySummary', () => {
    it('月次の残業時間サマリーを計算できること', () => {
      const employeeEntries = new Map<string, WorkEntry[]>();
      
      // 従業員1のエントリー
      employeeEntries.set('従業員1', [
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '09:00',
          endTime: '18:00', // 1時間の残業
          mainCategory: 'WEB開発',
          subCategory: 'コーディング',
          meeting: '',
          workContent: 'タスク1'
        }),
        new WorkEntry({
          date: new Date('2024/03/08'),
          startTime: '09:00',
          endTime: '19:00', // 2時間の残業
          mainCategory: 'WEB開発',
          subCategory: 'テスト',
          meeting: '',
          workContent: 'タスク2'
        })
      ]);

      // 従業員2のエントリー
      employeeEntries.set('従業員2', [
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '09:00',
          endTime: '20:00', // 3時間の残業
          mainCategory: 'WEB開発',
          subCategory: 'コーディング',
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

      // 合計と平均の確認
      expect(summary.total).toBe(6); // 1 + 2 + 3 = 6時間
      expect(summary.average).toBe(3); // 6時間 ÷ 2人 = 3時間

      // 従業員ごとの確認
      const emp1 = summary.employees.find(e => e.name === '従業員1');
      expect(emp1?.total).toBe(3); // 1 + 2 = 3時間
      expect(emp1?.weekly[0].hours).toBe(1); // 第1週
      expect(emp1?.weekly[1].hours).toBe(2); // 第2週

      const emp2 = summary.employees.find(e => e.name === '従業員2');
      expect(emp2?.total).toBe(3); // 3時間
      expect(emp2?.weekly[0].hours).toBe(3); // 第1週

      // 週次平均の確認
      expect(summary.weeklyAverages.get(1)).toBe(2); // 第1週: (1 + 3) ÷ 2 = 2時間
      expect(summary.weeklyAverages.get(2)).toBe(1); // 第2週: (2 + 0) ÷ 2 = 1時間
    });
  });

  // 他のテストケースも追加
}); 