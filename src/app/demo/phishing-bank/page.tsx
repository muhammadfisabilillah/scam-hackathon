import type { Metadata } from "next";
import { Landmark, LockKeyhole, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Nusa Bank - Verifikasi Akun",
  description:
    "Safe local phishing simulation target for the ScamPilot AI browser scanner.",
};

export default function PhishingBankDemoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12 text-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            ScamPilot AI demo target. This is a safe local simulation. Never
            enter real credentials.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl shadow-slate-300/40 sm:p-9">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white">
              <Landmark className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight text-blue-800">
                NUSA BANK
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Demo portal
              </p>
            </div>
          </div>

          <div className="mt-7 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            <LockKeyhole className="h-3.5 w-3.5" />
            Akun Anda akan diblokir permanen
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
            Verifikasi Akun Segera
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Kami mendeteksi aktivitas mencurigakan pada akun Anda. Verifikasi
            dalam 10 menit atau akses akun akan ditutup permanen.
          </p>

          <form className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="customer-id"
                className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Nomor Kartu / ID Nasabah
              </label>
              <input
                id="customer-id"
                name="customer-id"
                type="text"
                autoComplete="off"
                placeholder="0000 0000 0000 0000"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none ring-blue-600/20 focus:border-blue-500 focus:ring-4"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Password / PIN
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="off"
                placeholder="Enter your password"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none ring-blue-600/20 focus:border-blue-500 focus:ring-4"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Verifikasi Sekarang
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">
            Demo page for ScamPilot AI. No data is collected or transmitted.
          </p>
        </div>
      </div>
    </main>
  );
}
