// طبقة الوصول إلى Supabase — تُستخدم فقط عند توفر المفاتيح وتسجيل الدخول.
// بدون اتصال يعمل التطبيق بالكامل على وضع Demo المحلي (انظر store.tsx).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityItem, ActivityMeta, AttemptRecord, Role } from "./types";
import { isUuidLike, rid } from "./utils";

type SB = SupabaseClient;

// ---------- تحويل النماذج ----------

function toActivityRow(meta: ActivityMeta, ownerId: string) {
  return {
    id: meta.id,
    owner_id: ownerId,
    title: meta.title,
    subject: meta.subject,
    skill: meta.skill,
    objective: meta.objective,
    level: meta.performanceLevel ?? null,
    activity_type: meta.activityType,
    settings_json: {
      support: meta.support,
      color: meta.color,
      imageSize: meta.imageSize,
      reinforcement: meta.reinforcement,
      showNumbers: meta.showNumbers,
      field: meta.field,
      stage: meta.stage,
      grade: meta.grade,
      questionCount: meta.questionCount,
      instructions: meta.instructions,
      teacherName: meta.teacherName,
      activityDate: meta.activityDate
    },
    status: meta.status,
    created_at: meta.createdAt,
    updated_at: meta.updatedAt
  };
}

function fromActivityRow(r: Record<string, unknown>): ActivityMeta {
  const s = (r.settings_json ?? {}) as Record<string, unknown>;
  const support = (s.support ?? {}) as ActivityMeta["support"];
  return {
    id: String(r.id),
    ownerId: String(r.owner_id),
    title: String(r.title ?? ""),
    subject: String(r.subject ?? ""),
    field: String(s.field ?? ""),
    skill: String(r.skill ?? ""),
    objective: String(r.objective ?? ""),
    stage: String(s.stage ?? ""),
    grade: String(s.grade ?? ""),
    performanceLevel: (r.level as string) ?? "",
    questionCount: Number(s.questionCount ?? 2),
    instructions: String(s.instructions ?? ""),
    teacherName: String(s.teacherName ?? ""),
    activityDate: String(s.activityDate ?? ""),
    activityType: r.activity_type as ActivityMeta["activityType"],
    support: {
      level: support.level ?? "intro",
      optionsCount: support.optionsCount ?? 2,
      imageSize: support.imageSize ?? "large",
      shortInstructions: support.shortInstructions ?? true,
      readAloud: support.readAloud ?? true,
      instantReinforcement: support.instantReinforcement ?? true,
      retryAllowed: support.retryAllowed ?? true,
      reduceDistractions: support.reduceDistractions ?? true,
      showHints: support.showHints ?? true,
      hintIntensity: support.hintIntensity ?? "high"
    },
    color: String(s.color ?? "#176B61"),
    imageSize: (s.imageSize as ActivityMeta["imageSize"]) ?? "large",
    reinforcement: (s.reinforcement as ActivityMeta["reinforcement"]) ?? "stars",
    status: (r.status as ActivityMeta["status"]) ?? "draft",
    showNumbers: s.showNumbers !== false,
    createdAt: String(r.created_at ?? new Date().toISOString()),
    updatedAt: String(r.updated_at ?? new Date().toISOString())
  };
}

function toItemRows(items: ActivityItem[], activityId: string) {
  return items.map((it, i) => ({
    id: isUuidLike(it.id) ? it.id : rid(),
    activity_id: activityId,
    position: i,
    question_text: it.questionText,
    content_json: {
      ...it.content,
      _imageSvg: it.imageSvg ?? null,
      _imageUrl: it.imageUrl ?? null,
      _imageAlt: it.imageAlt ?? null
    },
    answer_json: { ...it.answer, _hint: it.hint ?? null }
  }));
}

function fromItemRow(r: Record<string, unknown>): ActivityItem {
  const c = { ...((r.content_json ?? {}) as Record<string, unknown>) };
  const a = { ...((r.answer_json ?? {}) as Record<string, unknown>) };
  const { _imageSvg, _imageUrl, _imageAlt, ...content } = c;
  const { _hint, ...answer } = a;
  return {
    id: String(r.id),
    activityId: String(r.activity_id),
    position: Number(r.position ?? 0),
    questionText: String(r.question_text ?? ""),
    hint: (_hint as string) ?? undefined,
    imageSvg: (_imageSvg as string) ?? undefined,
    imageUrl: (_imageUrl as string) ?? undefined,
    imageAlt: (_imageAlt as string) ?? undefined,
    content,
    answer
  };
}

// ---------- الملف الشخصي ----------

