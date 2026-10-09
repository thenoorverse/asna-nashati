"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/layout";
import { Button, Card, Badge, EmptyState, inputCls } from "@/components/ui";
import { useDemo } from "@/lib/store";
import { TeacherOnly } from "@/components/guards";
import { ACTIVITY_TYPE_LABEL, type ActivityType } from "@/lib/types";
import { formatDateAr } from "@/lib/utils";
import { Plus, Search, Copy, Pencil, Trash2, Play, FileText, Flame, Cloud, HardDrive } from "lucide-react";
import { TEMPLATE_SEEDS } from "@/lib/templates-seed";

export default function DashboardPage() {
  return <TeacherOnly><DashboardInner /></TeacherOnly>;
}

function DashboardInner() {
  const { profile, db, deleteActivity, duplicateActivity, usage, remote, syncError, aliases, addAlias, removeAlias } = useDemo();
  const [newAlias, setNewAlias] = useState("");
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("الكل");
  const [type, setType] = useState<"الكل" | ActivityType>("الكل");
  const [sort, setSort] = useState<"new" | "old" | "az">("new");

  const mine = useMemo(() => {
    let list = db.activities.filter((a) => a.ownerId === profile.id);
    if (q) list = list.filter((a) => (a.title + a.skill + a.subject).includes(q));
    if (subject !== "الكل") list = list.filter((a) => a.subject === subject);
    if (type !== "الكل") list = list.filter((a) => a.activityType === type);
    if (sort === "new") list = [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (sort === "old") list = [...list].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    if (sort === "az") list = [...list].sort((a, b) => a.title.localeCompare(b.title, "ar"));
    return list;
  }, [db, profile, q, subject, type, sort]);

  const interactive = mine.filter((a) => a.activityType !== "worksheet").length;
  const worksheets = mine.filter((a) => a.activityType === "worksheet").length;
  const drafts = mine.filter((a) => a.status === "draft");
  const recent = mine.slice(0, 4);
  const subjects = ["الكل", ...Array.from(new Set(mine.map((a) => a.subject)))];

  const onDelete = (id: string, title: string) => {
    if (confirm(`حذف النشاط «${title}» نهائيًا؟ لا يمكن التراجع.`)) void deleteActivity(id);
  };
  const onDuplicate = (id: string) => { void duplicateActivity(id); };

  const topTemplates = useMemo(() => {
    const used = TEMPLATE_SEEDS.filter((t) => (usage[t.id] ?? 0) > 0).sort((a, b) => (usage[b.id] ?? 0) - (usage[a.id] ?? 0)).slice(0, 3);
    return used.length ? used : TEMPLATE_SEEDS.slice(0, 3);
  }, [usage]);

  return (
    <Shell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F4A44]">أهلًا {profile.displayName} 👋</h1>
          <p className="text-gray-600">هذه أنشطتك الحقيقية المحفوظة في مساحتك — وضع التجربة المحلي.</p>
        </div>
        <Link href="/studio"><Button size="lg"><Plus aria-hidden="true" /> إنشاء نشاط جديد</Button></Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4" role="group" aria-label="إحصاءات">
        {[
          ["الأنشطة المنشأة", mine.length],
          ["الأنشطة التفاعلية", interactive],
          ["أوراق العمل", worksheets],
          ["المسودات", drafts.length]
        ].map(([t, n]) => (
          <Card key={t as string} className="text-center">
            <p className="text-4xl font-extrabold text-[#176B61]">{n}</p>
            <p className="mt-1 font-bold text-gray-600">{t}</p>
          </Card>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm font-bold text-gray-600">
        {remote ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F1EC] px-3 py-1 text-[#176B61]"><Cloud size={16} /> متصل سحابيًا — بياناتك في Supabase</span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1"><HardDrive size={16} /> وضع Demo محلي — البيانات في متصفحك</span>
        )}
      </div>
      {syncError && (
        <p role="alert" className="mt-3 rounded-2xl bg-[#F6E8CF] p-3 text-sm font-bold text-[#6b4d14]">{syncError}</p>
      )}

      <h2 className="mb-2 mt-6 flex items-center gap-1.5 font-extrabold text-[#0F4A44]"><Flame size={18} className="text-[#b97f12]" /> القوالب الأكثر استخدامًا</h2>
      <div className="grid gap-2 sm:grid-cols-3">
        {topTemplates.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-2 rounded-2xl bg-white p-3 shadow-card">
            <span className="font-bold">{t.title}
              {(usage[t.id] ?? 0) > 0 && <span className="mr-1 text-xs text-gray-500">({usage[t.id]}×)</span>}
            </span>
            <Link href={`/studio?template=${t.id}`} className="shrink-0 rounded-xl bg-[#E8C58D] px-3 py-2 text-sm font-bold text-[#4a3410]">استخدام</Link>
          </div>
        ))}
      </div>

      <Card className="mt-4">
        <h2 className="font-extrabold">رموز الطالبات المستعارة ({aliases.length})</h2>
        <p className="text-sm text-gray-500">رموز بدل الأسماء الكاملة — تُقترح تلقائيًا عند بدء النشاط.</p>
        <div className="mt-2 flex gap-2">
          <input className={inputCls} value={newAlias} onChange={(e) => setNewAlias(e.target.value)}
            placeholder="مثال: نجمة ١" maxLength={30} aria-label="رمز جديد"
            onKeyDown={(e) => { if (e.key === "Enter") { addAlias(newAlias); setNewAlias(""); } }} />
          <Button onClick={() => { addAlias(newAlias); setNewAlias(""); }}>إضافة</Button>
        </div>
        {aliases.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {aliases.map((a) => (
              <span key={a} className="inline-flex items-center gap-1 rounded-full bg-[#E6F1EC] px-3 py-1.5 text-sm font-bold text-[#0F4A44]">
                {a}
                <button onClick={() => { if (confirm(`حذف الرمز «${a}»؟`)) removeAlias(a); }} aria-label={`حذف ${a}`} className="font-extrabold text-red-600">×</button>
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <div className="grid gap-2 sm:grid-cols-4">
          <label className="relative sm:col-span-2">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input className={`${inputCls} pr-10`} placeholder="بحث سريع في أنشطتك..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="بحث" />
          </label>
          <select className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="تصفية حسب المادة">
            {subjects.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className={inputCls} value={sort} onChange={(e) => setSort(e.target.value as never)} aria-label="الترتيب">
            <option value="new">الأحدث أولًا</option><option value="old">الأقدم أولًا</option><option value="az">أبجدي</option>
          </select>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="تصفية حسب النوع">
          {(["الكل", "choose-image", "matching", "classification", "ordering", "true-false", "completion", "counting", "worksheet"] as const).map((t) => (
            <button key={t} onClick={() => setType(t as never)} aria-pressed={type === t}
              className={`rounded-full px-3 py-1.5 text-sm font-bold ${type === t ? "bg-[#176B61] text-white" : "bg-gray-100"}`}>
              {t === "الكل" ? "الكل" : ACTIVITY_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </Card>

      {mine.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="لا توجد أنشطة بعد" desc="ابدئي من قالب جاهز أو أنشئي نشاطك الأول في دقائق."
            action={<Link href="/templates"><Button>استكشفي القوالب</Button></Link>} />
        </div>
      ) : (
        <>
          <h2 className="mb-2 mt-6 font-extrabold text-[#0F4A44]">الأنشطة الأخيرة</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {recent.map((a) => (
              <Card key={a.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold">{a.title || "(بدون عنوان)"}</h3>
                    <p className="text-sm text-gray-500">{a.subject} • {formatDateAr(a.updatedAt)}</p>
                  </div>
                  <Badge tone={a.status === "draft" ? "gold" : "mint"}>{a.status === "draft" ? "مسودة" : "منشور"}</Badge>
                </div>
                <div className="mt-2"><Badge tone="gray">{ACTIVITY_TYPE_LABEL[a.activityType]}</Badge></div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Link href={`/play?id=${a.id}`} className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-[#176B61] px-3 font-bold text-white"><Play size={16} /> تشغيل</Link>
                  <Link href={`/studio?id=${a.id}`} className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-gray-100 px-3 font-bold"><Pencil size={16} /> تعديل</Link>
                  <button onClick={() => onDuplicate(a.id)} className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-gray-100 px-3 font-bold"><Copy size={16} /> نسخ</button>
                  <button onClick={() => onDelete(a.id, a.title)} className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-red-50 px-3 font-bold text-red-600"><Trash2 size={16} /> حذف</button>
                </div>
              </Card>
            ))}
          </div>

          <h2 className="mb-2 mt-6 font-extrabold text-[#0F4A44]">كل الأنشطة ({mine.length})</h2>
          <div className="overflow-x-auto rounded-3xl bg-white shadow-card">
            <table className="w-full min-w-[640px] text-right">
              <thead><tr className="bg-[#E6F1EC] text-[#0F4A44]">
                <th className="p-3">العنوان</th><th className="p-3">النوع</th><th className="p-3">الحالة</th><th className="p-3">آخر تحديث</th><th className="p-3">إجراءات</th>
              </tr></thead>
              <tbody>
                {mine.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3 font-bold">{a.title || "(بدون عنوان)"}</td>
                    <td className="p-3 text-sm">{ACTIVITY_TYPE_LABEL[a.activityType]}</td>
                    <td className="p-3"><Badge tone={a.status === "draft" ? "gold" : "mint"}>{a.status === "draft" ? "مسودة" : "منشور"}</Badge></td>
                    <td className="p-3 text-sm text-gray-500">{formatDateAr(a.updatedAt)}</td>
                    <td className="p-3"><span className="flex gap-1">
                      <Link href={`/play?id=${a.id}`} aria-label="تشغيل" className="grid h-10 w-10 place-items-center rounded-xl bg-[#E6F1EC] text-[#176B61]"><Play size={16} /></Link>
                      <Link href={`/studio?id=${a.id}`} aria-label="تعديل" className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100"><Pencil size={16} /></Link>
                      <Link href={`/reports?activity=${a.id}`} aria-label="التقرير" className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100"><FileText size={16} /></Link>
                      <button aria-label="حذف" onClick={() => onDelete(a.id, a.title)} className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600"><Trash2 size={16} /></button>
                    </span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {drafts.length > 0 && (
            <>
              <h2 className="mb-2 mt-6 font-extrabold text-[#0F4A44]">المسودات غير المكتملة ({drafts.length})</h2>
              <div className="grid gap-2">
                {drafts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#FFF9EC] p-3">
                    <span className="font-bold">{a.title || "(بدون عنوان)"} — {ACTIVITY_TYPE_LABEL[a.activityType]}</span>
                    <Link href={`/studio?id=${a.id}`} className="rounded-xl bg-[#E8C58D] px-4 py-2 font-bold text-[#4a3410]">إكمال التحرير</Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Shell>
  );
}
