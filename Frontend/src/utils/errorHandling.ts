/**
 * Centralized Error Handling System
 * Provides comprehensive error parsing and user-friendly messages
 */

import type { ParsedError } from "../types/Error.type";

export enum ErrorType {
  USER_REJECTED = 'USER_REJECTED',
  WALLET_LOCKED = 'WALLET_LOCKED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Parse error and return structured error information
 */
export function parseError(error: any): ParsedError {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  
  // User rejected/cancelled transaction
  if (
    errorMessage.includes('USER_REFUSED_OP') ||
    errorMessage.includes('User refused') ||
    errorMessage.includes('User rejected') ||
    errorMessage.includes('User denied') ||
    errorMessage.includes('user rejected') ||
    errorMessage.includes('User aborted') ||
    errorMessage.includes('user aborted') ||
    errorMessage.includes('aborted') ||
    errorMessage.includes('cancelled') ||
    errorMessage.includes('canceled') ||
    error?.name === 'UserRejectedRequestError' ||
    error?.code === 4001 // Standard wallet rejection code
  ) {
    return {
      type: ErrorType.USER_REJECTED,
      message: errorMessage,
      userMessage: 'Transaction cancelled',
      shouldLog: false,
      shouldNotify: false, // Don't show toast for user cancellation
    };
  }
  
  // Wallet locked or not connected
  if (
    errorMessage.includes('wallet is locked') ||
    errorMessage.includes('Wallet locked') ||
    errorMessage.includes('not connected') ||
    errorMessage.includes('No wallet connected') ||
    errorMessage.includes('Please connect')
  ) {
    return {
      type: ErrorType.WALLET_LOCKED,
      message: errorMessage,
      userMessage: 'Please unlock your wallet and try again',
      shouldLog: true,
      shouldNotify: true,
    };
  }
  
  // Network/RPC errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('RPC') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('Failed to fetch')
  ) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: errorMessage,
      userMessage: 'Network error. Please check your connection and try again',
      shouldLog: true,
      shouldNotify: true,
    };
  }
  
  // Insufficient funds
  if (
    errorMessage.includes('Insufficient') ||
    errorMessage.includes('insufficient') ||
    errorMessage.includes('not enough')
  ) {
    return {
      type: ErrorType.INSUFFICIENT_FUNDS,
      message: errorMessage,
      userMessage: 'Insufficient balance',
      shouldLog: false,
      shouldNotify: true,
    };
  }
  
  // Contract errors
  if (
    errorMessage.includes('Contract') ||
    errorMessage.includes('execution') ||
    errorMessage.includes('revert')
  ) {
    return {
      type: ErrorType.CONTRACT_ERROR,
      message: errorMessage,
      userMessage: 'Transaction failed. Please try again',
      shouldLog: true,
      shouldNotify: true,
    };
  }
  
  // Unknown error
  return {
    type: ErrorType.UNKNOWN,
    message: errorMessage,
    userMessage: 'An unexpected error occurred. Please try again',
    shouldLog: true,
    shouldNotify: true,
  };
}

/**
 * Safe wrapper for async wallet operations
 * Automatically handles errors and provides consistent error handling
 */
export async function safeWalletOperation<T>(
  operation: () => Promise<T>,
  options: {
    onSuccess?: (result: T) => void;
    onError?: (error: ParsedError) => void;
    suppressUserRejection?: boolean;
  } = {}
): Promise<{ success: boolean; data?: T; error?: ParsedError }> {
  const { onSuccess, onError, suppressUserRejection = true } = options;
  
  try {
    const result = await operation();
    onSuccess?.(result);
    return { success: true, data: result };
  } catch (error: any) {
    const parsedError = parseError(error);
    
    // Log error if needed
    if (parsedError.shouldLog) {
      console.error('[Wallet Operation Error]:', {
        type: parsedError.type,
        message: parsedError.message,
        // Don't log original error to avoid BigInt serialization issues
      });
      // Log original error separately without serialization
      console.error('Original error:', error);
    }
    
    // Don't notify for user rejection if suppressed
    if (parsedError.type === ErrorType.USER_REJECTED && suppressUserRejection) {
      return { success: false, error: parsedError };
    }
    
    // Call error handler
    onError?.(parsedError);
    
    return { success: false, error: parsedError };
  }
}

/**
 * Check if error is a user rejection
 */
export function isUserRejection(error: any): boolean {
  const parsed = parseError(error);
  return parsed.type === ErrorType.USER_REJECTED;
}

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error: any): string {
  return parseError(error).userMessage;
}

/**
 * Suppress console errors for specific error types
 */
export function shouldSuppressError(error: any): boolean {
  const parsed = parseError(error);
  return parsed.type === ErrorType.USER_REJECTED;
}
