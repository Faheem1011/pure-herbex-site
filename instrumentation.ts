export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureKvEnv } = await import("@/lib/kv-env");
    ensureKvEnv();
  }
}
