"use client";
import Link from "next/link";
import { Shell } from "@/components/layout";
import { Button, Card, Badge } from "@/components/ui";
import { Sparkles } from "lucide-react";

export default function SuggestPage() {
  return (
    <Shell>
      <h1 className="flex items-center gap-2 text-2xl font-extrabold text-[#0F4A44]">
        <Sparkles aria-hidden="true" /> اقترحي لي نشاطًا
      </h1>
      <p className="text-gray-600">ميزة مستقبلية — التوليد الذكي المساعد.</p>
      <Card className="mt-4">
        <div className="text-center">
          <Badge tone="gold">الميزة غير مفعّلة حاليًا</Badge>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-gray-600">
            لم يُضبط مزود الذكاء الاصطناعي بعد — لذلك لا ندّعي أي توليد.
            جميع وظائف المنصة الرئيسية (الاستوديو، المحركات الثمانية، الطباعة، التقارير) تعمل كاملة بدونه.
          </p>
          <div className="mt-4 rounded-2xl bg-[#F7F5EF] p-4 text-right text-sm leading-relaxed">
            <p className="font-extrabold">للتفعيل مستقبلًا (للمديرة):</p>
            <ol className="mt-1 list-decimal pr-5 text-gray-600">
              <li>أضيفي <code>AI_PROVIDER</code> و <code>AI_API_KEY</code> في ملف البيئة على الخادم فقط.</li>
              <li>لن تُرسل بيانات الطالبات الشخصية إلى المزود افتراضيًا — فقط المهارة والهدف والمستوى.</li>
              <li>كل اقتراح سيظهر كمسودة قابلة للتحرير والمراجعة قبل النشر.</li>
            </ol>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/templates"><Button>استخدمي القوالب الجاهزة بدلًا من ذلك</Button></Link>
            <Link href="/studio"><Button variant="ghost">ابدئي تصميمًا يدويًا</Button></Link>
          </div>
        </div>
      </Card>
    </Shell>
  );
}
