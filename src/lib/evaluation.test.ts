import { describe, it, expect } from "vitest";
import { checkAnswer, scorePct, isMastered } from "@/lib/evaluation";

describe("محركات التقييم", () => {
  it("اختيار الصورة: يقبل الصحيح ويرفض الخاطئ", () => {
    const item = { content: {}, answer: { correctIndex: 1 } };
    expect(checkAnswer("choose-image", item, { selectedIndex: 1 })).toBe(true);
    expect(checkAnswer("choose-image", item, { selectedIndex: 0 })).toBe(false);
  });
  it("صح/خطأ", () => {
    expect(checkAnswer("true-false", { content: {}, answer: { value: true } }, { value: true })).toBe(true);
    expect(checkAnswer("true-false", { content: {}, answer: { value: true } }, { value: false })).toBe(false);
  });
  it("العد", () => {
    expect(checkAnswer("counting", { content: {}, answer: { count: 3 } }, { count: 3 })).toBe(true);
    expect(checkAnswer("counting", { content: {}, answer: { count: 3 } }, { count: 4 })).toBe(false);
  });
  it("المطابقة: كل الأزواج مطلوبة", () => {
    const item = { content: {}, answer: { pairs: [{ left: "a", right: "1" }] } };
    expect(checkAnswer("matching", item, { pairs: [{ left: "a", right: "1" }] })).toBe(true);
    expect(checkAnswer("matching", item, { pairs: [{ left: "a", right: "2" }] })).toBe(false);
  });
  it("الترتيب: تسلسل تام", () => {
    const item = { content: {}, answer: { order: ["أ", "ب"] } };
    expect(checkAnswer("ordering", item, { order: ["أ", "ب"] })).toBe(true);
    expect(checkAnswer("ordering", item, { order: ["ب", "أ"] })).toBe(false);
  });
  it("النسبة والإتقان", () => {
    expect(scorePct(3, 4)).toBe(75);
    expect(scorePct(0, 0)).toBe(0);
    expect(isMastered(80, 80)).toBe(true);
    expect(isMastered(79, 80)).toBe(false);
  });
});
