import { z } from "zod";

export const activityMetaSchema = z.object({
  title: z.string().min(3, "العنوان قصير جدًا").max(120),
  subject: z.string().min(1, "اختاري المادة"),
  field: z.string().optional(),
  skill: z.string().min(2, "حددي المهارة المستهدفة"),
  objective: z.string().min(5, "اكتبي هدفًا قابلًا للقياس"),
  stage: z.string().optional(),
  grade: z.string().optional(),
  performanceLevel: z.string().optional(),
  questionCount: z.number().int().min(2, "الحد الأدنى سؤالان").max(10),
  instructions: z.string().min(3, "اكتبي تعليمات مختصرة"),
  teacherName: z.string().optional(),
  activityDate: z.string().optional()
});

export const itemSchema = z.object({
  questionText: z.string().min(1, "نص السؤال مطلوب"),
  hint: z.string().optional()
});

export const attemptSchema = z.object({
  studentAlias: z.string().min(1, "الرمز المستعار مطلوب").max(30),
  supportNote: z.enum(["مستقل", "تلميح لفظي", "تلميح بصري", "مساعدة جزئية", "مساعدة كلية"]),
  masteryThreshold: z.number().min(0).max(100).default(80),
  notes: z.string().max(500).optional()
});

export type ActivityMetaInput = z.infer<typeof activityMetaSchema>;
