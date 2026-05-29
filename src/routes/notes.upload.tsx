import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, FileText, Loader2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { uploadNotePdf } from "@/lib/notes-api";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/notes/upload")({
  head: () => ({ meta: [{ title: "Upload notes — Acadex" }] }),
  component: UploadPage,
});

const branches = ["CSE", "ECE", "ME", "EE", "CE", "IT"];
const semesters = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8"];

function UploadPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [semester, setSemester] = useState("Sem 5");
  const [description, setDescription] = useState("");

  const mut = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Pick a PDF first");
      if (!title.trim() || !subject.trim()) throw new Error("Title and subject required");
      return uploadNotePdf({ file, title: title.trim(), subject: subject.trim(), branch, semester, description: description.trim() || undefined });
    },
    onSuccess: () => {
      toast.success("Notes uploaded 🎉");
      navigate({ to: "/notes" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading)
    return <PageShell title="Upload"><div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div></PageShell>;
  if (!user)
    return (
      <PageShell title="Upload notes" subtitle="Share">
        <div className="glass rounded-3xl p-8 text-center gradient-border">
          <div className="text-2xl mb-1">🔒</div>
          <p className="text-sm text-muted-foreground">Sign in to upload and share notes with your branch.</p>
          <Link to="/login" className="btn-brand inline-flex mt-4 rounded-xl px-4 py-2 text-xs font-medium">Sign in</Link>
        </div>
      </PageShell>
    );

  return (
    <PageShell title="Upload notes" subtitle="Share">
      <form
        onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
        className="space-y-3"
      >
        <label className="glass rounded-2xl p-4 flex items-center gap-3 cursor-pointer block">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/30 to-sky-500/30 flex items-center justify-center">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{file ? file.name : "Choose PDF"}</div>
            <div className="text-xs text-muted-foreground">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Up to 25 MB"}</div>
          </div>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <Input placeholder="Title (e.g. OS Unit 3 — Memory)" value={title} onChange={setTitle} />
        <Input placeholder="Subject (e.g. Operating Systems)" value={subject} onChange={setSubject} />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Branch" value={branch} onChange={setBranch} options={branches} />
          <Select label="Semester" value={semester} onChange={setSemester} options={semesters} />
        </div>

        <textarea
          placeholder="Short description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full glass rounded-2xl px-4 py-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
        />

        <button
          type="submit"
          disabled={mut.isPending}
          className="btn-brand w-full rounded-2xl py-3 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {mut.isPending ? "Uploading…" : "Publish notes"}
        </button>
      </form>
    </PageShell>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full glass rounded-2xl px-4 py-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
    />
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full glass rounded-2xl px-3 py-3 text-sm bg-transparent outline-none"
      >
        {options.map((o) => <option key={o} value={o} className="bg-background">{o}</option>)}
      </select>
    </label>
  );
}
