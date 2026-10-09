"use client";
import type { ActivityItem, ActivityMeta } from "@/lib/types";
import { svgByKey } from "@/lib/svg-library";
import { RemoteImg } from "@/components/studio/upload";

export interface PrintPrefs {
  orientation: "portrait" | "landscape";
  bw: boolean;
  showStudentLine: boolean;
  showDateLine: boolean;
  schoolHeader: string;
  showTeacherFooter: boolean;
  showNumbers: boolean;
  includeAnswerKey: boolean;
}

// ورقة A4 حقيقية RTL — تُطبع عبر window.print() (نص عربي أصلي وليس صورة شاشة)
export function WorksheetSheet({ meta, items, prefs, answerKey = false }: {
  meta: ActivityMeta; items: ActivityItem[]; prefs: PrintPrefs; answerKey?: boolean;
}) {
  const bw = prefs.bw || answerKey;
  return (
    <div
      className="sheet-a4 print-page mx-auto rounded-2xl border bg-white p-8 shadow-card"
      dir="rtl"
      style={prefs.orientation === "landscape" ? { width: "297mm", minHeight: "210mm" } : undefined}
      aria-label={answerKey ? "مفتاح الإجابة" : "ورقة العمل"}
    >
      {/* الترويسة */}
      <header className="avoid-break border-b-4 pb-3 text-center" style={{ borderColor: bw ? "#000" : meta.color }}>
        {prefs.schoolHeader && <p className="text-sm font-bold text-gray-600">{prefs.schoolHeader}</p>}
        <h1 className="text-2xl font-extrabold">{answerKey ? `مفتاح الإجابة — ${meta.title}` : meta.title}</h1>
        <p className="mt-1 text-sm text-gray-600">{meta.subject} • {meta.skill}</p>
        {(prefs.showStudentLine || prefs.showDateLine) && (
          <div className="mt-2 flex justify-between gap-4 text-sm font-bold">
            {prefs.showStudentLine && <span>اسم الطالبة: ............................</span>}
            {prefs.showDateLine && <span>التاريخ: ........ / ........ / ........</span>}
          </div>
        )}
      </header>

      <p className="avoid-break mt-3 rounded-xl bg-gray-50 p-3 font-bold">التعليمات: {meta.instructions}</p>

      <div className="mt-4 space-y-4">
        {items.map((it, i) => (
          <section key={it.id} className="avoid-break rounded-2xl border-2 border-gray-200 p-4">
            <h2 className="text-lg font-extrabold">
              {prefs.showNumbers && meta.showNumbers ? `سؤال ${i + 1}: ` : ""}{it.questionText}
            </h2>
            {it.imageUrl ? (
              it.imageUrl.startsWith("storage:") ? (
                <RemoteImg storageRef={it.imageUrl} alt={it.imageAlt || it.questionText} cls="mx-auto block max-w-[180px]" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.imageUrl} alt={it.imageAlt || it.questionText} className="mx-auto block max-w-[180px]" />
              )
            ) : it.imageSvg ? (
              <span dangerouslySetInnerHTML={{ __html: svgByKey(it.imageSvg) ?? "" }} className="mx-auto block max-w-[180px]" role="img" aria-label={it.imageAlt || it.questionText} />
            ) : null}
            <QuestionPrintBody meta={meta} item={it} answerKey={answerKey} bw={bw} />
          </section>
        ))}
      </div>

      <footer className="avoid-break mt-6 flex items-center justify-between border-t-2 border-gray-200 pt-3 text-sm font-bold text-gray-600">
        <span className="rounded-xl border-2 border-gray-300 px-4 py-2">التقييم: أتقن ☐ &nbsp; أحتاج مساعدة ☐</span>
        {prefs.showTeacherFooter && meta.teacherName && <span>المعلمة: {meta.teacherName}</span>}
      </footer>
    </div>
  );
}

