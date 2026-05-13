// Curated multilingual sample responses used when no upstream AI provider is bound.
// Local demos stay fully functional without a Cloudflare login; deployed
// environments route through Workers AI / Claude and never reach this file.

type Lang = 'en' | 'pa' | 'hi' | 'ur' | 'fr' | 'es';

const EXPLAIN: Record<Lang, string> = {
  en: `You've received a Brampton Administrative Penalty Notice. The bylaw cited covers a specific safety or community-standard concern — the description on the notice itself is the most accurate summary.

You have three options under the City's Administrative Penalty System:
1. Pay the notice online, by mail, or in person at 5 Ray Lawson Blvd.
2. Request a Screening Review within 15 days — a Screening Officer will look at the facts and may reduce or cancel the penalty.
3. Set up a personalized payment plan through FairPlan — 0% interest, instalments calibrated to your household.

If paying the full amount is difficult right now, you're not alone, and the City offers hardship-aware plans. We'll walk you through it.`,

  pa: `ਤੁਹਾਨੂੰ ਬ੍ਰੈਮਪਟਨ ਤੋਂ ਇੱਕ ਪ੍ਰਸ਼ਾਸਨਿਕ ਜੁਰਮਾਨਾ ਨੋਟਿਸ ਮਿਲਿਆ ਹੈ। ਉੱਪਰ ਦਿੱਤਾ ਉਪ-ਨਿਯਮ ਕਿਸੇ ਸੁਰੱਖਿਆ ਜਾਂ ਭਾਈਚਾਰੇ ਦੇ ਨਿਯਮ ਨਾਲ ਜੁੜਿਆ ਹੈ — ਨੋਟਿਸ ਉੱਤੇ ਲਿਖਿਆ ਵੇਰਵਾ ਸਭ ਤੋਂ ਸਹੀ ਹੈ।

ਤੁਹਾਡੇ ਕੋਲ ਤਿੰਨ ਵਿਕਲਪ ਹਨ:
1. ਨੋਟਿਸ ਦਾ ਭੁਗਤਾਨ ਕਰੋ — ਆਨਲਾਈਨ, ਡਾਕ ਰਾਹੀਂ, ਜਾਂ 5 Ray Lawson Blvd ਉੱਤੇ।
2. 15 ਦਿਨਾਂ ਅੰਦਰ ਸਕ੍ਰੀਨਿੰਗ ਸਮੀਖਿਆ ਲਈ ਅਰਜ਼ੀ ਦਿਓ — ਅਧਿਕਾਰੀ ਨੋਟਿਸ ਘਟਾ ਜਾਂ ਰੱਦ ਕਰ ਸਕਦਾ ਹੈ।
3. FairPlan ਰਾਹੀਂ ਆਪਣੇ ਘਰ ਮੁਤਾਬਕ ਯੋਜਨਾ ਬਣਾਓ — 0% ਵਿਆਜ, ਆਸਾਨ ਕਿਸ਼ਤਾਂ।

ਜੇ ਪੂਰੀ ਰਕਮ ਅਦਾ ਕਰਨੀ ਔਖੀ ਹੈ, ਤਾਂ ਫ਼ਿਕਰ ਨਾ ਕਰੋ — ਸ਼ਹਿਰ ਔਖੇ ਹਾਲਾਤਾਂ ਨੂੰ ਧਿਆਨ ਵਿੱਚ ਰੱਖਦਾ ਹੈ।`,

  hi: `आपको ब्रैम्पटन से एक प्रशासनिक दंड नोटिस मिला है। ऊपर दिया उप-नियम किसी सुरक्षा या सामुदायिक मानक से जुड़ा है — नोटिस का विवरण सबसे सटीक है।

आपके पास तीन विकल्प हैं:
1. नोटिस का भुगतान करें — ऑनलाइन, डाक से, या 5 Ray Lawson Blvd पर।
2. 15 दिन के भीतर स्क्रीनिंग समीक्षा के लिए आवेदन करें — अधिकारी नोटिस घटा या रद्द कर सकते हैं।
3. FairPlan के माध्यम से व्यक्तिगत भुगतान योजना बनाएं — 0% ब्याज, आपके परिवार के अनुसार किस्तें।

अगर पूरी राशि देना मुश्किल है, तो परेशान न हों — शहर कठिनाई को ध्यान में रखता है।`,

  ur: `آپ کو برمپٹن سے ایک انتظامی جرمانہ نوٹس موصول ہوا ہے۔ نوٹس پر دیا گیا قانون کسی حفاظتی یا کمیونٹی معیار سے متعلق ہے۔

آپ کے پاس تین اختیارات ہیں:
1. نوٹس کی ادائیگی کریں — آن لائن، ڈاک، یا 5 Ray Lawson Blvd پر۔
2. 15 دن کے اندر اسکریننگ ریویو کی درخواست دیں۔
3. FairPlan کے ذریعے ذاتی ادائیگی منصوبہ بنائیں — 0% سود۔

اگر پوری رقم ادا کرنا مشکل ہے، تو فکر نہ کریں — شہر مشکلات کو سمجھتا ہے۔`,

  fr: `Vous avez reçu un avis de pénalité administrative de la Ville de Brampton. Le règlement cité concerne une question de sécurité ou de norme communautaire — la description sur l'avis lui-même est la plus précise.

Sous le système de pénalités administratives, vous avez trois options :
1. Payer l'avis en ligne, par la poste, ou en personne au 5 Ray Lawson Blvd.
2. Demander une révision préalable dans les 15 jours — un agent peut réduire ou annuler la pénalité.
3. Mettre en place un plan de paiement personnalisé via FairPlan — 0 % d'intérêt, versements adaptés à votre ménage.

Si payer le montant complet est difficile, vous n'êtes pas seul — la Ville propose des plans qui tiennent compte des difficultés.`,

  es: `Ha recibido un Aviso de Multa Administrativa de la Ciudad de Brampton. La ordenanza citada cubre una preocupación de seguridad o estándar comunitario — la descripción en el aviso es el resumen más preciso.

Tiene tres opciones:
1. Pagar el aviso en línea, por correo, o en persona en 5 Ray Lawson Blvd.
2. Solicitar una Revisión de Selección dentro de 15 días — un oficial puede reducir o cancelar la multa.
3. Configurar un plan de pago personalizado a través de FairPlan — 0% de interés.

Si pagar el monto completo es difícil, no está solo — la Ciudad ofrece planes que tienen en cuenta las dificultades.`,
};

