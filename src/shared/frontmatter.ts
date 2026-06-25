/**
 * Simple YAML frontmatter parser — local stub replacing @oh-my-opencode/utils.
 */

export interface FrontmatterResult<T = Record<string, unknown>> {
  data: T;
  body: string;
  hadFrontmatter: boolean;
  parseError: boolean;
}

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

/**
 * Parse YAML frontmatter from markdown content.
 * Returns data (parsed YAML), body (content after frontmatter), and metadata.
 */
export function parseFrontmatter<T = Record<string, unknown>>(content: string): FrontmatterResult<T> {
  const match = content.match(FRONTMATTER_RE);
  if (!match) {
    return { data: {} as T, body: content, hadFrontmatter: false, parseError: false };
  }

  try {
    // Simple YAML key-value parser (covers the basic cases in prompt files)
    const yamlStr = match[1];
    const data: Record<string, unknown> = {};
    for (const line of yamlStr.split("\n")) {
      const kvMatch = line.match(/^(\w+):\s*(.+)$/);
      if (kvMatch) {
        const [, key, value] = kvMatch;
        // Strip quotes if present
        data[key] = value.replace(/^["\']|["\']$/g, "");
      }
    }
    return { data: data as T, body: match[2], hadFrontmatter: true, parseError: false };
  } catch {
    return { data: {} as T, body: content, hadFrontmatter: true, parseError: true };
  }
}
