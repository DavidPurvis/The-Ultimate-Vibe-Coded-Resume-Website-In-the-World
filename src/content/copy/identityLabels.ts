/** Identity ids and their short labels — split out so the header callback doesn't pull the whole checkpoint script. */
export type IdentityId = 'chatgpt' | 'claude' | 'gemini' | 'human' | 'clippy' | 'other';

export const callbackLabels: Record<IdentityId, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  human: 'Human',
  clippy: 'Clippy',
  other: 'Other AI',
};
