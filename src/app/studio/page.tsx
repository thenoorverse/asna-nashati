"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shell } from "@/components/layout";
import { Button, Card, Badge, Field, inputCls, ProgressBar } from "@/components/ui";
import { ACTIVITY_TYPE_LABEL, DEFAULT_SUPPORT, SUBJECTS, type ActivityItem, type ActivityMeta, type ActivityType, type SupportLevel } from "@/lib/types";
import { TEMPLATE_SEEDS } from "@/lib/templates-seed";
import { useDemo, getPrintDefaultsLocal } from "@/lib/store";
import { uid, nowIso } from "@/lib/utils";
import { ItemsEditor, blankItem, type DraftItem } from "@/components/studio/editors";
import { WorksheetSheet, type PrintPrefs } from "@/components/print/worksheet";
import { ArrowRight, ArrowLeft, Save, Eye, Printer, CheckCircle2 } from "lucide-react";
import { TeacherOnly } from "@/components/guards";

const TYPES: ActivityType[] = ["choose-image", "matching", "classification", "ordering", "true-false", "completion", "counting", "worksheet"];
const COLORS = ["#176B61", "#2E7CC0", "#8a2b4a", "#6b4d14", "#5B3A1A", "#4a5568"];

function StudioInner() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id");
  const tplId = params.get("template");
  const { db, saveActivity, updateActivity, useTemplate, syncError } = useDemo();

  const [step, setStep] = useState(0);
  const [meta, setMeta] = useState<ActivityMeta>({
    id: "", ownerId: "demo-teacher", title: "", subject: "الرياضيات", field: "",
    skill: "", objective: "", stage: "المرحلة الابتدائية", grade: "", performanceLevel: "",
    questionCount: 3, instructions: "", teacherName: "", activityDate: "",
    activityType: "choose-image", support: { ...DEFAULT_SUPPORT.intro },
    color: COLORS[0], imageSize: "large", reinforcement: "stars",
    status: "draft", showNumbers: true, createdAt: nowIso(), updatedAt: nowIso()
  });
  const [level, setLevel] = useState<SupportLevel>("intro");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [savedId, setSavedId] = useState<string | null>(editId);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving">("saved");
  const [snapshot, setSnapshot] = useState<{ meta: ActivityMeta; items: DraftItem[] } | null>(null);
  const [prefs, setPrefs] = useState<PrintPrefs>(() => {
    const d = getPrintDefaultsLocal();
    return {
      orientation: "portrait", bw: false, showStudentLine: d.showStudentLine, showDateLine: true,
      schoolHeader: d.schoolHeader, showTeacherFooter: d.showTeacherFooter, showNumbers: true, includeAnswerKey: false
    };
  });
  const [previewMode, setPreviewMode] = useState<"student" | "print">("student");

  // تحميل: تعديل نشاط أو انطلاق من قالب
  const countedTpl = useRef<string | null>(null);
  useEffect(() => {
    if (editId) {
      const a = db.activities.find((x) => x.id === editId);
      if (a) {
        setMeta(a); setSavedId(a.id);
        setLevel(a.support.level);
        const its = db.items.filter((x) => x.activityId === editId)
          .map((x) => ({ ...x, localId: x.id }));
        setItems(its as DraftItem[]);
        return;
      }
    }
    if (tplId) {
      const t = TEMPLATE_SEEDS.find((x) => x.id === tplId);
      if (t) {
        setMeta((m) => ({
          ...m, title: `${t.title} — نسختي`, subject: t.subject, skill: t.skill,
          objective: t.objective, instructions: t.instructions,
          activityType: t.activityType, support: { ...DEFAULT_SUPPORT[t.supportLevel] },
          questionCount: t.items.length
        }));
        setLevel(t.supportLevel);
        setItems(t.items.map((it) => ({ ...it, localId: uid("d") }) as DraftItem));
        if (countedTpl.current !== t.id) { countedTpl.current = t.id; useTemplate(t.id); }
        return;
      }
    }
    if (items.length === 0) setItems([blankItem("choose-image", 0), blankItem("choose-image", 1)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, tplId]);

  // حفظ مسودة تلقائي (debounced)
  useEffect(() => {
    if (saveState !== "dirty") return;
    const t = setTimeout(() => {
      setSaveState("saving");
      const payload = items.map(({ localId: _l, ...rest }) => rest as unknown as ActivityItem);
      if (savedId && db.activities.some((a) => a.id === savedId)) {
        void updateActivity({ ...meta, status: "draft" }, payload.map((p, i) => ({ ...p, activityId: savedId, position: i }) as ActivityItem));
      } else {
        void saveActivity({ ...meta, id: "", status: "draft" }, payload as never).then((id) => {
          setSavedId(id);
          setMeta((m) => ({ ...m, id }));
        });
      }
      setSaveState("saved");
      try { setSnapshot(JSON.parse(JSON.stringify({ meta, items }))); } catch { /* ignore */ }
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveState]);

  // تحذير عند الخروج مع تعديلات غير محفوظة
  useEffect(() => {
    if (saveState !== "dirty") return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [saveState]);

  const undoUnsaved = () => {
    if (!snapshot) return;
    if (!confirm("التراجع عن كل التعديلات غير المحفوظة؟")) return;
    try {
      const s = JSON.parse(JSON.stringify(snapshot)) as { meta: ActivityMeta; items: DraftItem[] };
      setMeta(s.meta); setItems(s.items); setLevel(s.meta.support.level);
      setSaveState("saved");
    } catch { /* ignore */ }
  };

  const markDirty = () => setSaveState((s) => (s === "saving" ? s : "dirty"));
  const setM = (p: Partial<ActivityMeta>) => { setMeta((m) => ({ ...m, ...p })); markDirty(); };
  const setI = (v: DraftItem[]) => { setItems(v); markDirty(); };

  const switchType = (t: ActivityType) => {
    if (t === meta.activityType) return;
    if (items.some((x) => x.questionText.trim()) && !confirm("تغيير نوع النشاط يعيد تهيئة الأسئلة — هل تريدين المتابعة؟")) return;
    setM({ activityType: t });
    setI([blankItem(t, 0), blankItem(t, 1)]);
  };

  const errors = useMemo(() => {
    const e: string[] = [];
    if (meta.title.trim().length < 3) e.push("عنوان النشاط قصير");
    if (!meta.subject) e.push("اختاري المادة");
    if (meta.skill.trim().length < 2) e.push("حددي المهارة");
    if (meta.objective.trim().length < 5) e.push("اكتبي هدفًا قابلًا للقياس");
    if (items.length < 2) e.push("أضيفي سؤالين على الأقل");
    if (items.length > 10) e.push("الحد الأقصى ١٠ أسئلة");
    if (items.some((x) => !x.questionText.trim())) e.push("كل سؤال يحتاج نصًا");
    return e;
  }, [meta, items]);

  const publish = async () => {
    if (errors.length) { alert("أكملي البيانات التالية:\n- " + errors.join("\n- ")); return; }
    const payload = items.map(({ localId: _l, ...rest }) => rest);
    let id = savedId;
    if (id && db.activities.some((a) => a.id === id)) {
      await updateActivity({ ...meta, status: "published" }, payload.map((p, i) => ({ ...p, id: (p as { id?: string }).id ?? uid("item"), activityId: id!, position: i }) as ActivityItem));
    } else {
      id = await saveActivity({ ...meta, id: "", status: "published" }, payload as never);
    }
    router.push(`/play?id=${id}`);
  };

  const previewItems: ActivityItem[] = items.map((d, i) => {
    const { localId: _l, ...rest } = d;
    return { ...rest, id: `prev-${i}`, activityId: "preview", position: i } as ActivityItem;
  });

  return (
    <Shell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F4A44]">{editId ? "تحرير النشاط" : "استوديو التصميم — نشاط جديد"}</h1>
          <p className="text-gray-600">خطوات واضحة من الفكرة إلى النشاط الجاهز</p>
        </div>
        <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${saveState === "saved" ? "bg-[#E6F1EC] text-[#176B61]" : saveState === "saving" ? "bg-[#F6E8CF] text-[#6b4d14]" : "bg-[#F5DCE2] text-[#8a2b4a]"}`}
          role="status" aria-live="polite">
          {saveState === "saved" ? "✓ محفوظ" : saveState === "saving" ? "جارٍ الحفظ..." : "• تعديلات غير محفوظة"}
        </span>
        {saveState === "dirty" && snapshot && (
          <button type="button" onClick={undoUnsaved}
            className="min-h-[44px] rounded-2xl bg-gray-100 px-4 text-sm font-bold text-gray-700">
            ↩ تراجع عن غير المحفوظ
          </button>
        )}
      </div>

      <ol className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="خطوات الإنشاء">
        {["بيانات النشاط", "مستوى الدعم", "نوع النشاط", "محرر المحتوى", "المعاينة والنشر"].map((t, i) => (
          <li key={t}>
            <button type="button" onClick={() => setStep(i)}
              aria-current={step === i ? "step" : undefined}
              className={`w-full rounded-2xl px-3 py-2.5 text-sm font-extrabold ${step === i ? "bg-[#176B61] text-white" : step < i ? "bg-[#E6F1EC] text-[#176B61]" : "bg-white text-gray-500"}`}>
              {i + 1}. {t}
            </button>
          </li>
        ))}
      </ol>
      <ProgressBar value={((step + 1) / 5) * 100} />
      {syncError && (
        <p role="alert" className="mt-3 rounded-2xl bg-[#F6E8CF] p-3 text-sm font-bold text-[#6b4d14]">{syncError}</p>
      )}

      <Card className="mt-4">
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2" role="group" aria-label="بيانات النشاط">
            <Field label="عنوان النشاط" required><input className={inputCls} value={meta.title} onChange={(e) => setM({ title: e.target.value })} placeholder="مثال: أميّز الكيلو من الجرام" /></Field>
            <Field label="المادة الدراسية" required>
              <select className={inputCls} value={meta.subject} onChange={(e) => setM({ subject: e.target.value })}>
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="المجال / الوحدة"><input className={inputCls} value={meta.field} onChange={(e) => setM({ field: e.target.value })} placeholder="مثال: القياس" /></Field>
            <Field label="المهارة المستهدفة" required><input className={inputCls} value={meta.skill} onChange={(e) => setM({ skill: e.target.value })} placeholder="مثال: التمييز بين وحدتي الكتلة" /></Field>
            <div className="sm:col-span-2"><Field label="الهدف التعليمي القابل للقياس" required hint="مثال: أن تميز الطالبة بين الجرام والكيلو في ٣ مواقف من ٤"><textarea className={inputCls} rows={2} value={meta.objective} onChange={(e) => setM({ objective: e.target.value })} /></Field></div>
            <Field label="المرحلة الدراسية"><input className={inputCls} value={meta.stage} onChange={(e) => setM({ stage: e.target.value })} /></Field>
            <Field label="الصف"><input className={inputCls} value={meta.grade} onChange={(e) => setM({ grade: e.target.value })} placeholder="مثال: الصف الثاني" /></Field>
            <Field label="مستوى أداء الطالبة"><input className={inputCls} value={meta.performanceLevel} onChange={(e) => setM({ performanceLevel: e.target.value })} placeholder="وصف مرن — ليس تصنيفًا ثابتًا" /></Field>
            <Field label="عدد الأسئلة (٢–١٠)">
              <input type="number" min={2} max={10} className={inputCls} value={meta.questionCount}
                onChange={(e) => setM({ questionCount: Math.min(10, Math.max(2, Number(e.target.value))) })} />
              <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                الأسئلة الحالية في المحرر: {items.length}
                {items.length !== meta.questionCount && (
                  <button type="button" className="rounded-xl bg-[#E6F1EC] px-3 py-1.5 font-bold text-[#176B61]"
                    onClick={() => {
                      if (items.length < meta.questionCount) {
                        setI([...items, ...Array.from({ length: meta.questionCount - items.length }, (_, k) => blankItem(meta.activityType, items.length + k))]);
                      } else if (confirm(`تقليص الأسئلة إلى ${meta.questionCount}؟ ستُحذف الأسئلة الأخيرة نهائيًا.`)) {
                        setI(items.slice(0, meta.questionCount));
                      }
                    }}>
                    مطابقة المحرر مع العدد ({meta.questionCount})
                  </button>
                )}
              </span>
            </Field>
            <div className="sm:col-span-2"><Field label="تعليمات النشاط" required><textarea className={inputCls} rows={2} value={meta.instructions} onChange={(e) => setM({ instructions: e.target.value })} placeholder="تعليمات قصيرة ومباشرة للطالبة" /></Field></div>
            <Field label="اسم المعلمة (اختياري)"><input className={inputCls} value={meta.teacherName} onChange={(e) => setM({ teacherName: e.target.value })} /></Field>
            <Field label="تاريخ النشاط (اختياري)"><input type="date" className={inputCls} value={meta.activityDate} onChange={(e) => setM({ activityDate: e.target.value })} /></Field>
          </div>
        )}

        {step === 1 && (
          <div role="radiogroup" aria-label="مستوى الدعم">
            <p className="mb-3 font-bold text-gray-700">المستويات إعدادات قابلة للتعديل — وليست تصنيفات ثابتة لقدرات الطالبات.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["intro", "core", "advanced"] as SupportLevel[]).map((l) => (
                <button key={l} type="button" role="radio" aria-checked={level === l}
                  onClick={() => { setLevel(l); setM({ support: { ...DEFAULT_SUPPORT[l] } }); }}
                  className={`rounded-3xl border-4 p-4 text-right ${level === l ? "border-[#176B61] bg-[#E6F1EC]" : "border-gray-200 bg-white"}`}>
                  <span className="font-extrabold">{l === "intro" ? "المستوى التمهيدي" : l === "core" ? "المستوى الأساسي" : "المستوى المتقدم"}</span>
                  <span className="mt-1 block text-sm text-gray-600">
                    {l === "intro" ? "خيارات قليلة • صور كبيرة • تعزيز فوري • تكرار المحاولة" : l === "core" ? "خيارات أكثر • نص وصورة • تدرج معتدل" : "تلميحات أقل • تعقيد تدريجي • استقلالية أكبر"}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["shortInstructions", "تعليمات قصيرة"], ["readAloud", "قراءة السؤال صوتيًا"],
                ["instantReinforcement", "تعزيز فوري"], ["retryAllowed", "تكرار المحاولة"],
                ["reduceDistractions", "تقليل المشتتات"], ["showHints", "إظهار التلميحات"]
              ].map(([k, label]) => (
                <label key={k} className="flex min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-2 font-bold">
                  {label}
                  <input type="checkbox" className="h-6 w-6 accent-[#176B61]"
                    checked={Boolean((meta.support as unknown as Record<string, boolean>)[k])}
                    onChange={(e) => setM({ support: { ...meta.support, [k]: e.target.checked } })} />
                </label>
              ))}
              <Field label="حجم الصور">
                <select className={inputCls} value={meta.imageSize}
                  onChange={(e) => { const v = e.target.value as ActivityMeta["imageSize"]; setM({ imageSize: v, support: { ...meta.support, imageSize: v } }); }}>
                  <option value="large">كبيرة وواضحة</option><option value="medium">متوسطة</option><option value="small">صغيرة</option>
                </select>
              </Field>
              <Field label="طريقة التعزيز">
                <select className={inputCls} value={meta.reinforcement} onChange={(e) => setM({ reinforcement: e.target.value as ActivityMeta["reinforcement"] })}>
                  <option value="stars">نجوم ⭐</option><option value="words">كلمات مشجعة</option><option value="quiet">هادئ (بدون مؤثرات)</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="نوع النشاط">
            {TYPES.map((t) => (
              <button key={t} type="button" role="radio" aria-checked={meta.activityType === t}
                onClick={() => switchType(t)}
                className={`rounded-3xl border-4 p-4 text-right ${meta.activityType === t ? "border-[#176B61] bg-[#E6F1EC]" : "border-gray-200"}`}>
                <span className="font-extrabold">{ACTIVITY_TYPE_LABEL[t]}</span>
                <Badge tone={meta.activityType === t ? "mint" : "gray"}>{t === meta.activityType ? "محدد" : "اختياري"}</Badge>
              </button>
            ))}
            <p className="text-sm text-gray-500 sm:col-span-2">تغيير النوع يعيد تهيئة الأسئلة — راجعي قبل التبديل.</p>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <Field label="لون النشاط">
                <span className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c} type="button" aria-label={`لون ${c}`} aria-pressed={meta.color === c}
                      onClick={() => setM({ color: c })}
                      className={`h-11 w-11 rounded-full border-4 ${meta.color === c ? "border-gray-800" : "border-gray-200"}`}
                      style={{ background: c }} />
                  ))}
                </span>
              </Field>
              <label className="flex items-center gap-2 font-bold">
                <input type="checkbox" className="h-6 w-6 accent-[#176B61]" checked={meta.showNumbers} onChange={(e) => setM({ showNumbers: e.target.checked })} />
                ترقيم الأسئلة تلقائيًا
              </label>
            </div>
            <ItemsEditor type={meta.activityType} items={items} setItems={setI} />
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="وضع المعاينة">
              <button type="button" role="tab" aria-selected={previewMode === "student"}
                onClick={() => setPreviewMode("student")}
                className={`rounded-2xl px-4 py-2.5 font-bold ${previewMode === "student" ? "bg-[#176B61] text-white" : "bg-gray-100"}`}>
                <Eye size={16} className="inline" /> معاينة تفاعلية
              </button>
              <button type="button" role="tab" aria-selected={previewMode === "print"}
                onClick={() => setPreviewMode("print")}
                className={`rounded-2xl px-4 py-2.5 font-bold ${previewMode === "print" ? "bg-[#176B61] text-white" : "bg-gray-100"}`}>
                <Printer size={16} className="inline" /> معاينة الطباعة A4
              </button>
            </div>
            {errors.length > 0 ? (
              <div className="mb-3 rounded-2xl bg-[#F5DCE2] p-4 font-bold text-[#8a2b4a]" role="alert">
                قبل النشر أكملي: <ul className="mt-1 list-disc pr-5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
              </div>
            ) : (
              <p className="mb-3 flex items-center gap-2 rounded-2xl bg-[#E6F1EC] p-3 font-bold text-[#176B61]">
                <CheckCircle2 size={20} /> النشاط مكتمل وجاهز للنشر ✓
              </p>
            )}
            {previewMode === "print" ? (
              <div>
                <div className="no-print mb-3 grid gap-2 rounded-2xl bg-gray-50 p-3 sm:grid-cols-3">
                  <label className="font-bold">الاتجاه
                    <select className={inputCls} value={prefs.orientation} onChange={(e) => setPrefs({ ...prefs, orientation: e.target.value as "portrait" | "landscape" })}>
                      <option value="portrait">عمودي A4</option><option value="landscape">أفقي A4</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 font-bold"><input type="checkbox" className="h-5 w-5 accent-[#176B61]" checked={prefs.bw} onChange={(e) => setPrefs({ ...prefs, bw: e.target.checked })} /> نسخة اقتصادية (أبيض وأسود)</label>
                  <label className="flex items-center gap-2 font-bold"><input type="checkbox" className="h-5 w-5 accent-[#176B61]" checked={prefs.showNumbers} onChange={(e) => setPrefs({ ...prefs, showNumbers: e.target.checked })} /> ترقيم الأسئلة في المطبوعة</label>
                  <label className="flex items-center gap-2 font-bold"><input type="checkbox" className="h-5 w-5 accent-[#176B61]" checked={prefs.includeAnswerKey} onChange={(e) => setPrefs({ ...prefs, includeAnswerKey: e.target.checked })} /> تضمين مفتاح الإجابة</label>
                  <label className="font-bold sm:col-span-3">ترويسة المدرسة (اختيارية)
                    <input className={inputCls} value={prefs.schoolHeader} onChange={(e) => setPrefs({ ...prefs, schoolHeader: e.target.value })} placeholder="مثال: مدرسة النور الابتدائية" />
                  </label>
                </div>
                <WorksheetSheet meta={meta} items={previewItems} prefs={prefs} />
                {prefs.includeAnswerKey && (
                  <div className="mt-4"><WorksheetSheet meta={meta} items={previewItems} prefs={prefs} answerKey /></div>
                )}
                <div className="no-print mt-3 flex gap-2">
                  <Button type="button" onClick={() => window.print()}><Printer size={18} /> طباعة / حفظ PDF</Button>
                </div>
                <p className="mt-2 text-sm text-gray-500">للحصول على PDF عربي سليم: اختاري «حفظ كـ PDF» من نافذة الطباعة — النص العربي يُحفظ كنص حقيقي باتجاه RTL.</p>
              </div>
            ) : (
              <div className="rounded-3xl bg-[#F7F5EF] p-4">
                <p className="font-bold text-gray-600">معاينة الطالبة — {meta.title || "(بدون عنوان)"}</p>
                <p className="mt-1 text-lg font-extrabold">{previewItems[0]?.questionText || "أضيفي أسئلة لعرض المعاينة"}</p>
              </div>
            )}
          </div>
        )}

        {/* التنقل */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            <ArrowRight size={18} /> السابق
          </Button>
          <div className="flex gap-2">
            {step < 4 ? (
              <Button type="button" onClick={() => setStep((s) => Math.min(4, s + 1))}>التالي <ArrowLeft size={18} /></Button>
            ) : (
              <>
                <Button type="button" variant="gold" onClick={() => window.print()}><Printer size={18} /> طباعة</Button>
                <Button type="button" onClick={publish}><Save size={18} /> نشر وتشغيل</Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </Shell>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<Shell><p className="p-8 font-bold">جارٍ التحميل...</p></Shell>}>
      <TeacherOnly><StudioInner /></TeacherOnly>
    </Suspense>
  );
}
