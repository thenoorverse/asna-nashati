"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ActivityItem, ActivityMeta, AttemptRecord, Role } from "@/lib/types";
import { TEMPLATE_SEEDS } from "@/lib/templates-seed";
import { DEFAULT_SUPPORT } from "@/lib/types";
import { uid, rid, isUuidLike, nowIso } from "@/lib/utils";
import { getSupabase } from "@/lib/supabase";
import { ensureProfile, fetchTeacherData, fetchAliases, fetchAllActivities, upsertActivityFull, deleteActivityRemote, saveAttemptRemote, updateAttemptNotesRemote, getTeacherSettings, saveTeacherSettings, type PrintDefaults } from "@/lib/repo";

export interface TeacherProfile {
  id: string;
  displayName: string;
  role: Role;
  schoolName?: string;
}

interface DemoDB {
  activities: ActivityMeta[];
  items: ActivityItem[];
  attempts: AttemptRecord[];
}

const LS_KEY = "asna_demo_db_v1";
const PROFILE_KEY = "asna_demo_profile_v1";
const USAGE_KEY = "asna_tpl_usage_v1";
const ALIASES_KEY = "asna_aliases_v1";
const PRINT_KEY = "asna_print_defaults_v1";

const DEFAULT_PRINT: PrintDefaults = { schoolHeader: "", showTeacherFooter: true, showStudentLine: true };

// قراءة متزامنة لإعدادات الطباعة (تُستخدم كقيم أولية قبل تحميل المزود)
export function getPrintDefaultsLocal(): PrintDefaults {
  try {
    const raw = localStorage.getItem(PRINT_KEY);
    if (raw) return { ...DEFAULT_PRINT, ...(JSON.parse(raw) as Partial<PrintDefaults>) };
  } catch { /* ignore */ }
  return { ...DEFAULT_PRINT };
}

function seedFromTemplates(): DemoDB {
  const activities: ActivityMeta[] = [];
  const items: ActivityItem[] = [];
  for (const t of TEMPLATE_SEEDS.slice(0, 2)) {
    const aid = uid("act");
    activities.push({
      id: aid,
      ownerId: "demo-teacher",
      title: t.title,
      subject: t.subject,
      field: "",
      skill: t.skill,
      objective: t.objective,
      stage: "المرحلة الابتدائية",
      grade: "الصف الأول",
      performanceLevel: "المستوى التمهيدي",
      questionCount: t.items.length,
      instructions: t.instructions,
      teacherName: "أ. عائشة البحيري",
      activityDate: "",
      activityType: t.activityType,
      support: { ...DEFAULT_SUPPORT[t.supportLevel] },
      color: "#176B61",
      imageSize: "large",
      reinforcement: "stars",
      status: "published",
      showNumbers: true,
      createdAt: nowIso(),
      updatedAt: nowIso()
    });
    t.items.forEach((it, i) => {
      items.push({ ...it, id: uid("item"), activityId: aid, position: i } as ActivityItem);
    });
  }
  return { activities, items, attempts: [] };
}

function loadDB(): DemoDB {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as DemoDB;
  } catch { /* ignore */ }
  const seeded = seedFromTemplates();
  try { localStorage.setItem(LS_KEY, JSON.stringify(seeded)); } catch { /* ignore */ }
  return seeded;
}

function loadUsage(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(USAGE_KEY) ?? "{}") as Record<string, number>;
  } catch { return {}; }
}

