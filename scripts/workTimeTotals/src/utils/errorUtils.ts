import { WorktimeError } from '../domain/error/WorktimeError';

/**
 * Helper function to log and throw WorktimeError
 * @param error The WorktimeError to log and throw
 */
export function logAndThrow(error: WorktimeError): never {
  console.error(error.formatForLog());
  throw error;
}