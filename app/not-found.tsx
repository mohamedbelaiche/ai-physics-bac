import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-5xl font-bold">404</p>
      <h1 className="text-xl font-bold">هذه الصفحة غير موجودة</h1>
      <p className="t-muted max-w-md">
        يبدو أن الرابط الذي فتحته غير صحيح أو تم حذف الصفحة.
      </p>
      <Link
        href="/"
        className="btn btn-primary px-5 py-2.5"
      >
        العودة إلى الدردشة
      </Link>
    </main>
  );
}
