import type { ActivityItem, ActivityType } from "./types";

// منطق تقييم الإجابات — منفصل عن العرض (قابل للتوسعة والاختبار)
export function checkAnswer(
  type: ActivityType,
  item: Pick<ActivityItem, "content" | "answer">,
  response: Record<string, unknown>
): boolean {
  switch (type) {
    case "choose-image": {
      return response.selectedIndex === (item.answer as { correctIndex: number }).correctIndex;
    }
    case "true-false": {
      return response.value === (item.answer as { value: boolean }).value;
    }
    case "counting": {
      return Number(response.count) === Number((item.answer as { count: number }).count);
    }
    case "completion": {
      const a = String((item.answer as { missing: string }).missing ?? "").trim();
      return String(response.value ?? "").trim() === a;
    }
    case "matching": {
      const pairs = (item.answer as { pairs: { left: string; right: string }[] }).pairs ?? [];
      const given = (response.pairs ?? []) as { left: string; right: string }[];
      if (given.length !== pairs.length) return false;
      return pairs.every((p) => given.some((g) => g.left === p.left && g.right === p.right));
    }
    case "classification": {
      const groups = (item.answer as { groups: Record<string, string[]> }).groups ?? {};
      const given = (response.groups ?? {}) as Record<string, string[]>;
      return Object.keys(groups).every((g) => {
        const exp = [...(groups[g] ?? [])].sort().join("|");
        const got = [...(given[g] ?? [])].sort().join("|");
        return exp === got;
      });
    }
    case "ordering": {
      const order = (item.answer as { order: string[] }).order ?? [];
      const given = (response.order ?? []) as string[];
      return JSON.stringify(order) === JSON.stringify(given);
    }
    case "worksheet": {
      // ورقة العمل تُصحح يدويًا — القيمة الافتراضية تُحسب من الأسئلة الفرعية إن وجدت
      const subs = (item.content as { subQuestions?: { id: string; answer: string }[] })?.subQuestions ?? [];
      if (!subs.length) return true;
      const given = (response.answers ?? {}) as Record<string, string>;
      return subs.every((s) => String(given[s.id] ?? "").trim() === String(s.answer).trim());
    }
    default:
      return false;
  }
}

export function scorePct(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

export function isMastered(pct: number, threshold: number): boolean {
  return pct >= threshold;
}
