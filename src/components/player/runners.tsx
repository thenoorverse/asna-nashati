"use client";
import { useMemo, useState } from "react";
import type { ActivityItem, ActivityMeta } from "@/lib/types";
import { svgByKey } from "@/lib/svg-library";
import { speakArabic, cn } from "@/lib/utils";
import { Volume2, Lightbulb, EyeOff, Eye } from "lucide-react";
import { RemoteImg } from "@/components/studio/upload";

export interface RunnerState {
  responses: Record<string, Record<string, unknown>>;
  tries: Record<string, number>;
  hints: Record<string, number>;
  done: Record<string, boolean | null>; // true صح، false خطأ أخير، null لم يُجب
}

export function useRunner(items: ActivityItem[]) {
  const [idx, setIdx] = useState(0);
  const [st, setSt] = useState<RunnerState>({ responses: {}, tries: {}, hints: {}, done: {} });
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [effectsOff, setEffectsOff] = useState(false);
  const item = items[idx];
  const progress = items.length ? Math.round(((idx + 1) / items.length) * 100) : 0;

  const record = (itemId: string, response: Record<string, unknown>, correct: boolean, isHint = false) => {
    setSt((s) => ({
      responses: { ...s.responses, [itemId]: response },
      tries: { ...s.tries, [itemId]: (s.tries[itemId] ?? 0) + 1 },
      hints: { ...s.hints, [itemId]: (s.hints[itemId] ?? 0) + (isHint ? 1 : 0) },
      done: { ...s.done, [itemId]: correct }
    }));
  };

  return { idx, setIdx, st, record, showHint, setShowHint, effectsOff, setEffectsOff, item, progress };
}

function QHead({ meta, item, num, total, showNumbers }: { meta: ActivityMeta; item: ActivityItem; num: number; total: number; showNumbers: boolean }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-bold text-gray-500">
        <span>{showNumbers ? `سؤال ${num} من ${total}` : `الخطوة ${num}`}</span>
        {meta.support.readAloud && (
          <button
            type="button" onClick={() => speakArabic(item.questionText)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#E6F1EC] px-3 font-bold text-[#176B61]"
            aria-label="استماع إلى السؤال"
          >
            <Volume2 size={18} aria-hidden="true" /> اسمعي السؤال
          </button>
        )}
      </div>
      <h2 className="text-2xl font-extrabold leading-relaxed text-[#0F4A44]">{item.questionText}</h2>
      {!meta.support.reduceDistractions && (
        <p className="mt-1 text-gray-500">{meta.instructions}</p>
      )}
    </div>
  );
}

function Feedback({ ok, reinforcement }: { ok: boolean | null | undefined; reinforcement: ActivityMeta["reinforcement"] }) {
  if (ok === undefined || ok === null) return null;
  if (reinforcement === "quiet") {
    return (
      <p role="status" className={cn("mt-3 rounded-2xl p-3 font-bold", ok ? "bg-[#E6F1EC] text-[#176B61]" : "bg-gray-100 text-gray-700")}>
        {ok ? "✓ أحسنتِ" : "حاولي مرة أخرى بهدوء"}
      </p>
    );
  }
  if (ok) {
    return (
      <p role="status" className="mt-3 rounded-2xl bg-[#E6F1EC] p-4 text-center text-xl font-extrabold text-[#176B61]">
        {reinforcement === "stars" ? "⭐⭐⭐ أحسنتِ! رائعة!" : "أحسنتِ! إجابة صحيحة 🎉"}
        <span className="mr-2 rounded-full bg-white px-2 py-0.5 text-sm">إجابة صحيحة</span>
      </p>
    );
  }
  return (
    <p role="status" className="mt-3 rounded-2xl bg-[#F6E8CF] p-4 text-center text-lg font-bold text-[#6b4d14]">
      لا بأس، حاولي مرة أخرى 💛
      <span className="mr-2 rounded-full bg-white px-2 py-0.5 text-sm">تحتاج مراجعة</span>
    </p>
  );
}

