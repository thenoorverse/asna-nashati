import { describe, it, expect } from "vitest";
import { activityMetaSchema } from "@/lib/schemas";

describe("التحقق من المدخلات", () => {
  it("يرفض العنوان القصير والأسئلة غير الصالحة", () => {
    const r = activityMetaSchema.safeParse({
      title: "أ", subject: "", skill: "", objective: "قصير",
      questionCount: 1, instructions: ""
    });
    expect(r.success).toBe(false);
  });
  it("يقبل نشاطًا صالحًا", () => {
    const r = activityMetaSchema.safeParse({
      title: "أميّز الكيلو من الجرام", subject: "الرياضيات",
      skill: "التمييز بين وحدتي الكتلة",
      objective: "أن تميز الطالبة بين الجرام والكيلو في ٣ مواقف من ٤",
      questionCount: 4, instructions: "اختاري الوحدة الصحيحة"
    });
    expect(r.success).toBe(true);
  });
});