function QuestionPrintBody({ item, answerKey }: { meta: ActivityMeta; item: ActivityItem; answerKey: boolean; bw: boolean }) {
  const c = item.content as Record<string, unknown>;
  const a = item.answer as Record<string, unknown>;

  // المطابقة: جدول الأزواج الصحيحة
  if (Array.isArray(c.left) && Array.isArray(c.right)) {
    const left = c.left as { id: string; label: string }[];
    const right = c.right as { id: string; label: string }[];
    const pairs = (a.pairs as { left: string; right: string }[] | undefined) ?? [];
    const rLabel = (id: string) => right.find((r) => r.id === id)?.label ?? "؟";
    return (
      <div className="mt-2 space-y-1.5">
        {left.map((l) => {
          const hit = pairs.find((p) => p.left === l.id);
          return (
            <div key={l.id} className="flex items-center gap-2 rounded-xl border p-2 font-bold">
              <span>{l.label}</span><span aria-hidden="true">⟵</span>
              <span className="min-w-[80px] rounded-lg border-2 border-dashed border-gray-300 px-3 py-1 text-gray-400">
                {answerKey && hit ? rLabel(hit.right) : "..............."}
              </span>
              {answerKey && hit && <span className="text-sm">✓ {rLabel(hit.right)}</span>}
            </div>
          );
        })}
      </div>
    );
  }

  // التصنيف: المجموعات والعناصر
  if (Array.isArray(c.items) && Array.isArray(c.groups)) {
    const all = c.items as { id: string; label: string }[];
    const groups = c.groups as string[];
    const ans = (a.groups ?? {}) as Record<string, string[]>;
    const label = (id: string) => all.find((x) => x.id === id)?.label ?? id;
    return (
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g} className="rounded-xl border p-2">
            <p className="font-extrabold">{g}</p>
            <p className="text-sm text-gray-600">
              {answerKey ? (ans[g] ?? []).map(label).join(" ، ") || "—" : "ضعي العناصر هنا"}
            </p>
          </div>
        ))}
      </div>
    );
  }

  // الترتيب: التسلسل الصحيح
  if (Array.isArray(c.shuffled) && Array.isArray(a.order)) {
    const order = a.order as string[];
    return (
      <div className="mt-2 rounded-xl border p-2 font-bold">
        {answerKey ? (
          <p>الترتيب الصحيح: {order.join(" ← ")}</p>
        ) : (
          <p>رتّبي: {(c.shuffled as string[]).join(" ، ")}</p>
        )}
      </div>
    );
  }

  // إكمال الناقص
  if (Array.isArray(c.options) && typeof (a as { missing?: string }).missing === "string") {
    return (
      <div className="mt-2">
        <p className="font-bold">الخيارات: {(c.options as string[]).join(" ، ")}</p>
        <p className="mt-1 font-bold">الإجابة: ........ {answerKey ? `(${(a as { missing: string }).missing})` : ""}</p>
      </div>
    );
  }

  if (Array.isArray(c.options) && typeof (a as { correctIndex?: number }).correctIndex === "number") {
    const opts = c.options as { svg?: string; label: string; imageUrl?: string }[];
    const ci = (a as { correctIndex: number }).correctIndex;
    return (
      <div className="mt-2 grid grid-cols-2 gap-2">
        {opts.map((o, k) => (
          <div key={k} className="flex items-center gap-2 rounded-xl border p-2">
            <span className="grid h-7 w-7 place-items-center rounded-full border-2 font-extrabold">○</span>
            {o.imageUrl ? (
              o.imageUrl.startsWith("storage:") ? (
                <RemoteImg storageRef={o.imageUrl} alt={o.label} cls="block w-14 rounded-lg object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.imageUrl} alt={o.label} className="block w-14 rounded-lg object-cover" />
              )
            ) : o.svg ? (
              <span dangerouslySetInnerHTML={{ __html: svgByKey(o.svg) ?? "" }} className="block w-14" />
            ) : null}
            <span className="font-bold">{o.label}{answerKey && k === ci ? " ✓ (الصحيحة)" : ""}</span>
          </div>
        ))}
      </div>
    );
  }
  if (typeof c.dots === "number") {
    return (
      <div className="mt-2">
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: c.dots as number }).map((_, k) => (
            <span key={k} dangerouslySetInnerHTML={{ __html: svgByKey("ball") ?? "" }} className="block w-10" />
          ))}
        </div>
        <p className="mt-2 font-bold">العدد: ........ {answerKey ? `(الإجابة: ${String((a as { count?: number }).count)})` : ""}</p>
      </div>
    );
  }
  if (typeof (a as { value?: boolean }).value === "boolean" && !Array.isArray(c.options)) {
    return (
      <div className="mt-2 flex gap-6 font-extrabold">
        <span>صح ○</span><span>خطأ ○</span>
        {answerKey && <span>الإجابة: {(a as { value: boolean }).value ? "صح" : "خطأ"}</span>}
      </div>
    );
  }
  return (
    <div className="mt-2">
      <div className="min-h-[48px] rounded-2xl border-2 border-dashed border-gray-300" />
    </div>
  );
}
