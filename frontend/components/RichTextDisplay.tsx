'use client';

import { formatRichText } from '@/lib/richText';

export default function RichTextDisplay({ text }: { text: string }) {
  return (
    <div
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: formatRichText(text) }}
    />
  );
}

