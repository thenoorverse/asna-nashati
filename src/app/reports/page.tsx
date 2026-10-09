"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shell } from "@/components/layout";
import { Button, Card, Badge, EmptyState, inputCls } from "@/components/ui";
import { useDemo } from "@/lib/store";
import { TeacherOnly } from "@/components/guards";
import { formatDateAr } from "@/lib/utils";

function ReportsInner() {
  const params = useSearchParams();
  const preselect = params.get("activity") ?? "all";
  const { db, updateAttemptNotes } = useDemo();
  const [filter, setFilter] = useState(preselect);
  const [aliasFilter, setAliasFilter] = useState("الكل");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savedTick, setSavedTick] = useState<string | null>(null);

  const noteOf = (id: string, stored?: string) => notes[id] ?? stored ?? "";
  const saveNote = (id: string) => {
    void updateAttemptNotes(id, noteOf(id, db.attempts.find((a) => a.id === id)?.notes)).then(() => {
      setSavedTick(id);
      setTimeout(() => setSavedTick((t) => (t === id ? null : t)), 2000);
    });
  };

  const attempts = db.attempts
    .filter((a) => filter === "all" || a.activityId === filter)
    .filter((a) => aliasFilter === "الكل" || a.studentAlias === aliasFilter);
  const aliasOptions = ["الكل", ...Array.from(new Set(db.attempts.map((a) => a.studentAlias)))];
  const titleOf = (id: string) => db.activities.find((x) => x.id === id)?.title ?? (id === "public-demo" ? "نشاط عام للتجربة (العد من ١ إلى ١٠)" : "نشاط محذوف");
  const questionOf = (activityId: string, itemId: string, fallbackIndex: number) =>
    db.items.find((x) => x.id === itemId)?.questionText ?? `سؤال ${fallbackIndex + 1}`;

  return (
    <Shell>
      <h1 className="text-2xl font-extrabold text-[#0F4A44]">التقويم والمتابعة</h1>
      <p className="text-gray-600">سجل المحاولات: الأسئلة، الصحيحة، المحاولات، التلميحات، الزمن (معلومة مساعدة فقط)، ومستوى المساعدة.</p>

      <Card className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="font-bold">تصفية حسب النشاط
          <select className={inputCls} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">كل الأنشطة ({db.attempts.length})</option>
            {db.activities.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
        </label>
        <label className="font-bold">تصفية حسب رمز الطالبة
          <select className={inputCls} value={aliasFilter} onChange={(e) => setAliasFilter(e.target.value)}>
            {aliasOptions.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </Card>

      {attempts.length === 0 ? (
        <div className="mt-4"><EmptyState title="لا محاولات مسجلة بعد" desc="شغّلي نشاطًا من لوحة التحكم بوضع الطالبة، وستظهر النتائج هنا تلقائيًا." /></div>
      ) : (
        <div className="mt-4 space-y-3">
          {attempts.map((a) => {
            return (
              <Card key={a.id} className="avoid-break">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-extrabold">{titleOf(a.activityId)} — الرمز: {a.studentAlias}</h2>
                  <Badge tone={a.mastered ? "mint" : "gold"}>{a.mastered ? `أتقن (${a.scorePct}%)` : `يحتاج دعمًا (${a.scorePct}%)`}</Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                  {[["الأسئلة", a.totalQuestions], ["صحيحة", a.correctCount], ["المحاولات", a.attemptTries], ["التلميحات", a.hintsUsed]].map(([t, v]) => (
                    <div key={t as string} className="rounded-2xl bg-[#F7F5EF] p-2"><p className="text-xl font-extrabold text-[#176B61]">{v}</p><p className="text-xs text-gray-500">{t}</p></div>
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  الزمن: {Math.floor(a.durationSec / 60)} دقيقة و{a.durationSec % 60} ثانية (معلومة مساعدة فقط) •
                  المساعدة: {a.supportNote} • التاريخ: {formatDateAr(a.completedAt)} •
                  المعيار: {a.masteryThreshold}%
                </p>
                {a.perItem.length > 0 && (
                  <details className="mt-2 rounded-2xl bg-[#F7F5EF] p-3">
                    <summary className="cursor-pointer font-bold text-[#0F4A44]">
                      تفاصيل الأسئلة ({a.perItem.filter((p) => p.correct).length}/{a.perItem.length} صحيحة)
                    </summary>
                    <ul className="mt-2 space-y-1.5">
                      {a.perItem.map((p, k) => (
                        <li key={p.itemId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm">
                          <span className="font-bold">{questionOf(a.activityId, p.itemId, k)}</span>
                          <span className="flex gap-2 text-gray-600">
                            <span className={p.correct ? "font-bold text-[#176B61]" : "font-bold text-[#8a2b4a]"}>
                              {p.correct ? "✓ صحيحة" : "✗ تحتاج مراجعة"}
                            </span>
                            <span>المحاولات: {p.tries}</span>
                            <span>التلميحات: {p.hints}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                <label className="mt-2 block font-bold">ملاحظات المعلمة ومجالات التحسين
                  <textarea className={inputCls} rows={2} value={noteOf(a.id, a.notes)}
                    onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })}
                    placeholder="مثال: تحتاج دعمًا بصريًا في التمييز بين..." />
                </label>
                <div className="no-print mt-2 flex items-center gap-2">
                  <Button size="sm" variant="soft" onClick={() => saveNote(a.id)}>💾 حفظ الملاحظة</Button>
                  {savedTick === a.id && <span className="text-sm font-bold text-[#176B61]" role="status">✓ حُفظت</span>}
                  <Button size="sm" variant="ghost" onClick={() => window.print()}>🖨️ طباعة هذا التقرير</Button>
                </div>
                {noteOf(a.id, a.notes) && <p className="mt-1 rounded-xl bg-[#E6F1EC] p-2 text-sm font-bold text-[#0F4A44]">ملاحظة محفوظة للطباعة: {noteOf(a.id, a.notes)}</p>}
              </Card>
            );
          })}
        </div>
      )}
    </Shell>
  );
}

export default function ReportsPage() {
  return <Suspense fallback={<Shell><p className="p-8">جارٍ التحميل...</p></Shell>}><TeacherOnly><ReportsInner /></TeacherOnly></Suspense>;
}
