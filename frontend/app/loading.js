'use client';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
      <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-md border border-slate-200">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        <span className="text-sm font-medium">Loading...</span>
      </div>
    </div>
  );
}
