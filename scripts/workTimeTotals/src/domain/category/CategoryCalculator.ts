import { WorkEntry } from '../workEntry/WorkEntry';

export class CategoryCalculator {
  /**
   * カテゴリごとの作業時間を計算
   */
  static calculateTotalsByCategory(entries: WorkEntry[]): Map<string, number> {
    const totals = new Map<string, number>();

    entries
      .filter(entry => entry.subCategory !== '休憩')
      .forEach(entry => {
        const current = totals.get(entry.mainCategory) || 0;
        const duration = this.calculateDuration(entry);
        totals.set(entry.mainCategory, current + duration);
      });

    return totals;
  }

  private static calculateDuration(entry: WorkEntry): number {
    const [startHours, startMinutes] = entry.startTime.split(':').map(Number);
    const [endHours, endMinutes] = entry.endTime.split(':').map(Number);

    let startTotalMinutes = startHours * 60 + startMinutes;
    let endTotalMinutes = endHours * 60 + endMinutes;

    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 24 * 60;
    }

    const durationMinutes = endTotalMinutes - startTotalMinutes;
    return Math.round(durationMinutes / 60 * 100) / 100;
  }
} 