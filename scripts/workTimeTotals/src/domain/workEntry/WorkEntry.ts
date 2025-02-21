import { dayjsLib } from '../../libs/dayjs';
import { WorktimeError, ErrorCodes } from '../error/WorktimeError';

interface WorkEntryProps {
  date: Date;
  startTime: string;
  endTime: string;
  mainCategory: string;
  subCategory: string;
  description: string;
}

export class WorkEntry {
  private readonly _date: Date;
  private readonly _startTime: string;
  private readonly _endTime: string;
  private readonly _mainCategory: string;
  private readonly _subCategory: string;
  private readonly _description: string;

  constructor(props: WorkEntryProps) {
    this.validateProps(props);

    this._date = props.date;
    this._startTime = props.startTime;
    this._endTime = props.endTime;
    this._mainCategory = props.mainCategory;
    this._subCategory = props.subCategory;
    this._description = props.description;
  }

  private validateProps(props: WorkEntryProps): void {
    try {
      // 必須項目のチェック
      if (!props.subCategory) {
        throw new WorktimeError(
          'SubCategory is required',
          ErrorCodes.REQUIRED_FIELD_MISSING,
          {
            message: '作業内容のサブカテゴリを入力してください',
            errorLocation: `行のデータ: ${props.date}, ${props.startTime}-${props.endTime}, ${props.mainCategory}`
          }
        );
      }

      // 開始時刻は必須
      if (!props.startTime) {
        throw new WorktimeError(
          'Start time is required',
          ErrorCodes.REQUIRED_FIELD_MISSING,
          {
            message: '開始時刻は必須です',
            errorLocation: `時刻: ${props.startTime}-${props.endTime}`,
            cellData: {
              row: 0,
              values: [props.date, props.startTime, props.endTime],
              expectedFormat: '開始時刻 HH:MM'
            }
          }
        );
      }

      // 時刻形式のバリデーション
      const timeFormat = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeFormat.test(props.startTime)) {
        throw new WorktimeError(
          'Invalid start time format',
          ErrorCodes.INVALID_TIME_FORMAT,
          {
            message: '開始時刻の形式が不正です (HH:MM)',
            errorLocation: `時刻: ${props.startTime}`,
            cellData: {
              row: 0,
              values: [props.date, props.startTime, props.endTime],
              expectedFormat: 'HH:MM (例: 09:00)'
            }
          }
        );
      }
      if (props.endTime && !timeFormat.test(props.endTime)) {
        throw new WorktimeError(
          'Invalid end time format',
          ErrorCodes.INVALID_TIME_FORMAT,
          {
            message: '終了時刻の形式が不正です (HH:MM)',
            errorLocation: `時刻: ${props.endTime}`,
            cellData: {
              row: 0,
              values: [props.date, props.startTime, props.endTime],
              expectedFormat: 'HH:MM (例: 17:30)'
            }
          }
        );
      }

      // 開始時刻と終了時刻の組み合わせチェック
      if (!props.startTime && props.endTime) {
        throw new WorktimeError(
          'Start time is required when end time is set',
          ErrorCodes.INVALID_TIME_FORMAT,
          {
            message: '終了時刻が設定されている場合は、開始時刻も入力してください',
            errorLocation: `時刻: ${props.startTime}-${props.endTime}`,
            cellData: {
              row: 0,
              values: [props.date, props.startTime, props.endTime],
              expectedFormat: '開始時刻 HH:MM - 終了時刻 HH:MM'
            }
          }
        );
      }

      // 日付のバリデーション
      if (!(props.date instanceof Date) || isNaN(props.date.getTime())) {
        throw new WorktimeError(
          'Invalid date format',
          ErrorCodes.INVALID_DATE_FORMAT,
          {
            message: '日付の形式が不正です',
            errorLocation: `日付: ${props.date}`,
            cellData: {
              row: 0,
              values: [props.date],
              expectedFormat: 'YYYY/MM/DD'
            }
          }
        );
      }

      // 日付の妥当性チェック
      const date = dayjsLib.parse(props.date);
      if (!date.isValid() || date.format('YYYY-MM-DD') !== date.format('YYYY-MM-DD')) {
        throw new WorktimeError(
          'Invalid date value',
          ErrorCodes.INVALID_DATE_FORMAT,
          {
            message: `不正な日付です: ${props.date}`,
            errorLocation: `日付: ${props.date}`,
            cellData: {
              row: 0,
              values: [props.date],
              expectedFormat: 'YYYY/MM/DD'
            }
          }
        );
      }
    } catch (error) {
      if (error instanceof WorktimeError) {
        throw error;
      }
      throw new WorktimeError(
        'Invalid work entry',
        ErrorCodes.INVALID_SHEET_FORMAT,
        {
          message: error instanceof Error ? error.message : '不明なエラー',
          errorLocation: `Date: ${props.date}, Time: ${props.startTime}-${props.endTime}`,
          cellData: {
            row: 0,
            values: [props.date, props.startTime, props.endTime, props.mainCategory, props.subCategory],
            expectedFormat: '日付 | 開始時刻 | 終了時刻 | メインカテゴリ | サブカテゴリ | 説明'
          }
        }
      );
    }
  }

  calculateDuration(): number {
    return dayjsLib.diffHours(this._startTime, this._endTime, this._date);
  }

  // getterアクセサ
  get date(): Date {
    return this._date;
  }
  get startTime(): string {
    return this._startTime;
  }
  get endTime(): string {
    return this._endTime;
  }
  get mainCategory(): string {
    return this._mainCategory;
  }
  get subCategory(): string {
    return this._subCategory;
  }
  get description(): string {
    return this._description;
  }
}
