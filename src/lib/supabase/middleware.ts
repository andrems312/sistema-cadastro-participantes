import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";
import { ROTAS_PUBLICAS } from "@/lib/constants";

const ROTAS_SO_DESLOGADO = ["/login", "/criar-acesso", "/recuperar-senha"];

function comecaCom(pathname: string, rotas: string[]) {
  return rotas.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/**
 * Renova a sessão (cookies) a cada requisição e protege as páginas privadas.
 * A verificação de nível de acesso (admin) é feita no servidor, nas páginas e actions.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    // Sem configuração: deixa a página exibir a mensagem de configuração.
    return response;
  }

  const supabase = createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // IMPORTANTE: getUser() valida o token no servidor do Supabase (não confie só no cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const publica = comecaCom(pathname, ROTAS_PUBLICAS);

  if (!user && !publica && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("redirectTo", `${pathname}${search}`);
    return copiarCookies(response, NextResponse.redirect(url));
  }

  if (user && comecaCom(pathname, ROTAS_SO_DESLOGADO)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return copiarCookies(response, NextResponse.redirect(url));
  }

  return response;
}

function copiarCookies(origem: NextResponse, destino: NextResponse) {
  origem.cookies.getAll().forEach((c) => destino.cookies.set(c));
  return destino;
}
