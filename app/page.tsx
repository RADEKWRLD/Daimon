export default function Home() {
  const serviceBoundaries = [
    "profile-service",
    "prompt-service",
    "safety-service",
    "chat-service",
    "storage-service",
  ];

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-zinc-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
            Daimon sandbox architecture
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
            Profile and persona data are scoped by user, versioned in Postgres,
            and never stored as repo files.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-zinc-700">
            The implementation separates protocol adapters, service boundaries,
            storage repositories, local AI tools, and an independent Safety Gate.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-zinc-300 bg-white p-5">
            <h2 className="text-lg font-semibold">Storage</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-700">
              Profiles live in <code>profiles</code>. Persona prompts live in{" "}
              <code>agent_prompts</code> and <code>prompt_versions</code>.
            </p>
          </article>
          <article className="rounded-lg border border-zinc-300 bg-white p-5">
            <h2 className="text-lg font-semibold">Sandboxing</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-700">
              Repositories require <code>viewerUserId</code>, and tRPC injects
              the authenticated user through request context.
            </p>
          </article>
          <article className="rounded-lg border border-zinc-300 bg-white p-5">
            <h2 className="text-lg font-semibold">Safety</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-700">
              Crisis checks run before the active prompt is read, so persona
              text cannot override the fixed safety response.
            </p>
          </article>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-lg border border-zinc-300 bg-white p-6">
            <h2 className="text-xl font-semibold">Service Boundaries</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {serviceBoundaries.map((service) => (
                <div
                  className="border-l-4 border-teal-600 bg-zinc-50 px-4 py-3 text-sm font-medium"
                  key={service}
                >
                  {service}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-amber-300 bg-[#fff8e6] p-6">
            <h2 className="text-xl font-semibold">File Policy</h2>
            <p className="mt-4 text-sm leading-6 text-zinc-800">
              Development-only prompt exports go under{" "}
              <code>.data/sandboxes/&lbrace;userId&rbrace;/prompt-versions/</code>.
              The <code>.data/</code> directory is ignored by Git and is never a
              production source of truth.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
