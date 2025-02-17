import { dayjsLib } from '../../libs/dayjs';
import { WorkEntry } from './WorkEntry';
import { WORK_TIME } from '../../define';
import { OvertimeCalculator } from '../overtime/OvertimeCalculator';

export class WorkEntryCollection {
  constructor(
    private _entries: WorkEntry[] = []
  ) {}

  get entries(): WorkEntry[] {
    return this._entries;
  }

  add(entry: WorkEntry): void {
    this._entries.push(entry);
  }

  filterByDate(date: Date): WorkEntryCollection {
    const targetDate = dayjsLib.formatDate(date);
    const filteredEntries = this._entries.filter(entry => 
      dayjsLib.formatDate(entry.date) === targetDate
    );
    return new WorkEntryCollection(filteredEntries);
  }

  totalDuration(): number {
    return this._entries
      .filter(entry => entry.subCategory !== '休憩') // 休憩を除外
      .reduce((total, entry) => total + this.calculateDuration(entry), 0);
  }

  totalDurationByCategory(): Map<string, number> {
    const totals = new Map<string, number>();

    this._entries
      .filter(entry => entry.subCategory !== '休憩') // 休憩を除外
      .forEach(entry => {
        const current = totals.get(entry.mainCategory) || 0;
        totals.set(entry.mainCategory, current + this.calculateDuration(entry));
      });

    return totals;
  }

  private calculateDuration(entry: WorkEntry): number {
    const [startHours, startMinutes] = entry.startTime.split(':').map(Number);
    const [endHours, endMinutes] = entry.endTime.split(':').map(Number);

    let startTotalMinutes = startHours * 60 + startMinutes;
    let endTotalMinutes = endHours * 60 + endMinutes;

    // 終了時間が開始時間より小さい場合（日付を跨いでいる場合）
    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 24 * 60; // 24時間分を加算
    }

    const durationMinutes = endTotalMinutes - startTotalMinutes;

    // 時間に変換（小数点以下2桁まで）
    return Math.round(durationMinutes / 60 * 100) / 100;
  }

  /**
   * 期間全体の残業時間を計算
   */
  totalOvertimeHours(): number {
    return OvertimeCalculator.calculateTotal(this._entries);
  }

  /**
   * 日付ごとの残業時間を取得
   */
  overtimeHoursByDate(): Map<string, number> {
    return OvertimeCalculator.calculateByDate(this._entries);
  }
} 