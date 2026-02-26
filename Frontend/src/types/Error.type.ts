export type ParsedErrorType =
  | "USER_REJECTED"
  | "WALLET_LOCKED"
  | "NETWORK_ERROR"
  | "INSUFFICIENT_FUNDS"
  | "CONTRACT_ERROR"
  | "UNKNOWN";

export interface ParsedError {
  type: ParsedErrorType;
  message: string;
  userMessage: string;
  shouldLog: boolean;
  shouldNotify: boolean;
}
