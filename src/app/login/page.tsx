"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout";
import { Button, Card, Field, inputCls, Badge } from "@/components/ui";
import { useDemo } from "@/lib/store";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const { profile, setProfile } = useDemo();
  const supa = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const demoAs = (role: "teacher" | "visitor" | "admin", name: string) => {
    setProfile({ ...profile, role, displayName: name });
    router.push(role === "visitor" ? "/templates" : "/dashboard");
  };

  const withSupabase = async (fn: (sb: NonNullable<ReturnType<typeof getSupabase>>) => Promise<{ error: { message: string } | null }>, okMsg: string) => {
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true); setMsg(null);
    try {
      const { error } = await fn(sb);
      setMsg(error ? `تعذر الدخول: ${error.message}` : okMsg);
      if (!error) router.push("/dashboard");
    } finally { setBusy(false); }
  };

  return (
    <Shell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-extrabold text-[#0F4A44]">تسجيل الدخول</h1>
        <p className="text-gray-600">اختاري طريقة الدخول المناسبة — وضع التجربة يعمل فورًا بدون حساب.</p>

        <Card className="mt-4">
          <h2 className="font-extrabold">وضع التجربة Demo <Badge>يعمل الآن</Badge></h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Button onClick={() => demoAs("teacher", "معلمة التجربة")}>دخول كمعلمة</Button>
            <Button variant="gold" onClick={() => demoAs("visitor", "زائرة")}>دخول كزائرة</Button>
            <Button variant="ghost" onClick={() => demoAs("admin", "مديرة النظام")}>دخول كمديرة</Button>
          </div>
          <p className="mt-2 text-sm text-gray-500">الزائر يستعرض القوالب ويجرّب نشاطًا عامًا فقط — صفحات المعلمات محمية.</p>
        </Card>

        <Card className="mt-4">
          <h2 className="font-extrabold">حساب Supabase <Badge tone={supa ? "mint" : "gray"}>{supa ? "مفعّل" : "غير مفعّل"}</Badge></h2>
          {!supa ? (
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              لم تُضبط مفاتيح Supabase بعد — المصادقة الحقيقية غير متاحة.
              للتفعيل: انسخي <code>.env.example</code> إلى <code>.env.local</code> وعبّئي المفاتيح (الشرح في <code>supabase/README.md</code>).
            </p>
          ) : (
            <div className="mt-3 grid gap-3">
              <Field label="البريد الإلكتروني"><input type="email" dir="ltr" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teacher@school.sa" /></Field>
              <Field label="كلمة المرور"><input type="password" dir="ltr" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
              {msg && <p role="alert" className="rounded-2xl bg-[#F6E8CF] p-3 text-sm font-bold text-[#6b4d14]">{msg}</p>}
              <div className="flex flex-wrap gap-2">
                <Button disabled={busy} onClick={() => withSupabase((sb) => sb.auth.signInWithPassword({ email, password }), "تم الدخول بنجاح")}>دخول</Button>
                <Button disabled={busy} variant="ghost" onClick={() => withSupabase((sb) => sb.auth.signUp({ email, password }), "تم إنشاء الحساب — تحققي من بريدك")}>حساب جديد</Button>
                <Button disabled={busy} variant="soft" onClick={() => withSupabase((sb) => sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/login" }), "أُرسل رابط إعادة التعيين إلى بريدك")}>نسيتِ كلمة المرور؟</Button>
              </div>
            </div>
          )}
          <p className="mt-3 text-sm"><Link href="/" className="font-bold text-[#176B61]">← عودة للرئيسية</Link></p>
        </Card>
      </div>
    </Shell>
  );
}
