import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Timer, Calculator, CheckSquare, Play, Pause, RotateCcw, Plus, Trash2, Loader2, BookOpenCheck, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Course = Tables<"student_courses">;
type Attendance = Tables<"attendance_records">;

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Study Tools — Acadex" },
      { name: "description", content: "Track your own courses, grades, CGPA and daily class attendance." },
      { property: "og:title", content: "Study Tools — Acadex" },
      { property: "og:description", content: "Track your own courses, grades, CGPA and daily class attendance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ToolsPage,
});

function ToolsPage() {
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState("");
  const [semester, setSemester] = useState("");
  const [credits, setCredits] = useState("3");
  const [gradePoint, setGradePoint] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCredits, setEditCredits] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [markingId, setMarkingId] = useState<string | null>(null);

  const loadTracker = useCallback(async () => {
    if (!user) {
      setCourses([]);
      setAttendance([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [courseResult, attendanceResult] = await Promise.all([
      supabase.from("student_courses").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("attendance_records").select("*").eq("user_id", user.id).order("class_date", { ascending: false }),
    ]);
    if (courseResult.error || attendanceResult.error) {
      toast.error("Could not load your study records. Please try again.");
    } else {
      setCourses(courseResult.data ?? []);
      setAttendance(attendanceResult.data ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) void loadTracker();
  }, [authLoading, loadTracker]);

  const overallCgpa = useMemo(() => {
    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
    if (!totalCredits) return null;
    return courses.reduce((sum, course) => sum + course.credits * course.grade_point, 0) / totalCredits;
  }, [courses]);

  const overallAttendance = useMemo(() => {
    if (!attendance.length) return null;
    return (attendance.filter((record) => record.present).length / attendance.length) * 100;
  }, [attendance]);

  const addCourse = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const creditValue = Number(credits);
    const gradeValue = Number(gradePoint);
    if (!courseName.trim() || !semester.trim() || !Number.isFinite(creditValue) || creditValue <= 0 || creditValue > 60 || !Number.isFinite(gradeValue) || gradeValue < 0 || gradeValue > 10) {
      toast.error("Enter a course, semester, credits above 0, and a grade point from 0 to 10.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("student_courses").insert({
      user_id: user.id,
      course_name: courseName.trim(),
      semester: semester.trim(),
      credits: creditValue,
      grade_point: gradeValue,
    });
    setSaving(false);
    if (error) {
      toast.error("Could not save this course.");
      return;
    }
    setCourseName("");
    setSemester("");
    setCredits("3");
    setGradePoint("");
    toast.success("Course added to your tracker.");
    await loadTracker();
  };

  const saveCourse = async (courseId: string) => {
    const creditValue = Number(editCredits);
    const gradeValue = Number(editGrade);
    if (!Number.isFinite(creditValue) || creditValue <= 0 || creditValue > 60 || !Number.isFinite(gradeValue) || gradeValue < 0 || gradeValue > 10) {
      toast.error("Credits must be above 0 and grade point must be from 0 to 10.");
      return;
    }
    const { error } = await supabase.from("student_courses").update({ credits: creditValue, grade_point: gradeValue }).eq("id", courseId);
    if (error) {
      toast.error("Could not update this course.");
      return;
    }
    setEditingId(null);
    toast.success("Course grade updated.");
    await loadTracker();
  };

  const removeCourse = async (course: Course) => {
    if (!window.confirm(`Remove ${course.course_name}? Its attendance history will also be removed.`)) return;
    const { error } = await supabase.from("student_courses").delete().eq("id", course.id);
    if (error) {
      toast.error("Could not remove this course.");
      return;
    }
    toast.success("Course removed.");
    await loadTracker();
  };

  const markAttendance = async (courseId: string, present: boolean) => {
    if (!user) return;
    setMarkingId(courseId);
    const today = new Date().toLocaleDateString("en-CA");
    const { error } = await supabase.from("attendance_records").upsert(
      { user_id: user.id, course_id: courseId, class_date: today, present },
      { onConflict: "user_id,course_id,class_date" },
    );
    setMarkingId(null);
    if (error) {
      toast.error("Could not save today's attendance.");
      return;
    }
    toast.success(present ? "Marked present for today." : "Marked absent for today.");
    await loadTracker();
  };

  const today = new Date().toLocaleDateString("en-CA");
  const attendanceFor = (courseId: string) => attendance.filter((item) => item.course_id === courseId);

  return (
    <PageShell title="Tools" subtitle="Your study dashboard">
      <Pomodoro />

      <section className="mt-6 grid grid-cols-2 gap-3" aria-label="Personal study summary">
        <SummaryCard icon={CheckSquare} title="Attendance" value={overallAttendance == null ? "—" : `${Math.round(overallAttendance)}%`} detail={attendance.length ? `${attendance.filter((item) => item.present).length} / ${attendance.length} classes marked` : "No classes marked yet"} />
        <SummaryCard icon={Calculator} title="CGPA" value={overallCgpa == null ? "—" : overallCgpa.toFixed(2)} detail={courses.length ? `${courses.length} courses · credit weighted` : "Add grades to calculate"} />
      </section>

      {!user && !authLoading ? (
        <section className="mt-8 border-t border-border pt-6 text-center">
          <BookOpenCheck className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-3 text-lg font-semibold">Your records, saved privately</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to add courses, calculate your CGPA, and mark each class.</p>
          <Button asChild className="mt-4"><Link to="/login">Sign in to start</Link></Button>
        </section>
      ) : (
        <>
          <section className="mt-8 border-t border-border pt-6">
            <div className="mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">CGPA tracker</h2>
                <p className="text-xs text-muted-foreground">Add your subjects, credits and grade points.</p>
              </div>
            </div>
            <form onSubmit={addCourse} className="grid grid-cols-2 gap-2">
              <Input aria-label="Course name" placeholder="Course name" maxLength={120} value={courseName} onChange={(event) => setCourseName(event.target.value)} required className="col-span-2" />
              <Input aria-label="Semester" placeholder="Semester (e.g. Sem 3)" maxLength={80} value={semester} onChange={(event) => setSemester(event.target.value)} required />
              <Input aria-label="Credits" type="number" placeholder="Credits" min="0.01" max="60" step="0.01" value={credits} onChange={(event) => setCredits(event.target.value)} required />
              <Input aria-label="Grade point" type="number" placeholder="Grade point / 10" min="0" max="10" step="0.01" value={gradePoint} onChange={(event) => setGradePoint(event.target.value)} required className="col-span-2" />
              <Button type="submit" disabled={saving} className="col-span-2"><Plus className="h-4 w-4" /> Add course</Button>
            </form>
            <div className="mt-4 space-y-2">
              {loading ? <TrackerLoading /> : courses.length === 0 ? <EmptyState title="No courses yet" detail="Add your first course above to calculate a personal CGPA." /> : courses.map((course) => (
                <article key={course.id} className="glass rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-medium">{course.course_name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{course.semester} · {course.credits} credits · grade {course.grade_point.toFixed(2)}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${course.course_name}`} onClick={() => { setEditingId(course.id); setEditCredits(String(course.credits)); setEditGrade(String(course.grade_point)); }}><Pencil /></Button>
                      <Button variant="ghost" size="icon" aria-label={`Remove ${course.course_name}`} onClick={() => void removeCourse(course)}><Trash2 /></Button>
                    </div>
                  </div>
                  {editingId === course.id && (
                    <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3">
                      <label className="min-w-24 flex-1 text-xs text-muted-foreground">Credits<Input aria-label="Edit credits" type="number" min="0.01" max="60" step="0.01" value={editCredits} onChange={(event) => setEditCredits(event.target.value)} /></label>
                      <label className="min-w-24 flex-1 text-xs text-muted-foreground">Grade point<Input aria-label="Edit grade point" type="number" min="0" max="10" step="0.01" value={editGrade} onChange={(event) => setEditGrade(event.target.value)} /></label>
                      <Button size="icon" aria-label="Save course grade" onClick={() => void saveCourse(course.id)}><Save /></Button>
                      <Button size="icon" variant="ghost" aria-label="Cancel editing" onClick={() => setEditingId(null)}><X /></Button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8 border-t border-border pt-6">
            <div className="mb-4 flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">Attendance tracker</h2>
                <p className="text-xs text-muted-foreground">Mark each course present or absent once per day.</p>
              </div>
            </div>
            {loading ? <TrackerLoading /> : courses.length === 0 ? <EmptyState title="Add courses first" detail="Your courses will appear here so you can record each class." /> : (
              <div className="space-y-3">
                {courses.map((course) => {
                  const records = attendanceFor(course.id);
                  const present = records.filter((item) => item.present).length;
                  const percent = records.length ? Math.round((present / records.length) * 100) : 0;
                  const markedToday = records.find((item) => item.class_date === today);
                  return (
                    <article key={course.id} className="glass rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate font-medium">{course.course_name}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">{present} present / {records.length} marked · {records.length ? `${percent}%` : "No records"}</p>
                        </div>
                        {markedToday ? <span className="shrink-0 text-xs text-muted-foreground">Today: {markedToday.present ? "Present" : "Absent"}</span> : null}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant={markedToday?.present ? "default" : "outline"} disabled={markingId === course.id} onClick={() => void markAttendance(course.id, true)}>{markingId === course.id ? <Loader2 className="animate-spin" /> : null}Present</Button>
                        <Button size="sm" variant={markedToday && !markedToday.present ? "secondary" : "outline"} disabled={markingId === course.id} onClick={() => void markAttendance(course.id, false)}>Absent</Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </PageShell>
  );
}

function SummaryCard({ icon: Icon, title, value, detail }: { icon: typeof Timer; title: string; value: string; detail: string }) {
  return (
    <div className="glass rounded-2xl p-4 gradient-border">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><Icon className="h-5 w-5" /></div>
      <div className="mt-4 text-xs text-muted-foreground">{title}</div>
      <div className="text-xl font-semibold gradient-text">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{detail}</div>
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center"><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}

function TrackerLoading() {
  return <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground" role="status"><Loader2 className="h-4 w-4 animate-spin" />Loading your records…</div>;
}

function Pomodoro() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const progress = 1 - seconds / (25 * 60);
  const circumference = 2 * Math.PI * 86;

  return (
    <section className="glass-strong rounded-3xl p-6 gradient-border">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Pomodoro</p><h2 className="text-lg font-semibold">Deep focus session</h2></div>
        <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-[10px]">25 / 5</span>
      </div>
      <div className="mt-6 grid place-items-center">
        <div className="relative h-52 w-52">
          <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
            <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0%" stopColor="var(--brand)" /><stop offset="100%" stopColor="var(--brand-2)" /></linearGradient></defs>
            <circle cx="100" cy="100" r="86" stroke="var(--border)" strokeWidth="10" fill="none" />
            <circle cx="100" cy="100" r="86" stroke="url(#g)" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} />
          </svg>
          <div className="absolute inset-0 grid place-items-center"><div className="text-center"><div className="text-4xl font-semibold tabular-nums">{mm}:{ss}</div><div className="mt-1 text-xs text-muted-foreground">focus block</div></div></div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button onClick={() => setRunning((current) => !current)} className="btn-brand h-12 rounded-2xl px-6">{running ? <Pause /> : <Play />}{running ? "Pause" : "Start"}</Button>
        <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl" onClick={() => { setRunning(false); setSeconds(25 * 60); }} aria-label="Reset timer"><RotateCcw /></Button>
      </div>
    </section>
  );
}