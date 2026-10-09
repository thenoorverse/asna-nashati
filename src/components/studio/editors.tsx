"use client";
import { useState } from "react";
import type { ActivityItem, ActivityType } from "@/lib/types";
import { SVG_LIBRARY, SVG_CATEGORIES, svgByKey } from "@/lib/svg-library";
import { inputCls, Field, Button } from "@/components/ui";
import { Trash2, Copy, ArrowUp, ArrowDown, ImagePlus, GripVertical } from "lucide-react";
import { uid } from "@/lib/utils";
import { ImageUpload, AltField } from "@/components/studio/upload";

export type DraftItem = Omit<ActivityItem, "id" | "activityId"> & { localId: string };

export function blankItem(type: ActivityType, position: number): DraftItem {
  const base = { localId: uid("d"), position, questionText: "", hint: "", content: {}, answer: {} };
  switch (type) {
    case "choose-image":
      return { ...base, questionText: "أين التفاحة؟", content: { options: [{ svg: "apple", label: "تفاحة" }, { svg: "banana", label: "موزة" }] }, answer: { correctIndex: 0 } };
    case "true-false":
      return { ...base, questionText: "العبارة...", content: {}, answer: { value: true } };
    case "counting":
      return { ...base, questionText: "كم عدد الكرات؟", content: { dots: 3, options: [2, 3, 4] }, answer: { count: 3 } };
    case "completion":
      return { ...base, questionText: "أكملي: ١ ، ٢ ، ...", content: { options: ["٣", "٥", "٧"] }, answer: { missing: "٣" } };
    case "matching":
      return { ...base, questionText: "طابقي كل صورة بكلمتها", content: { left: [{ id: "l1", svg: "cat", label: "قطة" }, { id: "l2", svg: "apple", label: "تفاحة" }], right: [{ id: "r1", label: "قطة" }, { id: "r2", label: "تفاحة" }] }, answer: { pairs: [{ left: "l1", right: "r1" }, { left: "l2", right: "r2" }] } };
    case "classification":
      return { ...base, questionText: "صنّفي العناصر", content: { items: [{ id: "c1", svg: "cat", label: "قطة" }, { id: "t1", svg: "tree", label: "شجرة" }], groups: ["حيوان", "نبات"] }, answer: { groups: { "حيوان": ["c1"], "نبات": ["t1"] } } };
    case "ordering":
      return { ...base, questionText: "رتّبي بالترتيب", content: { shuffled: ["ب", "أ", "ج"] }, answer: { order: ["أ", "ب", "ج"] } };
    case "worksheet":
      return { ...base, questionText: "ورقة عمل", content: { subQuestions: [{ id: "q1", text: "لوّني التفاحة", answer: "" }] }, answer: {} };
    default:
      return base as DraftItem;
  }
}

