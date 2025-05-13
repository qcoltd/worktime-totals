import { EmployeeSheetRepository } from './domain/employee/EmployeeSheetRepository';
import { WorktimeCollectionService } from './application/WorktimeCollectionService';
import { OvertimeCalculationService } from './application/OvertimeCalculationService';
import { TOTALING_SHEET } from './define';
import { WorkEntry } from './domain/workEntry/WorkEntry';
import { CategoryTotalingService } from './application/CategoryTotalingService';
import { SubCategoryTotalingService } from './application/SubCategoryTotalingService';
import { DashboardRepository } from './domain/dashboard/DashboardRepository';
import { OvertimeVisualizationService } from './presentation/visualization/services/OvertimeVisualizationService';
import { OvertimeSummary } from './application/OvertimeCalculationService';
import { CategoryVisualizationService } from './presentation/visualization/services/CategoryVisualizationService';
import { WorktimeVisualizationService } from './presentation/visualization/services/WorktimeVisualizationService';
import { dayjsLib } from './libs/dayjs';
import { SubCategoryVisualizationService } from './presentation/visualization/services/SubCategoryVisualizationService';
import { ErrorModalPresenter } from './presentation/error/ErrorModalPresenter';
import { WorktimeError, ErrorCodes } from './domain/error/WorktimeError';

