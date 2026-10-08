import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

// 브라우저용 Supabase 클라이언트. 환경변수가 없으면 null을 돌려주고,
// 호출하는 쪽은 "준비 중" 상태로 안전하게 동작해야 한다 (빌드 시점에도 에러가 나지 않도록).
let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  client ??= createBrowserClient(url, key);
  return client;
}
