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
    // 必須項目のチェック
    if (!props.subCategory) {
      throw new WorktimeError(
        'SubCategory is required',
        ErrorCodes.REQUIRED_FIELD_MISSING
      );
    }

    // 時刻形式のバリデーション
    const timeFormat = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeFormat.test(props.startTime) || !timeFormat.test(props.endTime)) {
      throw new WorktimeError(
        'Invalid time format',
        ErrorCodes.INVALID_TIME_FORMAT
      );
    }

    // 日付のバリデーション
    if (!(props.date instanceof Date) || isNaN(props.date.getTime())) {
      throw new WorktimeError(
        'Invalid date format',
        ErrorCodes.INVALID_DATE_FORMAT
      );
    }

    // 日付の妥当性チェックを追加
    const date = dayjsLib.parse(props.date);
    if (!date.isValid() || date.format('YYYY-MM-DD') !== date.format('YYYY-MM-DD')) {
      throw new WorktimeError(
        'Invalid date value',
        ErrorCodes.INVALID_DATE_FORMAT,
        { date: props.date }
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
