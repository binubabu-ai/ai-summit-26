/**
 * Document Format Converter
 * Converts various document formats to markdown for processing
 */

import mammoth from 'mammoth';
import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

export interface ConversionResult {
  markdown: string;
  originalFormat: string;
  warnings?: string[];
}

/**
 * Convert .docx file to markdown
 */
export async function convertDocxToMarkdown(buffer: Buffer): Promise<ConversionResult> {
  try {
    // Convert .docx to HTML using mammoth
    const result = await mammoth.convertToHtml({ buffer });

    // Convert HTML to markdown using turndown
    const markdown = turndownService.turndown(result.value);

    const warnings: string[] = [];

    // Collect conversion warnings
    if (result.messages && result.messages.length > 0) {
      result.messages.forEach(msg => {
        if (msg.type === 'warning') {
          warnings.push(msg.message);
        }
      });
    }

    return {
      markdown: markdown.trim(),
      originalFormat: 'docx',
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    throw new Error(`Failed to convert .docx to markdown: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convert uploaded file to markdown based on its type
 */
export async function convertToMarkdown(file: File): Promise<ConversionResult> {
  const fileName = file.name.toLowerCase();

  // Already markdown
  if (fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
    const content = await file.text();
    return {
      markdown: content,
      originalFormat: 'markdown',
    };
  }

  // Plain text
  if (fileName.endsWith('.txt')) {
    const content = await file.text();
    return {
      markdown: content,
      originalFormat: 'text',
    };
  }

  // .docx files
  if (fileName.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return await convertDocxToMarkdown(buffer);
  }

  // PDF (not supported yet - would need pdf-parse or similar)
  if (fileName.endsWith('.pdf')) {
    throw new Error('PDF conversion not yet implemented. Please convert to .docx or .md first.');
  }

  // Unsupported format
  throw new Error(`Unsupported file format: ${fileName}. Supported formats: .md, .txt, .docx`);
}

/**
 * Detect if content is binary (not text)
 */
export function isBinaryContent(content: string): boolean {
  // Check for null bytes or other binary indicators
  if (content.includes('\0')) return true;

  // Check for ZIP signature (PK) - indicates .docx, .xlsx, etc.
  if (content.startsWith('PK')) return true;

  // Check for PDF signature
  if (content.startsWith('%PDF')) return true;

  // Check for other binary indicators
  const binaryPattern = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;
  return binaryPattern.test(content.substring(0, 512));
}

/**
 * Clean markdown content
 * Remove excessive whitespace, normalize line endings
 */
export function cleanMarkdown(markdown: string): string {
  return markdown
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // Remove trailing whitespace
    .replace(/[ \t]+$/gm, '')
    // Limit consecutive blank lines to 2
    .replace(/\n{4,}/g, '\n\n\n')
    // Trim start/end
    .trim();
}
