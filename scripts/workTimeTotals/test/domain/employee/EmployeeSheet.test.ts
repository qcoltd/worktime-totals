import { describe, expect, it } from 'vitest';
import { EmployeeSheet } from '../../../src/domain/employee/EmployeeSheet';

describe('EmployeeSheet', () => {
  describe('constructor', () => {
    it('正しいURLからスプレッドシートIDを抽出できること', () => {
      const sheet = new EmployeeSheet({
        name: '山田太郎',
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1z-LDS7uOV-Yb26--ZVIobCI2XHtvwk4upKM3fkXykO4/edit?gid=2120967157'
      });

      expect(sheet.name).toBe('山田太郎');
      expect(sheet.spreadsheetId).toBe('1z-LDS7uOV-Yb26--ZVIobCI2XHtvwk4upKM3fkXykO4');
    });

    it('不正なURLの場合はエラーを投げること', () => {
      expect(() => new EmployeeSheet({
        name: '山田太郎',
        spreadsheetUrl: 'https://invalid-url.com'
      })).toThrow('Invalid spreadsheet URL format');
    });
  });
}); 