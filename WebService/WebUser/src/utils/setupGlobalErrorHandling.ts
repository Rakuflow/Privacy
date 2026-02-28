import { shouldSuppressError } from './errorHandling';

declare global {
  interface Window {
    __rakuflowErrorHandlingInstalled__?: boolean;
  }
}

const USER_REJECTION_MESSAGES = [
  'User aborted',
  'user aborted',
  'USER_REFUSED_OP',
  'User rejected',
  'user rejected',
];

function isUserRejectionMessage(errorString: string): boolean {
  return USER_REJECTION_MESSAGES.some((message) => errorString.includes(message));
}

function stringifyErrorArg(arg: unknown): string {
  if (typeof arg === 'string') {
    return arg;
  }

  if (arg instanceof Error) {
    return arg.message;
  }

  if (typeof arg === 'object' && arg !== null && 'message' in arg) {
    return String((arg as { message?: unknown }).message ?? '');
  }

  return String(arg ?? '');
}

export function setupGlobalErrorHandling(): void {
  // Global BigInt serialization fix.
  if (typeof (BigInt.prototype as any).toJSON === 'undefined') {
    (BigInt.prototype as any).toJSON = function toJSON() {
      return this.toString();
    };
  }

  if (window.__rakuflowErrorHandlingInstalled__) {
    return;
  }

  window.__rakuflowErrorHandlingInstalled__ = true;

  const originalConsoleError = console.error.bind(console);

  console.error = (...args: unknown[]) => {
    const errorString = args.map(stringifyErrorArg).join(' ');

    if (isUserRejectionMessage(errorString)) {
      return;
    }

    originalConsoleError(...(args as Parameters<typeof console.error>));
  };

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const errorString = stringifyErrorArg(event.reason);

    if (isUserRejectionMessage(errorString) || shouldSuppressError(event.reason)) {
      event.preventDefault();
    }
  });
}