export function HintBox({ hint, visible, onToggle }: { hint?: string; visible: boolean; onToggle: () => void }) {
  if (!hint) return null;
  return (
    <div className="mt-3">
      <button type="button" onClick={onToggle}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#F6E8CF] px-3 font-bold text-[#6b4d14]"
        aria-expanded={visible}>
        {visible ? <EyeOff size={18} /> : <Lightbulb size={18} />} {visible ? "إخفاء التلميح" : "إظهار التلميح"}
      </button>
      {visible && <p className="mt-2 rounded-2xl bg-[#FFF9EC] p-3 font-bold text-[#6b4d14]">💡 {hint}</p>}
    </div>
  );
}

// ---------- محركات العرض (واحد لكل نوع) ----------

export function ChooseImageRunner({ meta, item, value, ok, onAnswer }: {
  meta: ActivityMeta; item: ActivityItem; value?: number; ok?: boolean | null;
  onAnswer: (i: number) => void;
}) {
  const opts = (item.content.options ?? []) as { svg: string; label: string; imageUrl?: string }[];
  const big = meta.imageSize === "large";
  return (
    <div>
      <div className={cn("mt-4 grid gap-3", opts.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        {opts.map((o, i) => {
          const answered = ok !== undefined && ok !== null;
          const isRight = value === i && ok === true;
          const isWrong = value === i && ok === false;
          return (
            <button
              key={i} type="button" onClick={() => onAnswer(i)}
              aria-pressed={value === i}
              className={cn(
                "rounded-3xl border-4 bg-white p-3 transition min-h-[120px]",
                isRight ? "border-[#176B61] bg-[#E6F1EC]" : isWrong ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-[#176B61]"
              )}
            >
              {o.imageUrl ? (
                o.imageUrl.startsWith("storage:") ? (
                  <RemoteImg storageRef={o.imageUrl} alt={o.label} cls={cn("mx-auto block rounded-2xl object-cover", big ? "max-w-[220px]" : "max-w-[140px]")} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.imageUrl} alt={o.label} className={cn("mx-auto block rounded-2xl object-cover", big ? "max-w-[220px]" : "max-w-[140px]")} />
                )
              ) : (
                <span dangerouslySetInnerHTML={{ __html: svgByKey(o.svg) ?? "" }}
                  className={cn("mx-auto block", big ? "max-w-[220px]" : "max-w-[140px]")} />
              )}
              <span className="mt-2 block text-xl font-extrabold">{o.label}</span>
              {isRight && <span className="mt-1 block font-bold text-[#176B61]">✓ اختيار صحيح</span>}
            </button>
          );
        })}
      </div>
      <Feedback ok={ok} reinforcement={meta.reinforcement} />
    </div>
  );
}

export function TrueFalseRunner({ meta, ok, onAnswer }: {
  meta: ActivityMeta; ok?: boolean | null; onAnswer: (v: boolean) => void;
}) {
  return (
    <div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {(["صح", "خطأ"] as const).map((t) => {
          const v = t === "صح";
          return (
            <button key={t} type="button" onClick={() => onAnswer(v)}
              className="min-h-[96px] rounded-3xl border-4 border-gray-200 bg-white text-3xl font-extrabold hover:border-[#176B61]">
              {t === "صح" ? "✓ صح" : "✗ خطأ"}
            </button>
          );
        })}
      </div>
      <Feedback ok={ok} reinforcement={meta.reinforcement} />
    </div>
  );
}

export function CountingRunner({ meta, item, ok, onAnswer }: {
  meta: ActivityMeta; item: ActivityItem; ok?: boolean | null; onAnswer: (n: number) => void;
}) {
  const dots = Number(item.content.dots ?? 3);
  const options = (item.content.options ?? []) as number[];
  return (
    <div>
      <div className="mt-4 flex flex-wrap gap-2 rounded-3xl bg-white p-4" aria-label={`مجموعة من ${dots} عناصر`}>
        {Array.from({ length: dots }).map((_, i) => (
          <span key={i} dangerouslySetInnerHTML={{ __html: svgByKey("ball") ?? "" }} className="block w-14" />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {options.map((n) => (
          <button key={n} type="button" onClick={() => onAnswer(n)}
            className="min-h-[72px] rounded-3xl border-4 border-gray-200 bg-white text-3xl font-extrabold hover:border-[#176B61]">{n}</button>
        ))}
      </div>
      <Feedback ok={ok} reinforcement={meta.reinforcement} />
    </div>
  );
}

export function CompletionRunner({ meta, item, ok, onAnswer }: {
  meta: ActivityMeta; item: ActivityItem; ok?: boolean | null; onAnswer: (v: string) => void;
}) {
  const options = (item.content.options ?? []) as string[];
  return (
    <div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {options.map((o) => (
          <button key={o} type="button" onClick={() => onAnswer(o)}
            className="min-h-[72px] rounded-3xl border-4 border-gray-200 bg-white text-2xl font-extrabold hover:border-[#176B61]">{o}</button>
        ))}
      </div>
      <Feedback ok={ok} reinforcement={meta.reinforcement} />
    </div>
  );
}

// المطابقة بالنقر المتتابع (بديل السحب والإفلات — يعمل باللمس ولوحة المفاتيح)
export function MatchingRunner({ meta, item, onDone, onRetry }: {
  meta: ActivityMeta; item: ActivityItem; onDone: (pairs: { left: string; right: string }[], ok: boolean) => void; onRetry?: () => void;
}) {
  const left = (item.content.left ?? []) as { id: string; svg?: string; label: string }[];
  const right = (item.content.right ?? []) as { id: string; label: string }[];
  const expected = (item.answer.pairs ?? []) as { left: string; right: string }[];
  const [selL, setSelL] = useState<string | null>(null);
  const [made, setMade] = useState<{ left: string; right: string }[]>([]);
  const [ok, setOk] = useState<boolean | null>(null);

  const pickR = (rid: string) => {
    if (!selL || made.some((m) => m.left === selL || m.right === rid)) return;
    const next = [...made, { left: selL, right: rid }];
    setMade(next); setSelL(null);
    if (next.length === expected.length) {
      const good = expected.every((p) => next.some((n) => n.left === p.left && n.right === p.right));
      setOk(good); onDone(next, good);
    }
  };

  return (
    <div>
      <p className="mt-2 text-sm font-bold text-gray-500">اختاري صورة ثم كلمتها — بدون سحب.</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {left.map((l) => (
            <button key={l.id} type="button" onClick={() => setSelL(l.id)}
              disabled={made.some((m) => m.left === l.id)}
              aria-pressed={selL === l.id}
              className={cn("w-full rounded-2xl border-4 bg-white p-2 font-bold disabled:opacity-40",
                selL === l.id ? "border-[#E8C58D]" : made.some((m) => m.left === l.id) ? "border-[#176B61]" : "border-gray-200")}>
              {l.svg && <span dangerouslySetInnerHTML={{ __html: svgByKey(l.svg) ?? "" }} className="mx-auto block max-w-[90px]" />}
              {l.label}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {right.map((r) => (
            <button key={r.id} type="button" onClick={() => pickR(r.id)}
              disabled={made.some((m) => m.right === r.id)}
              className="min-h-[64px] w-full rounded-2xl border-4 border-gray-200 bg-white text-lg font-extrabold disabled:border-[#176B61] disabled:opacity-60">
              {r.label}
            </button>
          ))}
        </div>
      </div>
      {made.length > 0 && (
        <button type="button" className="mt-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold"
          onClick={() => { setMade([]); setOk(null); setSelL(null); onRetry?.(); }}>إعادة المحاولة</button>
      )}
      <Feedback ok={ok} reinforcement={meta.reinforcement} />
    </div>
  );
}

// التصنيف بالنقر: اختاري العنصر ثم المجموعة (بديل السحب)
export function ClassificationRunner({ meta, item, onDone, onRetry }: {
  meta: ActivityMeta; item: ActivityItem; onDone: (groups: Record<string, string[]>, ok: boolean) => void; onRetry?: () => void;
}) {
  const all = (item.content.items ?? []) as { id: string; svg: string; label: string }[];
  const groups = (item.content.groups ?? []) as string[];
  const expected = (item.answer.groups ?? {}) as Record<string, string[]>;
  const [sel, setSel] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string[]>>({});
  const [ok, setOk] = useState<boolean | null>(null);
  const rest = useMemo(() => all.filter((a) => !Object.values(placed).flat().includes(a.id)), [all, placed]);

  const put = (g: string) => {
    if (!sel) return;
    const next = { ...placed, [g]: [...(placed[g] ?? []), sel] };
    setPlaced(next); setSel(null);
    const total = Object.values(next).flat().length;
    if (total === all.length) {
      const good = Object.keys(expected).every(
        (k) => [...(expected[k] ?? [])].sort().join("|") === [...(next[k] ?? [])].sort().join("|")
      );
      setOk(good); onDone(next, good);
    }
  };

  return (
    <div>
      <p className="mt-2 text-sm font-bold text-gray-500">اضغطي العنصر ثم اضغطي مجموعته.</p>
      <div className="mt-3 flex flex-wrap gap-2 rounded-3xl bg-white p-3" aria-label="العناصر المتبقية">
        {rest.map((a) => (
          <button key={a.id} type="button" onClick={() => setSel(a.id)} aria-pressed={sel === a.id}
            className={cn("w-24 rounded-2xl border-4 p-1.5", sel === a.id ? "border-[#E8C58D] bg-[#FFF9EC]" : "border-gray-200")}>
            <span dangerouslySetInnerHTML={{ __html: svgByKey(a.svg) ?? "" }} className="block" />
            <span className="text-sm font-bold">{a.label}</span>
          </button>
        ))}
        {rest.length === 0 && <span className="font-bold text-[#176B61]">تم توزيع كل العناصر ✓</span>}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {groups.map((g) => (
          <button key={g} type="button" onClick={() => put(g)}
            className="min-h-[80px] rounded-3xl border-4 border-dashed border-[#176B61]/40 bg-[#E6F1EC]/60 p-2 font-extrabold text-[#0F4A44]">
            {g}
            <span className="mt-1 flex flex-wrap justify-center gap-1">
              {(placed[g] ?? []).map((id) => {
                const a = all.find((x) => x.id === id);
                return a ? <span key={id} dangerouslySetInnerHTML={{ __html: svgByKey(a.svg) ?? "" }} className="block w-10" /> : null;
              })}
            </span>
          </button>
        ))}
      </div>
      <button type="button" className="mt-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold"
        onClick={() => { setPlaced({}); setOk(null); setSel(null); onRetry?.(); }}>إعادة</button>
      <Feedback ok={ok} reinforcement={meta.reinforcement} />
    </div>
  );
}

// الترتيب بالنقر المتتابع
export function OrderingRunner({ meta, item, onDone, onRetry }: {
  meta: ActivityMeta; item: ActivityItem; onDone: (order: string[], ok: boolean) => void; onRetry?: () => void;
}) {
  const shuffled = (item.content.shuffled ?? []) as string[];
  const expected = (item.answer.order ?? []) as string[];
  const [seq, setSeq] = useState<string[]>([]);
  const [ok, setOk] = useState<boolean | null>(null);

  const tap = (s: string, k: number) => {
    if (seq.includes(`${s}#${k}`)) return;
    const next = [...seq, `${s}#${k}`];
    setSeq(next);
    if (next.length === shuffled.length) {
      const plain = next.map((x) => x.split("#")[0]);
      const good = JSON.stringify(plain) === JSON.stringify(expected);
      setOk(good); onDone(plain, good);
    }
  };

  return (
    <div>
      <p className="mt-2 text-sm font-bold text-gray-500">اضغطي العناصر بالترتيب الصحيح واحدًا واحدًا.</p>
      <div className="mt-3 min-h-[64px] rounded-3xl bg-white p-3 font-extrabold" aria-live="polite">
        {seq.length === 0 ? <span className="text-gray-400">ترتيبك سيظهر هنا...</span> : seq.map((x) => x.split("#")[0]).join(" ← ")}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {shuffled.map((s, k) => (
          <button key={k} type="button" onClick={() => tap(s, k)}
            disabled={seq.includes(`${s}#${k}`)}
            className="min-h-[64px] rounded-2xl border-4 border-gray-200 bg-white px-5 text-xl font-extrabold disabled:border-[#176B61] disabled:opacity-50">
            {s}
          </button>
        ))}
      </div>
      <button type="button" className="mt-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold"
        onClick={() => { setSeq([]); setOk(null); onRetry?.(); }}>إعادة</button>
      <Feedback ok={ok} reinforcement={meta.reinforcement} />
    </div>
  );
}

export { QHead };
