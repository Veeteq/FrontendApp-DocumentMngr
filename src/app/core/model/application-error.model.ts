export type ApplicationErrorType =
  | 'http'
  | 'timeout'
  | 'network'
  | 'unknown';

export interface ApplicationError {
  type: ApplicationErrorType;
  message: string;
  originalError: unknown;
  status?: number;
}