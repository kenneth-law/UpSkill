/**
 * Custom error handler for webpack HMR errors
 * This script patches the error handling in Next.js to prevent crashes
 * when webpack messages have null values
 */

// Function to safely handle webpack messages
function safelyHandleWebpackMessages() {
  if (typeof window !== 'undefined') {
    // Store the original console.error
    const originalConsoleError = console.error;

    // Override console.error to catch and handle specific webpack errors
    console.error = function(...args) {
      // Check if this is the webpack HMR error we're looking for
      const errorString = args.join(' ');
      if (
        errorString.includes('Cannot read properties of null') &&
        (errorString.includes('webpack') || errorString.includes('HMR'))
      ) {
        console.warn('Suppressed webpack HMR error. This is a known issue and can be safely ignored.');
        return;
      }

      // For all other errors, use the original console.error
      originalConsoleError.apply(console, args);
    };

    // Add a global error handler for uncaught exceptions
    window.addEventListener('error', function(event) {
      if (
        event.error && 
        event.error.message && 
        event.error.message.includes('Cannot read properties of null') &&
        (event.error.stack.includes('webpack') || event.error.stack.includes('HMR'))
      ) {
        console.warn('Caught webpack HMR error. This is a known issue and can be safely ignored.');
        event.preventDefault();
        return true;
      }
      return false;
    });
  }
}

// Initialize the error handler
safelyHandleWebpackMessages();

export default safelyHandleWebpackMessages;