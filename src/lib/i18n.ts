// FairPlan i18n — server-rendered translation bundle.
// Resident-facing pages call t(lang, key). UI labels stay close to source.
// AI-generated content (ticket explanations, plan rationale, reminders) is
// translated by the model itself via the language param on each skill call.

export const LANGUAGES = {
  en: { native: 'English', dir: 'ltr' as const },
  pa: { native: 'ਪੰਜਾਬੀ', dir: 'ltr' as const },
  hi: { native: 'हिन्दी', dir: 'ltr' as const },
  fr: { native: 'Français', dir: 'ltr' as const },
} as const;

export type Lang = keyof typeof LANGUAGES;
export const LANG_CODES = Object.keys(LANGUAGES) as Lang[];
export const DEFAULT_LANG: Lang = 'en';
export const LANG_COOKIE = 'fp_lang';

export function isLang(value: string | undefined): value is Lang {
  return !!value && (LANG_CODES as string[]).includes(value);
}

const dict = {
  // Navigation
  'nav.portal': {
    en: 'Resident portal',
    pa: 'ਨਿਵਾਸੀ ਪੋਰਟਲ',
    hi: 'निवासी पोर्टल',
    fr: 'Portail des résidents',
  },
  'nav.dashboard': {
    en: 'Public dashboard',
    pa: 'ਜਨਤਕ ਡੈਸ਼ਬੋਰਡ',
    hi: 'सार्वजनिक डैशबोर्ड',
    fr: 'Tableau de bord public',
  },
  'nav.my_notices': {
    en: 'My notices',
    pa: 'ਮੇਰੇ ਨੋਟਿਸ',
    hi: 'मेरे नोटिस',
    fr: 'Mes avis',
  },
  'nav.about': { en: 'About', pa: 'ਬਾਰੇ', hi: 'के बारे में', fr: 'À propos' },
  'nav.check_ticket': {
    en: 'Check a ticket',
    pa: 'ਟਿਕਟ ਦੇਖੋ',
    hi: 'टिकट देखें',
    fr: 'Vérifier un avis',
  },
  'nav.sign_in': { en: 'Sign in', pa: 'ਸਾਈਨ ਇਨ', hi: 'साइन इन', fr: 'Se connecter' },
  'nav.sign_out': { en: 'Sign out', pa: 'ਸਾਈਨ ਆਉਟ', hi: 'साइन आउट', fr: 'Se déconnecter' },
  'nav.create_account': {
    en: 'Create account',
    pa: 'ਖਾਤਾ ਬਣਾਓ',
    hi: 'खाता बनाएं',
    fr: 'Créer un compte',
  },

  // Ticket detail
  'ticket.agent_header': {
    en: 'FairPlan agent',
    pa: 'FairPlan ਏਜੰਟ',
    hi: 'FairPlan एजेंट',
    fr: 'Agent FairPlan',
  },
  'ticket.agent_subtitle': {
    en: 'Your notice, in plain language',
    pa: 'ਤੁਹਾਡਾ ਨੋਟਿਸ, ਸੌਖੀ ਭਾਸ਼ਾ ਵਿੱਚ',
    hi: 'आपका नोटिस, सरल भाषा में',
    fr: 'Votre avis, en langage simple',
  },
  'ticket.pay_now': {
    en: 'Pay now',
    pa: 'ਹੁਣੇ ਭੁਗਤਾਨ ਕਰੋ',
    hi: 'अभी भुगतान करें',
    fr: 'Payer maintenant',
  },
  'ticket.setup_plan': {
    en: 'Set up a payment plan',
    pa: 'ਭੁਗਤਾਨ ਯੋਜਨਾ ਬਣਾਓ',
    hi: 'भुगतान योजना बनाएं',
    fr: 'Créer un plan de paiement',
  },
  'ticket.request_review': {
    en: 'Request Screening Review',
    pa: 'ਸਕ੍ਰੀਨਿੰਗ ਸਮੀਖਿਆ ਦੀ ਬੇਨਤੀ',
    hi: 'स्क्रीनिंग समीक्षा का अनुरोध',
    fr: 'Demander une révision',
  },
  'ticket.due_in': {
    en: 'Due in {n}d',
    pa: '{n} ਦਿਨ ਵਿੱਚ ਬਕਾਇਆ',
    hi: '{n} दिन में देय',
    fr: 'Échéance dans {n}j',
  },
  'ticket.overdue_by': {
    en: 'Overdue by {n}d',
    pa: '{n} ਦਿਨ ਵੱਧ ਬਕਾਇਆ',
    hi: '{n} दिन अतिदेय',
    fr: 'En retard de {n}j',
  },

  // Plan recommender
  'plan.step1_header': {
    en: 'Tell us a little, so the plan fits you.',
    pa: 'ਥੋੜ੍ਹਾ ਦੱਸੋ ਤਾਂ ਜੋ ਯੋਜਨਾ ਤੁਹਾਡੇ ਲਈ ਢੁਕਵੀਂ ਹੋਵੇ।',
    hi: 'थोड़ा बताएं ताकि योजना आपके लिए सही हो।',
    fr: 'Dites-nous quelques détails pour adapter le plan.',
  },
  'plan.income_label': {
    en: 'Approximate household income (CAD / year)',
    pa: 'ਘਰੇਲੂ ਆਮਦਨ ਲਗਭਗ (CAD / ਸਾਲ)',
    hi: 'अनुमानित घरेलू आय (CAD / वर्ष)',
    fr: 'Revenu approximatif du ménage (CAD / an)',
  },
  'plan.household_label': {
    en: 'Household size',
    pa: 'ਘਰ ਦੇ ਮੈਂਬਰ',
    hi: 'घर के सदस्य',
    fr: 'Taille du ménage',
  },
  'plan.see_my_plan': {
    en: 'See my personalized plan',
    pa: 'ਮੇਰੀ ਯੋਜਨਾ ਦੇਖੋ',
    hi: 'मेरी योजना देखें',
    fr: 'Voir mon plan personnalisé',
  },
  'plan.your_plan': {
    en: 'Your plan',
    pa: 'ਤੁਹਾਡੀ ਯੋਜਨਾ',
    hi: 'आपकी योजना',
    fr: 'Votre plan',
  },
  'plan.total': { en: 'Total', pa: 'ਕੁੱਲ', hi: 'कुल', fr: 'Total' },
  'plan.apr': { en: 'APR', pa: 'APR', hi: 'APR', fr: 'TAEG' },
  'plan.first_payment': {
    en: 'First payment',
    pa: 'ਪਹਿਲੀ ਅਦਾਇਗੀ',
    hi: 'पहली किस्त',
    fr: 'Premier paiement',
  },
  'plan.accept_sign': {
    en: 'Accept & e-sign the agreement',
    pa: 'ਸਮਝੌਤੇ ਨੂੰ ਮਨਜ਼ੂਰ ਕਰੋ ਅਤੇ ਈ-ਦਸਤਖਤ',
    hi: 'समझौते को स्वीकारें और ई-हस्ताक्षर',
    fr: 'Accepter et signer électroniquement',
  },

  // Dispute flow
  'dispute.h1': {
    en: 'Ask the City to take another look.',
    pa: 'ਸ਼ਹਿਰ ਨੂੰ ਮੁੜ ਵਿਚਾਰ ਲਈ ਕਹੋ।',
    hi: 'शहर से पुनर्विचार के लिए कहें।',
    fr: 'Demandez à la Ville de réexaminer.',
  },
  'dispute.sub': {
    en: "Under Brampton's APS, you have 15 days from the date on the notice to request a Screening Review. There's no cost to file. A human Screening Officer always decides.",
    pa: 'ਬ੍ਰੈਮਪਟਨ ਦੇ APS ਅਨੁਸਾਰ, ਤੁਹਾਡੇ ਕੋਲ 15 ਦਿਨਾਂ ਦੇ ਅੰਦਰ ਸਕ੍ਰੀਨਿੰਗ ਸਮੀਖਿਆ ਦੀ ਬੇਨਤੀ ਕਰਨ ਦਾ ਅਧਿਕਾਰ ਹੈ। ਕੋਈ ਫੀਸ ਨਹੀਂ ਲੱਗਦੀ। ਫੈਸਲਾ ਹਮੇਸ਼ਾ ਮਨੁੱਖੀ ਅਧਿਕਾਰੀ ਕਰਦਾ ਹੈ।',
    hi: 'ब्रैम्पटन के APS के तहत, आप नोटिस की तारीख से 15 दिन के भीतर स्क्रीनिंग समीक्षा का अनुरोध कर सकते हैं। कोई शुल्क नहीं। निर्णय हमेशा मानव अधिकारी करता है।',
    fr: "Sous l'APS de Brampton, vous avez 15 jours à compter de la date de l'avis pour demander une révision préalable. Aucun frais. Un agent humain décide toujours.",
  },
  'dispute.submit': {
    en: 'Submit Screening Review',
    pa: 'ਸਮੀਖਿਆ ਜਮ੍ਹਾਂ ਕਰੋ',
    hi: 'समीक्षा जमा करें',
    fr: 'Soumettre la révision',
  },

  // Decision page
  'decision.cancelled': {
    en: 'Notice cancelled',
    pa: 'ਨੋਟਿਸ ਰੱਦ',
    hi: 'नोटिस रद्द',
    fr: 'Avis annulé',
  },
  'decision.reduced': {
    en: 'Penalty reduced',
    pa: 'ਜੁਰਮਾਨਾ ਘਟਾਇਆ',
    hi: 'जुर्माना घटाया',
    fr: 'Pénalité réduite',
  },
  'decision.upheld': {
    en: 'Notice upheld',
    pa: 'ਨੋਟਿਸ ਬਰਕਰਾਰ',
    hi: 'नोटिस बरकरार',
    fr: 'Avis maintenu',
  },
  'decision.hearing_required': {
    en: 'Hearing required',
    pa: 'ਸੁਣਵਾਈ ਲੋੜੀਂਦੀ',
    hi: 'सुनवाई आवश्यक',
    fr: 'Audience requise',
  },

  // Misc
  'a11y.skip_to_content': {
    en: 'Skip to content',
    pa: 'ਮੁੱਖ ਸਮੱਗਰੀ ਤੇ ਜਾਓ',
    hi: 'मुख्य सामग्री पर जाएं',
    fr: 'Aller au contenu',
  },
  'lang.label': {
    en: 'Language',
    pa: 'ਭਾਸ਼ਾ',
    hi: 'भाषा',
    fr: 'Langue',
  },
} as const satisfies Record<string, Record<Lang, string>>;

export type TranslationKey = keyof typeof dict;

export function t(lang: Lang, key: TranslationKey, vars?: Record<string, string | number>): string {
  let s = dict[key][lang] ?? dict[key].en;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

export function readLangFromCookie(headers: Headers): Lang {
  const raw = headers.get('cookie') ?? '';
  for (const part of raw.split(';')) {
    const [k, v] = part.trim().split('=');
    if (k === LANG_COOKIE && isLang(v)) return v;
  }
  return DEFAULT_LANG;
}
