import { WorktimeError, ErrorCodes } from '../domain/error/WorktimeError';

class DayjsLib {
  private getDayjs(): typeof dayjs.dayjs {
    return typeof dayjs !== 'undefined' ? dayjs.dayjs : require('dayjs');
  }

  formatDate(date: Date): string {
    return this.getDayjs()(date).format('YYYY/MM/DD');
  }

  parse(date: Date | string) {
    const dayjs = this.getDayjs();
    if (typeof date === 'string') {
      // YYYY/MM/DD形式の文字列を厳密にパース
      const [year, month, day] = date.split('/').map(Number);
      
      // 各部分の妥当性チェック
      if (
        isNaN(year) || isNaN(month) || isNaN(day) ||
        month < 1 || month > 12 ||
        day < 1 || day > new Date(year, month, 0).getDate()
      ) {
        throw new WorktimeError(
          'Invalid date format or value',
          ErrorCodes.INVALID_DATE_FORMAT,
          { date }
        );
      }

      return dayjs(new Date(year, month - 1, day));
    }

    // Date型の場合の妥当性チェック
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new WorktimeError(
        'Invalid date value',
        ErrorCodes.INVALID_DATE_FORMAT,
        { date }
      );
    }

    return dayjs(date);
  }

  // 時間差の計算（時間単位）
  diffHours(start: string, end: string, baseDate: Date) {
    const dayjs = this.getDayjs();
    const baseDateStr = dayjs(baseDate).format('YYYY-MM-DD');
    let startTime = dayjs(`${baseDateStr} ${start}`);
    let endTime = dayjs(`${baseDateStr} ${end}`);

    if (endTime.isBefore(startTime)) {
      endTime = endTime.add(1, 'day');
    }

    return endTime.diff(startTime, 'hour', true);
  }
}

export const dayjsLib = new DayjsLib(); 