interface StoreCtx {
  profile: TeacherProfile;
  setProfile: (p: TeacherProfile) => void;
  db: DemoDB;
  saveActivity: (meta: ActivityMeta, items: Omit<ActivityItem, "id" | "activityId">[] & unknown) => Promise<string>;
  updateActivity: (meta: ActivityMeta, items: ActivityItem[]) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  duplicateActivity: (id: string) => Promise<string | null>;
  saveAttempt: (a: AttemptRecord, responses?: Record<string, Record<string, unknown>>, opts?: { localOnly?: boolean }) => Promise<void>;
  updateAttemptNotes: (id: string, notes: string) => Promise<void>;
  aliases: string[];
  addAlias: (alias: string) => void;
  removeAlias: (alias: string) => void;
  refresh: () => void;
  isSupabase: boolean;
  remote: boolean;
  syncError: string | null;
  usage: Record<string, number>;
  useTemplate: (tplId: string) => void;
  signOut: () => Promise<void>;
  printDefaults: PrintDefaults;
  setPrintDefaults: (d: PrintDefaults) => Promise<void>;
  adminOverview: { activities: ActivityMeta[]; itemsCount: number; attemptsCount: number; owners: number } | null;
  loadAdminOverview: () => Promise<void>;
  adminDeleteActivity: (id: string) => Promise<void>;
}

const Ctx = createContext<StoreCtx | null>(null);

