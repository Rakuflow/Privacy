/**
 * Silently handles permission errors and uses fallback method
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try Clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Silent fallback - don't log permission errors
      // This is expected in sandboxed/iframe environments
    }
  }

  // Fallback method
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    return successful;
  } catch (err) {
    console.error('All clipboard methods failed:', err);
    return false;
  }
}
