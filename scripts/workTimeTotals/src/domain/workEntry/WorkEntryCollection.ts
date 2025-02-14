import { dayjsLib } from '../../libs/dayjs';
import { WorkEntry } from './WorkEntry';

export class WorkEntryCollection {
  private readonly _entries: WorkEntry[] = [];

  constructor(entries: WorkEntry[] = []) {
    this._entries = entries;
  }

  get entries(): WorkEntry[] {
    return [...this._entries]; // 配列の不変性を保持
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
    return this._entries.reduce(
      (total, entry) => total + entry.calculateDuration(),
      0
    );
  }

  totalDurationByCategory(): Map<string, number> {
    const categoryTotals = new Map<string, number>();

    this._entries.forEach(entry => {
      const category = entry.mainCategory;
      const currentTotal = categoryTotals.get(category) || 0;
      categoryTotals.set(category, currentTotal + entry.calculateDuration());
    });

    return categoryTotals;
  }
} 