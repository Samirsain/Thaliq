import Link from "next/link";

import { Button } from "@/components/ui/button";

const FLOW = [
  "QR Scan",
  "Digital Menu",
  "Table Identified",
  "Order Placed",
  "Kitchen Prepares",
  "Live Tracking",
  "Payment",
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <span className="text-lg font-semibold">THALIQ</span>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/staff">Staff sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center gap-10 px-6 py-24 text-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            One QR. Your entire restaurant connected.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Scan. Order. Serve. Manage. THALIQ is the QR-first restaurant operating system for
            cafes, restaurants, bakeries and food courts.
          </p>
        </div>

        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/signup">Start free trial</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>

        <ol className="flex flex-wrap items-center justify-center gap-2 pt-8 text-sm text-muted-foreground">
          {FLOW.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className="rounded-full border px-3 py-1">{step}</span>
              {i < FLOW.length - 1 && <span aria-hidden>→</span>}
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
