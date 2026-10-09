// الأنواع الأساسية للمنصة — مصممة لتطابق مخطط Supabase + وضع Demo المحلي
export type Role = "visitor" | "teacher" | "admin";
export type ActivityType =
  | "choose-image"
  | "matching"
  | "classification"
  | "ordering"
  | "true-false"
  | "completion"
  | "counting"
  | "worksheet";
export type ActivityStatus = "draft" | "published";
export type SupportLevel = "intro" | "core" | "advanced";
export type HelpLevel = "مستقل" | "تلميح لفظي" | "تلميح بصري" | "مساعدة جزئية" | "مساعدة كلية";

export interface SupportSettings {
  level: SupportLevel;
  optionsCount: number;
  imageSize: "large" | "medium" | "small";
  shortInstructions: boolean;
  readAloud: boolean;
  instantReinforcement: boolean;
  retryAllowed: boolean;
  reduceDistractions: boolean;
  showHints: boolean;
  hintIntensity: "high" | "medium" | "low";
}

export interface ActivityMeta {
  id: string;
  ownerId: string;
  title: string;
  subject: string;
  field?: string;
  skill: string;
  objective: string;
  stage?: string;
  grade?: string;
  performanceLevel?: string;
  questionCount: number;
  instructions: string;
  teacherName?: string;
  activityDate?: string;
  activityType: ActivityType;
  support: SupportSettings;
  color: string;
  imageSize: "large" | "medium" | "small";
  reinforcement: "stars" | "words" | "quiet";
  status: ActivityStatus;
  showNumbers: boolean;
  createdAt: string;
  updatedAt: string;
}

// عنصر سؤال واحد — بنية مرنة لكل محرك
export interface ActivityItem {
  id: string;
  activityId: string;
  position: number;
  questionText: string;
  hint?: string;
  imageSvg?: string; // مفتاح من مكتبة SVG الأصلية
  imageUrl?: string; // رفع المعلمة
  imageAlt?: string; // نص بديل لقارئ الشاشة
  content: Record<string, unknown>; // حمولة خاصة بالمحرك
  answer: Record<string, unknown>; // الإجابة الصحيحة
}

export interface TemplateSeed {
  id: string;
  title: string;
  subject: string;
  activityType: ActivityType;
  skill: string;
  objective: string;
  instructions: string;
  supportLevel: SupportLevel;
  items: Omit<ActivityItem, "id" | "activityId">[];
}

export interface AttemptRecord {
  id: string;
  activityId: string;
  studentAlias: string;
  startedAt: string;
  completedAt: string;
  totalQuestions: number;
  correctCount: number;
  attemptTries: number;
  hintsUsed: number;
  durationSec: number;
  scorePct: number;
  supportNote: HelpLevel;
  perItem: { itemId: string; correct: boolean; tries: number; hints: number }[];
  masteryThreshold: number;
  mastered: boolean;
  notes?: string;
}

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  "choose-image": "اختيار الصورة الصحيحة",
  matching: "المطابقة",
  classification: "التصنيف",
  ordering: "الترتيب",
  "true-false": "صح أو خطأ",
  completion: "إكمال الناقص",
  counting: "العد والكميات",
  worksheet: "ورقة العمل المصورة"
};

export const SUBJECTS = [
  "الرياضيات",
  "العلوم",
  "اللغة العربية",
  "التربية الإسلامية",
  "المهارات الحياتية",
  "المهارات الاجتماعية",
  "المهارات الإدراكية والبصرية"
];

export const DEFAULT_SUPPORT: Record<SupportLevel, SupportSettings> = {
  intro: {
    level: "intro",
    optionsCount: 2,
    imageSize: "large",
    shortInstructions: true,
    readAloud: true,
    instantReinforcement: true,
    retryAllowed: true,
    reduceDistractions: true,
    showHints: true,
    hintIntensity: "high"
  },
  core: {
    level: "core",
    optionsCount: 3,
    imageSize: "medium",
    shortInstructions: false,
    readAloud: true,
    instantReinforcement: true,
    retryAllowed: true,
    reduceDistractions: false,
    showHints: true,
    hintIntensity: "medium"
  },
  advanced: {
    level: "advanced",
    optionsCount: 4,
    imageSize: "small",
    shortInstructions: false,
    readAloud: false,
    instantReinforcement: false,
    retryAllowed: true,
    reduceDistractions: false,
    showHints: false,
    hintIntensity: "low"
  }
};
