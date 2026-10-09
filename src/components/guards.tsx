"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Shell } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { useDemo } from "@/lib/store";
import { ShieldAlert } from "lucide-react";

// حارس صلاحيات على مستوى الواجهة (مع RLS على مستوى قاعدة البيانات في Supabase)
export function TeacherOnly({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { profile, setProfile } = useDemo();
  const allowed = admin ? profile.role === "admin" : profile.role === "teacher" || profile.role === "admin";
  if (allowed) return <>{children}</>;
  return (
    <Shell>
      <Card className="mx-auto max-w-xl text-center">
        <ShieldAlert size={40} className="mx-auto text-[#8a2b4a]" aria-hidden="true" />
        <h1 className="mt-2 text-2xl font-extrabold">
          {admin ? "هذه الصفحة لمديرة النظام" : "هذه الصفحة للمعلمات"}
        </h1>
        <p className="mt-2 text-gray-600">
          أنتِ تتصفحين الآن كـ«زائر» — يمكنك استعراض القوالب العامة وتجربة نشاط عام،
          لكن إنشاء الأنشطة وحفظها يتطلب دخول المعلمة.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button onClick={() => setProfile({ ...profile, role: admin ? "admin" : "teacher", displayName: profile.displayName === "زائرة" ? "معلمة التجربة" : profile.displayName })}>
            دخول تجريبي {admin ? "كمديرة" : "كمعلمة"}
          </Button>
          <Link href="/templates"><Button variant="ghost">استعراض القوالب العامة</Button></Link>
        </div>
      </Card>
    </Shell>
  );
}