// في الوضع السحابي يجب أن تكون المفاتيح UUID حقيقية (أعمدة uuid في Supabase)
function ensureRemoteIds(meta: ActivityMeta, items: ActivityItem[]): { meta: ActivityMeta; items: ActivityItem[] } {
  if (isUuidLike(meta.id)) return { meta, items };
  const nid = rid();
  return {
    meta: { ...meta, id: nid },
    items: items.map((it) => ({ ...it, id: rid(), activityId: nid }))
  };
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<TeacherProfile>({
    id: "demo-teacher",
    displayName: "معلمة التجربة",
    role: "teacher",
    schoolName: "مدرسة النور"
  });
  const [db, setDb] = useState<DemoDB>({ activities: [], items: [], attempts: [] });
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [aliases, setAliases] = useState<string[]>([]);
  const [printDefaults, setPrintDefaultsState] = useState<PrintDefaults>(DEFAULT_PRINT);
  const [adminOverview, setAdminOverview] = useState<StoreCtx["adminOverview"]>(null);
  const [ready, setReady] = useState(false);
  const sb = getSupabase();
  const remote = Boolean(sb && userId);

  // إعداد جلسة Supabase: الدور من جدول profiles + تحميل بيانات المعلمة السحابية
  useEffect(() => {
    if (!sb) return;
    let alive = true;
    const setup = async (uid_: string, fallbackName: string) => {
      try {
        const role = await ensureProfile(sb, uid_, fallbackName);
        if (!alive) return;
        setUserId(uid_);
        setProfileState((p) => ({ ...p, id: uid_, role, displayName: p.id === "demo-teacher" ? fallbackName : p.displayName }));
        const data = await fetchTeacherData(sb, uid_);
        if (!alive) return;
        setDb({ activities: data.activities, items: data.items, attempts: data.attempts });
        try {
          const [remoteAliases, remotePrint] = await Promise.all([
            fetchAliases(sb, uid_),
            getTeacherSettings(sb, uid_)
          ]);
          if (!alive) return;
          if (remoteAliases.length) setAliases(remoteAliases);
          if (remotePrint) {
            setPrintDefaultsState(remotePrint);
            try { localStorage.setItem(PRINT_KEY, JSON.stringify(remotePrint)); } catch { /* ignore */ }
          }
        } catch { /* الرموز والإعدادات اختيارية */ }
        setSyncError(null);
      } catch (e) {
        if (alive) setSyncError(e instanceof Error ? e.message : "تعذر المزامنة السحابية — العمل محليًا");
      }
    };
    sb.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u && alive) void setup(u.id, String(u.user_metadata?.display_name ?? u.email ?? "معلمة"));
    });
    const { data: sub } = sb.auth.onAuthStateChange((_ev, session) => {
      const u = session?.user;
      if (u) void setup(u.id, String(u.user_metadata?.display_name ?? u.email ?? "معلمة"));
      else if (alive) {
        setUserId(null);
        setProfileState((p) => ({ ...p, id: "demo-teacher", role: "teacher" }));
        setDb(loadDB());
      }
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const p = localStorage.getItem(PROFILE_KEY);
      if (p && !sb) setProfileState(JSON.parse(p));
    } catch { /* ignore */ }
    setDb(loadDB());
    setUsage(loadUsage());
    try {
      const al = localStorage.getItem(ALIASES_KEY);
      if (al) setAliases(JSON.parse(al) as string[]);
    } catch { /* ignore */ }
    setPrintDefaultsState(getPrintDefaultsLocal());
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || remote) return; // السحابة مصدر الحقيقة عند تسجيل الدخول
    try { localStorage.setItem(LS_KEY, JSON.stringify(db)); } catch { /* ignore */ }
  }, [db, ready, remote]);

  const setProfile = (p: TeacherProfile) => {
    setProfileState(p);
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
  };

  const remoteOp = async (fn: () => Promise<void>) => {
    if (!sb || !userId) return;
    try {
      await fn();
      setSyncError(null);
    } catch (e) {
      setSyncError(e instanceof Error ? `تعذر الحفظ السحابي: ${e.message} — البيانات محفوظة محليًا` : "تعذر الحفظ السحابي");
    }
  };

  const saveActivity = async (meta: ActivityMeta, rawItems: unknown): Promise<string> => {
    const useRemote = remote && sb && userId;
    const baseId = meta.id || (useRemote ? rid() : uid("act"));
    const full: ActivityMeta = { ...meta, id: baseId, ownerId: useRemote && userId ? userId : profile.id, createdAt: meta.createdAt || nowIso(), updatedAt: nowIso() };
    const arr = (rawItems ?? []) as Omit<ActivityItem, "id" | "activityId">[];
    let newItems: ActivityItem[] = arr.map((it, i) => ({
      ...(it as object),
      id: useRemote ? rid() : uid("item"),
      activityId: baseId,
      position: i
    }) as ActivityItem);
    let finalMeta = full;
    if (useRemote) {
      const fixed = ensureRemoteIds(full, newItems);
      finalMeta = fixed.meta; newItems = fixed.items;
    }
    setDb((d) => ({ ...d, activities: [finalMeta, ...d.activities.filter((a) => a.id !== finalMeta.id)], items: [...d.items.filter((x) => x.activityId !== finalMeta.id), ...newItems] }));
    if (useRemote && sb && userId) await remoteOp(() => upsertActivityFull(sb, userId, finalMeta, newItems));
    return finalMeta.id;
  };

  const updateActivity = async (meta: ActivityMeta, items: ActivityItem[]) => {
    let m = meta;
    let its = items;
    if (remote) {
      const fixed = ensureRemoteIds(meta, items);
      m = fixed.meta; its = fixed.items;
    }
    const norm = its.map((it, i) => ({ ...it, activityId: m.id, position: i }));
    setDb((d) => ({
      ...d,
      activities: d.activities.map((a) => (a.id === meta.id || a.id === m.id ? { ...m, updatedAt: nowIso() } : a)),
      items: [...d.items.filter((x) => x.activityId !== meta.id && x.activityId !== m.id), ...norm]
    }));
    if (remote && sb && userId) {
      const mm = m; const nn = norm;
      await remoteOp(() => upsertActivityFull(sb, userId, mm, nn));
    }
  };

  const deleteActivity = async (id: string) => {
    setDb((d) => ({
      ...d,
      activities: d.activities.filter((a) => a.id !== id),
      items: d.items.filter((x) => x.activityId !== id)
    }));
    if (remote && sb) await remoteOp(() => deleteActivityRemote(sb, id));
  };

  const duplicateActivity = async (id: string): Promise<string | null> => {
    const src = db.activities.find((a) => a.id === id);
    if (!src) return null;
    const useRemote = remote;
    const nid = useRemote ? rid() : uid("act");
    const copy: ActivityMeta = { ...src, id: nid, title: `${src.title} (نسخة)`, status: "draft", createdAt: nowIso(), updatedAt: nowIso() };
    const srcItems = db.items.filter((x) => x.activityId === id).map((it) => ({ ...it, id: useRemote ? rid() : uid("item"), activityId: nid }));
    setDb((d) => ({ ...d, activities: [copy, ...d.activities], items: [...d.items, ...srcItems] }));
    if (useRemote && sb && userId) {
      const cc = copy; const si = srcItems;
      await remoteOp(() => upsertActivityFull(sb, userId, cc, si));
    }
    return nid;
  };

  const saveAttempt = async (a: AttemptRecord, responses: Record<string, Record<string, unknown>> = {}, opts?: { localOnly?: boolean }) => {
    setDb((d) => ({ ...d, attempts: [a, ...d.attempts] }));
    if (remote && sb && userId && !opts?.localOnly) {
      const aa = { ...a, id: isUuidLike(a.id) ? a.id : rid() };
      await remoteOp(() => saveAttemptRemote(sb, userId, aa, responses));
    }
  };

  const updateAttemptNotes = async (id: string, notes: string) => {
    setDb((d) => ({ ...d, attempts: d.attempts.map((a) => (a.id === id ? { ...a, notes } : a)) }));
    if (remote && sb) await remoteOp(() => updateAttemptNotesRemote(sb, id, notes));
  };

  const persistAliases = (next: string[]) => {
    setAliases(next);
    try { localStorage.setItem(ALIASES_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const addAlias = (alias: string) => {
    const v = alias.trim().slice(0, 30);
    if (!v || aliases.includes(v)) return;
    persistAliases([...aliases, v]);
  };
  const removeAlias = (alias: string) => persistAliases(aliases.filter((a) => a !== alias));

  const useTemplate = (tplId: string) => {
    setUsage((u) => {
      const next = { ...u, [tplId]: (u[tplId] ?? 0) + 1 };
      try { localStorage.setItem(USAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const signOut = async () => {
    if (sb) await sb.auth.signOut();
    setUserId(null);
    setProfileState({ id: "demo-teacher", displayName: "معلمة التجربة", role: "teacher", schoolName: "مدرسة النور" });
    setDb(loadDB());
  };

  const setPrintDefaults = async (d: PrintDefaults) => {
    setPrintDefaultsState(d);
    try { localStorage.setItem(PRINT_KEY, JSON.stringify(d)); } catch { /* ignore */ }
    if (remote && sb && userId) await remoteOp(() => saveTeacherSettings(sb, userId, d));
  };

  const refresh = () => { if (!remote) setDb(loadDB()); };

  // نظرة المديرة عن بُعد (قراءة فقط — لا تمس مساحة المعلمة المحلية)
  const loadAdminOverview = async () => {
    if (!sb || !userId) return;
    try {
      const all = await fetchAllActivities(sb);
      setAdminOverview({
        activities: all.activities,
        itemsCount: all.items.length,
        attemptsCount: all.attempts.length,
        owners: new Set(all.activities.map((a) => a.ownerId)).size
      });
      setSyncError(null);
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "تعذر تحميل نظرة المديرة");
    }
  };

  const adminDeleteActivity = async (id: string) => {
    setDb((d) => ({
      ...d,
      activities: d.activities.filter((a) => a.id !== id),
      items: d.items.filter((x) => x.activityId !== id)
    }));
    setAdminOverview((o) => (o ? { ...o, activities: o.activities.filter((a) => a.id !== id) } : o));
    if (sb) await remoteOp(() => deleteActivityRemote(sb, id));
  };

  const isSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return (
    <Ctx.Provider value={{ profile, setProfile, db, saveActivity, updateActivity, deleteActivity, duplicateActivity, saveAttempt, updateAttemptNotes, aliases, addAlias, removeAlias, refresh, isSupabase, remote, syncError, usage, useTemplate, signOut, printDefaults, setPrintDefaults, adminOverview, loadAdminOverview, adminDeleteActivity }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDemo(): StoreCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDemo خارج المزود");
  return v;
}
