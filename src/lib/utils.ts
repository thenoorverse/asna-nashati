export function uid(prefix = "id"): string {
  try {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  } catch {
    return `${prefix}_${Math.random().toString(36).slice(2, 12)}`;
  }
}

// معرّف UUID حقيقي — يُستخدم عند المزامنة مع Supabase (أعمدة uuid)
export function rid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

export function isUuidLike(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function formatDateAr(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function speakArabic(text: string): void {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-SA";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch {
    /* تجاهل — الميزة اختيارية */
  }
}

export const cn = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(" ");
