/**
 * Copies text to the clipboard with fallback support for non-secure contexts (HTTP)
 * and environments where navigator.clipboard is undefined.
 *
 * @param {string} text - The text to copy
 * @returns {Promise<boolean>} - Resolves to true if copy succeeded, false otherwise
 */
export async function copyToClipboard(text) {
  if (!text) return false;

  // Modern navigator.clipboard API (requires HTTPS or localhost / secure context)
  if (navigator?.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, trying fallback:', err);
    }
  }

  // Fallback using execCommand for HTTP (non-secure context) or older browsers
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '-9999px';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.setAttribute('readonly', '');

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback copyToClipboard failed:', err);
    return false;
  }
}
