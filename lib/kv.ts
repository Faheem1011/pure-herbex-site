import { ensureKvEnv } from "@/lib/kv-env";

ensureKvEnv();

export { kv } from "@vercel/kv";
