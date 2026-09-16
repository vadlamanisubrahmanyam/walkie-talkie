// Shared validation for anything typed into a text box in this app.
// Keeping rules in one place means the same limits show up consistently
// in ChannelsScreen and (later) anywhere else a name/code is entered.

const CHANNEL_NAME_MIN = 2;
const CHANNEL_NAME_MAX = 30;
// Letters, numbers, spaces, and a few common punctuation marks — blocks
// stray control characters and keeps Firestore doc/display data predictable.
const CHANNEL_NAME_PATTERN = /^[a-zA-Z0-9 ][a-zA-Z0-9 '\-_.]*$/;

const INVITE_CODE_LENGTH = 6;
// Must match the alphabet used in generateInviteCode() (firestoreService.js) —
// no 0/O/1/I/etc, to avoid ambiguous codes read out loud or handwritten.
const INVITE_CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;

export function validateChannelName(rawName) {
  const name = rawName.trim();
  if (name.length === 0) return { valid: false, error: "Enter a channel name." };
  if (name.length < CHANNEL_NAME_MIN) return { valid: false, error: `Name must be at least ${CHANNEL_NAME_MIN} characters.` };
  if (name.length > CHANNEL_NAME_MAX) return { valid: false, error: `Name must be ${CHANNEL_NAME_MAX} characters or fewer.` };
  if (!CHANNEL_NAME_PATTERN.test(name)) {
    return { valid: false, error: "Use letters, numbers, and spaces only." };
  }
  return { valid: true, value: name };
}

export function validateInviteCode(rawCode) {
  const code = rawCode.trim().toUpperCase();
  if (code.length === 0) return { valid: false, error: "Enter an invite code." };
  if (code.length !== INVITE_CODE_LENGTH) {
    return { valid: false, error: `Invite codes are ${INVITE_CODE_LENGTH} characters.` };
  }
  if (!INVITE_CODE_PATTERN.test(code)) {
    return { valid: false, error: "That doesn't look like a valid invite code." };
  }
  return { valid: true, value: code };
}
