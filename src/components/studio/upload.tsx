"use client";
import { useEffect, useRef, useState } from "react";
import { inputCls } from "@/components/ui";
import { svgByKey } from "@/lib/svg-library";
import { getSupabase } from "@/lib/supabase";
import { uploadImage, getSignedUrl } from "@/lib/repo";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_BYTES = 2 * 1024 * 1024; // ٢ م.ب

// رفع صورة المعلمة الخاصة: تحقق من النوع والحجم.
// عند تسجيل الدخول السحابي تُرفع إلى حزمة Supabase الخاصة، وإلا تُحفظ محليًا.
export function ImageUpload({ value, onChange, label = "أو ارفعي صورتك الخاصة" }: {
  value?: string; onChange: (dataUrl: string, alt: string) => void; label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cloud, setCloud] = useState(false);

  const pick = async (f: File | undefined) => {
    setErr(null);
    if (!f) return;
    if (!ALLOWED.includes(f.type)) { setErr("نوع الملف غير مسموح — استخدمي PNG أو JPG أو WebP أو SVG."); return; }
    if (f.size > MAX_BYTES) { setErr("حجم الصورة كبير — الحد الأقصى ٢ م.ب."); return; }
    // محاولة الرفع السحابي أولًا
    const sb = getSupabase();
    if (sb) {
      try {
        const { data: { user } } = await sb.auth.getUser();
        if (user) {
          setBusy(true);
          const storageRef = await uploadImage(sb, user.id, f);
          setCloud(true);
          onChange(storageRef, f.name);
          return;
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "تعذر الرفع السحابي — سيُحفظ محليًا");
      } finally {
        setBusy(false);
      }
    }
    const r = new FileReader();
    r.onload = () => { setCloud(false); onChange(String(r.result), f.name); };
    r.readAsDataURL(f);
  };

  return (
    <div className="mt-1">
      <input ref={ref} type="file" accept={ALLOWED.join(",")} className="hidden"
        aria-label={label} onChange={(e) => void pick(e.target.files?.[0])} />
      <div className="flex items-center gap-2">
        <button type="button" disabled={busy} onClick={() => ref.current?.click()}
          className="min-h-[44px] rounded-xl bg-[#F6E8CF] px-4 font-bold text-[#6b4d14] disabled:opacity-50">
          📤 {busy ? "جارٍ الرفع..." : label}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("", "")}
            className="min-h-[44px] rounded-xl bg-red-50 px-3 font-bold text-red-600">إزالة المرفوعة</button>
        )}
      </div>
      {value?.startsWith("data:") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="الصورة المرفوعة" className="mt-2 h-24 w-24 rounded-2xl border-2 border-gray-200 object-cover" />
      )}
      {value?.startsWith("storage:") && <RemoteImg storageRef={value} alt="الصورة المرفوعة" cls="mt-2 h-24 w-24 rounded-2xl border-2 border-gray-200 object-cover" />}
      {err && <p role="alert" className="mt-1 text-sm font-bold text-red-600">{err}</p>}
      <p className="mt-1 text-xs text-gray-500">
        PNG/JPG/WebP/SVG حتى ٢ م.ب — {cloud || value?.startsWith("storage:") ? "محفوظة في مساحتك السحابية الخاصة." : "تُحفظ في مساحتك الخاصة فقط."}
      </p>
    </div>
  );
}

// صورة من الحزمة السحابية الخاصة: تُعرض عبر رابط موقّت مؤقت (لا روابط دائمة مكشوفة)
export function RemoteImg({ storageRef, alt, cls }: { storageRef: string; alt: string; cls?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const sb = getSupabase();
    if (!sb) return;
    void getSignedUrl(sb, storageRef).then((u) => { if (alive) setSrc(u); });
    return () => { alive = false; };
  }, [storageRef]);
  if (!src) return <span className={cls ?? "block h-24 rounded-2xl bg-gray-100"} aria-label="جارٍ تحميل الصورة..." role="img" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={cls} />;
}

// عرض صورة: مرفوعة (أولوية) أو من مكتبة SVG
export function ItemImage({ imageUrl, imageSvg, alt, cls = "mx-auto block max-w-[220px]" }: {
  imageUrl?: string; imageSvg?: string; alt: string; cls?: string;
}) {
  if (imageUrl?.startsWith("storage:")) {
    return <RemoteImg storageRef={imageUrl} alt={alt} cls={cls} />;
  }
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt={alt} className={cls} />;
  }
  if (imageSvg) {
    const s = svgByKey(imageSvg);
    if (s) return <span dangerouslySetInnerHTML={{ __html: s }} className={cls} role="img" aria-label={alt} />;
  }
  return null;
}

export function AltField({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <input className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)}
      placeholder="وصف بديل للصورة (مهم لقارئ الشاشة)" aria-label="النص البديل للصورة" />
  );
}
