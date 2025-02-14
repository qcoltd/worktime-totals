import { describe, expect, it } from 'vitest';
import { WorkEntry } from '../../../src/domain/workEntry/WorkEntry';

describe('WorkEntry', () => {
  describe('基本的なプロパティ', () => {
    it('必要な属性で初期化できること', () => {
      const entry = new WorkEntry({
        date: new Date('2025/02/12'),
        startTime: '10:00',
        endTime: '12:00',
        mainCategory: '学習',
        subCategory: '開発',
        description: '技術研修 カネカ チェック項目確認作業'
      });

      expect(entry.date).toEqual(new Date('2025/02/12'));
      expect(entry.startTime).toBe('10:00');
      expect(entry.endTime).toBe('12:00');
      expect(entry.mainCategory).toBe('学習');
      expect(entry.subCategory).toBe('開発');
      expect(entry.description).toBe('技術研修 カネカ チェック項目確認作業');
    });
  });

  describe('作業時間計算', () => {
    it('開始時刻と終了時刻から作業時間を計算できること', () => {
      const entry = new WorkEntry({
        date: new Date('2025/02/12'),
        startTime: '10:00',
        endTime: '12:00',
        mainCategory: '学習',
        subCategory: '開発',
        description: '技術研修 カネカ チェック項目確認作業'
      });

      expect(entry.calculateDuration()).toBe(2); // 2時間
    });

    it('日をまたぐ場合も正しく計算できること', () => {
      const entry = new WorkEntry({
        date: new Date('2025/02/12'),
        startTime: '22:00',
        endTime: '01:30',
        mainCategory: '運用',
        subCategory: '障害対応',
        description: '緊急対応'
      });

      expect(entry.calculateDuration()).toBe(3.5); //   3時間30分 = 3.5時間
    });
  });

  describe('バリデーション', () => {
    it('不正な時刻形式の場合はエラーとなること', () => {
      expect(() => {
        new WorkEntry({
          date: new Date('2025/02/12'),
          startTime: '9:0',  // 不正な形式
          endTime: '17:30',
          mainCategory: '開発',
          subCategory: 'コーディング',
          description: 'WorkEntryクラスの実装'
        });
      }).toThrow('Invalid time format');
    });

    it('必須項目が欠けている場合はエラーとなること', () => {
      expect(() => {
        new WorkEntry({
          date: new Date('2025/02/12'),
          startTime: '10:00',
          endTime: '12:00',
          mainCategory: '学習',
          subCategory: '',  // 空文字
          description: '技術研修 カネカ チェック項目確認作業'
        });
      }).toThrow('SubCategory is required');
    });
  });
}); 