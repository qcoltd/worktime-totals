import { describe, expect, it } from 'vitest';
import { OvertimeCalculator } from '../../../src/domain/overtime/OvertimeCalculator';
import { WorkEntry } from '../../../src/domain/workEntry/WorkEntry';
import { dayjsLib } from '../../../src/libs/dayjs';

describe('OvertimeCalculator', () => {
  describe('calculateTotal', () => {
    it('期間全体の残業時間を計算できること', () => {
      const entries = [
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '09:00',
          endTime: '18:00', // 1時間の残業
          mainCategory: 'WEB開発',
          subCategory: 'コーディング',
          description: 'タスク1'
        }),
        new WorkEntry({
          date: new Date('2024/03/02'),
          startTime: '09:00',
          endTime: '19:00', // 2時間の残業
          mainCategory: 'WEB開発',
          subCategory: 'テスト',
          description: 'タスク2'
        })
      ];

      expect(OvertimeCalculator.calculateTotal(entries)).toBe(3); // 1時間 + 2時間
    });

    it('休憩時間を除外して計算すること', () => {
      const entries = [
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '09:00',
          endTime: '18:00',
          mainCategory: 'WEB開発',
          subCategory: 'コーディング',
          description: 'タスク1'
        }),
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '12:00',
          endTime: '13:00',
          mainCategory: '休憩',
          subCategory: '休憩',
          description: 'お昼休憩'
        })
      ];

      expect(OvertimeCalculator.calculateTotal(entries)).toBe(1);
    });

    it('日付を跨ぐ残業時間を計算できること', () => {
      const entries = [
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '19:00',
          endTime: '02:00', // 翌日2時まで（7時間の作業）
          mainCategory: 'WEB開発',
          subCategory: 'コーディング',
          description: 'タスク1'
        })
      ];

      // 7時間の作業のうち、所定労働時間8時間を超えた分はないので残業は0時間
      expect(OvertimeCalculator.calculateTotal(entries)).toBe(0);

      // 長時間作業のケース
      const longEntries = [
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '09:00',
          endTime: '02:00', // 翌日2時まで（17時間の作業）
          mainCategory: 'WEB開発',
          subCategory: 'コーディング',
          description: 'タスク1'
        })
      ];

      // 17時間の作業のうち、所定労働時間8時間を超えた9時間が残業
      expect(OvertimeCalculator.calculateTotal(longEntries)).toBe(9);
    });
  });

  describe('calculateByDate', () => {
    it('日付ごとの残業時間を計算できること', () => {
      const date1 = new Date('2024/03/01');
      const date2 = new Date('2024/03/02');
      const entries = [
        new WorkEntry({
          date: date1,
          startTime: '09:00',
          endTime: '18:00', // 1時間の残業
          mainCategory: 'WEB開発',
          subCategory: 'コーディング',
          description: 'タスク1'
        }),
        new WorkEntry({
          date: date2,
          startTime: '09:00',
          endTime: '19:00', // 2時間の残業
          mainCategory: 'WEB開発',
          subCategory: 'テスト',
          description: 'タスク2'
        })
      ];

      const overtimeByDate = OvertimeCalculator.calculateByDate(entries);
      const date1Str = dayjsLib.formatDate(date1);
      const date2Str = dayjsLib.formatDate(date2);

      expect(overtimeByDate.get(date1Str)).toBe(1);
      expect(overtimeByDate.get(date2Str)).toBe(2);
    });
  });
}); 