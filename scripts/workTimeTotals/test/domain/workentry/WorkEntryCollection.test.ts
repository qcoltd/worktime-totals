import { describe, expect, it } from 'vitest';
import { WorkEntry } from '../../../src/domain/workEntry/WorkEntry';
import { WorkEntryCollection } from '../../../src/domain/workEntry/WorkEntryCollection';
import { dayjsLib } from '../../../src/libs/dayjs';

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
        meeting: '',
        workContent: '技術研修'
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
        meeting: '',
        workContent: '技術研修'
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
        meeting: '',
        workContent: '技術研修'
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

    describe('totalDuration', () => {
      it('休憩時間を除外して合計時間を計算すること', () => {
        const collection = new WorkEntryCollection();
        
        // 通常の作業
        collection.add(new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '09:00',
          endTime: '12:00',
          mainCategory: 'WEB開発',
          subCategory: 'コーディング',
          description: 'タスク1'
        }));

        // 休憩時間
        collection.add(new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '12:00',
          endTime: '13:00',
          mainCategory: '休憩',
          subCategory: '休憩',
          description: 'お昼休憩'
        }));

        // 通常の作業
        collection.add(new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '13:00',
          endTime: '17:30',
          mainCategory: 'WEB開発',
          subCategory: 'テスト',
          description: 'タスク2'
        }));

        expect(collection.totalDuration()).toBe(7.5); // 3時間 + 4.5時間 = 7.5時間
      });
    });

    describe('totalDurationByCategory', () => {
      it('CategoryCalculatorを使用してカテゴリごとの合計時間を計算すること', () => {
        const collection = new WorkEntryCollection();
        
        // WEB開発カテゴリの作業
        collection.add(new WorkEntry({
          date: new Date('2024/03/01'),
          startTime: '09:00',
          endTime: '12:00',
          mainCategory: 'WEB開発',
          subCategory: 'コーディング',
          description: 'タスク1'
        }));

        const totals = collection.totalDurationByCategory();
        expect(totals.get('WEB開発')).toBe(3);
      });
    });

    it('日付を跨ぐ作業時間を計算できること', () => {
      const collection = new WorkEntryCollection();
      
      // 19:00から翌0:00まで（5時間）
      collection.add(new WorkEntry({
        date: new Date('2025/02/24'),
        startTime: '19:00',
        endTime: '00:00',
        mainCategory: 'その他',
        subCategory: '予定立て・日報',
        description: '勤怠集計 仕様の確認'
      }));

      expect(collection.totalDuration()).toBe(5);

      // 19:00から翌2:00まで（7時間）
      const collection2 = new WorkEntryCollection();
      collection2.add(new WorkEntry({
        date: new Date('2025/02/24'),
        startTime: '19:00',
        endTime: '02:00',
        mainCategory: 'その他',
        subCategory: '予定立て・日報',
        description: '勤怠集計 仕様の確認'
      }));

      expect(collection2.totalDuration()).toBe(7);
    });
  });

  describe('残業時間計算', () => {
    it('1日の所定労働時間を超えた分を残業として計算できること', () => {
      const collection = new WorkEntryCollection();
      
      // 9時間の作業（1時間の残業）
      collection.add(new WorkEntry({
        date: new Date('2024/03/01'),
        startTime: '09:00',
        endTime: '18:00',
        mainCategory: 'WEB開発',
        subCategory: 'コーディング',
        description: 'タスク1'
      }));

      expect(collection.totalOvertimeHours()).toBe(1);
    });

    it('休憩時間は残業時間から除外されること', () => {
      const collection = new WorkEntryCollection();
      
      // 9時間の作業（1時間の残業）
      collection.add(new WorkEntry({
        date: new Date('2024/03/01'),
        startTime: '09:00',
        endTime: '18:00',
        mainCategory: 'WEB開発',
        subCategory: 'コーディング',
        description: 'タスク1'
      }));

      // 1時間の休憩
      collection.add(new WorkEntry({
        date: new Date('2024/03/01'),
        startTime: '12:00',
        endTime: '13:00',
        mainCategory: '休憩',
        subCategory: '休憩',
        description: 'お昼休憩'
      }));

      expect(collection.totalOvertimeHours()).toBe(1);
    });

    it('日付ごとの残業時間を取得できること', () => {
      const collection = new WorkEntryCollection();
      
      // 3/1: 1時間の残業
      const date1 = new Date('2024/03/01');
      collection.add(new WorkEntry({
        date: date1,
        startTime: '09:00',
        endTime: '18:00',
        mainCategory: 'WEB開発',
        subCategory: 'コーディング',
        description: 'タスク1'
      }));

      // 3/2: 2時間の残業
      const date2 = new Date('2024/03/02');
      collection.add(new WorkEntry({
        date: date2,
        startTime: '09:00',
        endTime: '19:00',
        mainCategory: 'WEB開発',
        subCategory: 'テスト',
        description: 'タスク2'
      }));

      const overtimeByDate = collection.overtimeHoursByDate();
      const date1Str = dayjsLib.formatDate(date1);
      const date2Str = dayjsLib.formatDate(date2);

      expect(overtimeByDate.get(date1Str)).toBe(1);
      expect(overtimeByDate.get(date2Str)).toBe(2);
    });
  });
});  