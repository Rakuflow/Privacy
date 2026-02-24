import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useEffect } from "react";
import { shouldSuppressError } from "../utils/errorHandling";

// Global BigInt serialization fix
// Prevents "Do not know how to serialize a BigInt" errors
if (typeof BigInt.prototype.toJSON === 'undefined') {
  (BigInt.prototype as any).toJSON = function() {
    return this.toString();
  };
}

export default function App() {
  // Suppress console errors for user rejections
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      // Check if this is a user rejection error
      const errorString = args.join(' ');
      if (
        errorString.includes('User aborted') ||
        errorString.includes('user aborted') ||
        errorString.includes('USER_REFUSED_OP') ||
        errorString.includes('User rejected') ||
        errorString.includes('user rejected')
      ) {
        // Silently ignore user rejection errors
        return;
      }
      
      // Call original console.error for other errors
      originalConsoleError.apply(console, args);
    };
    
    // Global unhandled rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      const errorString = error?.message || error?.toString() || '';
      
      // Suppress user rejection errors
      if (
        errorString.includes('User aborted') ||
        errorString.includes('user aborted') ||
        errorString.includes('USER_REFUSED_OP') ||
        errorString.includes('User rejected') ||
        errorString.includes('user rejected') ||
        shouldSuppressError(error)
      ) {
        event.preventDefault(); // Prevent the error from being logged
        return;
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}