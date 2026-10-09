"use client";
import { Shell } from "@/components/layout";
import { Card, Badge, Field, inputCls, Button } from "@/components/ui";
import { useDemo } from "@/lib/store";
import { TeacherOnly } from "@/components/guards";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useState } from "react";

export default function SettingsPage() {
  return <TeacherOnly><SettingsInner /></TeacherOnly>;
}

function SettingsInner() {
  const { profile, setProfile, remote, signOut, syncError, printDefaults, setPrintDefaults } = useDemo();
  const [savedPrint, setSavedPrint] = useState(false);
  const [draftHeader, setDraftHeader] = useState(printDefaults.schoolHeader);
  const [name, setName] = useState(profile.displayName);
  const [school, setSchool] = useState(profile.schoolName ?? "");
  const supa = isSupabaseConfigured();
  return (
    <Shell>
      <h1 className="text-2xl font-extrabold text-[#0F4A44]">الإعدادات</h1>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-extrabold">الملف الشخصي (وضع Demo محلي)</h2>
          <div className="mt-3 grid gap-3">
            <Field label="اسم العرض"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="المدرسة"><input className={inputCls} value={school} onChange={(e) => setSchool(e.target.value)} /></Field>
            <Field label="الدور">
              <select className={inputCls} value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value as never })}>
                <option value="teacher">معلمة</option><option value="admin">مديرة نظام</option><option value="visitor">زائر</option>
              </select>
            </Field>
            <Button onClick={() => setProfile({ ...profile, displayName: name || "معلمة", schoolName: school })}>حفظ الملف</Button>
            {remote && (
              <Button variant="danger" onClick={() => { if (confirm("تسجيل الخروج من الحساب السحابي والعودة لوضع Demo؟")) void signOut(); }}>
                تسجيل الخروج السحابي
              </Button>
            )}
          </div>
        </Card>
        <Card>
          <h2 className="font-extrabold">الاتصال والخصوصية</h2>
          <div className="mt-2 flex gap-2">
            <Badge tone={supa ? "mint" : "gold"}>{supa ? "Supabase مفعّل" : "وضع Demo محلي"}</Badge>
            {remote && <Badge tone="mint">متصل سحابيًا</Badge>}
          </div>
          {syncError && <p role="alert" className="mt-2 rounded-2xl bg-[#F6E8CF] p-3 text-sm font-bold text-[#6b4d14]">{syncError}</p>}
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-600">
            <li>✓ البيانات محفوظة محليًا في متصفحك فقط — لا تُرسل لأي خادم.</li>
            <li>✓ نستخدم رموزًا مستعارة للطالبات — لا أسماء كاملة.</li>
            <li>✓ لا نتائج علنية، ولا روابط ملفات خاصة.</li>
            <li>✓ للربط بـ Supabase: انسخي <code>.env.example</code> إلى <code>.env.local</code> وعبّئي المفاتيح، ثم طبّقي ترحيلات <code>supabase/migrations</code>.</li>
          </ul>
          {!supa && <p className="mt-2 rounded-2xl bg-[#F6E8CF] p-3 text-sm font-bold text-[#6b4d14]">تعليمات التفعيل الكاملة في README و supabase/README.md</p>}
        </Card>
        <Card>
          <h2 className="font-extrabold">ترويسة الطباعة الافتراضية</h2>
          <p className="text-sm text-gray-500">تُستخدم تلقائيًا في أوراق العمل الجديدة (محليًا وسحابيًا).</p>
          <div className="mt-3 grid gap-3">
            <Field label="ترويسة المدرسة">
              <input className={inputCls} value={draftHeader}
                onChange={(e) => { setDraftHeader(e.target.value); setSavedPrint(false); }}
                placeholder="مثال: مدرسة النور الابتدائية" />
            </Field>
            <label className="flex min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-2 font-bold">
              إظهار اسم المعلمة في التذييل
              <input type="checkbox" className="h-6 w-6 accent-[#176B61]" checked={printDefaults.showTeacherFooter}
                onChange={(e) => { setSavedPrint(false); void setPrintDefaults({ ...printDefaults, schoolHeader: draftHeader, showTeacherFooter: e.target.checked }).then(() => setSavedPrint(true)); }} />
            </label>
            <label className="flex min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-2 font-bold">
              سطر اسم الطالبة والتاريخ
              <input type="checkbox" className="h-6 w-6 accent-[#176B61]" checked={printDefaults.showStudentLine}
                onChange={(e) => { setSavedPrint(false); void setPrintDefaults({ ...printDefaults, schoolHeader: draftHeader, showStudentLine: e.target.checked }).then(() => setSavedPrint(true)); }} />
            </label>
            <Button onClick={() => { void setPrintDefaults({ ...printDefaults, schoolHeader: draftHeader }).then(() => setSavedPrint(true)); }}>
              حفظ ترويسة المدرسة
            </Button>
            {savedPrint && <p className="text-sm font-bold text-[#176B61]" role="status">✓ حُفظت الإعدادات</p>}
          </div>
        </Card>
      </div>
    </Shell>
  );
}
