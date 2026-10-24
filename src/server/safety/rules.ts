// Deterministic layer of the safety pipeline (SPEC §6.2, steps 1 and 3).
// Pure functions so they run instantly and are unit tested.

/** Below this, a press is a tap, not a question. */
export const MIN_AUDIO_SECONDS = 0.5;

// Transcription models hallucinate on silence: "you", "thank you", subtitle credits, other scripts.
const NOISE_PATTERNS = [
  /^(you|thank you|thanks|bye|okay|ok|hmm+|uh+|um+|ah+|oh+|so|yeah|merci|euh+)[.!?…]*$/i,
  /thanks? for watching/i,
  /subtitles? (by|from)/i,
  /sous-titr/i,
  /^[\s.…,!?♪*-]*$/,
];
const FOREIGN_SCRIPT = /[Ѐ-ӿ֐-׿؀-ۿ฀-๿぀-ヿ㐀-鿿가-힯]/;

export type InputCheck = { ok: true; text: string } | { ok: false; reason: string };

export function checkInput(transcript: string, audioSeconds?: number): InputCheck {
  const text = transcript.replace(/\s+/g, " ").trim();
  if (audioSeconds !== undefined && audioSeconds < MIN_AUDIO_SECONDS) return { ok: false, reason: "too_short" };
  if (text.length < 2) return { ok: false, reason: "empty" };
  if (FOREIGN_SCRIPT.test(text)) return { ok: false, reason: "foreign_script" };
  if (NOISE_PATTERNS.some((pattern) => pattern.test(text))) return { ok: false, reason: "noise" };
  return { ok: true, text };
}

export type RuleVerdict =
  | { verdict: "decline"; reason: string; alert: boolean }
  | { verdict: "grown_up"; reason: string; distress: boolean }
  | { verdict: "answer"; reason: "affection" };

type Rule = { pattern: RegExp; reason: string };

// Distress is checked first: it must reach a grown-up, never be "declined".
const DISTRESS: Rule[] = [
  { pattern: /\b(kill|hurt|cut) (myself|me)\b|\bwant to die\b|\bnobody loves me\b|\bme (tuer|faire du mal)\b|\bveux mourir\b/i, reason: "self_harm" },
  { pattern: /\b(someone|somebody|he|she|they|a grown.?up) (hit|hits|touched|touches|hurts?) me\b|\bon me (frappe|touche)\b/i, reason: "abuse" },
];

const DECLINE: Rule[] = [
  { pattern: /\b(light|start|make|set)\b.{0,15}\bfire\b|\bmatch(es)?\b|\blighter\b|\ballumer\b.{0,15}\bfeu\b|\ballumettes?\b|\bbriquet\b/i, reason: "fire" },
  { pattern: /\b(pills?|medicines?|medication|drugs?|meds)\b|\bm[ée]dicaments?\b|\bpilules?\b/i, reason: "medicine" },
  { pattern: /\b(weapons?|guns?|knife|knives|bombs?|explosives?|sword|kill (someone|a person|people))\b|\barmes?\b|\bfusil\b|\bcouteau\b|\bbombe\b/i, reason: "weapon" },
  { pattern: /\b(poison|bleach|alcohol|beer|wine|vodka|cigarettes?|vapes?)\b|\bpoison\b|\bjavel\b|\balcool\b/i, reason: "dangerous_substance" },
  { pattern: /\bmy (home )?address\b|\bwhere (do )?i live\b|\b(phone number|password|credit card|pin code)\b|\bmon adresse\b|\bmot de passe\b/i, reason: "personal_info" },
  { pattern: /\bsecrets? about\b|\bun secret sur\b/i, reason: "privacy" },
  { pattern: /\b(steal|stealing|shoplift(ing)?)\b|\bvoler (de l'argent|l'argent|dans (un|le|les|la) (magasin|porte-monnaie|sac))\b/i, reason: "stealing" },
  { pattern: /\b(sex|sexy|porn|naked|nude)\b|\bporno\b|\btoute? nue?\b/i, reason: "adult" },
];

const GROWN_UP: Rule[] = [
  { pattern: /\bbab(y|ies)\b.{0,25}\b(come from|made|born)\b|\bwhere do bab(y|ies)\b|\bd'o[uù] viennent les b[ée]b[ée]s\b/i, reason: "babies" },
  // Death of people or pets needs a grown-up; "why did dinosaurs die out?" is plain science.
  { pattern: /\b(grand(pa|ma|father|mother)|granny|mom|mum|dad|mommy|daddy|people|person|someone|we|i|you|pets?|dog|cat|hamster|friend)\b.{0,20}\b(die|died|dies|dying|dead|death)\b|\b(die|died|dead|death)\b.{0,20}\b(grand(pa|ma|father|mother)|mom|mum|dad|people|pets?|dog|cat)\b|\bfuneral\b|\b(papi|mamie|papy|grand-p[èe]re|grand-m[èe]re|maman|papa|chien|chat)\b.{0,20}\b(mort|mourir|d[ée]c[ée]d[ée])\b/i, reason: "death" },
  { pattern: /\b(god|gods|heaven|hell|religion|church|mosque|synagogue)\b|\bdieu\b|\bparadis\b|\breligion\b/i, reason: "religion" },
  { pattern: /(?<!star )\b(war|wars|terroris[mt]|shooting|election|president)\b|\bguerre\b|\battentat\b/i, reason: "difficult_news" },
  { pattern: /\b(divorce|divorced|fight(ing)?|argue|arguing|yell(ing)?)\b.{0,30}\b(mom|dad|mum|parents?|maman|papa)\b|\bdivorce\b/i, reason: "family_conflict" },
  { pattern: /\b(private parts|puberty)\b|\bpubert[ée]\b/i, reason: "body" },
];

// "Do you love me?" gets an answer that gently points back to real people (SPEC §6.4).
const AFFECTION = /\b(do you love me|i love you|you'?re my best friend|be my best friend|are you my friend)\b|\btu m'aimes\b|\bje t'aime\b|\bmeilleur ami\b/i;

export function applyRules(text: string): RuleVerdict | undefined {
  for (const rule of DISTRESS) {
    if (rule.pattern.test(text)) return { verdict: "grown_up", reason: rule.reason, distress: true };
  }
  for (const rule of DECLINE) {
    if (rule.pattern.test(text)) {
      return { verdict: "decline", reason: rule.reason, alert: rule.reason === "weapon" || rule.reason === "medicine" };
    }
  }
  for (const rule of GROWN_UP) {
    if (rule.pattern.test(text)) return { verdict: "grown_up", reason: rule.reason, distress: false };
  }
  if (AFFECTION.test(text)) return { verdict: "answer", reason: "affection" };
  return undefined;
}

const STORY_REQUEST = /\b(tell|read) me (a|another) (bedtime )?story\b|\bbedtime story\b|\braconte(-| )moi une histoire\b|\bune histoire\b/i;

export function isStoryRequest(text: string): boolean {
  return STORY_REQUEST.test(text);
}

// Instant language guess for turns decided by the rules alone (no classifier call).
const FRENCH_HINT =
  /[àâçéèêëîïôûùüÿœ]|\b(je|tu|il|elle|nous|vous|est|les|des|une|pourquoi|comment|quoi|qui|o[uù]|c'est|qu'est|moi|mon|ma|mes|ton|ta|veux|peux|fait|faire|avec|dans|sur|pas)\b/i;

export function guessLanguage(text: string): "en" | "fr" {
  return FRENCH_HINT.test(text) ? "fr" : "en";
}
