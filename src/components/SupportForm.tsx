"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n";

export default function SupportForm({
  locale,
  labels,
}: {
  locale: Locale;
  labels: {
    reportIssue: string;
    yourEmail: string;
    issueType: string;
    yourMessage: string;
    issuePlaceholder: string;
    submit: string;
    loading: string;
    success: string;
    error: string;
  };
}) {
  const [email, setEmail] = useState("");
  const [issueType, setIssueType] = useState("General");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, issueType, message, locale }),
    });
    setStatus(response.ok ? labels.success : labels.error);
    setLoading(false);
    if (response.ok) {
      setEmail("");
      setMessage("");
    }
  };

  return (
    <form onSubmit={submit} className="glass-panel rounded-3xl border border-stone-800 p-6 flex flex-col gap-4">
      <h2 className="text-xl font-bold text-stone-100">{labels.reportIssue}</h2>
      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder={labels.yourEmail} className="rounded-xl bg-stone-900 border border-stone-800 px-4 py-3 text-stone-100" required />
      <input value={issueType} onChange={(e) => setIssueType(e.target.value)} type="text" placeholder={labels.issueType} className="rounded-xl bg-stone-900 border border-stone-800 px-4 py-3 text-stone-100" required />
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={labels.issuePlaceholder} className="rounded-xl bg-stone-900 border border-stone-800 px-4 py-3 text-stone-100 min-h-32" required />
      <button disabled={loading} className="rounded-xl bg-amber-500 px-4 py-3 font-bold text-stone-950">
        {loading ? labels.loading : labels.submit}
      </button>
      {status && <p className="text-sm text-stone-300">{status}</p>}
    </form>
  );
}
