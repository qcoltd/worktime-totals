// GAS環境とローカル環境で異なる方法でdayjsを取得
const getDayjs = () => {
  return typeof dayjs !== 'undefined' ? dayjs.dayjs : require('dayjs');
};

export const dayjsLib = {
  // 日時文字列のパース
  parse: (date: Date | string) => getDayjs()(date),

  // 時間差の計算（時間単位）
  diffHours: (start: string, end: string, baseDate: Date) => {
    const dayjs = getDayjs();
    const baseDateStr = dayjs(baseDate).format('YYYY-MM-DD');
    let startTime = dayjs(`${baseDateStr} ${start}`);
    let endTime = dayjs(`${baseDateStr} ${end}`);

    if (endTime.isBefore(startTime)) {
      endTime = endTime.add(1, 'day');
    }

    return endTime.diff(startTime, 'hour', true);
  },

  // 日付のフォーマット
  formatDate: (date: Date, format = 'YYYY-MM-DD') => {
    return getDayjs()(date).format(format);
  }
}; 