function main() {
  try {
    // ダッシュボードの設定を取得
    const dashboardRepo = new DashboardRepository(TOTALING_SHEET.SS_ID);
    const settings = dashboardRepo.getSettings();

    // 集計対象の期間を設定
    const startDate = settings.startDate;
    const endDate = settings.endDate;

    // 出力設定を取得
    const outputOvertimeAndCategory = settings.outputOvertimeAndCategory;
    const outputProjectBreakdown = settings.outputProjectBreakdown;

    // どちらの出力も選択されていない場合は処理を終了
    if (!outputOvertimeAndCategory && !outputProjectBreakdown) {
      console.log('出力が選択されていません。ダッシュボードで出力項目を選択してください。');
      // 警告モーダルを表示
      const e = new WorktimeError(
        '出力項目が未選択です',
        ErrorCodes.DASHBOARD_ERROR,
        { message: 'ダッシュボードで出力項目を選択してください。' }
      );
      console.error(e.formatForLog());
      ErrorModalPresenter.showWarning(
        '出力項目が未選択です',
        'ダッシュボードで出力項目を選択してください。'
      );
      return;
    }

    // サービスの初期化
    const employeeRepo = new EmployeeSheetRepository();
    const worktimeService = new WorktimeCollectionService(employeeRepo);
    const overtimeService = new OvertimeCalculationService();

    // 従業員シート一覧を取得
    console.log('=== 従業員シート一覧 ===');
    const employeeSheets = employeeRepo.findAll();
    employeeSheets.forEach(sheet => {
      console.log(`- ${sheet.name}: ${sheet.spreadsheetId}`);
    });

    // 作業時間の集計
    console.log('\n=== 作業時間集計 ===');
    console.log(`期間: ${startDate.toLocaleDateString()} 〜 ${endDate.toLocaleDateString()}`);
    console.log(`選択された出力: ${outputOvertimeAndCategory ? '残業時間と業務比率' : ''}${outputOvertimeAndCategory && outputProjectBreakdown ? ', ' : ''}${outputProjectBreakdown ? '案件別作業時間内訳' : ''}`);

    const workEntries = worktimeService.collectWorkEntries(startDate, endDate);
    // エラーが発生した場合、ここで処理が止まる

    workEntries.forEach((entries, name) => {
      console.log(`\n■ ${name}`);
      console.log(`総作業時間: ${entries.totalDuration()}時間`);

      // カテゴリごとの集計
      console.log('カテゴリ別作業時間:');
      const categoryTotals = entries.totalDurationByCategory();
      categoryTotals.forEach((duration, category) => {
        console.log(`  ${category}: ${duration}時間`);
      });
    });

    // 残業時間の集計（両方の出力に必要なので常に実行）
    console.log('\n=== 残業時間集計 ===');

    // WorkEntryCollectionからWorkEntry[]に変換
    const entriesForOvertime = new Map<string, WorkEntry[]>();
    workEntries.forEach((collection, name) => {
      entriesForOvertime.set(name, collection.entries);
    });

    // 月ごとに集計を実行
    const overtimeStartMonth = new Date(startDate);
    const overtimeEndMonth = new Date(endDate);
    const overtimeSummaries: OvertimeSummary[] = [];

    // 一日でもまたがっていれば出力したいので月初日で判定する
    overtimeStartMonth.setDate(1);
    while (overtimeStartMonth <= overtimeEndMonth) {
      const summary = overtimeService.calculateMonthlySummary(
        entriesForOvertime,
        overtimeStartMonth
      );
      overtimeSummaries.push(summary);

      // ログ出力
      console.log(`\n期間: ${summary.period.startDate} 〜 ${summary.period.endDate}`);
      console.log(`全体合計: ${summary.total}時間`);
      console.log(`全体平均: ${summary.average.toFixed(1)}時間`);

      console.log('\n週次平均:');
      summary.weeklyAverages.forEach((average, weekNum) => {
        console.log(`  第${weekNum}週: ${average.toFixed(1)}時間`);
      });

      console.log('\n従業員別集計:');
      summary.employees.forEach(employee => {
        console.log(`\n■ ${employee.name}`);
        console.log(`  月間合計: ${employee.total}時間`);
        console.log('  週別内訳:');
        employee.weekly.forEach(week => {
          console.log(`    第${week.weekNumber}週 (${week.startDate}〜${week.endDate}): ${week.hours}時間`);
        });
      });

      // 次の月へ
      overtimeStartMonth.setMonth(overtimeStartMonth.getMonth() + 1);
    }

    // カテゴリ別作業時間の集計
    console.log('\n=== カテゴリ別作業時間集計 ===');
    const categoryService = new CategoryTotalingService();

    // 月ごとに集計を実行
    const categoryStartMonth = new Date(startDate);
    const categoryEndMonth = new Date(endDate);

    while (categoryStartMonth <= categoryEndMonth) {
      const categorySummary = categoryService.calculateMonthlySummary(
        entriesForOvertime,
        categoryStartMonth
      );

      console.log(`\n■ ${dayjsLib.formatDate(categoryStartMonth, 'YYYY/MM')}`);
      console.log(`期間: ${categorySummary.period.startDate} 〜 ${categorySummary.period.endDate}`);

      console.log('\n全体集計:');
      categorySummary.totalsByCategory.forEach(total => {
        console.log(`  ${total.category}: ${total.hours}時間`);
      });

      console.log('\n従業員別集計:');
      categorySummary.employeeTotals.forEach(employee => {
        console.log(`  ${employee.name}`);
        employee.totals.forEach(total => {
          console.log(`    ${total.category}: ${total.hours}時間`);
        });
      });

      // 次の月へ
      categoryStartMonth.setMonth(categoryStartMonth.getMonth() + 1);
    }

    // サブカテゴリ別作業時間の集計
    console.log('\n=== サブカテゴリ別作業時間集計 ===');
    const subCategoryService = new SubCategoryTotalingService();
    const targetMainCategories = settings.targetProjects; // ダッシュボードから取得した案件を使用

    const subCategorySummary = subCategoryService.calculateSummary(
      entriesForOvertime,
      targetMainCategories,
      startDate,
      endDate
    );

    console.log(`\n■ 対象メインカテゴリ: ${subCategorySummary.mainCategories.join(', ')}`);
    console.log(`期間: ${subCategorySummary.period.startDate} 〜 ${subCategorySummary.period.endDate}`);

    console.log('\n全体集計:');
    subCategorySummary.totalsBySubCategory.forEach(total => {
      console.log(`  ${total.subCategory}: ${total.hours}時間`);
    });

    console.log('\n従業員別集計:');
    subCategorySummary.employeeTotals.forEach(employee => {
      console.log(`\n● ${employee.name}`);
      employee.totals.forEach(total => {
        console.log(`  ${total.subCategory}: ${total.hours}時間`);
      });
    });

    // 可視化サービスの初期化
    const overtimeOutput = new OvertimeVisualizationService(startDate, endDate);
    const categoryOutput = new CategoryVisualizationService(startDate, endDate, categoryService);
    const subCategoryOutput = new SubCategoryVisualizationService(
      startDate,
      endDate,
      subCategoryService,
      targetMainCategories
    );
    const worktimeOutput = new WorktimeVisualizationService(
      TOTALING_SHEET.SS_ID,
      overtimeOutput,
      categoryOutput,
      subCategoryOutput
    );

    // 残業時間と業務比率の出力（フラグがオンの場合のみ）
    if (outputOvertimeAndCategory) {
      console.log('\n残業時間と業務比率の出力を実行します...');
      worktimeOutput.visualizeOvertimeAndCategory(overtimeSummaries, entriesForOvertime);
    }

    // 案件別作業時間の内訳を出力（フラグがオンの場合のみ）
    if (outputProjectBreakdown) {
      console.log('\n案件別作業時間の内訳の出力を実行します...');

      // Filter entries by the target main categories before visualization
      const projectFilteredEntries = new Map<string, WorkEntry[]>();

      entriesForOvertime.forEach((entries, name) => {
        // Filter entries that belong to the target projects (main categories)
        const filteredEntries = entries.filter(entry =>
          targetMainCategories.includes(entry.mainCategory)
        );

        if (filteredEntries.length > 0) {
          projectFilteredEntries.set(name, filteredEntries);
        }
      });

      worktimeOutput.visualizeProjectBreakdown(projectFilteredEntries);
    }

  } catch (error) {
    if (error instanceof WorktimeError) {
      // モーダルでエラーを表示して終了
      console.error(error.formatForLog());
      ErrorModalPresenter.showError(error);
      return;  // 処理を終了
    } else {
      console.error('予期せぬエラーが発生しました:', error);
    }
  }
}