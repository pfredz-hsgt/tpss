// Simple rich text formatter for *bold* and _italic_ syntax (WhatsApp-style)

export function formatRichText(text: string): string {
  // Escape HTML to prevent XSS
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Convert *text* to <strong>text</strong>
  escaped = escaped.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  
  // Convert _text_ to <em>text</em>
  escaped = escaped.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Convert line breaks to <br>
  escaped = escaped.replace(/\n/g, '<br>');

  return escaped;
}

