import * as Diff from 'diff';

/**
 * Calculates the difference between two markdown strings and returns
 * a single string with HTML tags wrapping the changes.
 * 
 * Uses <ins> for additions and <del> for deletions.
 */
export const computeMarkdownDiff = (oldText: string, newText: string): string => {
  // We use diffWords to respect word boundaries, which is better for prose.
  const changes = Diff.diffWords(oldText, newText);
  
  let result = '';

  changes.forEach((part) => {
    const value = part.value;
    if (part.added) {
      // Added: Green/Yellow background. 
      // We add inline styles for clipboard compatibility (Word/Email)
      // and Tailwind classes for the UI.
      result += `<mark class="bg-yellow-200 text-yellow-900 rounded px-0.5" style="background-color: #fef08a; color: #713f12; padding: 0 2px; border-radius: 2px; text-decoration: none;">${value}</mark>`;
    } else if (part.removed) {
      // Removed: Red background with strikethrough.
      result += `<del class="bg-red-100 text-red-900 rounded px-0.5 decoration-red-500" style="background-color: #fee2e2; color: #7f1d1d; text-decoration: line-through; padding: 0 2px; border-radius: 2px;">${value}</del>`;
    } else {
      result += value;
    }
  });

  return result;
};
