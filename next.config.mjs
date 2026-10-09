/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // تصدير ثابت لـ GitHub Pages. يُضبط NEXT_BASE_PATH=/asna-nashati في workflow النشر فقط،
  // ليبقى التطوير والاختبار محليًا على الجذر بدون مسار إضافي.
  output: "export",
  basePath: process.env.NEXT_BASE_PATH || "",
  images: { unoptimized: true }
};
export default nextConfig;
