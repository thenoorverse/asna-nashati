"use client";
import { useMemo, useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shell, PlayBanner } from "@/components/layout";
import { Button, Card, ProgressBar, inputCls } from "@/components/ui";
import { useDemo, getPrintDefaultsLocal } from "@/lib/store";
import type { AttemptRecord, HelpLevel, ActivityMeta, ActivityItem } from "@/lib/types";
import { DEFAULT_SUPPORT } from "@/lib/types";
import { TEMPLATE_SEEDS } from "@/lib/templates-seed";
import { checkAnswer, scorePct, isMastered } from "@/lib/evaluation";
import { uid, nowIso, speakArabic } from "@/lib/utils";
import {
  useRunner, QHead, HintBox,
  ChooseImageRunner, TrueFalseRunner, CountingRunner, CompletionRunner,
  MatchingRunner, ClassificationRunner, OrderingRunner
} from "@/components/player/runners";
import { ItemImage } from "@/components/studio/upload";
import { WorksheetSheet, type PrintPrefs } from "@/components/print/worksheet";
import { ArrowLeft, ArrowRight, Printer, RotateCcw, EyeOff } from "lucide-react";

const HELPS: HelpLevel[] = ["مستقل", "تلميح لفظي", "تلميح بصري", "مساعدة جزئية", "مساعدة كلية"];

export default function PlayPage() {
  return (
    <Suspense fallback={<Shell><p className="p-8 font-bold">جارٍ تحميل النشاط...</p></Shell>}>
      <PlayInner />
    </Suspense>
  );
}

