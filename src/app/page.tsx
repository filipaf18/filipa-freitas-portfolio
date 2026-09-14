import { redirect } from "next/navigation";

// O proxy.ts já redireciona quem não tem sessão para /login.
export default function Home() {
  redirect("/app");
}
