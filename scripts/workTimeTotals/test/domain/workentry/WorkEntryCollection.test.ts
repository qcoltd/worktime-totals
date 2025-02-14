import { describe, expect, it } from 'vitest';
import { WorkEntry } from '../../../src/domain/workEntry/WorkEntry';
import { WorkEntryCollection } from '../../../src/domain/workEntry/WorkEntryCollection';

describe('WorkEntryCollection', () => {
  describe('基本機能', () => {
    it('WorkEntryを追加できること', () => {
      const collection = new WorkEntryCollection();
      const entry = new WorkEntry({
        date: new Date('2025/02/12'),
        startTime: '10:00',
        endTime: '12:00',
        mainCategory: '学習',
        subCategory: '開発',
        description: '技術研修'
      });

      collection.add(entry);
      expect(collection.entries).toHaveLength(1);
      expect(collection.entries[0]).toBe(entry);
    });

    it('日付でフィルタリングできること', () => {
      const collection = new WorkEntryCollection();
      const entry1 = new WorkEntry({
        date: new Date('2025/02/12'),
        startTime: '10:00',
        endTime: '12:00',
        mainCategory: '学習',
        subCategory: '開発',
        description: '技術研修'
      });
      const entry2 = new WorkEntry({
        date: new Date('2025/02/13'),
        startTime: '13:00',
        endTime: '15:00',
        mainCategory: '学習',
        subCategory: '開発',
        description: '技術研修2日目'
      });

      collection.add(entry1);
      collection.add(entry2);

      const filtered = collection.filterByDate(new Date('2025/02/12'));
      expect(filtered.entries).toHaveLength(1);
      expect(filtered.entries[0]).toBe(entry1);
    });
  });

  describe('集計機能', () => {
    it('総作業時間を計算できること', () => {
      const collection = new WorkEntryCollection();
      collection.add(new WorkEntry({
        date: new Date('2025/02/12'),
        startTime: '10:00',
        endTime: '12:00',
        mainCategory: '学習',
        subCategory: '開発',
        description: '午前の部'
      }));
      collection.add(new WorkEntry({
        date: new Date('2025/02/12'),
        startTime: '13:00',
        endTime: '17:30',
        mainCategory: '学習',
        subCategory: '開発',
        description: '午後の部'
      }));

      expect(collection.totalDuration()).toBe(6.5); // 2時間 + 4.5時間
    });

    it('カテゴリごとの作業時間を計算できること', () => {
      const collection = new WorkEntryCollection();
      collection.add(new WorkEntry({
        date: new Date('2025/02/12'),
        startTime: '10:00',
        endTime: '12:00',
        mainCategory: '学習',
        subCategory: '開発',
        description: '技術研修'
      }));
      collection.add(new WorkEntry({
        date: new Date('2025/02/12'),
        startTime: '13:00',
        endTime: '15:00',
        mainCategory: '運用',
        subCategory: '定例作業',
        description: '日次確認'
      }));

      const categoryTotals = collection.totalDurationByCategory();
      expect(categoryTotals.get('学習')).toBe(2);
      expect(categoryTotals.get('運用')).toBe(2);
    });
  });
}); 