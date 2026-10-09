// مكتبة بصرية أصلية 100%: رموز SVG مرسومة برمجيًا — لا صور محفوظة الحقوق.
// كل عنصر: مفتاح + تسمية عربية + SVG جاهز للعرض والطباعة.
export interface SvgAsset {
  key: string;
  label: string;
  category: string;
  svg: string;
}

function wrap(inner: string, bg = "#E6F1EC"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img"><rect x="4" y="4" width="112" height="112" rx="24" fill="${bg}"/><g>${inner}</g></svg>`;
}

export const SVG_LIBRARY: SvgAsset[] = [
  { key: "apple", label: "تفاحة", category: "طعام", svg: wrap(`<circle cx="60" cy="68" r="28" fill="#D64545"/><rect x="57" y="28" width="6" height="16" rx="3" fill="#7A4A21"/><path d="M60 40 Q80 30 88 42 Q76 46 60 40" fill="#2E8B57"/><ellipse cx="50" cy="60" rx="7" ry="10" fill="#fff" opacity=".45"/>`) },
  { key: "banana", label: "موزة", category: "طعام", svg: wrap(`<path d="M30 50 Q40 92 84 86 Q90 84 86 76 Q50 78 38 44 Q36 38 30 50" fill="#F2C230" stroke="#B98A12" stroke-width="3"/>`, "#FFF6DE") },
  { key: "cat", label: "قطة", category: "حيوانات", svg: wrap(`<circle cx="60" cy="66" r="26" fill="#E8A25E"/><path d="M40 50 L34 30 L52 40 Z M80 50 L86 30 L68 40 Z" fill="#E8A25E"/><circle cx="51" cy="62" r="4" fill="#222"/><circle cx="69" cy="62" r="4" fill="#222"/><path d="M54 74 Q60 79 66 74" stroke="#5B3A1A" stroke-width="3" fill="none" stroke-linecap="round"/>`, "#F6E8CF") },
  { key: "dog", label: "كلب", category: "حيوانات", svg: wrap(`<ellipse cx="60" cy="68" rx="26" ry="22" fill="#C68B4E"/><ellipse cx="38" cy="58" rx="8" ry="14" fill="#8A5A24"/><ellipse cx="82" cy="58" rx="8" ry="14" fill="#8A5A24"/><circle cx="51" cy="64" r="4" fill="#222"/><circle cx="69" cy="64" r="4" fill="#222"/><ellipse cx="60" cy="76" rx="7" ry="5" fill="#222"/>`, "#F6E8CF") },
  { key: "bird", label: "عصفور", category: "حيوانات", svg: wrap(`<ellipse cx="60" cy="66" rx="24" ry="19" fill="#5AA9E6"/><circle cx="76" cy="56" r="11" fill="#5AA9E6"/><circle cx="79" cy="54" r="2.6" fill="#222"/><path d="M86 56 l10 4 -10 4 z" fill="#F2A230"/><path d="M40 66 q-12 2 -16 12 12 -2 16 -12" fill="#2E7CC0"/>`) },
  { key: "fish", label: "سمكة", category: "حيوانات", svg: wrap(`<ellipse cx="54" cy="62" rx="24" ry="16" fill="#F2789F"/><path d="M76 62 l20 -14 v28 z" fill="#D64570"/><circle cx="44" cy="59" r="3" fill="#222"/>`, "#F5DCE2") },
  { key: "tree", label: "شجرة", category: "نباتات", svg: wrap(`<rect x="54" y="74" width="12" height="24" rx="4" fill="#7A4A21"/><circle cx="60" cy="52" r="26" fill="#2E8B57"/><circle cx="46" cy="44" r="10" fill="#3FA46A"/>`, "#E6F1EC") },
  { key: "flower", label: "زهرة", category: "نباتات", svg: wrap(`<g fill="#F2789F"><circle cx="60" cy="40" r="10"/><circle cx="78" cy="54" r="10"/><circle cx="70" cy="74" r="10"/><circle cx="50" cy="74" r="10"/><circle cx="42" cy="54" r="10"/></g><circle cx="60" cy="58" r="10" fill="#F2C230"/><rect x="57" y="78" width="6" height="20" fill="#2E8B57"/>`, "#F5DCE2") },
  { key: "sun", label: "شمس", category: "طبيعة", svg: wrap(`<circle cx="60" cy="60" r="20" fill="#F2B230"/><g stroke="#F2B230" stroke-width="5" stroke-linecap="round"><path d="M60 24v8M60 88v8M24 60h8M88 60h8M35 35l6 6M79 79l6 6M85 35l-6 6M41 79l-6 6"/></g>`, "#FFF6DE") },
  { key: "moon", label: "قمر", category: "طبيعة", svg: wrap(`<path d="M74 22 A34 34 0 1 0 74 98 A27 27 0 1 1 74 22" fill="#E8C58D"/>`, "#F7F5EF") },
  { key: "hand-wash", label: "غسل اليدين", category: "نظافة", svg: wrap(`<rect x="30" y="52" width="26" height="34" rx="10" fill="#F6C89F"/><rect x="62" y="52" width="26" height="34" rx="10" fill="#F6C89F"/><circle cx="46" cy="44" r="5" fill="#5AA9E6"/><circle cx="60" cy="36" r="6" fill="#5AA9E6"/><circle cx="74" cy="44" r="5" fill="#5AA9E6"/>`, "#E6F1EC") },
  { key: "soap", label: "صابونة", category: "نظافة", svg: wrap(`<rect x="32" y="50" width="56" height="30" rx="14" fill="#9AD0EC"/><circle cx="48" cy="42" r="6" fill="#CDEAFB"/><circle cx="66" cy="36" r="8" fill="#CDEAFB"/><circle cx="80" cy="46" r="5" fill="#CDEAFB"/>`, "#E6F1EC") },
  { key: "toothbrush", label: "فرشاة أسنان", category: "نظافة", svg: wrap(`<rect x="26" y="56" width="52" height="10" rx="5" fill="#176B61"/><rect x="78" y="50" width="18" height="22" rx="6" fill="#9AD0EC"/>`, "#E6F1EC") },
  { key: "towel", label: "منشفة", category: "نظافة", svg: wrap(`<rect x="34" y="34" width="52" height="56" rx="10" fill="#F5DCE2" stroke="#D64570" stroke-width="3"/><path d="M34 66h52" stroke="#D64570" stroke-width="3"/>`, "#F5DCE2") },
  { key: "scale-light", label: "ريشة (خفيف)", category: "قياس", svg: wrap(`<path d="M60 30 Q78 52 60 88 Q42 52 60 30" fill="#CDEAFB" stroke="#5AA9E6" stroke-width="3"/><path d="M60 30v58" stroke="#5AA9E6" stroke-width="3"/>`, "#E6F1EC") },
  { key: "scale-heavy", label: "صخرة (ثقيل)", category: "قياس", svg: wrap(`<ellipse cx="60" cy="70" rx="28" ry="20" fill="#8A8A8A"/><ellipse cx="50" cy="62" rx="8" ry="6" fill="#B5B5B5"/>`, "#F7F5EF") },
  { key: "kilo", label: "كيلو جرام", category: "قياس", svg: wrap(`<rect x="36" y="44" width="48" height="44" rx="10" fill="#176B61"/><text x="60" y="72" text-anchor="middle" font-size="20" fill="#fff" font-family="sans-serif">1kg</text>`, "#E6F1EC") },
  { key: "gram", label: "جرام", category: "قياس", svg: wrap(`<rect x="40" y="52" width="40" height="32" rx="10" fill="#E8C58D"/><text x="60" y="73" text-anchor="middle" font-size="16" fill="#5B3A1A" font-family="sans-serif">1g</text>`, "#FFF6DE") },
  { key: "num1", label: "العدد ١", category: "أعداد", svg: wrap(`<text x="60" y="84" text-anchor="middle" font-size="56" font-weight="bold" fill="#176B61" font-family="sans-serif">١</text>`, "#fff") },
  { key: "num2", label: "العدد ٢", category: "أعداد", svg: wrap(`<text x="60" y="84" text-anchor="middle" font-size="56" font-weight="bold" fill="#176B61" font-family="sans-serif">٢</text>`, "#fff") },
  { key: "num3", label: "العدد ٣", category: "أعداد", svg: wrap(`<text x="60" y="84" text-anchor="middle" font-size="56" font-weight="bold" fill="#176B61" font-family="sans-serif">٣</text>`, "#fff") },
  { key: "num4", label: "العدد ٤", category: "أعداد", svg: wrap(`<text x="60" y="84" text-anchor="middle" font-size="56" font-weight="bold" fill="#176B61" font-family="sans-serif">٤</text>`, "#fff") },
  { key: "num5", label: "العدد ٥", category: "أعداد", svg: wrap(`<text x="60" y="84" text-anchor="middle" font-size="56" font-weight="bold" fill="#176B61" font-family="sans-serif">٥</text>`, "#fff") },
  { key: "ball", label: "كرة", category: "ألعاب", svg: wrap(`<circle cx="60" cy="62" r="24" fill="#fff" stroke="#176B61" stroke-width="4"/><path d="M60 38v48M36 62h48" stroke="#176B61" stroke-width="3"/>`) },
  { key: "book", label: "كتاب", category: "مدرسة", svg: wrap(`<rect x="36" y="36" width="48" height="56" rx="6" fill="#2E7CC0"/><rect x="42" y="36" width="8" height="56" fill="#1E5A8A"/><path d="M56 50h20M56 60h20M56 70h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`, "#E6F1EC") },
  { key: "pencil", label: "قلم", category: "مدرسة", svg: wrap(`<rect x="50" y="30" width="14" height="56" rx="4" fill="#F2C230" transform="rotate(20 57 58)"/><path d="M70 88 l6 12 8 -10z" fill="#5B3A1A"/>`, "#FFF6DE") },
  { key: "mosque", label: "مسجد", category: "إسلامية", svg: wrap(`<rect x="36" y="62" width="48" height="26" rx="4" fill="#E8C58D"/><circle cx="60" cy="56" r="14" fill="#176B61"/><rect x="57" y="26" width="6" height="20" fill="#176B61"/>`, "#FFF6DE") },
  { key: "heart", label: "قلب", category: "اجتماعية", svg: wrap(`<path d="M60 86 C34 66 30 46 44 40 C52 37 58 42 60 48 C62 42 68 37 76 40 C90 46 86 66 60 86" fill="#D64570"/>`, "#F5DCE2") },
  { key: "star", label: "نجمة تعزيز", category: "تعزيز", svg: wrap(`<path d="M60 28 l9 19 21 3 -15 14 4 21 -19 -10 -19 10 4 -21 -15 -14 21 -3z" fill="#E8C58D" stroke="#B98A12" stroke-width="2"/>`, "#FFF6DE") }
];

export function svgByKey(key?: string): string | undefined {
  if (!key) return undefined;
  return SVG_LIBRARY.find((a) => a.key === key)?.svg;
}

export const SVG_CATEGORIES = Array.from(new Set(SVG_LIBRARY.map((a) => a.category)));
