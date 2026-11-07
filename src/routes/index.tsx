import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { navItems } from "@/lib/nav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Creator AI Studio — AI YouTube Video Maker" },
      { name: "description", content: "Create stories, scripts, Telugu voice-overs and YouTube videos and Shorts in one studio." },
      { property: "og:title", content: "Creator AI Studio — AI YouTube Video Maker" },
      { property: "og:description", content: "Create stories, scripts, Telugu voice-overs and YouTube videos and Shorts in one studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const tools = navItems.slice(1);
  return (
    <div>
      <section className="relative overflow-hidden rounded-2xl border bg-card p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Welcome</p>
        <h1 className="mt-3 max-w-xl text-3xl font-semibold sm:text-4xl">
          Make YouTube videos, <span className="text-gradient">from idea to upload.</span>
        </h1>
        <p className="mt-3 max-w-lg text-sm text-muted-foreground">
          Story, script, Telugu voice, images and video — all in one place.
        </p>
        <Link to="/story" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:brightness-110">
          Start with a story <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <h2 className="mb-4 mt-10 text-lg font-semibold">Tools</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((t) => (
          <Link key={t.url} to={t.url} className="group rounded-xl border bg-card p-5 transition hover:border-primary/40 hover:bg-accent/40">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-primary">
              <t.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-medium">{t.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
