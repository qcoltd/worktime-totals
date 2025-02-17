import { WorkEntry } from '../workEntry/WorkEntry';
import { WORK_TIME } from '../../define';
import { dayjsLib } from '../../libs/dayjs';

export class OvertimeCalculator {
  /**
   * 日付ごとの残業時間を計算
   */
  static calculateByDate(entries: WorkEntry[]): Map<string, number> {
    // 日付ごとにグループ化
    const entriesByDate = new Map<string, WorkEntry[]>();
    
    entries
      .filter(entry => entry.subCategory !== '休憩')
      .forEach(entry => {
        const dateStr = dayjsLib.formatDate(entry.date);
        const dateEntries = entriesByDate.get(dateStr) || [];
        dateEntries.push(entry);
        entriesByDate.set(dateStr, dateEntries);
      });

    // 各日の残業時間を計算
    const overtimeByDate = new Map<string, number>();
    entriesByDate.forEach((dateEntries, date) => {
      const overtime = this.calculateDailyOvertime(dateEntries);
      if (overtime > 0) {
        overtimeByDate.set(date, Math.round(overtime * 100) / 100);
      }
    });

    return overtimeByDate;
  }

  /**
   * 期間全体の残業時間を計算
   */
  static calculateTotal(entries: WorkEntry[]): number {
    const overtimeByDate = this.calculateByDate(entries);
    const total = Array.from(overtimeByDate.values())
      .reduce((sum, overtime) => sum + overtime, 0);
    
    return Math.round(total * 100) / 100;
  }

  /**
   * 1日の残業時間を計算
   */
  private static calculateDailyOvertime(entries: WorkEntry[]): number {
    const totalMinutes = entries.reduce((total, entry) => {
      const [startHours, startMinutes] = entry.startTime.split(':').map(Number);
      const [endHours, endMinutes] = entry.endTime.split(':').map(Number);
      
      let startTotalMinutes = startHours * 60 + startMinutes;
      let endTotalMinutes = endHours * 60 + endMinutes;

      // 終了時間が開始時間より小さい場合（日付を跨いでいる場合）
      if (endTotalMinutes < startTotalMinutes) {
        endTotalMinutes += 24 * 60; // 24時間分を加算
      }
      
      return total + (endTotalMinutes - startTotalMinutes);
    }, 0);

    const totalHours = totalMinutes / 60;
    return Math.max(0, totalHours - WORK_TIME.REGULAR_HOURS_PER_DAY);
  }
} 