import Link from "next/link";
import { Shell } from "@/components/layout";
import { Button, Card, Badge } from "@/components/ui";
import { Palette, Users, MousePointerClick, Printer, FolderHeart, Gauge, ArrowLeft, CheckCircle2 } from "lucide-react";

const BENEFITS = [
  { icon: Palette, title: "سهولة التصميم", desc: "خطوات واضحة وقوالب جاهزة — صممي نشاطًا كاملًا في دقائق دون خبرة تقنية." },
  { icon: Users, title: "مراعاة الفروق الفردية", desc: "ثلاثة مستويات دعم قابلة للتخصيص حسب أداء كل طالبة." },
  { icon: MousePointerClick, title: "أنشطة تفاعلية", desc: "٨ محركات: اختيار الصورة، المطابقة، التصنيف، الترتيب، وغيرها — تعمل باللمس ولوحة المفاتيح." },
  { icon: Printer, title: "طباعة A4 حقيقية", desc: "أوراق عمل عربية RTL بملف PDF نظيف، مع نسخة ملونة واقتصادية ومفتاح إجابة." },
  { icon: FolderHeart, title: "حفظ الأعمال", desc: "مسودات تُحفظ تلقائيًا، ونسخ وتعديل دون المساس بالقالب الأصلي." },
  { icon: Gauge, title: "قياس الأداء", desc: "تقارير مبسطة: المحاولات، التلميحات، مستوى المساعدة، ومعيار إتقان مخصص." }
];

const STEPS = [
  "اختاري قالبًا من المكتبة أو ابدئي من الصفر",
  "أدخلي بيانات النشاط والهدف القابل للقياس",
  "حددي مستوى الدعم المناسب للطالبة",
  "حرّري الأسئلة والصور وحددي الإجابة الصحيحة",
  "عايني ثم انشري: تفاعلي أو ورقة عمل للطباعة"
];

