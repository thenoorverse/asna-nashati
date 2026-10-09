"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Shell } from "@/components/layout";
import { Button, Card, Badge } from "@/components/ui";
import { TeacherOnly } from "@/components/guards";
import { useDemo } from "@/lib/store";
import { TEMPLATE_SEEDS } from "@/lib/templates-seed";
import { ACTIVITY_TYPE_LABEL } from "@/lib/types";
import { formatDateAr } from "@/lib/utils";

function AdminInner() {
  const { db, deleteActivity, remote, profile, adminOverview, loadAdminOverview, adminDeleteActivity } = useDemo();

  useEffect(() => {
    if (remote && profile.role === "admin") void loadAdminOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote, profile.role]);

  const acts = adminOverview?.activities ?? db.activities;
  const itemsCount = adminOverview ? adminOverview.itemsCount : db.items.length;
  const attemptsCount = adminOverview ? adminOverview.attemptsCount : db.attempts.length;
  const owners = adminOverview ? adminOverview.owners : new Set(db.activities.map((a) => a.ownerId)).size;
  const onDel = (id: string, title: string) => {
    if (!confirm(`حذف «${title}» إداريًا؟`)) return;
    void (remote && profile.role === "admin" ? adminDeleteActivity(id) : deleteActivity(id));
  };
  return (
    <Shell>
      <h1 className="text-2xl font-extrabold text-[#0F4A44]">إدارة النظام</h1>
      <p className="text-gray-600">
        إدارة القوالب العامة والمحتوى والحسابات المصرح بها
        {remote ? " — نظرة سحابية شاملة (قراءة)." : " (وضع Demo: إدارة محلية)."}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["إجمالي الأنشطة", acts.length],
          ["إجمالي الأسئلة", itemsCount],
          ["المحاولات المسجلة", attemptsCount],
          ["المالكون", owners]
        ].map(([t, n]) => (
          <Card key={t as string} className="text-center">
            <p className="text-4xl font-extrabold text-[#176B61]">{n}</p>
            <p className="mt-1 font-bold text-gray-600">{t}</p>
          </Card>
        ))}
      </div>

      <h2 className="mb-2 mt-6 font-extrabold">القوالب العامة ({TEMPLATE_SEEDS.length})</h2>
      <div className="grid gap-2">
        {TEMPLATE_SEEDS.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-3 shadow-card">
            <span className="font-bold">{t.title} <Badge tone="gray">{ACTIVITY_TYPE_LABEL[t.activityType]}</Badge></span>
            <span className="flex gap-2">
              <Badge>منشور</Badge>
              <Link href={`/studio?template=${t.id}`} className="rounded-xl bg-[#E6F1EC] px-3 py-1.5 text-sm font-bold text-[#176B61]">معاينة كنشاط</Link>
            </span>
          </div>
        ))}
      </div>

      <h2 className="mb-2 mt-6 font-extrabold">كل الأنشطة (إشراف)</h2>
      {acts.length === 0 ? (
        <Card><p className="text-gray-600">لا أنشطة بعد.</p></Card>
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white shadow-card">
          <table className="w-full min-w-[560px] text-right">
            <thead><tr className="bg-[#E6F1EC]"><th className="p-3">العنوان</th><th className="p-3">المالك</th><th className="p-3">التحديث</th><th className="p-3">إجراء</th></tr></thead>
            <tbody>
              {acts.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3 font-bold">{a.title || "(بدون عنوان)"}</td>
                  <td className="p-3 font-mono text-xs" dir="ltr">{a.ownerId}</td>
                  <td className="p-3 text-sm text-gray-500">{formatDateAr(a.updatedAt)}</td>
                  <td className="p-3">
                    <button className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600"
                      onClick={() => onDel(a.id, a.title || "(بدون عنوان)")}>
                      حذف إداري
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-sm text-gray-500">في بيئة Supabase تُدار الحسابات والأدوار عبر جدول <code>profiles</code> وسياسات RLS — راجعي <code>supabase/migrations/001_schema.sql</code>.</p>
      <div className="mt-3"><Link href="/dashboard"><Button variant="ghost">عودة للوحة التحكم</Button></Link></div>
    </Shell>
  );
}

export default function AdminPage() {
  return <TeacherOnly admin><AdminInner /></TeacherOnly>;
}
