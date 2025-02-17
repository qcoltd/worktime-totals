import { describe, expect, it } from 'vitest';
import { CategoryCalculator } from '../../../src/domain/category/CategoryCalculator';
import { WorkEntry } from '../../../src/domain/workEntry/WorkEntry';

describe('CategoryCalculator', () => {
  describe('calculateTotalsByCategory', () => {
    it('カテゴリごとの作業時間を計算できること', () => {
      const entries = [
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
        }),
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '17:00',
          endTime: '18:00', // 1時間
          mainCategory: '運用',
          subCategory: '定例作業',
          description: 'タスク3'
        })
      ];

      const totals = CategoryCalculator.calculateTotalsByCategory(entries);
      expect(totals.get('WEB開発')).toBe(7); // 3時間 + 4時間
      expect(totals.get('運用')).toBe(1); // 1時間
    });

    it('休憩時間を除外して計算すること', () => {
      const entries = [
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
          startTime: '12:00',
          endTime: '13:00', // 1時間（休憩）
          mainCategory: '休憩',
          subCategory: '休憩',
          description: 'お昼休憩'
        }),
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '13:00',
          endTime: '15:00', // 2時間
          mainCategory: 'WEB開発',
          subCategory: 'テスト',
          description: 'タスク2'
        })
      ];

      const totals = CategoryCalculator.calculateTotalsByCategory(entries);
      expect(totals.get('WEB開発')).toBe(5); // 3時間 + 2時間
      expect(totals.get('休憩')).toBeUndefined(); // 休憩は含まれない
    });

    it('日付を跨ぐ作業時間を計算できること', () => {
      const entries = [
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '22:00',
          endTime: '01:00', // 3時間
          mainCategory: 'WEB開発',
          subCategory: 'コーディング',
          description: 'タスク1'
        }),
        new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '09:00',
          endTime: '17:00', // 8時間
          mainCategory: 'WEB開発',
          subCategory: 'テスト',
          description: 'タスク2'
        })
      ];

      const totals = CategoryCalculator.calculateTotalsByCategory(entries);
      expect(totals.get('WEB開発')).toBe(11); // 3時間 + 8時間
    });
  });
}); 