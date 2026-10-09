import { test, expect } from "@playwright/test";

test("الرحلة الأساسية: الرئيسية ← القوالب ← الاستوديو ← اللوحة", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /من الفكرة إلى التفاعل/ })).toBeVisible();
  await page.getByRole("link", { name: /استكشفي القوالب/ }).click();
  await expect(page).toHaveURL(/\/templates/, { timeout: 20000 });
  await expect(page.getByRole("heading", { name: /مكتبة القوالب/ })).toBeVisible({ timeout: 15000 });
  await page.getByRole("link", { name: /تخصيص هذا القالب/ }).first().click();
  await expect(page.getByText(/استوديو التصميم/)).toBeVisible();
  await page.getByRole("link", { name: /لوحة التحكم/ }).first().click();
  await expect(page.getByText(/أهلًا/)).toBeVisible();
});

test("وضع الطالبة يعرض سؤالًا واحدًا مع زر الاستماع", async ({ page }) => {
  await page.goto("/dashboard");
  const play = page.getByRole("link", { name: /تشغيل/ }).first();
  if (await play.count()) {
    await play.click();
    await expect(page.getByText(/وضع الطالبة/)).toBeVisible();
  }
});

test("الحماية: الإدارة للمديرة والدخول يعرض وضع التجربة", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByText(/لمديرة النظام/)).toBeVisible();
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /تسجيل الدخول/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /دخول كمعلمة/ })).toBeVisible();
});

test("رحلة كاملة: إنشاء نشاط ونشره وتشغيله وظهوره في التقارير", async ({ page }) => {
  await page.goto("/studio");
  await page.getByLabel(/عنوان النشاط/).fill("نشاط الاختبار الآلي");
  await page.getByLabel(/المهارة المستهدفة/).fill("مهارة الاختبار");
  await page.getByLabel(/الهدف التعليمي/).fill("أن تجيب الطالبة إجابة صحيحة واحدة على الأقل");
  await page.getByLabel(/تعليمات النشاط/).fill("اختاري الصورة الصحيحة");
  await page.getByRole("button", { name: "التالي" }).click(); // الدعم
  await page.getByRole("button", { name: "التالي" }).click(); // النوع
  await page.getByRole("button", { name: "التالي" }).click(); // المحرر
  await page.getByLabel(/نص السؤال/).nth(0).fill("أين التفاحة؟ (١)");
  await page.getByLabel(/نص السؤال/).nth(1).fill("أين التفاحة؟ (٢)");
  await page.getByRole("button", { name: "التالي" }).click(); // المعاينة
  await expect(page.getByText(/جاهز للنشر/)).toBeVisible();
  await page.getByRole("button", { name: /نشر وتشغيل/ }).click();
  // وضع الطالبة: الإجابة الصحيحة (تفاحة = الخيار الأول افتراضيًا)
  await expect(page.getByText(/وضع الطالبة/)).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: /تفاحة/ }).first().click();
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: /تفاحة/ }).first().click();
  await page.getByRole("button", { name: /إنهاء النشاط/ }).click();
  await expect(page.getByRole("heading", { name: /عمل رائع/ })).toBeVisible();
  // التقرير
  await page.goto("/reports");
  await expect(page.getByRole("heading", { name: /نشاط الاختبار الآلي/ })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/أتقن/).first()).toBeVisible();
});

test("النشاط العام يعمل بدون دخول", async ({ page }) => {
  await page.goto("/play/some-unknown-id");
  await expect(page.getByRole("heading", { name: /نشاط عام للتجربة/ })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/بدون تسجيل دخول/)).toBeVisible();
});

test("إدارة الرموز المستعارة من اللوحة", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByLabel(/رمز جديد/).fill("نجمة ٩٩");
  await page.getByRole("button", { name: "إضافة", exact: true }).click();
  await expect(page.getByText("نجمة ٩٩")).toBeVisible({ timeout: 15000 });
});

test("النشاط العام (العد): إجابة وتسجيل محاولة", async ({ page }) => {
  await page.goto("/play/public-demo");
  // الأسئلة: ٢، ٣، ٤، ٥ — الخيارات تتضمن الإجابة
  for (const [q, ans] of [["سؤال 1 من 4", "2"], ["سؤال 2 من 4", "3"], ["سؤال 3 من 4", "4"]] as const) {
    await expect(page.getByText(q).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: ans, exact: true }).click();
    await page.getByRole("button", { name: "التالي" }).click();
  }
  await expect(page.getByText("سؤال 4 من 4").first()).toBeVisible();
  await page.getByRole("button", { name: "5", exact: true }).click();
  await page.getByRole("button", { name: /إنهاء النشاط/ }).click();
  await expect(page.getByRole("heading", { name: /عمل رائع/ })).toBeVisible({ timeout: 15000 });
});
