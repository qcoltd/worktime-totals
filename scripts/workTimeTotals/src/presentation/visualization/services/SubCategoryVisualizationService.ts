import { WorkEntry } from '../../../domain/workEntry/WorkEntry';
import { WorktimeError, ErrorCodes } from '../../../domain/error/WorktimeError';
import { SubCategoryTotalingService } from '../../../application/SubCategoryTotalingService';
import { dayjsLib } from '../../../libs/dayjs';
import { SubCategoryBarChartComponent } from '../components/charts/subcategory/SubCategoryBarChartComponent';



export class SubCategoryVisualizationService {
  constructor(
    private startDate: Date,
    private endDate: Date,
    private subCategoryService: SubCategoryTotalingService,
    private targetMainCategories: string[]
  ) {}

  visualize(
    entries: Map<string, WorkEntry[]>,
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    startRow: number = 1
  ): number {
    try {
      // 集計期間と対象案件の行を追加
      const infoRow = [
        '集計期間',
        dayjsLib.formatDate(this.startDate),
        dayjsLib.formatDate(this.endDate),
        '対象案件',
        this.targetMainCategories.join(', ')
      ];
      sheet.getRange(startRow, 1, 1, infoRow.length).setValues([infoRow]);

      // サブカテゴリの一覧を取得（重複を除去）
      const subCategories = this.getUniqueSubCategories(entries);

      // ヘッダー行の作成（2行目に移動）
      const headers = ['従業員名', ...subCategories, '合計'];
      sheet.getRange(startRow + 2, 1, 1, headers.length).setValues([headers]);

      // 以降の処理で行番号を2行ずらす
      const headerRow = startRow + 2;
      
      // 従業員ごとの集計データを作成
      const employeeRows: any[][] = [];
      let totalsBySubCategory = new Map<string, number>();
      let grandTotal = 0;

      entries.forEach((workEntries, employeeName) => {
        const row = [employeeName];
        let employeeTotal = 0;

        // 各サブカテゴリの時間を集計
        subCategories.forEach(subCategory => {
          const hours = workEntries
            .filter(entry => entry.subCategory === subCategory)
            .reduce((sum, entry) => {
              // startDateとendDateから作業時間を計算
              return sum + entry.calculateDuration();
            }, 0);

          // 合計の更新
          employeeTotal += hours;
          totalsBySubCategory.set(
            subCategory,
            (totalsBySubCategory.get(subCategory) || 0) + hours
          );

          // 時間を HH:MM 形式に変換
          row.push(this.formatHours(hours));
        });

        grandTotal += employeeTotal;
        row.push(this.formatHours(employeeTotal));
        employeeRows.push(row);
      });

      // 従業員データの出力 ヘッダー行の次の行から出力
      sheet.getRange(headerRow + 1, 1, employeeRows.length, headers.length)
        .setValues(employeeRows);

      // 合計行の作成
      const totalRow = ['合計'];
      subCategories.forEach(subCategory => {
        totalRow.push(this.formatHours(totalsBySubCategory.get(subCategory) || 0));
      });
      totalRow.push(this.formatHours(grandTotal));

      // 合計行の出力（従業員データの後に配置）
      const totalRowRange = sheet.getRange(
        headerRow + 1 + employeeRows.length,
        1,
        1,
        headers.length
      );
      totalRowRange.setValues([totalRow]);

      // スタイルの適用（情報行も含める）
      const totalRows = employeeRows.length + 2; // ヘッダー行と合計行を含む
      this.applyStyles(sheet, startRow + 2, totalRows, headers.length); // ヘッダー行の位置から開始
      this.applyInfoRowStyles(sheet, startRow, infoRow.length);

      // グラフ用のデータを準備
    //   const employeeNames = Array.from(entries.keys());
    //   const chartData = {
    //     employeeNames: [...employeeNames, '合計'],
    //     subCategories: subCategories,
    //     values: [
    //       ...employeeNames.map(name => 
    //         subCategories.map(subCategory => 
    //           entries.get(name)!
    //             .filter(entry => entry.subCategory === subCategory)
    //             .reduce((sum, entry) => sum + entry.calculateDuration(), 0)
    //         )
    //       ),
    //       // 合計行のデータ
    //       subCategories.map(subCategory => totalsBySubCategory.get(subCategory) || 0)
    //     ]
    //   };

      // グラフの描画
      const chart = new SubCategoryBarChartComponent(sheet);
      chart.render({
        row: headerRow,  // ヘッダー行の位置
        column: 1,
        numRows: employeeRows.length + 1 + 1,  // データ行数 + ヘッダー行 + 合計行
        numColumns: subCategories.length + 1 + 1  // データ列数 + 従業員名列 + 合計列
      });

      return headerRow + employeeRows.length + chart.chartHeight;
    } catch (error) {
      throw new WorktimeError(
        'Failed to visualize subcategory data',
        ErrorCodes.SHEET_ACCESS_ERROR,
        { error }
      );
    }
  }

  private getUniqueSubCategories(entries: Map<string, WorkEntry[]>): string[] {
    return this.subCategoryService.getSubCategories();
  }

  private formatHours(hours: number): string {
    // HH:MM 形式から小数点形式に変更
    return hours.toFixed(1);
  }

  private applyStyles(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    startRow: number,
    totalRows: number,
    totalColumns: number
  ): void {
    const range = sheet.getRange(startRow, 1, totalRows, totalColumns);

    // 全体の罫線
    range.setBorder(true, true, true, true, true, true);

    // ヘッダー行のスタイル（開始行）
    const headerRange = sheet.getRange(startRow, 1, 1, totalColumns);
    headerRange.setBackground('#f3f3f3');
    headerRange.setFontWeight('bold');

    // 合計行のスタイル（最終行）
    const totalRange = sheet.getRange(startRow + totalRows - 1, 1, 1, totalColumns);
    totalRange.setBackground('#f3f3f3');
    totalRange.setFontWeight('bold');

    // // 列幅の自動調整
    // for (let i = 1; i <= totalColumns; i++) {
    //   sheet.autoResizeColumn(i);
    // }
  }

  // 情報行のスタイル適用
  private applyInfoRowStyles(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    startRow: number,
    columns: number
  ): void {
    const range = sheet.getRange(startRow, 1, 1, columns);
    range.setBackground('#f3f3f3');
    
    // ラベルセルを太字に
    sheet.getRange(startRow, 1).setFontWeight('bold');
    sheet.getRange(startRow, 4).setFontWeight('bold');
  }
} 