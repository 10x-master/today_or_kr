import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 서버(라우트 핸들러)용 Supabase 클라이언트. 로그인 쿠키로 사용자를 알아본다.
// 환경변수가 없으면 null을 돌려주고, 호출하는 쪽이 503으로 응답한다.
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const cookieStore = await cookies();
    return createServerClient(url, key, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // 라우트 핸들러가 아닌 곳에서 호출되면 쿠키를 쓸 수 없다. 읽기 전용으로 넘어간다.
          }
        },
      },
    });
  } catch {
    // 빌드 타임 프리렌더링 또는 쿠키 비허용 컨텍스트에서는 쿠키 없이 익명 클라이언트 반환
    return createServerClient(url, key, {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    });
  }
}
