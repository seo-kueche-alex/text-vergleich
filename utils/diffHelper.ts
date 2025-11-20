import * as Diff from 'diff';

/**
 * Returns the raw diff chunks
 */
export const getDiffChunks = (oldText: string, newText: string) => {
  return Diff.diffWords(oldText, newText);
};

/**
 * Calculates the difference and returns HTML string with inline styles.
 * This string is used for both:
 * 1. Rendering in the UI (via ReactMarkdown)
 * 2. Copying to clipboard (so you can paste HTML tags into other tools)
 */
export const computeMarkdownDiff = (oldText: string, newText: string): string => {
  const changes = getDiffChunks(oldText, newText);
  
  let result = '';

  changes.forEach((part) => {
    const value = part.value;
    if (part.added) {
      // Added: Yellow background
      // We use inline styles which are required for email clients and some markdown editors
      result += `<span style="background-color: #fef08a; color: #713f12;">${value}</span>`;
    } else if (part.removed) {
      // Removed: Red background with strikethrough
      result += `<s style="background-color: #fee2e2; color: #7f1d1d; text-decoration: line-through;">${value}</s>`;
    } else {
      result += value;
    }
  });

  return result;
};