export function SvgPicker({ value, onChange }: { value?: string; onChange: (k: string) => void }) {
  const [cat, setCat] = useState<string>("الكل");
  const list = SVG_LIBRARY.filter((a) => cat === "الكل" || a.category === cat);
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="تصفية حسب الفئة">
        {["الكل", ...SVG_CATEGORIES].map((c) => (
          <button
            key={c} type="button" onClick={() => setCat(c)}
            className={`rounded-full px-3 py-1.5 text-sm font-bold ${cat === c ? "bg-[#176B61] text-white" : "bg-gray-100"}`}
            aria-pressed={cat === c}
          >{c}</button>
        ))}
      </div>
      <div className="grid max-h-56 grid-cols-4 gap-2 overflow-auto rounded-2xl border-2 border-gray-100 p-2 sm:grid-cols-6" role="listbox" aria-label="مكتبة الصور">
        {list.map((a) => (
          <button
            key={a.key} type="button" role="option" aria-selected={value === a.key}
            title={a.label} onClick={() => onChange(a.key)}
            className={`rounded-xl border-2 p-1 ${value === a.key ? "border-[#176B61] bg-[#E6F1EC]" : "border-transparent hover:border-gray-300"}`}
          >
            <span dangerouslySetInnerHTML={{ __html: a.svg }} className="block aspect-square" />
            <span className="block truncate text-center text-[11px] font-bold text-gray-600">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ItemShell({ index, total, onMove, onCopy, onDelete, drag, children }: {
  index: number; total: number;
  onMove: (d: -1 | 1) => void; onCopy: () => void; onDelete: () => void;
  drag: {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  children: React.ReactNode;
}) {
  return (
    <div className="avoid-break rounded-3xl border-2 border-gray-100 bg-white p-4"
      onDragOver={drag.onDragOver} onDrop={drag.onDrop}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <span draggable={drag.draggable} onDragStart={drag.onDragStart} title="اسحبي لإعادة الترتيب (للفأرة واللمس — وزرا أعلى/أسفل للوحة المفاتيح)"
            aria-hidden="true"
            className="grid h-10 w-10 cursor-grab place-items-center rounded-xl bg-gray-100 text-gray-500 active:cursor-grabbing">
            <GripVertical size={18} aria-hidden="true" />
          </span>
          <span className="rounded-full bg-[#E6F1EC] px-3 py-1 text-sm font-extrabold text-[#176B61]">سؤال {index + 1}</span>
        </span>
        <div className="flex gap-1.5">
          <button type="button" className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100" onClick={() => onMove(-1)} disabled={index === 0} aria-label="نقل لأعلى"><ArrowUp size={18} /></button>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="نقل لأسفل"><ArrowDown size={18} /></button>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100" onClick={onCopy} aria-label="نسخ السؤال"><Copy size={18} /></button>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600" onClick={onDelete} aria-label="حذف السؤال"><Trash2 size={18} /></button>
        </div>
      </div>
      {children}
    </div>
  );
}

export function ItemsEditor({ type, items, setItems }: {
  type: ActivityType; items: DraftItem[]; setItems: (v: DraftItem[]) => void;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    next.forEach((it, k) => (it.position = k));
    setItems(next);
  };
  const patch = (i: number, p: Partial<DraftItem>) => {
    const next = [...items]; next[i] = { ...next[i], ...p }; setItems(next);
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d; if (j < 0 || j >= items.length) return;
    const next = [...items]; [next[i], next[j]] = [next[j], next[i]];
    next.forEach((it, k) => (it.position = k)); setItems(next);
  };
  const copy = (i: number) => {
    const c = { ...items[i], localId: uid("d") };
    const next = [...items]; next.splice(i + 1, 0, c);
    next.forEach((it, k) => (it.position = k)); setItems(next);
  };
  const del = (i: number) => {
    if (!confirm("حذف هذا السؤال؟")) return;
    const next = items.filter((_, k) => k !== i);
    next.forEach((it, k) => (it.position = k)); setItems(next);
  };

  return (
    <div className="space-y-4">
      {items.map((it, i) => (
        <ItemShell key={it.localId} index={i} total={items.length}
          onMove={(d) => move(i, d)} onCopy={() => copy(i)} onDelete={() => del(i)}
          drag={{
            draggable: true,
            onDragStart: (e) => { setDragIdx(i); e.dataTransfer.effectAllowed = "move"; },
            onDragOver: (e) => e.preventDefault(),
            onDrop: (e) => { e.preventDefault(); if (dragIdx !== null) reorder(dragIdx, i); setDragIdx(null); }
          }}>
          <div className="grid gap-3">
            <Field label="نص السؤال" required>
              <input className={inputCls} value={it.questionText}
                onChange={(e) => patch(i, { questionText: e.target.value })}
                placeholder="مثال: أين التفاحة؟" />
            </Field>
            <div className="rounded-2xl bg-gray-50 p-3">
              <p className="mb-1 font-bold">صورة السؤال (اختيارية):</p>
              <SvgPicker value={it.imageSvg} onChange={(svg) => patch(i, { imageSvg: svg, imageUrl: "" })} />
              <ImageUpload
                value={it.imageUrl}
                onChange={(dataUrl) => patch(i, { imageUrl: dataUrl, imageSvg: dataUrl ? undefined : it.imageSvg })}
              />
              {(it.imageSvg || it.imageUrl) && (
                <div className="mt-2">
                  <AltField value={it.imageAlt} onChange={(v) => patch(i, { imageAlt: v })} />
                </div>
              )}
            </div>
            <TypeFields type={type} item={it} onPatch={(p) => patch(i, p)} />
            <Field label="تلميح (اختياري)">
              <input className={inputCls} value={it.hint ?? ""}
                onChange={(e) => patch(i, { hint: e.target.value })}
                placeholder="تلميح يظهر عند الطلب" />
            </Field>
          </div>
        </ItemShell>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="soft" onClick={() => setItems([...items.map((x, k) => ({ ...x, position: k })), blankItem(type, items.length)])}>
          + إضافة سؤال
        </Button>
        <span className="self-center text-sm text-gray-500">عدد الأسئلة: {items.length} (من ٢ إلى ١٠)</span>
      </div>
    </div>
  );
}

function TypeFields({ type, item, onPatch }: { type: ActivityType; item: DraftItem; onPatch: (p: Partial<DraftItem>) => void }) {
  switch (type) {
    case "choose-image": {
      const opts = (item.content.options ?? []) as { svg: string; label: string; imageUrl?: string }[];
      const correct = (item.answer.correctIndex ?? 0) as number;
      return (
        <div>
          <p className="mb-2 font-bold">الخيارات المصورة — حددي الإجابة الصحيحة:</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {opts.map((o, k) => (
              <div key={k} className={`rounded-2xl border-2 p-2 ${k === correct ? "border-[#176B61] bg-[#E6F1EC]" : "border-gray-200"}`}>
                {o.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.imageUrl} alt={o.label} className="block aspect-square w-full rounded-xl object-cover" />
                ) : (
                  <span dangerouslySetInnerHTML={{ __html: svgByKey(o.svg) ?? "" }} className="block aspect-square" />
                )}
                <div className="mt-1 flex gap-1.5">
                  <input className={inputCls} value={o.label} aria-label={`تسمية الخيار ${k + 1}`}
                    onChange={(e) => { const n = [...opts]; n[k] = { ...n[k], label: e.target.value }; onPatch({ content: { ...item.content, options: n } }); }} />
                  <button type="button" className={`shrink-0 rounded-xl px-3 font-bold ${k === correct ? "bg-[#176B61] text-white" : "bg-gray-100"}`}
                    onClick={() => onPatch({ answer: { correctIndex: k } })}
                    aria-pressed={k === correct}>✓</button>
                  {opts.length > 2 && (
                    <button type="button" className="shrink-0 rounded-xl bg-red-50 px-3 text-red-600" aria-label="حذف الخيار"
                      onClick={() => onPatch({ content: { ...item.content, options: opts.filter((_, x) => x !== k) } })}>×</button>
                  )}
                </div>
                <details className="mt-1">
                  <summary className="cursor-pointer text-sm font-bold text-[#176B61]"><ImagePlus size={14} className="inline" /> تغيير الصورة</summary>
                  <SvgPicker value={o.svg} onChange={(svg) => { const n = [...opts]; n[k] = { ...n[k], svg, imageUrl: "" }; onPatch({ content: { ...item.content, options: n } }); }} />
                  <ImageUpload value={o.imageUrl} onChange={(dataUrl) => { const n = [...opts]; n[k] = { ...n[k], imageUrl: dataUrl }; onPatch({ content: { ...item.content, options: n } }); }} />
                </details>
              </div>
            ))}
          </div>
          <button type="button" className="mt-2 rounded-xl bg-gray-100 px-4 py-2 font-bold"
            onClick={() => onPatch({ content: { ...item.content, options: [...opts, { svg: "star", label: "خيار جديد" }] } })}>
            + إضافة خيار
          </button>
        </div>
      );
    }
    case "true-false":
      return (
        <Field label="الإجابة الصحيحة">
          <div className="flex gap-2" role="radiogroup" aria-label="الإجابة الصحيحة">
            {[{ v: true, t: "صح ✓" }, { v: false, t: "خطأ ✗" }].map((o) => (
              <button key={o.t} type="button" role="radio" aria-checked={(item.answer.value as boolean) === o.v}
                className={`flex-1 rounded-2xl py-3 text-lg font-extrabold ${(item.answer.value as boolean) === o.v ? "bg-[#176B61] text-white" : "bg-gray-100"}`}
                onClick={() => onPatch({ answer: { value: o.v } })}>{o.t}</button>
            ))}
          </div>
        </Field>
      );
    case "counting": {
      const dots = Number(item.content.dots ?? 3);
      const options = (item.content.options ?? [2, 3, 4]) as number[];
      return (
        <div className="grid gap-2">
          <Field label="عدد العناصر في المجموعة">
            <input type="number" min={1} max={10} className={inputCls} value={dots}
              onChange={(e) => { const d = Number(e.target.value); onPatch({ content: { ...item.content, dots: d }, answer: { count: d } }); }} />
          </Field>
          <Field label="خيارات العدد (افصلي بفاصلة)" hint="مثال: 2,3,4">
            <input className={inputCls} defaultValue={options.join(",")}
              onBlur={(e) => onPatch({ content: { ...item.content, options: e.target.value.split(",").map((x) => Number(x.trim())).filter((x) => !isNaN(x)) } })} />
          </Field>
        </div>
      );
    }
    case "completion": {
      const opts = (item.content.options ?? []) as string[];
      return (
        <div className="grid gap-2">
          <Field label="التكملة الصحيحة" required>
            <input className={inputCls} value={String((item.answer as { missing?: string }).missing ?? "")}
              onChange={(e) => onPatch({ answer: { missing: e.target.value } })} placeholder="مثال: ٣" />
          </Field>
          <Field label="الخيارات المعروضة (افصلي بفاصلة)">
            <input className={inputCls} defaultValue={opts.join("،")}
              onBlur={(e) => onPatch({ content: { ...item.content, options: e.target.value.split(/[،,]/).map((x) => x.trim()).filter(Boolean) } })} />
          </Field>
        </div>
      );
    }
    case "ordering": {
      const sh = (item.content.shuffled ?? []) as string[];
      return (
        <div className="grid gap-2">
          <Field label="الترتيب الصحيح (سطر لكل عنصر)" hint="اكتبي كل عنصر في سطر مستقل بالترتيب الصحيح">
            <textarea className={inputCls} rows={4} defaultValue={((item.answer as { order?: string[] }).order ?? []).join("\n")}
              onBlur={(e) => { const order = e.target.value.split("\n").map((x) => x.trim()).filter(Boolean); onPatch({ answer: { order }, content: { ...item.content, shuffled: [...order].reverse() } }); }} />
          </Field>
          {sh.length > 0 && <p className="text-sm text-gray-500">العرض الحالي للطالبة (مخلوط): {sh.join(" ، ")}</p>}
        </div>
      );
    }
    case "matching": {
      const left = (item.content.left ?? []) as { id: string; svg?: string; label: string }[];
      const right = (item.content.right ?? []) as { id: string; label: string }[];
      const pairs = (item.answer.pairs ?? []) as { left: string; right: string }[];
      const setLeft = (n: typeof left) => {
        // تنظيف الأزواج اليتيمة عند حذف عنصر
        const ids = new Set(n.map((x) => x.id));
        onPatch({ content: { ...item.content, left: n }, answer: { pairs: pairs.filter((p) => ids.has(p.left)) } });
      };
      const setRight = (n: typeof right) => {
        const ids = new Set(n.map((x) => x.id));
        onPatch({ content: { ...item.content, right: n }, answer: { pairs: pairs.filter((p) => ids.has(p.right)) } });
      };
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 font-bold">الصور (العمود الأول):</p>
            {left.map((l, k) => (
              <div key={l.id} className="mb-2 rounded-2xl bg-gray-50 p-2">
                <div className="flex gap-1.5">
                  <input className={inputCls} value={l.label} aria-label={`تسمية صورة ${k + 1}`}
                    onChange={(e) => { const n = [...left]; n[k] = { ...n[k], label: e.target.value }; setLeft(n); }} />
                  {left.length > 1 && (
                    <button type="button" className="shrink-0 rounded-xl bg-red-50 px-3 font-bold text-red-600" aria-label="حذف الصورة"
                      onClick={() => setLeft(left.filter((x) => x.id !== l.id))}>×</button>
                  )}
                </div>
                <details className="mt-1">
                  <summary className="cursor-pointer text-sm font-bold text-[#176B61]">تغيير الصورة</summary>
                  <SvgPicker value={l.svg} onChange={(svg) => { const n = [...left]; n[k] = { ...n[k], svg }; setLeft(n); }} />
                </details>
                <label className="mt-1 block text-sm font-bold">تُطابق:
                  <select className={inputCls} value={pairs.find((p) => p.left === l.id)?.right ?? ""}
                    onChange={(e) => {
                      const rest = pairs.filter((p) => p.left !== l.id);
                      onPatch({ answer: { pairs: e.target.value ? [...rest, { left: l.id, right: e.target.value }] : rest } });
                    }}>
                    <option value="">— اختاري —</option>
                    {right.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </label>
              </div>
            ))}
            <button type="button" className="rounded-xl bg-gray-100 px-4 py-2 font-bold"
              onClick={() => setLeft([...left, { id: uid("l"), svg: "star", label: "صورة جديدة" }])}>+ صورة</button>
          </div>
          <div>
            <p className="mb-1 font-bold">الكلمات (العمود الثاني):</p>
            {right.map((r, k) => (
              <div key={r.id} className="mb-2 flex gap-1.5">
                <input className={inputCls} value={r.label} aria-label={`كلمة ${k + 1}`}
                  onChange={(e) => { const n = [...right]; n[k] = { ...n[k], label: e.target.value }; setRight(n); }} />
                {right.length > 1 && (
                  <button type="button" className="shrink-0 rounded-xl bg-red-50 px-3 font-bold text-red-600" aria-label="حذف الكلمة"
                    onClick={() => setRight(right.filter((x) => x.id !== r.id))}>×</button>
                )}
              </div>
            ))}
            <button type="button" className="rounded-xl bg-gray-100 px-4 py-2 font-bold"
              onClick={() => setRight([...right, { id: uid("r"), label: "كلمة جديدة" }])}>+ كلمة</button>
          </div>
        </div>
      );
    }
    case "classification": {
      const all = (item.content.items ?? []) as { id: string; svg: string; label: string }[];
      const groups = (item.content.groups ?? []) as string[];
      const ans = (item.answer.groups ?? {}) as Record<string, string[]>;
      const setGroups = (n: string[]) => {
        const kept: Record<string, string[]> = {};
        n.forEach((g) => { kept[g] = ans[g] ?? []; });
        onPatch({ content: { ...item.content, groups: n }, answer: { groups: kept } });
      };
      return (
        <div className="grid gap-3">
          <Field label="المجموعات (مجموعة في كل سطر)" hint="مثال: حيوان / نبات">
            <textarea className={inputCls} rows={2} defaultValue={groups.join("\n")}
              onBlur={(e) => setGroups(e.target.value.split("\n").map((x) => x.trim()).filter(Boolean))} />
          </Field>
          <div>
            <p className="mb-1 font-bold">العناصر ومجموعة كل عنصر:</p>
            {all.map((a, k) => (
              <div key={a.id} className="mb-2 rounded-2xl bg-gray-50 p-2">
                <div className="flex gap-1.5">
                  <input className={inputCls} value={a.label} aria-label={`عنصر ${k + 1}`}
                    onChange={(e) => { const n = [...all]; n[k] = { ...n[k], label: e.target.value }; onPatch({ content: { ...item.content, items: n } }); }} />
                  <select className={inputCls} aria-label="المجموعة الصحيحة" value={Object.keys(ans).find((g) => (ans[g] ?? []).includes(a.id)) ?? ""}
                    onChange={(e) => {
                      const next: Record<string, string[]> = {};
                      Object.keys(ans).forEach((g) => { next[g] = (ans[g] ?? []).filter((id) => id !== a.id); });
                      if (e.target.value) next[e.target.value] = [...(next[e.target.value] ?? []), a.id];
                      onPatch({ answer: { groups: next } });
                    }}>
                    <option value="">— المجموعة؟ —</option>
                    {groups.map((g) => <option key={g}>{g}</option>)}
                  </select>
                  {all.length > 1 && (
                    <button type="button" className="shrink-0 rounded-xl bg-red-50 px-3 font-bold text-red-600" aria-label="حذف العنصر"
                      onClick={() => {
                        const next: Record<string, string[]> = {};
                        Object.keys(ans).forEach((g) => { next[g] = (ans[g] ?? []).filter((id) => id !== a.id); });
                        onPatch({ content: { ...item.content, items: all.filter((x) => x.id !== a.id) }, answer: { groups: next } });
                      }}>×</button>
                  )}
                </div>
                <details className="mt-1">
                  <summary className="cursor-pointer text-sm font-bold text-[#176B61]">تغيير الصورة</summary>
                  <SvgPicker value={a.svg} onChange={(svg) => { const n = [...all]; n[k] = { ...n[k], svg }; onPatch({ content: { ...item.content, items: n } }); }} />
                </details>
              </div>
            ))}
            <button type="button" className="rounded-xl bg-gray-100 px-4 py-2 font-bold"
              onClick={() => onPatch({ content: { ...item.content, items: [...all, { id: uid("c"), svg: "star", label: "عنصر جديد" }] } })}>+ عنصر</button>
          </div>
        </div>
      );
    }
    case "worksheet": {
      const subs = ((item.content as { subQuestions?: { id: string; text: string; answer: string }[] }).subQuestions ?? []);
      return (
        <div>
          <p className="mb-2 font-bold">أسئلة ورقة العمل الفرعية:</p>
          {subs.map((s, k) => (
            <div key={s.id} className="mb-2 grid gap-1.5 rounded-2xl bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500">سؤال فرعي {k + 1}</span>
                <button type="button" className="rounded-xl bg-red-50 px-3 py-1.5 text-sm font-bold text-red-600" aria-label="حذف السؤال الفرعي"
                  onClick={() => { if (confirm("حذف هذا السؤال الفرعي؟")) onPatch({ content: { ...item.content, subQuestions: subs.filter((x) => x.id !== s.id) } }); }}>× حذف</button>
              </div>
              <input className={inputCls} value={s.text} aria-label="نص السؤال الفرعي"
                onChange={(e) => { const n = [...subs]; n[k] = { ...n[k], text: e.target.value }; onPatch({ content: { ...item.content, subQuestions: n } }); }} />
              <input className={inputCls} value={s.answer} aria-label="إجابة السؤال الفرعي (لمفتاح الإجابة)"
                placeholder="الإجابة (تظهر في مفتاح المعلمة فقط)"
                onChange={(e) => { const n = [...subs]; n[k] = { ...n[k], answer: e.target.value }; onPatch({ content: { ...item.content, subQuestions: n } }); }} />
            </div>
          ))}
          <button type="button" className="rounded-xl bg-gray-100 px-4 py-2 font-bold"
            onClick={() => onPatch({ content: { ...item.content, subQuestions: [...subs, { id: uid("q"), text: "سؤال جديد", answer: "" }] } })}>+ سؤال فرعي</button>
        </div>
      );
    }
    default:
      return null;
  }
}
