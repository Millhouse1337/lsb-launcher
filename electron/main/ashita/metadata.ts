export interface AddonMetadata {
  name?: string;
  author?: string;
  version?: string;
  description?: string;
}

const PATTERNS: Record<keyof AddonMetadata, RegExp> = {
  name: /(?:_?addon)\s*\.\s*name\s*=\s*['"]([^'"]+)['"]/i,
  author: /(?:_?addon)\s*\.\s*author\s*=\s*['"]([^'"]+)['"]/i,
  version: /(?:_?addon)\s*\.\s*version\s*=\s*['"]([^'"]+)['"]/i,
  description: /(?:_?addon)\s*\.\s*(?:desc|description)\s*=\s*['"]([^'"]+)['"]/i,
};

export function parseAddonMetadata(lua: string): AddonMetadata {
  const result: AddonMetadata = {};
  for (const [key, pattern] of Object.entries(PATTERNS) as [keyof AddonMetadata, RegExp][]) {
    const match = lua.match(pattern);
    if (match) result[key] = match[1];
  }
  return result;
}