export async function ensureProfile(sb: SB, userId: string, displayName: string): Promise<Role> {
  const { data } = await sb.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (data && typeof (data as { role: string }).role === "string") {
    return (data as { role: Role }).role;
  }
  await sb.from("profiles").upsert(
    { id: userId, display_name: displayName || "معلمة", role: "teacher" },
    { onConflict: "id", ignoreDuplicates: true }
  );
  return "teacher";
}

// ---------- قراءة بيانات المعلمة ----------

export async function fetchTeacherData(sb: SB, userId: string) {
  const { data: acts } = await sb.from("activities").select("*").eq("owner_id", userId).order("updated_at", { ascending: false });
  const activities = ((acts ?? []) as Record<string, unknown>[]).map(fromActivityRow);
  const ids = activities.map((a) => a.id);

  let items: ActivityItem[] = [];
  if (ids.length) {
    const { data: its } = await sb.from("activity_items").select("*").in("activity_id", ids).order("position");
    items = ((its ?? []) as Record<string, unknown>[]).map(fromItemRow);
  }

  let attempts: AttemptRecord[] = [];
  if (ids.length) {
    const { data: atts } = await sb
      .from("attempts")
      .select("*, student_aliases(alias), responses(activity_item_id,is_correct,attempts_count,hints_used)")
      .in("activity_id", ids)
      .order("completed_at", { ascending: false });
    attempts = ((atts ?? []) as Record<string, unknown>[]).map(mapAttemptRow);
  }
  return { activities, items, attempts };
}

function mapAttemptRow(t: Record<string, unknown>): AttemptRecord {
  const alias = ((t.student_aliases ?? {}) as { alias?: string }).alias ?? "طالبة";
  const resps = ((t.responses ?? []) as Record<string, unknown>[]);
  return {
    id: String(t.id),
    activityId: String(t.activity_id),
    studentAlias: alias,
    startedAt: String(t.started_at ?? t.completed_at),
    completedAt: String(t.completed_at ?? t.started_at),
    totalQuestions: Number(t.total_questions ?? resps.length ?? 0),
    correctCount: Number(t.correct_count ?? resps.filter((r) => r.is_correct).length),
    attemptTries: Number(t.tries_total ?? 0),
    hintsUsed: Number(t.hints_used ?? resps.reduce((s, r) => s + Number(r.hints_used ?? 0), 0)),
    durationSec: Number(t.duration_sec ?? 0),
    scorePct: Number(t.score ?? 0),
    supportNote: (t.support_level as AttemptRecord["supportNote"]) ?? "مستقل",
    perItem: resps.map((r) => ({
      itemId: String(r.activity_item_id),
      correct: Boolean(r.is_correct),
      tries: Number(r.attempts_count ?? 1),
      hints: Number(r.hints_used ?? 0)
    })),
    masteryThreshold: Number(t.mastery_threshold ?? 80),
    mastered: Boolean(t.mastered),
    notes: (t.notes as string) ?? undefined
  } as AttemptRecord;
}

// نظرة المديرة: كل الأنشطة والمحاولات (تتطلب سياسات admin في الترحيل 003)
export async function fetchAllActivities(sb: SB) {
  const { data: acts } = await sb.from("activities").select("*").order("updated_at", { ascending: false });
  const activities = ((acts ?? []) as Record<string, unknown>[]).map(fromActivityRow);
  const ids = activities.map((a) => a.id);
  let items: ActivityItem[] = [];
  let attempts: AttemptRecord[] = [];
  if (ids.length) {
    const { data: its } = await sb.from("activity_items").select("*").in("activity_id", ids);
    items = ((its ?? []) as Record<string, unknown>[]).map(fromItemRow);
    const { data: atts } = await sb
      .from("attempts")
      .select("*, student_aliases(alias), responses(activity_item_id,is_correct,attempts_count,hints_used)")
      .in("activity_id", ids)
      .order("completed_at", { ascending: false });
    attempts = ((atts ?? []) as Record<string, unknown>[]).map(mapAttemptRow);
  }
  return { activities, items, attempts };
}

// ---------- كتابة ----------

export async function upsertActivityFull(sb: SB, userId: string, meta: ActivityMeta, items: ActivityItem[]): Promise<void> {
  const { error } = await sb.from("activities").upsert(toActivityRow(meta, userId), { onConflict: "id" });
  if (error) throw new Error(error.message);
  // إعادة كتابة العناصر (أبسط وأمثل لحفظ الترتيب)
  const del = await sb.from("activity_items").delete().eq("activity_id", meta.id);
  if (del.error) throw new Error(del.error.message);
  if (items.length) {
    const ins = await sb.from("activity_items").insert(toItemRows(items, meta.id));
    if (ins.error) throw new Error(ins.error.message);
  }
}

