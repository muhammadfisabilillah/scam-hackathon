import type { Metadata } from "next";
import { BookOpen, CalendarDays, Clock, GraduationCap } from "lucide-react";

export const metadata: Metadata = {
  title: "Kampus Nusantara - Library Announcement",
  description:
    "Safe local legitimate announcement page for the ScamPilot AI browser scanner.",
};

export default function LegitAnnouncementDemoPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white">
            <GraduationCap className="h-6 w-6" />
          </span>
          <div>
            <p className="text-base font-bold tracking-tight">
              Kampus Nusantara
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Official student portal
            </p>
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          <BookOpen className="h-3.5 w-3.5" />
          Official announcement
        </span>

        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
          Perpanjangan Jam Operasional Perpustakaan
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            10 - 24 November 2026
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            Until 11:00 PM
          </span>
        </div>

        <div className="mt-8 space-y-4 text-sm leading-7 text-slate-700">
          <p>
            Dear students, the main library will extend its opening hours during
            the final examination period. The library will remain open until
            11:00 PM from 10 November through 24 November 2026.
          </p>
          <p>
            Group study rooms can be reserved through the student portal. Please
            bring your student card for building access after 9:00 PM.
          </p>
          <p>
            The library team wishes you a calm and productive examination
            period.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Library contact
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Visit the information desk on level 2 or use the official student
            portal contact form. No payment or password is required for this
            announcement.
          </p>
        </div>
      </article>
    </main>
  );
}
