/**
 * Detects WhatsApp farm/spam profile names from Pure Herbex ad saboteurs.
 *
 * AUTO-BLOCK only high-confidence farm patterns (kk30641320, 08654hbfgj, 123456789).
 * Weird but human names pass: azmataliban, Education, allah256126, hajikhanjan94, Ali Malo.
 */

export type SpamVerdict = "clean" | "suspect" | "spam";

export type SpamAssessment = {
  verdict: SpamVerdict;
  score: number;
  reasons: string[];
};

/** Strip emoji / symbols so "🌻 Malik 🌻" is judged on the name text. */
export function stripDisplayNameDecorations(raw: string): string {
  return raw
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/[^\p{L}\p{N}\s.'-]/gu, "")
    .trim();
}

/** Classic farm: 1–2 lowercase letters + digit run (kk30641320, ks5043447, h42578302). */
const FARM_SHORT_PREFIX_DIGITS = /^[a-z]{1,2}\d{5,12}$/;

/** Digits then random letters (08654hbfgj). */
const FARM_DIGITS_THEN_LETTERS = /^\d{4,8}[a-z]{3,12}$/;

/** Pure numeric display names (123456789). */
const FARM_PURE_DIGITS = /^\d{6,15}$/;

/** Gibberish lowercase blob + optional digits, almost no vowels (fjdxdj00). */
const FARM_GIBBERISH_BLOB = /^[a-z]{5,14}\d{0,3}$/;

const COMMON_PK_NAME_WORDS =
  /^(muhammad|mohammad|ahmed|ahmad|ali|hassan|husain|usman|umar|bilal|faisal|imran|khan|malik|butt|sheikh|shah|raza|abbas|fatima|aisha|zain|hamza|salman|nadeem|tariq|asif|waqas|fahad|saeed|yasir|kamran|adnan|arif|javed|akbar|amir|anas|danish|farhan|hafiz|ijaz|junaid|kashif|liaquat|naveed|owais|qasim|rizwan|shoaib|sohail|tahir|waseem|younis|zeeshan|adeel|rana|umair|mudassar|malik|azmat|haji|allah|education)/i;

function hasUrduOrArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
}

function isGibberishLetters(name: string): boolean {
  const letters = name.replace(/\d/g, "");
  if (letters.length < 5) return false;
  const vowels = (letters.match(/[aeiou]/gi) || []).length;
  return vowels <= 1;
}

function looksLikeRealWordName(name: string): boolean {
  const letters = name.replace(/\d/g, "").toLowerCase();
  if (letters.length < 4) return false;
  const vowels = (letters.match(/[aeiou]/gi) || []).length;
  if (vowels >= 2) return true;
  return COMMON_PK_NAME_WORDS.test(letters);
}

/**
 * Strict farm check — only patterns from confirmed spam screenshots.
 * Does NOT block: azmataliban, allah256126, hajikhanjan94, Education, Ali Malo.
 */
export function isDefiniteFarmName(profileName: string): boolean {
  const raw = stripDisplayNameDecorations(profileName);
  if (!raw) return false;

  if (hasUrduOrArabic(raw)) return false;
  if (/\s/.test(raw)) return false;
  if (/[A-Z]/.test(raw)) return false;

  const name = raw.toLowerCase();

  if (FARM_PURE_DIGITS.test(name)) return true;
  if (FARM_SHORT_PREFIX_DIGITS.test(name)) return true;
  if (FARM_DIGITS_THEN_LETTERS.test(name)) return true;
  if (FARM_GIBBERISH_BLOB.test(name) && isGibberishLetters(name)) return true;

  return false;
}

/**
 * Score a WhatsApp profile display name.
 * Only definite farm patterns reach "spam" / auto-block.
 */
export function assessSpamProfile(
  profileName: string,
  options?: {
    firstMessageText?: string;
    hasConfirmTag?: boolean;
    isKnownCustomer?: boolean;
  }
): SpamAssessment {
  if (options?.hasConfirmTag || options?.isKnownCustomer) {
    return { verdict: "clean", score: 0, reasons: ["trusted_contact"] };
  }

  const raw = stripDisplayNameDecorations(profileName || "");
  if (!raw || raw === "WhatsApp Contact") {
    return { verdict: "clean", score: 0, reasons: [] };
  }

  if (hasUrduOrArabic(raw)) {
    return { verdict: "clean", score: 0, reasons: ["urdu_name"] };
  }

  if (/\s/.test(raw)) {
    return { verdict: "clean", score: 0, reasons: ["has_space"] };
  }

  if (/[A-Z]/.test(raw)) {
    return { verdict: "clean", score: 0, reasons: ["mixed_case_name"] };
  }

  const name = raw.toLowerCase();

  if (isDefiniteFarmName(profileName)) {
    const reasons: string[] = [];
    if (FARM_PURE_DIGITS.test(name)) reasons.push("pure_digits");
    else if (FARM_SHORT_PREFIX_DIGITS.test(name)) reasons.push("short_prefix_digits_farm");
    else if (FARM_DIGITS_THEN_LETTERS.test(name)) reasons.push("digits_then_letters_farm");
    else reasons.push("gibberish_farm");
    return { verdict: "spam", score: 100, reasons };
  }

  if (looksLikeRealWordName(name)) {
    return { verdict: "clean", score: 0, reasons: ["word_name"] };
  }

  return { verdict: "clean", score: 0, reasons: [] };
}

export function shouldAutoBlockSpam(assessment: SpamAssessment): boolean {
  return assessment.verdict === "spam";
}