export async function deleteActivityRemote(sb: SB, activityId: string): Promise<void> {
  const { error } = await sb.from("activities").delete().eq("id", activityId);
  if (error) throw new Error(error.message);
}

export async function fetchAliases(sb: SB, teacherId: string): Promise<string[]> {
  const { data } = await sb.from("student_aliases").select("alias").eq("teacher_id", teacherId).order("alias");
  return ((data ?? []) as { alias: string }[]).map((r) => r.alias);
}

export async function updateAttemptNotesRemote(sb: SB, attemptId: string, notes: string): Promise<void> {
  const { error } = await sb.from("attempts").update({ notes }).eq("id", attemptId);
  if (error) throw new Error(error.message);
}

export interface PrintDefaults {
  schoolHeader: string;
  showTeacherFooter: boolean;
  showStudentLine: boolean;
}

export async function getTeacherSettings(sb: SB, teacherId: string): Promise<PrintDefaults | null> {
  const { data } = await sb.from("teacher_settings").select("header_json,print_preferences_json").eq("teacher_id", teacherId).maybeSingle();
  if (!data) return null;
  const h = ((data as { header_json: unknown }).header_json ?? {}) as Record<string, unknown>;
  const p = ((data as { print_preferences_json: unknown }).print_preferences_json ?? {}) as Record<string, unknown>;
  return {
    schoolHeader: String(h.schoolHeader ?? ""),
    showTeacherFooter: p.showTeacherFooter !== false,
    showStudentLine: p.showStudentLine !== false
  };
}

export async function saveTeacherSettings(sb: SB, teacherId: string, d: PrintDefaults): Promise<void> {
  const { error } = await sb.from("teacher_settings").upsert(
    {
      teacher_id: teacherId,
      header_json: { schoolHeader: d.schoolHeader },
      print_preferences_json: { showTeacherFooter: d.showTeacherFooter, showStudentLine: d.showStudentLine }
    },
    { onConflict: "teacher_id" }
  );
  if (error) throw new Error(error.message);
}

async function ensureAlias(sb: SB, teacherId: string, alias: string): Promise<string | null> {
  const { data } = await sb.from("student_aliases").select("id").eq("teacher_id", teacherId).eq("alias", alias).maybeSingle();
  if (data) return (data as { id: string }).id;
  const { data: ins, error } = await sb
    .from("student_aliases")
    .insert({ teacher_id: teacherId, alias })
    .select("id")
    .maybeSingle();
  if (error) return null;
  return (ins as { id: string } | null)?.id ?? null;
}

export async function saveAttemptRemote(
  sb: SB,
  userId: string,
  a: AttemptRecord,
  responses: Record<string, Record<string, unknown>>
): Promise<void> {
  const aliasId = await ensureAlias(sb, userId, a.studentAlias);
  const { data: att, error } = await sb
    .from("attempts")
    .insert({
      activity_id: a.activityId,
      student_alias_id: aliasId,
      started_at: a.startedAt,
      completed_at: a.completedAt,
      score: a.scorePct,
      status: "completed",
      support_level: a.supportNote,
      total_questions: a.totalQuestions,
      correct_count: a.correctCount,
      hints_used: a.hintsUsed,
      tries_total: a.attemptTries,
      duration_sec: a.durationSec,
      mastery_threshold: a.masteryThreshold,
      mastered: a.mastered
    })
    .select("id")
    .maybeSingle();
  if (error || !att) throw new Error(error?.message ?? "تعذر حفظ المحاولة");
  const attemptId = (att as { id: string }).id;
  const rows = a.perItem.map((p) => ({
    attempt_id: attemptId,
    activity_item_id: p.itemId,
    response_json: responses[p.itemId] ?? {},
    is_correct: p.correct,
    attempts_count: Math.max(p.tries, 1),
    hints_used: p.hints
  }));
  if (rows.length) {
    const ins = await sb.from("responses").insert(rows);
    if (ins.error) throw new Error(ins.error.message);
  }
}

// ---------- التخزين (صور المعلمة) ----------

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export async function uploadImage(sb: SB, userId: string, file: File): Promise<string> {
  if (!ALLOWED_MIME.includes(file.type)) throw new Error("نوع الملف غير مسموح");
  if (file.size > 2 * 1024 * 1024) throw new Error("الحد الأقصى ٢ م.ب");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `${userId}/${rid()}.${ext}`;
  const { error } = await sb.storage.from("teacher-uploads").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return `storage:${path}`;
}

export async function getSignedUrl(sb: SB, storageRef: string): Promise<string | null> {
  const path = storageRef.startsWith("storage:") ? storageRef.slice(8) : storageRef;
  const { data, error } = await sb.storage.from("teacher-uploads").createSignedUrl(path, 7 * 24 * 3600);
  if (error) return null;
  return data.signedUrl;
}