function PlayInner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "public-demo";
  const router = useRouter();
  const { db, saveAttempt, aliases } = useDemo();

  // نشاط عام للزوار: أي معرّف غير موجود يعرض نشاط تجربة حقيقيًا (للقراءة والتجربة فقط)
  const pub = useMemo(() => {
    const t = TEMPLATE_SEEDS[1]; // العد من ١ إلى ١٠
    const meta: ActivityMeta = {
      id: "public-demo", ownerId: "public", title: `${t.title} (نشاط عام للتجربة)`,
      subject: t.subject, field: "", skill: t.skill, objective: t.objective,
      stage: "", grade: "", performanceLevel: "", questionCount: t.items.length,
      instructions: t.instructions, teacherName: "", activityDate: "",
      activityType: t.activityType, support: { ...DEFAULT_SUPPORT[t.supportLevel] },
      color: "#176B61", imageSize: "large", reinforcement: "stars",
      status: "published", showNumbers: true, createdAt: nowIso(), updatedAt: nowIso()
    };
    const items: ActivityItem[] = t.items.map((it, i) => ({ ...it, id: `pub-${i}`, activityId: "public-demo", position: i }) as ActivityItem);
    return { meta, items };
  }, []);
  const realMeta = db.activities.find((a) => a.id === id);
  const isPublic = !realMeta;
  const meta = realMeta ?? pub.meta;
  const items = useMemo(() => {
    if (realMeta) return db.items.filter((x) => x.activityId === id).sort((a, b) => a.position - b.position);
    return pub.items;
  }, [db, id, realMeta, pub]);
  const runner = useRunner(items);
  const [finished, setFinished] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [alias, setAlias] = useState("");
  const [help, setHelp] = useState<HelpLevel>("مستقل");
  const [threshold, setThreshold] = useState(80);
  const [result, setResult] = useState<AttemptRecord | null>(null);
  const [worksheetAnswers, setWorksheetAnswers] = useState<Record<string, string>>({});
  const [extraTries, setExtraTries] = useState<Record<string, number>>({});
  const qWrap = useRef<HTMLDivElement>(null);
  const bumpTry = (itemId: string) => setExtraTries((t) => ({ ...t, [itemId]: (t[itemId] ?? 0) + 1 }));

  // إدارة التركيز: عند التنقل بين الأسئلة ينتقل التركيز لبداية السؤال (قارئ الشاشة ولوحة المفاتيح)
  useEffect(() => {
    qWrap.current?.focus({ preventScroll: false });
  }, [runner.idx]);
  const [prefs] = useState<PrintPrefs>(() => {
    const d = getPrintDefaultsLocal();
    return {
      orientation: "portrait", bw: false, showStudentLine: d.showStudentLine, showDateLine: true,
      schoolHeader: d.schoolHeader, showTeacherFooter: d.showTeacherFooter, showNumbers: true, includeAnswerKey: false
    };
  });

  if (items.length === 0) {
    return <Shell><Card><h1 className="font-extrabold">لا أسئلة بعد</h1><Button className="mt-3" onClick={() => router.push(`/studio?id=${id}`)}>إكمال التحرير</Button></Card></Shell>;
  }

  const cur = runner.item;
  const curResp = runner.st.responses[cur?.id ?? ""];
  const curOk = cur ? runner.st.done[cur.id] : null;

  const answerSimple = (resp: Record<string, unknown>) => {
    if (!cur) return;
    const ok = checkAnswer(meta.activityType, cur, resp);
    runner.record(cur.id, resp, ok);
  };

  const finish = () => {
    let perItem: AttemptRecord["perItem"];
    let correctCount: number;
    let total: number;
    if (meta.activityType === "worksheet") {
      // ورقة العمل: تُصحح الأسئلة الفرعية ذات الإجابات المحددة ذاتيًا، والمفتوحة للتصحيح اليدوي
      const subs = items.flatMap((it) =>
        (((it.content as { subQuestions?: { id: string; text: string; answer: string }[] }).subQuestions ?? [])
          .map((s) => ({ ...s, itemId: it.id })))
      );
      const checkable = subs.filter((s) => s.answer.trim().length > 0);
      const subOk = (s: { id: string; itemId: string; answer: string }) =>
        String(worksheetAnswers[`${s.itemId}:${s.id}`] ?? "").trim() === s.answer.trim();
      perItem = items.map((it) => {
        const mine = checkable.filter((s) => s.itemId === it.id);
        const answered = subs.filter((s) => s.itemId === it.id).every((s) => String(worksheetAnswers[`${s.itemId}:${s.id}`] ?? "").trim().length > 0);
        const correct = mine.length > 0 ? mine.every(subOk) : answered;
        return { itemId: it.id, correct, tries: 1, hints: 0 };
      });
      total = checkable.length > 0 ? checkable.length : subs.length;
      correctCount = checkable.length > 0
        ? checkable.filter(subOk).length
        : subs.filter((s) => String(worksheetAnswers[`${s.itemId}:${s.id}`] ?? "").trim().length > 0).length;
      if (total === 0) { total = items.length; correctCount = items.length; }
    } else {
      perItem = items.map((it) => {
        const r = runner.st.responses[it.id];
        const correct = r ? checkAnswer(meta.activityType, it, r) : false;
        return { itemId: it.id, correct, tries: (runner.st.tries[it.id] ?? (r ? 1 : 0)) + (extraTries[it.id] ?? 0), hints: runner.st.hints[it.id] ?? 0 };
      });
      correctCount = perItem.filter((p) => p.correct).length;
      total = items.length;
    }
    const pct = scorePct(correctCount, total);
    const rec: AttemptRecord = {
      id: uid("att"), activityId: meta.id, studentAlias: alias.trim() || "طالبة",
      startedAt: new Date(startedAt).toISOString(), completedAt: nowIso(),
      totalQuestions: total, correctCount,
      attemptTries: perItem.reduce((s, p) => s + Math.max(p.tries, 1), 0),
      hintsUsed: perItem.reduce((s, p) => s + p.hints, 0),
      durationSec: Math.round((Date.now() - startedAt) / 1000),
      scorePct: pct, supportNote: help, perItem,
      masteryThreshold: threshold, mastered: isMastered(pct, threshold)
    };
    saveAttempt(rec, buildResponses(), { localOnly: isPublic });
    setResult(rec);
    setFinished(true);
  };

  const buildResponses = (): Record<string, Record<string, unknown>> => {
    if (meta.activityType === "worksheet") {
      const m: Record<string, Record<string, unknown>> = {};
      for (const it of items) {
        const subs = ((it.content as { subQuestions?: { id: string }[] }).subQuestions ?? []);
        const answers: Record<string, string> = {};
        subs.forEach((s) => { answers[s.id] = worksheetAnswers[`${it.id}:${s.id}`] ?? ""; });
        m[it.id] = { answers };
      }
      return m;
    }
    return { ...runner.st.responses };
  };

  if (finished && result) {
    return (
      <Shell>
        <Card className="mx-auto max-w-2xl text-center">
          <p className="text-5xl" aria-hidden="true">{result.mastered ? "🌟" : "💛"}</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#0F4A44]">
            {result.mastered ? "عمل رائع! أحسنتِ" : "محاولة طيبة! استمري"}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            أجبتِ إجابات صحيحة عن {result.correctCount} من {result.totalQuestions} — بدون حد زمني وبدون ضغط.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[["النسبة", `${result.scorePct}%`], ["المحاولات", result.attemptTries], ["التلميحات", result.hintsUsed]].map(([t, v]) => (
              <div key={t} className="rounded-2xl bg-[#F7F5EF] p-3"><p className="text-2xl font-extrabold text-[#176B61]">{v}</p><p className="text-sm text-gray-500">{t}</p></div>
            ))}
          </div>
          <p className="mt-3 text-sm text-gray-500">النسبة وحدها ليست دليل إتقان نهائي — المعلمة تراجع مستوى المساعدة ({result.supportNote}) ومعيار الإتقان ({result.masteryThreshold}%).</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button onClick={() => { setFinished(false); setResult(null); window.location.reload(); }} variant="ghost"><RotateCcw size={18} /> إعادة النشاط</Button>
            <Button onClick={() => router.push(`/reports?activity=${meta.id}`)}>عرض التقرير للمعلمة</Button>
            <Button variant="gold" onClick={() => router.push("/dashboard")}>لوحة التحكم</Button>
          </div>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <PlayBanner />
      {isPublic && (
        <div className="mb-3 rounded-2xl bg-[#E6F1EC] p-3 font-bold text-[#0F4A44]">
          🌍 نشاط عام للتجربة — يعمل بدون تسجيل دخول، والمحاولة تُسجل على هذا الجهاز فقط.
          <Link href="/login" className="mr-2 underline">دخول المعلمات</Link>
        </div>
      )}
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h1 className="font-extrabold text-[#0F4A44]">{meta.title}</h1>
          <button className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-gray-100 px-3 text-sm font-bold"
            onClick={() => runner.setEffectsOff(!runner.effectsOff)} aria-pressed={runner.effectsOff}>
            <EyeOff size={16} /> {runner.effectsOff ? "تفعيل المؤثرات" : "تعطيل المؤثرات"}
          </button>
        </div>
        <ProgressBar value={runner.progress} />
        <p className="mt-1 text-sm text-gray-500">التقدم: سؤال {runner.idx + 1} من {items.length} — خذي وقتك، لا يوجد حد زمني.</p>

        {/* بيانات الجلسة (تُسجل محليًا فقط، برمز مستعار) */}
        <Card className="mb-3 mt-3 grid gap-2 sm:grid-cols-3">
          <label className="font-bold">رمز الطالبة (مستعار)
            <input className={inputCls} value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="مثال: نجمة ١" maxLength={30} list="alias-list" />
            <datalist id="alias-list">
              {aliases.map((a) => <option key={a} value={a} />)}
            </datalist>
          </label>
          <label className="font-bold">مستوى المساعدة
            <select className={inputCls} value={help} onChange={(e) => setHelp(e.target.value as HelpLevel)}>
              {HELPS.map((h) => <option key={h}>{h}</option>)}
            </select>
          </label>
          <label className="font-bold">معيار الإتقان %
            <input type="number" min={0} max={100} className={inputCls} value={threshold} onChange={(e) => setThreshold(Math.min(100, Math.max(0, Number(e.target.value))))} />
          </label>
        </Card>

        {meta.activityType === "worksheet" ? (
          <Card>
            <QHead meta={meta} item={items[0]} num={1} total={1} showNumbers={meta.showNumbers} />
            <div className="mt-4 space-y-3">
              {items.map((it, ii) => {
                const subs = ((it.content as { subQuestions?: { id: string; text: string; answer: string }[] }).subQuestions ?? []);
                return (
                  <div key={it.id} className="rounded-2xl border-2 border-gray-100 p-3">
                    <p className="font-extrabold">{meta.showNumbers ? `${ii + 1}. ` : ""}{it.questionText}</p>
                    <ItemImage imageUrl={it.imageUrl} imageSvg={it.imageSvg} alt={it.imageAlt || it.questionText} cls="mt-2 block max-w-[180px]" />
                    {subs.map((s) => (
                      <label key={s.id} className="mt-2 block font-bold">
                        {s.text}
                        {!s.answer.trim() && <span className="mr-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">للتصحيح اليدوي</span>}
                        <input className={`${inputCls} mt-1`} value={worksheetAnswers[`${it.id}:${s.id}`] ?? ""}
                          onChange={(e) => setWorksheetAnswers({ ...worksheetAnswers, [`${it.id}:${s.id}`]: e.target.value })}
                          placeholder="اكتبي إجابتك هنا" aria-label={s.text} />
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="no-print mt-3 flex flex-wrap gap-2">
              <Button onClick={finish} variant="gold">إنهاء وتسجيل المحاولة ✓</Button>
              <Button onClick={() => window.print()} variant="ghost"><Printer size={18} /> طباعة ورقة العمل</Button>
            </div>
            <div className="mt-4 border-t pt-3">
              <p className="mb-2 text-sm font-bold text-gray-500">نسخة الطباعة A4:</p>
              <WorksheetSheet meta={meta} items={items} prefs={prefs} />
            </div>
          </Card>
        ) : cur ? (
          <div ref={qWrap} tabIndex={-1} className="outline-none">
          <Card key={cur.id}>
            <QHead meta={meta} item={cur} num={runner.idx + 1} total={items.length} showNumbers={meta.showNumbers} />
            <ItemImage imageUrl={cur.imageUrl} imageSvg={cur.imageSvg} alt={cur.imageAlt || cur.questionText} />
            <HintBox hint={cur.hint}
              visible={!!runner.showHint[cur.id]}
              onToggle={() => {
                runner.setShowHint({ ...runner.showHint, [cur.id]: !runner.showHint[cur.id] });
                if (!runner.showHint[cur.id]) runner.record(cur.id, curResp ?? {}, curOk === true, true);
              }} />

            {meta.activityType === "choose-image" && (
              <ChooseImageRunner meta={meta} item={cur} value={curResp?.selectedIndex as number | undefined}
                ok={curOk} onAnswer={(i) => answerSimple({ selectedIndex: i })} />
            )}
            {meta.activityType === "true-false" && (
              <TrueFalseRunner meta={meta} ok={curOk} onAnswer={(v) => answerSimple({ value: v })} />
            )}
            {meta.activityType === "counting" && (
              <CountingRunner meta={meta} item={cur} ok={curOk} onAnswer={(n) => answerSimple({ count: n })} />
            )}
            {meta.activityType === "completion" && (
              <CompletionRunner meta={meta} item={cur} ok={curOk} onAnswer={(v) => answerSimple({ value: v })} />
            )}
            {meta.activityType === "matching" && (
              <MatchingRunner meta={meta} item={cur} onDone={(pairs, ok) => runner.record(cur.id, { pairs }, ok)} onRetry={() => bumpTry(cur.id)} />
            )}
            {meta.activityType === "classification" && (
              <ClassificationRunner meta={meta} item={cur} onDone={(groups, ok) => runner.record(cur.id, { groups }, ok)} onRetry={() => bumpTry(cur.id)} />
            )}
            {meta.activityType === "ordering" && (
              <OrderingRunner meta={meta} item={cur} onDone={(order, ok) => runner.record(cur.id, { order }, ok)} onRetry={() => bumpTry(cur.id)} />
            )}

            <div className="mt-5 flex items-center justify-between gap-2 border-t pt-4">
              <Button variant="ghost" disabled={runner.idx === 0} onClick={() => runner.setIdx(runner.idx - 1)}>
                <ArrowRight size={18} /> السابق
              </Button>
              {runner.idx < items.length - 1 ? (
                <Button onClick={() => runner.setIdx(runner.idx + 1)}>التالي <ArrowLeft size={18} /></Button>
              ) : (
                <Button onClick={finish} variant="gold">إنهاء النشاط ✓</Button>
              )}
            </div>
          </Card>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => cur && speakArabic(cur.questionText)}>🔊 إعادة سماع السؤال</Button>
          <span className="self-center text-xs text-gray-500">يعمل باللمس والفأرة ولوحة المفاتيح (Tab + Enter).</span>
        </div>
      </div>
    </Shell>
  );
}
