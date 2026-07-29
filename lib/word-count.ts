// Shared by the Mongoose schema validator and the Zod form schema so the
// two layers can't silently drift apart on what "a word" means.
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
