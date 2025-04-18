export interface DashboardSettings {
  startDate: Date;
  endDate: Date;
  targetProjects: string[];
  outputOvertimeAndCategory: boolean; // 残業時間と業務比率の出力フラグ
  outputProjectBreakdown: boolean;    // 案件別作業時間の内訳の出力フラグ
} 