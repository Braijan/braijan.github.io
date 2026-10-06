import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-[100svh] flex-col items-center justify-center px-5 text-center"
    >
      <p className="font-mono text-[0.7rem] tracking-[0.2em] text-accent uppercase">404</p>
      <h1 className="mt-6 font-serif text-5xl font-light tracking-tight sm:text-6xl">
        Nothing lives at this address.
      </h1>
      <Link
        href="/"
        className="mt-10 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        Back to the front page
      </Link>
    </main>
  );
}
