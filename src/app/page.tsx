import { redirect } from "next/navigation";

export default function Home() {
  // O middleware redireciona ao /login quando não há sessão.
  redirect("/dashboard");
}