export default function HomePage() {
  return (
    <Shell>
      {/* البطل */}
      <section className="grid items-center gap-8 lg:grid-cols-2" aria-labelledby="hero-title">
        <div>
          <Badge>منصة المعلمات — التربية الخاصة</Badge>
          <h1 id="hero-title" className="mt-4 text-4xl font-extrabold leading-[1.3] text-[#0F4A44] sm:text-5xl">
            أنشطتك التعليمية...
            <br />
            من الفكرة إلى التفاعل
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            «أصنع نشاطي» استوديو عربي يساعد معلمات الإعاقة العقلية على إنتاج أنشطة مصورة وتفاعلية
            وأوراق عمل قابلة للطباعة — وفق قدرات الطالبات ومستويات أدائهن الفردية.
          </p>
          <p className="mt-2 font-bold text-[#8a6d2b]">كل مهارة تستحق نشاطًا يناسبها</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/studio"><Button size="lg">ابدئي التصميم <ArrowLeft aria-hidden="true" /></Button></Link>
            <Link href="/templates"><Button size="lg" variant="ghost">استكشفي القوالب</Button></Link>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle2 size={18} className="text-[#176B61]" aria-hidden="true" />
            يعمل فورًا في وضع التجربة — بدون حساب أو مفاتيح
          </div>
        </div>

        {/* عرض مصغر لاستوديو التصميم — SVG أصلي */}
        <div className="rounded-3xl bg-white p-5 shadow-pop" role="img" aria-label="معاينة مصغرة لاستوديو التصميم">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#F2789F]" /><span className="h-3 w-3 rounded-full bg-[#E8C58D]" /><span className="h-3 w-3 rounded-full bg-[#176B61]" />
            <span className="mr-2 text-sm font-bold text-gray-500">استوديو التصميم — معاينة</span>
          </div>
          <svg viewBox="0 0 400 260" className="w-full rounded-2xl bg-[#F7F5EF]">
            <rect x="16" y="16" width="368" height="34" rx="10" fill="#176B61" />
            <rect x="30" y="25" width="120" height="12" rx="6" fill="#fff" opacity=".85" />
            <rect x="300" y="25" width="60" height="14" rx="7" fill="#E8C58D" />
            <rect x="16" y="60" width="120" height="184" rx="12" fill="#fff" stroke="#176B61" strokeOpacity=".15" />
            <rect x="28" y="72" width="96" height="14" rx="7" fill="#E6F1EC" />
            <rect x="28" y="94" width="96" height="14" rx="7" fill="#E6F1EC" />
            <rect x="28" y="116" width="70" height="14" rx="7" fill="#F5DCE2" />
            <rect x="28" y="150" width="96" height="80" rx="10" fill="#F6E8CF" />
            <rect x="146" y="60" width="238" height="184" rx="12" fill="#fff" stroke="#176B61" strokeOpacity=".15" />
            <rect x="160" y="74" width="180" height="16" rx="8" fill="#0F4A44" opacity=".85" />
            <rect x="160" y="100" width="100" height="80" rx="12" fill="#F5DCE2" />
            <circle cx="210" cy="140" r="22" fill="#D64570" opacity=".8" />
            <rect x="270" y="100" width="100" height="80" rx="12" fill="#E6F1EC" />
            <circle cx="320" cy="140" r="22" fill="#176B61" opacity=".8" />
            <rect x="160" y="192" width="210" height="18" rx="9" fill="#176B61" />
          </svg>
          <div className="mt-3 flex gap-2">
            <span className="rounded-full bg-[#E6F1EC] px-3 py-1 text-xs font-bold text-[#176B61]">الخطوة ٣ من ٤</span>
            <span className="rounded-full bg-[#F6E8CF] px-3 py-1 text-xs font-bold text-[#6b4d14]">حفظ تلقائي ✓</span>
          </div>
        </div>
      </section>

      {/* الفوائد */}
      <section className="mt-12" aria-labelledby="benefits">
        <h2 id="benefits" className="text-2xl font-extrabold text-[#0F4A44]">لماذا «أصنع نشاطي»؟</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <Card key={b.title}>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#E6F1EC] text-[#176B61]">
                  <Icon aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-lg font-extrabold">{b.title}</h3>
                <p className="mt-1 leading-relaxed text-gray-600">{b.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* الخطوات */}
      <section className="mt-12 grid gap-6 lg:grid-cols-2" aria-labelledby="how">
        <Card className="bg-[#176B61] text-white border-0">
          <h2 id="how" className="text-2xl font-extrabold">من الفكرة إلى الفصل في ٥ خطوات</h2>
          <ol className="mt-4 space-y-3">
            {STEPS.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#E8C58D] font-extrabold text-[#4a3410]">{i + 1}</span>
                <span className="pt-1.5 font-bold leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
          <Link href="/studio" className="mt-6 inline-flex"><span className="rounded-2xl bg-white px-6 py-3 font-extrabold text-[#176B61]">جرّبي الآن — وضع Demo</span></Link>
        </Card>
        <Card>
          <h2 className="text-2xl font-extrabold text-[#0F4A44]">مصمم للتربية الخاصة</h2>
          <ul className="mt-4 space-y-2.5 leading-relaxed text-gray-700">
            <li>✓ سؤال واحد في كل خطوة، وتعليمات عربية قصيرة ومباشرة.</li>
            <li>✓ قراءة صوتية للسؤال، وتعزيز هادئ دون أصوات مزعجة.</li>
            <li>✓ بدائل للنقر بدل السحب والإفلات، ودعم كامل للمس ولوحة المفاتيح.</li>
            <li>✓ رموز مستعارة للطالبات — لا أسماء كاملة ولا نشر للنتائج.</li>
            <li>✓ تباين AA وتركيز واضح وتنقل بلوحة المفاتيح.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>WCAG 2.2 AA</Badge><Badge tone="gold">RTL كامل</Badge><Badge tone="blush">بدون حد زمني</Badge>
          </div>
        </Card>
      </section>
    </Shell>
  );
}
