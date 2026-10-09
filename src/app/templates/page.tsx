"use client";
import { useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/layout";
import { Button, Card, Badge, EmptyState, inputCls } from "@/components/ui";
import { TEMPLATE_SEEDS } from "@/lib/templates-seed";
import { ACTIVITY_TYPE_LABEL, SUBJECTS } from "@/lib/types";
import { PenSquare, Play } from "lucide-react";

export default function TemplatesPage() {
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("الكل");
  const list = TEMPLATE_SEEDS.filter(
    (t) => (!q || (t.title + t.skill).includes(q)) && (subject === "الكل" || t.subject === subject)
  );
  return (
    <Shell>
      <h1 className="text-2xl font-extrabold text-[#0F4A44]">مكتبة القوالب الجاهزة</h1>
      <p className="text-gray-600">٨ قوالب حقيقية بأسئلة وإجابات فعلية — انسخي وعدّلي دون المساس بالأصل.</p>
      <div className="mt-2">
        <Link href="/play?id=public-demo" className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-[#E6F1EC] px-4 font-bold text-[#176B61]">
          <Play size={18} /> جرّبي نشاطًا عامًا الآن — بدون دخول
        </Link>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input className={inputCls} placeholder="ابحثي: عد، غسل اليدين، جرام..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="بحث في القوالب" />
        <select className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="المادة">
          <option>الكل</option>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {list.length === 0 && <div className="mt-4"><EmptyState title="لا نتائج" desc="جرّبي كلمة أخرى أو تصفحي كل المواد." /></div>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <Card key={t.id}>
            <div className="flex flex-wrap gap-1.5">
              <Badge>{t.subject}</Badge><Badge tone="gold">{ACTIVITY_TYPE_LABEL[t.activityType]}</Badge>
            </div>
            <h2 className="mt-2 text-lg font-extrabold">{t.title}</h2>
            <p className="text-sm text-gray-600">المهارة: {t.skill}</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">الهدف: {t.objective}</p>
            <p className="mt-1 text-sm font-bold text-[#176B61]">{t.items.length} أسئلة جاهزة</p>
            <div className="mt-3 flex gap-2">
              <Link href={`/studio?template=${t.id}`} className="flex-1"><Button className="w-full" size="sm"><PenSquare size={16} /> تخصيص هذا القالب</Button></Link>
            </div>
            <p className="mt-2 flex items-center gap-1 text-xs text-gray-500"><Play size={12} /> النسخ يحفظ نشاطًا جديدًا مستقلًا في مساحتك</p>
          </Card>
        ))}
      </div>
    </Shell>
  );
}
