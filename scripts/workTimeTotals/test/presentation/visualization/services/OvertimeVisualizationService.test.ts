import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OvertimeVisualizationService } from '../../../../src/presentation/visualization/services/OvertimeVisualizationService';
import { OvertimeSummary } from '../../../../src/application/OvertimeCalculationService';

describe('OvertimeVisualizationService', () => {
  // モック用のスプレッドシート
  let mockSheet: any;
  let mockRange: any;
  let mockSpreadsheet: any;

  beforeEach(() => {
    // モックの設定
    mockRange = {
      setValues: vi.fn(),
      setValue: vi.fn(),
      setNumberFormat: vi.fn(),
      getRow: vi.fn().mockReturnValue(1),
      getColumn: vi.fn().mockReturnValue(1),
      getNumRows: vi.fn().mockReturnValue(3),
      getNumColumns: vi.fn().mockReturnValue(4)
    };

    mockSheet = {
      getRange: vi.fn().mockReturnValue(mockRange),
      autoResizeColumns: vi.fn()
    };

    mockSpreadsheet = {
      insertSheet: vi.fn().mockReturnValue(mockSheet),
      getSheetByName: vi.fn().mockReturnValue(mockSheet)
    };

    global.SpreadsheetApp = {
      openById: vi.fn().mockReturnValue(mockSpreadsheet)
    } as any;

    global.Utilities = {
      formatDate: vi.fn().mockReturnValue('202403141023')
    } as any;
  });

  describe('週次データのフィルタリング', () => {
    it('指定期間内の週のみを出力すること', () => {
      // テスト用の期間を設定（2025/01/08~2025/01/14 -> 第2週と第3週が対象）
      const startDate = new Date('2025-01-08');
      const endDate = new Date('2025-01-14');

      const service = new OvertimeVisualizationService('dummy-id', startDate, endDate);

      // テスト用のデータを作成
      const mockSummary: OvertimeSummary = {
        period: {
          startDate: '2025-01-01',
          endDate: '2025-01-31'
        },
        total: 10,
        average: 5,
        weeklyAverages: new Map([
          [1, 2],
          [2, 3],
          [3, 4],
          [4, 2],
          [5, 1]
        ]),
        employees: [
          {
            name: '従業員A',
            total: 6,
            weekly: [
              { weekNumber: 1, hours: 1, startDate: '2025-01-01', endDate: '2025-01-04' },
              { weekNumber: 2, hours: 2, startDate: '2025-01-05', endDate: '2025-01-11' },
              { weekNumber: 3, hours: 3, startDate: '2025-01-12', endDate: '2025-01-18' },
              { weekNumber: 4, hours: 2, startDate: '2025-01-19', endDate: '2025-01-25' },
              { weekNumber: 5, hours: 1, startDate: '2025-01-26', endDate: '2025-01-31' }
            ]
          }
        ]
      };

      // サービスを実行
      service.visualize([mockSummary]);

      // setValuesが呼ばれた回数と内容を確認
      const setValuesCalls = mockRange.setValues.mock.calls;
      
      // 第2週と第3週のデータが含まれていることを確認
      const weeklyData = setValuesCalls.filter(call => 
        call[0].some((row: any[]) => 
          row.includes('2025/01-2') || row.includes('2025/01-3')
        )
      );
      expect(weeklyData.length).toBeGreaterThan(0);
      
      // 第1週、第4週、第5週のデータが含まれていないことを確認
      const excludedWeeks = setValuesCalls.find(call => 
        call[0].some((row: any[]) => 
          row.includes('2025/01-1') || 
          row.includes('2025/01-4') || 
          row.includes('2025/01-5')
        )
      );
      expect(excludedWeeks).toBeFalsy();
    });
  });
}); 