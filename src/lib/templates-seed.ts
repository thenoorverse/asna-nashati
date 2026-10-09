import type { TemplateSeed } from "./types";

// ٨ قوالب حقيقية قابلة للتعديل — أسئلة وإجابات فعلية وليست عناوين فقط
export const TEMPLATE_SEEDS: TemplateSeed[] = [
  {
    id: "tpl-gram-kilo",
    title: "التمييز بين الجرام والكيلو جرام",
    subject: "الرياضيات",
    activityType: "choose-image",
    skill: "التمييز بين وحدتي الكتلة",
    objective: "أن تميز الطالبة بين الجرام والكيلو جرام في ٣ مواقف من ٤",
    instructions: "شاهدي الصورة ثم اختاري الوحدة الصحيحة.",
    supportLevel: "intro",
    items: [
      { position: 0, questionText: "كيس أرز كبير للعائلة — أي وحدة نستخدم؟", content: { options: [{ svg: "gram", label: "جرام" }, { svg: "kilo", label: "كيلو جرام" }] }, answer: { correctIndex: 1 } },
      { position: 1, questionText: "خاتم ذهب صغير — أي وحدة نستخدم؟", content: { options: [{ svg: "gram", label: "جرام" }, { svg: "kilo", label: "كيلو جرام" }] }, answer: { correctIndex: 0 } },
      { position: 2, questionText: "حبة تفاح واحدة — أي وحدة أنسب؟", content: { options: [{ svg: "gram", label: "جرام" }, { svg: "kilo", label: "كيلو جرام" }] }, answer: { correctIndex: 0 } },
      { position: 3, questionText: "كيس دقيق للخبز — أي وحدة نستخدم؟", content: { options: [{ svg: "gram", label: "جرام" }, { svg: "kilo", label: "كيلو جرام" }] }, answer: { correctIndex: 1 } }
    ]
  },
  {
    id: "tpl-count-1-10",
    title: "العد من ١ إلى ١٠",
    subject: "الرياضيات",
    activityType: "counting",
    skill: "العد الشفهي وربط العدد بالمعدود",
    objective: "أن تعد الطالبة مجموعات حتى ٥ عناصر بدقة",
    instructions: "عُدّي الكرات ثم اختاري العدد الصحيح.",
    supportLevel: "intro",
    items: [
      { position: 0, questionText: "كم عدد الكرات؟", content: { dots: 2, options: [1, 2, 3] }, answer: { count: 2 } },
      { position: 1, questionText: "كم عدد الكرات؟", content: { dots: 3, options: [2, 3, 4] }, answer: { count: 3 } },
      { position: 2, questionText: "كم عدد الكرات؟", content: { dots: 4, options: [3, 4, 5] }, answer: { count: 4 } },
      { position: 3, questionText: "كم عدد الكرات؟", content: { dots: 5, options: [4, 5, 6] }, answer: { count: 5 } }
    ]
  },
  {
    id: "tpl-order-numbers",
    title: "ترتيب الأعداد",
    subject: "الرياضيات",
    activityType: "ordering",
    skill: "ترتيب الأعداد تصاعديًا",
    objective: "أن ترتب الطالبة ٣ أعداد ترتيبًا تصاعديًا",
    instructions: "اضغطي الأعداد بالترتيب من الأصغر إلى الأكبر.",
    supportLevel: "core",
    items: [
      { position: 0, questionText: "رتّبي: ٣ ، ١ ، ٢", content: { shuffled: ["٣", "١", "٢"] }, answer: { order: ["١", "٢", "٣"] } },
      { position: 1, questionText: "رتّبي: ٥ ، ٣ ، ٤", content: { shuffled: ["٥", "٣", "٤"] }, answer: { order: ["٣", "٤", "٥"] } }
    ]
  },
  {
    id: "tpl-animals-plants",
    title: "تصنيف الحيوانات والنباتات",
    subject: "العلوم",
    activityType: "classification",
    skill: "تصنيف الكائنات",
    objective: "أن تصنف الطالبة ٤ عناصر بين حيوان ونبات",
    instructions: "ضعي كل صورة في مجموعتها الصحيحة.",
    supportLevel: "intro",
    items: [
      {
        position: 0,
        questionText: "صنّفي هذه العناصر",
        content: { items: [{ id: "cat", svg: "cat", label: "قطة" }, { id: "dog", svg: "dog", label: "كلب" }, { id: "tree", svg: "tree", label: "شجرة" }, { id: "flower", svg: "flower", label: "زهرة" }], groups: ["حيوان", "نبات"] },
        answer: { groups: { "حيوان": ["cat", "dog"], "نبات": ["tree", "flower"] } }
      },
      {
        position: 1,
        questionText: "صنّفي أيضًا",
        content: { items: [{ id: "bird", svg: "bird", label: "عصفور" }, { id: "fish", svg: "fish", label: "سمكة" }, { id: "apple-tree", svg: "tree", label: "شجرة تفاح" }, { id: "flower2", svg: "flower", label: "وردة" }], groups: ["حيوان", "نبات"] },
        answer: { groups: { "حيوان": ["bird", "fish"], "نبات": ["apple-tree", "flower2"] } }
      }
    ]
  },
  {
    id: "tpl-heavy-light",
    title: "التمييز بين الثقيل والخفيف",
    subject: "العلوم",
    activityType: "true-false",
    skill: "مفهوم الثقل",
    objective: "أن تميز الطالبة بين الثقيل والخفيف في ٣ عبارات من ٤",
    instructions: "اقرئي العبارة ثم اختاري صح أو خطأ.",
    supportLevel: "intro",
    items: [
      { position: 0, questionText: "الصخرة ثقيلة والريشة خفيفة.", imageSvg: "scale-heavy", content: {}, answer: { value: true } },
      { position: 1, questionText: "الريشة أثقل من الصخرة.", imageSvg: "scale-light", content: {}, answer: { value: false } },
      { position: 2, questionText: "كيس الأرز الكبير ثقيل.", content: {}, answer: { value: true } }
    ]
  },
  {
    id: "tpl-match-word",
    title: "مطابقة الصورة بالكلمة",
    subject: "اللغة العربية",
    activityType: "matching",
    skill: "الربط بين الصورة والكلمة",
    objective: "أن تطابق الطالبة ٣ صور بكلماتها",
    instructions: "اختاري الصورة ثم اختاري كلمتها.",
    supportLevel: "intro",
    items: [
      {
        position: 0,
        questionText: "طابقي كل صورة بكلمتها",
        content: { left: [{ id: "c1", svg: "cat", label: "صورة ١" }, { id: "a1", svg: "apple", label: "صورة ٢" }, { id: "b1", svg: "book", label: "صورة ٣" }], right: [{ id: "w-cat", label: "قطة" }, { id: "w-apple", label: "تفاحة" }, { id: "w-book", label: "كتاب" }] },
        answer: { pairs: [{ left: "c1", right: "w-cat" }, { left: "a1", right: "w-apple" }, { left: "b1", right: "w-book" }] }
      }
    ]
  },
  {
    id: "tpl-handwash",
    title: "ترتيب خطوات غسل اليدين",
    subject: "المهارات الحياتية",
    activityType: "ordering",
    skill: "تسلسل مهارة غسل اليدين",
    objective: "أن ترتب الطالبة خطوات غسل اليدين الأربع بالترتيب",
    instructions: "رتّبي الخطوات من الأولى إلى الأخيرة.",
    supportLevel: "core",
    items: [
      {
        position: 0,
        questionText: "رتّبي خطوات غسل اليدين",
        content: { shuffled: ["نشّفي يديك بالمنشفة", "بلّلي يديك بالماء", "افركي بالصابون", "اشطفي بالماء"] },
        answer: { order: ["بلّلي يديك بالماء", "افركي بالصابون", "اشطفي بالماء", "نشّفي يديك بالمنشفة"] }
      }
    ]
  },
  {
    id: "tpl-hygiene",
    title: "تصنيف أدوات النظافة الشخصية",
    subject: "المهارات الحياتية",
    activityType: "classification",
    skill: "التعرف على أدوات النظافة",
    objective: "أن تصنف الطالبة أدوات النظافة من غيرها",
    instructions: "اختاري الأدوات الخاصة بالنظافة فقط.",
    supportLevel: "intro",
    items: [
      {
        position: 0,
        questionText: "ما أدوات النظافة؟",
        content: { items: [{ id: "soap", svg: "soap", label: "صابونة" }, { id: "tb", svg: "toothbrush", label: "فرشاة" }, { id: "tw", svg: "towel", label: "منشفة" }, { id: "ball", svg: "ball", label: "كرة" }], groups: ["نظافة", "ليست نظافة"] },
        answer: { groups: { "نظافة": ["soap", "tb", "tw"], "ليست نظافة": ["ball"] } }
      }
    ]
  }
];
