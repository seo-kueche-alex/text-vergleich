import * as Diff from 'diff';

/**
 * Calculates the difference between two markdown strings and returns
 * a single string with HTML tags wrapping the changes.
 * 
 * Uses <ins> for additions and <del> for deletions.
 */
export const computeMarkdownDiff = (oldText: string, newText: string): string => {
  // We use diffWords to respect word boundaries, which is better for prose.
  // For code blocks, diffLines might be better, but diffWords is a good middle ground for markdown.
  const changes = Diff.diffWords(oldText, newText);
  
  let result = '';

  changes.forEach((part) => {
    const value = part.value;
    if (part.added) {
      // We wrap in <ins> which implies underlining, but we will style it yellow in CSS/Tailwind
      // Using inline style or specific class that we handle in rehype/renderer
      // We inject a span with a specific class that Tailwind recognizes if we were using raw HTML,
      // but since we are passing to ReactMarkdown with rehype-raw, we can use standard tags with classes.
      result += `<mark class="bg-yellow-200 text-yellow-900 rounded px-0.5">${value}</mark>`;
    } else if (part.removed) {
      result += `<del class="bg-red-100 text-red-900 rounded px-0.5 decoration-red-500">${value}</del>`;
    } else {
      result += value;
    }
  });

  return result;
};