const EXPLAIN_PLAN: Record<Lang, string> = {
  en: `Here's the reasoning behind this plan: the City charges no interest, so the total you pay matches the notice exactly. Spreading the amount over the months above keeps each instalment within reach. Paying the same amount with a credit card at the published Canadian average APR would add real interest on top — money that stays in your household with FairPlan.

What happens next: review the agreement, sign it electronically, and your first payment will be scheduled about two weeks out. If anything changes, contact City Court Services at 905-450-4770 — your plan can be rebalanced without penalty.`,

  pa: `ਇਸ ਯੋਜਨਾ ਪਿੱਛੇ ਸੋਚ ਇਹ ਹੈ: ਸ਼ਹਿਰ ਕੋਈ ਵਿਆਜ ਨਹੀਂ ਲੈਂਦਾ, ਇਸ ਲਈ ਨੋਟਿਸ ਉੱਤੇ ਜਿੰਨੀ ਰਕਮ ਹੈ ਉਹੀ ਅਦਾ ਕਰੋਗੇ। ਮਹੀਨਿਆਂ ਉੱਤੇ ਫੈਲਾ ਕੇ ਹਰ ਕਿਸ਼ਤ ਤੁਹਾਡੀ ਪਹੁੰਚ ਵਿੱਚ ਰਹਿੰਦੀ ਹੈ। ਕ੍ਰੈਡਿਟ ਕਾਰਡ ਨਾਲ ਅਦਾ ਕੀਤੀ ਜਾਵੇ ਤਾਂ ਔਸਤ APR ਉੱਤੇ ਵਿਆਜ ਵੱਡੀ ਰਕਮ ਜੋੜਦਾ ਹੈ — FairPlan ਨਾਲ ਇਹ ਪੈਸਾ ਤੁਹਾਡੇ ਘਰ ਵਿੱਚ ਹੀ ਰਹਿੰਦਾ ਹੈ।

ਅੱਗੇ ਕੀ: ਸਮਝੌਤਾ ਪੜ੍ਹੋ, ਡਿਜੀਟਲ ਤੌਰ 'ਤੇ ਦਸਤਖ਼ਤ ਕਰੋ, ਪਹਿਲੀ ਕਿਸ਼ਤ ਲਗਭਗ ਦੋ ਹਫ਼ਤਿਆਂ ਵਿੱਚ ਆਵੇਗੀ। ਕੋਈ ਤਬਦੀਲੀ ਹੋਵੇ ਤਾਂ City Court Services ਨੂੰ 905-450-4770 ਉੱਤੇ ਸੰਪਰਕ ਕਰੋ।`,

  hi: `इस योजना के पीछे विचार: शहर कोई ब्याज नहीं लेता, इसलिए नोटिस पर जो राशि है वही आप अदा करेंगे। महीनों में बाँटने से हर किस्त आपकी पहुँच में रहती है। यदि क्रेडिट कार्ड से चुकाई जाए, तो औसत APR पर ब्याज एक बड़ी राशि जोड़ देगा — FairPlan के साथ यह पैसा आपके घर में ही रहता है।

आगे क्या: समझौता पढ़ें, डिजिटल हस्ताक्षर करें, पहली किस्त लगभग दो हफ़्ते बाद होगी। कोई बदलाव हो तो City Court Services को 905-450-4770 पर संपर्क करें।`,

  ur: `اس منصوبے کے پیچھے سوچ: شہر کوئی سود نہیں لیتا، اس لیے آپ صرف نوٹس کی رقم ادا کریں گے۔ مہینوں میں تقسیم کرنے سے ہر قسط آپ کی پہنچ میں رہتی ہے۔

آگے کیا ہوگا: معاہدہ پڑھیں، ڈیجیٹل دستخط کریں، پہلی قسط تقریباً دو ہفتے بعد ہوگی۔ کوئی تبدیلی ہو تو City Court Services سے 905-450-4770 پر رابطہ کریں۔`,

  fr: `Voici le raisonnement derrière ce plan : la Ville ne facture aucun intérêt, donc le total que vous payez correspond exactement au montant de l'avis. Répartir le paiement sur les mois maintient chaque versement à portée. Payer le même montant par carte de crédit au TAEG moyen canadien ajouterait un intérêt réel — de l'argent qui reste dans votre ménage avec FairPlan.

Et après : examinez l'entente, signez-la électroniquement, et votre premier paiement sera prévu environ deux semaines plus tard. Si quoi que ce soit change, contactez les Services judiciaires de la Ville au 905-450-4770 — votre plan peut être rééquilibré sans pénalité.`,

  es: `El razonamiento detrás de este plan: la Ciudad no cobra intereses, por lo que paga exactamente el monto del aviso. Distribuir el pago en los meses mantiene cada cuota al alcance. Pagar el mismo monto con tarjeta de crédito al TAE promedio canadiense agregaría intereses reales — dinero que se queda en su hogar con FairPlan.

Qué sigue: revise el acuerdo, fírmelo electrónicamente, su primer pago estará programado en aproximadamente dos semanas. Si algo cambia, contacte a los Servicios Judiciales al 905-450-4770.`,
};

function detectLanguage(userContent: string): Lang {
  const m = userContent.match(/in (English|Punjabi|Hindi|Urdu|French|Spanish)/i);
  if (!m) return 'en';
  const map: Record<string, Lang> = {
    english: 'en',
    punjabi: 'pa',
    hindi: 'hi',
    urdu: 'ur',
    french: 'fr',
    spanish: 'es',
  };
  return map[m[1].toLowerCase()] ?? 'en';
}

export function sampleResponse(tag: string, userContent: string): string {
  const lang = detectLanguage(userContent);
  if (tag === 'explain_plan') return EXPLAIN_PLAN[lang];
  return EXPLAIN[lang];
}
