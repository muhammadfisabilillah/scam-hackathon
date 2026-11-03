const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?:\+62|62|0)[\s.-]?8[1-9](?:[\s.-]?\d){6,11}\b/g;
const OTP_DIGITS_PATTERN =
  /(?<=\b(?:otp|kode otp|kode verifikasi|verification code|one-time password|pin|password)\b\s*(?:is|adalah|:|=)?\s*)\d{4,8}\b/gi;
const LONG_NUMBER_PATTERN = /\+?\b\d(?:[ -]?\d){7,18}\b/g;

export function redactPII(text: string): string {
  return text
    .replace(EMAIL_PATTERN, "[REDACTED_EMAIL]")
    .replace(PHONE_PATTERN, "[REDACTED_PHONE]")
    .replace(OTP_DIGITS_PATTERN, "[REDACTED_SENSITIVE]")
    .replace(LONG_NUMBER_PATTERN, "[REDACTED_SENSITIVE]");
}
