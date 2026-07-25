/**
 * emailUtils.js - Validation and cleaning helpers for Gmail & Domain emails
 */

/**
 * Validates Gmail username based on Google constraints:
 * - Length: 6 to 30 characters (before @gmail.com)
 * - Allowed: Letters (a-z), Numbers (0-9), Dots (.), Underscores (_), Hyphens (-), Plus (+)
 * - Disallowed: Spaces, consecutive dots (..), starting or ending with a dot (.), special symbols
 */
export function validateGmailUsername(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return { isValid: false, error: 'Primary Email is required.' };
  }

  // Remove trailing @gmail.com if typed or pasted
  const username = rawInput.replace(/@gmail\.com$/i, '').trim();

  if (username.length < 6 || username.length > 30) {
    return { isValid: false, error: 'Primary email username must be between 6 and 30 characters.' };
  }

  if (username.startsWith('.') || username.endsWith('.')) {
    return { isValid: false, error: 'Primary email username cannot start or end with a dot (.).' };
  }

  if (username.includes('..')) {
    return { isValid: false, error: 'Primary email username cannot contain consecutive dots (..).' };
  }

  if (/[\s$#%&*!?/\\,:]/.test(username)) {
    return { isValid: false, error: 'Primary email username contains invalid special characters or spaces.' };
  }

  if (!/^[a-zA-Z0-9._+-]+$/.test(username)) {
    return { isValid: false, error: 'Primary email username contains disallowed characters.' };
  }

  return {
    isValid: true,
    username: username,
    fullEmail: `${username}@gmail.com`
  };
}

/**
 * Cleans domain email input by stripping redundant @ksrce.ac.in suffix
 */
export function cleanDomainEmailUsername(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return '';
  return rawInput.replace(/@ksrce\.ac\.in$/i, '').trim();
}
