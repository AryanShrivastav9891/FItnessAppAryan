# Offline writes — reference, not yet wired up

**This app has no backend.** `next.config.ts` sets `output: "export"`, which cannot
emit route handlers, so there is no `/api` to write to and nothing to sync. Every
write today goes to `localStorage` under `coach:*` (see [`lib/storage.ts`](../lib/storage.ts)),
which is already offline-proof — a set logged in a basement gym is saved the moment
it is typed.

This document is what to add **if** a server ever appears (syncing between phone and
laptop, a coach dashboard, a backup). Nothing here is imported by the app; copy it
out when it is needed. The `/api` caching rules in [`app/sw.ts`](../app/sw.ts) are
inert for the same reason and become live at the same moment.

The shape of the problem: a write made with no signal must (a) survive being closed,
(b) be sent later without the user doing anything, and (c) never create a duplicate
row when the retry and the original both land.

---

## 1. The queue — `lib/writeQueue.ts`

```ts
"use client";

/*
 * Durable outbox for writes made offline.
 *
 * IndexedDB rather than localStorage because it is available to the service
 * worker, which is what actually drains the queue after the tab is gone.
 */

const DB = "coach-outbox";
const STORE = "writes";

export interface QueuedWrite {
  /** Client-generated, and the server's idempotency key. Never regenerated. */
  id: string;
  url: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  body: unknown;
  /** When the user actually did the thing — not when it reached the server. */
  createdAt: number;
  attempts: number;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = run(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

/**
 * Record a write and try to send it.
 *
 * The id is minted here, once, and reused for every retry — that is the whole
 * idempotency story. Generating it server-side would defeat the point: a retry
 * would get a second id and become a second row.
 */
export async function enqueue(
  url: string,
  method: QueuedWrite["method"],
  body: unknown,
): Promise<QueuedWrite> {
  const write: QueuedWrite = {
    id: crypto.randomUUID(),
    url,
    method,
    body,
    createdAt: Date.now(),
    attempts: 0,
  };

  await tx("readwrite", (s) => s.add(write));

  // Ask the service worker to drain when there is signal. Background Sync fires
  // even if the tab is closed; browsers without it fall back to an immediate
  // attempt plus the `online` listener below.
  const registration = await navigator.serviceWorker?.ready;
  if (registration && "sync" in registration) {
    try {
      await (registration as ServiceWorkerRegistration & {
        sync: { register(tag: string): Promise<void> };
      }).sync.register("coach-outbox");
      return write;
    } catch {
      /* fall through to the direct attempt */
    }
  }
  void flush();
  return write;
}

/** Send everything queued. Safe to call repeatedly and concurrently. */
export async function flush(): Promise<void> {
  const pending = await tx<QueuedWrite[]>("readonly", (s) => s.getAll());

  for (const write of pending) {
    try {
      const res = await fetch(write.url, {
        method: write.method,
        headers: {
          "Content-Type": "application/json",
          // The server dedups on this. Same header on every retry.
          "Idempotency-Key": write.id,
        },
        body: JSON.stringify(write.body),
      });

      // 2xx means stored. 4xx means it will never succeed — drop it rather than
      // retrying a malformed write until the end of time.
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        await tx("readwrite", (s) => s.delete(write.id));
      } else {
        await tx("readwrite", (s) => s.put({ ...write, attempts: write.attempts + 1 }));
      }
    } catch {
      // Still offline. Leave it queued; the next sync picks it up.
      return;
    }
  }
}

export function watchForReconnect(): () => void {
  const onOnline = () => void flush();
  window.addEventListener("online", onOnline);
  return () => window.removeEventListener("online", onOnline);
}
```

## 2. Draining from the worker — add to `app/sw.ts`

Register **before** `serwist.addEventListeners()`, alongside the photo warm-up:

```ts
self.addEventListener("sync", (event) => {
  const syncEvent = event as ExtendableEvent & { tag: string };
  if (syncEvent.tag !== "coach-outbox") return;
  // Rejecting tells the browser to retry with its own backoff, which is far
  // better behaved than a timer of our own.
  syncEvent.waitUntil(drainOutbox());
});
```

`drainOutbox()` is the same logic as `flush()` above, written against raw
IndexedDB — the worker cannot import the `"use client"` module.

Serwist also ships `BackgroundSyncQueue`, which does this for you if you would
rather not hand-roll it:

```ts
import { BackgroundSyncQueue } from "serwist";
const outbox = new BackgroundSyncQueue("coach-outbox", { maxRetentionTime: 24 * 60 });
```

Note it replays the *request*, so the `Idempotency-Key` header must be set when
the request is first made — which the queue above already does.

## 3. Server-side dedup — the half that actually prevents duplicates

A client-generated id is worthless unless the server enforces it. The check must
be **atomic**; a `SELECT` then `INSERT` has a race that two retries in flight at
once will find.

```sql
CREATE TABLE set_log (
  id           uuid PRIMARY KEY,      -- the client's id, not a server sequence
  exercise_id  text        NOT NULL,
  weight_kg    numeric     NOT NULL,
  reps         int         NOT NULL,
  performed_at timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
```

```ts
// app/api/sets/route.ts  (requires dropping `output: "export"`)
export async function POST(request: Request) {
  const key = request.headers.get("Idempotency-Key");
  if (!key || !/^[0-9a-f-]{36}$/i.test(key)) {
    return Response.json({ error: "Idempotency-Key required" }, { status: 400 });
  }

  const body = await request.json();

  // ON CONFLICT DO NOTHING is the atomic part: the second arrival of the same
  // id changes nothing and still reports success, so the client stops retrying.
  const { rowCount } = await db.query(
    `INSERT INTO set_log (id, exercise_id, weight_kg, reps, performed_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO NOTHING`,
    [key, body.exerciseId, body.weightKg, body.reps, new Date(body.performedAt)],
  );

  // 201 = stored now, 200 = already had it. Both mean "done, stop retrying".
  return Response.json({ id: key, duplicate: rowCount === 0 }, {
    status: rowCount === 1 ? 201 : 200,
  });
}
```

### Why each piece is load-bearing

| Piece | Drop it and… |
| --- | --- |
| Client-generated UUID | The server assigns ids, so a retried write becomes a second set. Log 3×8 offline, reconnect twice, get six sets. |
| `crypto.randomUUID()` (not a counter) | Two devices generate `id: 1` and collide, or one silently overwrites the other. |
| `createdAt` from the client | Sets sync in reconnect order, not the order they were done — the rest timer and the session log both go wrong. |
| `ON CONFLICT DO NOTHING` | The race between two in-flight retries inserts twice; the unique key alone throws a 500, so the client retries forever. |
| 4xx → drop from queue | One malformed write blocks the queue behind it permanently. |
| Returning 200 on duplicate | The client treats it as failure and retries the same write forever. |

### Never cache these responses

Writes are `POST`/`PUT`/`PATCH`/`DELETE`, and every runtime rule in `app/sw.ts`
that could store anything is `method: "GET"` or precache-only, so they are never
cached. Keep it that way — a cached write response replayed to a different user
is a data-leak, and a cached `POST` result is meaningless anyway.
