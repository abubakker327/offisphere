'use client';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-700">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <span className="text-sm font-medium">Loading workspace...</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="of-skeleton h-28" />
          <div className="of-skeleton h-28" />
          <div className="of-skeleton h-28" />
          <div className="of-skeleton h-28" />
        </div>
      </div>
    </div>
  );
}
