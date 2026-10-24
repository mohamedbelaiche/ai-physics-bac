"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold">حدث خطأ غير متوقع</h1>
      <p className="t-muted max-w-md">
        تعذّر تحميل الواجهة. حاول إعادة المحاولة، وإن تكررت المشكلة أعد تشغيل الصفحة.
      </p>
      <button type="button" onClick={reset} className="btn btn-primary px-5 py-2.5">
        إعادة المحاولة
      </button>
      <p className="t-muted text-xs" dir="ltr">
        {error.digest ? `Ref: ${error.digest}` : ""}
      </p>
    </main>
  );
}
