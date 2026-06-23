/**
 * One-time copy: old Upstash Redis -> new Upstash Redis.
 *
 * Usage (PowerShell):
 *   $env:SOURCE_KV_REST_API_URL="https://liked-mole-100771.upstash.io"
 *   $env:SOURCE_KV_REST_API_TOKEN="..."
 *   $env:DEST_KV_REST_API_URL="https://cuddly-poodle-102740.upstash.io"
 *   $env:DEST_KV_REST_API_TOKEN="..."
 *   npx --yes tsx scripts/migrate-kv.ts
 *
 * Do NOT update Vercel env vars until this finishes successfully.
 */

type RedisValue = string | number | null | Record<string, unknown> | unknown[];

async function redisCommand(
  baseUrl: string,
  token: string,
  command: (string | number)[]
): Promise<unknown> {
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Redis HTTP ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(data.error);
  return data.result;
}

async function scanAllKeys(baseUrl: string, token: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = "0";

  do {
    const result = (await redisCommand(baseUrl, token, [
      "SCAN",
      cursor,
      "COUNT",
      200,
    ])) as [string, string[]];

    cursor = result[0];
    keys.push(...result[1]);
  } while (cursor !== "0");

  return [...new Set(keys)].sort();
}

async function copyKey(
  sourceUrl: string,
  sourceToken: string,
  destUrl: string,
  destToken: string,
  key: string
): Promise<void> {
  const type = (await redisCommand(sourceUrl, sourceToken, ["TYPE", key])) as string;
  const ttl = (await redisCommand(sourceUrl, sourceToken, ["TTL", key])) as number;

  if (type === "none") return;

  const ttlArgs =
    typeof ttl === "number" && ttl > 0 ? (["EX", ttl] as (string | number)[]) : [];

  switch (type) {
    case "string": {
      const value = await redisCommand(sourceUrl, sourceToken, ["GET", key]);
      await redisCommand(destUrl, destToken, ["SET", key, value as string, ...ttlArgs]);
      break;
    }
    case "set": {
      const members = (await redisCommand(sourceUrl, sourceToken, [
        "SMEMBERS",
        key,
      ])) as string[];
      await redisCommand(destUrl, destToken, ["DEL", key]);
      if (members.length) {
        await redisCommand(destUrl, destToken, ["SADD", key, ...members]);
      }
      if (ttlArgs.length) await redisCommand(destUrl, destToken, ["EXPIRE", key, ttl]);
      break;
    }
    case "list": {
      const items = (await redisCommand(sourceUrl, sourceToken, [
        "LRANGE",
        key,
        0,
        -1,
      ])) as string[];
      await redisCommand(destUrl, destToken, ["DEL", key]);
      if (items.length) {
        await redisCommand(destUrl, destToken, ["RPUSH", key, ...items]);
      }
      if (ttlArgs.length) await redisCommand(destUrl, destToken, ["EXPIRE", key, ttl]);
      break;
    }
    case "hash": {
      const fields = (await redisCommand(sourceUrl, sourceToken, [
        "HGETALL",
        key,
      ])) as string[];
      await redisCommand(destUrl, destToken, ["DEL", key]);
      if (fields.length) {
        await redisCommand(destUrl, destToken, ["HSET", key, ...fields]);
      }
      if (ttlArgs.length) await redisCommand(destUrl, destToken, ["EXPIRE", key, ttl]);
      break;
    }
    case "zset": {
      const pairs = (await redisCommand(sourceUrl, sourceToken, [
        "ZRANGE",
        key,
        0,
        -1,
        "WITHSCORES",
      ])) as string[];
      await redisCommand(destUrl, destToken, ["DEL", key]);
      if (pairs.length) {
        await redisCommand(destUrl, destToken, ["ZADD", key, ...pairs]);
      }
      if (ttlArgs.length) await redisCommand(destUrl, destToken, ["EXPIRE", key, ttl]);
      break;
    }
    default:
      throw new Error(`Unsupported type "${type}" for key ${key}`);
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing ${name}`);
    process.exit(1);
  }
  return value;
}

async function main() {
  const sourceUrl = requireEnv("SOURCE_KV_REST_API_URL");
  const sourceToken = requireEnv("SOURCE_KV_REST_API_TOKEN");
  const destUrl = requireEnv("DEST_KV_REST_API_URL");
  const destToken = requireEnv("DEST_KV_REST_API_TOKEN");

  if (sourceUrl === destUrl) {
    console.error("Source and destination URLs must differ.");
    process.exit(1);
  }

  console.log("Scanning source database...");
  const keys = await scanAllKeys(sourceUrl, sourceToken);
  console.log(`Found ${keys.length} keys.`);

  if (keys.length === 0) {
    console.log("Nothing to copy.");
    return;
  }

  let copied = 0;
  for (const key of keys) {
    await copyKey(sourceUrl, sourceToken, destUrl, destToken, key);
    copied += 1;
    if (copied % 10 === 0 || copied === keys.length) {
      console.log(`Copied ${copied}/${keys.length}...`);
    }
  }

  const destKeys = await scanAllKeys(destUrl, destToken);
  console.log(`Done. Destination now has ${destKeys.length} keys.`);

  if (destKeys.length < keys.length) {
    console.warn("Warning: destination key count is lower than source. Review before switching.");
    process.exit(2);
  }

  console.log("Safe to update Vercel KV_REST_API_URL and KV_REST_API_TOKEN, then redeploy.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
