import { Disclaimer } from "@/components/Disclaimer";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/app";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">NutriGLP</h1>
        <p className="mt-1 text-sm text-muted">Acompanhamento nutricional para nós as duas.</p>
      </div>
      <div className="card">
        <LoginForm next={next} />
      </div>
      <Disclaimer compact />
    </main>
  );
}
