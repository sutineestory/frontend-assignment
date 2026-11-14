# Frontend Assignment

My solutions to the [7 Solutions frontend assignment](docs/README.md).

| Part                           | Code                   | Live                                                                                                                                                                                    | Stack                                                     |
| ------------------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1. Auto Delete Todo List       | [`apps/web`](apps/web) | [frontend-assignment-web.vercel.app](https://frontend-assignment-web.vercel.app)                                                                                                        | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand |
| 2. Users grouped by department | [`apps/api`](apps/api) | API: [`/users/departments`](https://frontend-assignment-api-zeta.vercel.app/users/departments)<br>Dashboard: [`/assignment-2`](https://frontend-assignment-web.vercel.app/assignment-2) | Node.js 24, Fastify 5, TypeScript (ESM), gRPC             |

Every push runs format check, lint, typecheck, tests and build in [CI](.github/workflows/ci.yml).

## Demo

- **Part 1, Auto Delete Todo List:** https://frontend-assignment-web.vercel.app
- **Part 2, dashboard:** https://frontend-assignment-web.vercel.app/assignment-2
- **Part 2, API:** https://frontend-assignment-api-zeta.vercel.app/users/departments
  (health check: https://frontend-assignment-api-zeta.vercel.app/health)

## Highlights

- **Part 1:** every item has its own 5-second timer in a Zustand store, and a manual click and a timer can never move the same item twice. Works with the keyboard and screen readers, with a CSS-only countdown bar.
- **Part 2 API:** one request for all 208 users, a single-pass transform, and a 60 s cache that shares in-flight requests (100 concurrent requests → 1 call to dummyjson). The JSON is encoded once per cache fill: 114k requests/s, against 20k for my first version.
- **gRPC:** the same data over `@grpc/grpc-js` (runs locally), with the protobuf also encoded once (1.5x the calls/s).
- **Dashboard:** the Part 2 data as four charts with insights computed from the data, selection shared across charts, and a table view, in about 6 KB of JavaScript.
- **Quality:** 78 tests, benchmarks you can rerun (`pnpm bench`), CI on every push, both apps deployed on Vercel.

## Quick start

Requires Node.js 24 and pnpm (`corepack enable pnpm`).

```bash
pnpm install

PORT=4000 pnpm dev:api       # Part 2 API: http://localhost:4000/users/departments
pnpm dev:web                 # Web app: http://localhost:3000 (Part 1)
                             #   and /assignment-2 (dashboard, reads the API above)
pnpm dev:grpc                # Part 2 over gRPC: localhost:50051
pnpm --filter api grpc:call  # call the gRPC server and print the result
```

| Command                        | What it does                                                         |
| ------------------------------ | -------------------------------------------------------------------- |
| `pnpm test`                    | Vitest in both apps (78 tests)                                       |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript in both apps                                     |
| `pnpm build`                   | Production build of both apps                                        |
| `pnpm format`                  | Prettier on the whole repo                                           |
| `pnpm bench`                   | Part 2 benchmarks, about 3 minutes (see [Performance](#performance)) |

## Part 1: Auto Delete Todo List

Click an item in the list and it moves to the bottom of its Fruit or Vegetable column. Five seconds later it goes back to the bottom of the list. Click an item in a column and it goes back right away. A thin bar under each column item shows the time left.

The web app has a sidebar for switching between the two assignments (a row of tabs on phones, so the board keeps the full width). The Assignment 2 page is a dashboard of the Part 2 API (see [Dashboard](#dashboard-in-the-web-app)).

### How it works

Code: [`apps/web/src/features/board/`](apps/web/src/features/board)

| File                 | Role                                                                   |
| -------------------- | ---------------------------------------------------------------------- |
| `board.ts`           | Pure state transitions: `moveToColumn` and `moveToList`                |
| `store.ts`           | Zustand store that applies the transitions and owns one timer per item |
| `store-provider.tsx` | Creates one store per mount and shares it through React context        |
| `components/`        | `Board` (Server Component), `MainList`, `TypeColumn`, `ItemButton`     |

### Design decisions

- **Transitions do nothing when they don't apply.** `moveToColumn` on an item that isn't in the list returns the same state object. So does `moveToList` on an item that isn't in a column. That makes a manual click and a timer safe to race: whichever comes second does nothing.
- **One timer per item, outside React state.** Timers live in a `Map` inside the store, because they are never rendered. Sending an item back by hand cancels its timer, so it can't move twice. Items that time out return in the order they were moved.
- **Timers belong to the store, not to a component's Effects.** They start in the click handler, so React Strict Mode's double-run Effects can't create duplicates. They are also not cleared in an Effect cleanup: Next.js 16 keeps visited pages alive in `<Activity>`, which runs cleanups but keeps state. Clearing timers there would leave items stuck in a column when you switch to Assignment 2 and back. A test covers this.
- **One store per mount, not a module-level singleton.** On the server a singleton would be shared between requests. This is the pattern the Zustand docs recommend for Next.js.
- **The page is a Server Component.** The first HTML already contains the whole list; only the board's interactive parts are client components. Each component subscribes only to the slice of state it renders.
- **Keyboard and screen reader friendly.** Items are real `<button>`s and each column is a `<section>` with a heading. When the focused item moves away (pressed, or its timer ran out), focus goes to the item that took its place instead of falling back to the top of the page, so you can press Enter repeatedly to move items one after another. A visually hidden status message announces every move, including returns nobody clicked.
- **The countdown bar is CSS only.** Its duration comes from the same `RETURN_DELAY_MS` constant as the timer, so they can't drift apart, and it adds no state or re-renders. A hidden page's CSS animations restart when it is shown again, so the bar resumes from the time already passed. It is hidden when `prefers-reduced-motion` is on.
- **Layout.** Three columns at every screen width, so on a phone the item you just moved stays in view. Columns keep a minimum height, so the page doesn't jump as items move.

### Tests (30)

- **Transitions:** moving in both directions, append order, and the do-nothing cases.
- **Store, with fake timers:** an item returns at 5000 ms but not at 4999 ms; a manual return cancels the timer; several timers run independently.
- **UI, with React Testing Library:** clicking, auto-return, early return, where focus goes after each kind of move, the announcements, the countdown bar's duration and how it resumes, and items still returning while the board is hidden in `<Activity>`.
- **Sidebar:** links to both assignments and marks the current one with `aria-current`.

## Part 2: Users grouped by department

Fetches all users from [dummyjson](https://dummyjson.com/users) and groups them by `company.department`.

| Endpoint                                           | Response                                                       |
| -------------------------------------------------- | -------------------------------------------------------------- |
| `GET /users/departments`                           | The summary below                                              |
| `GET /health`                                      | `{ "status": "ok" }`                                           |
| gRPC `users.v1.UserService/GetDepartmentSummaries` | The same summary ([`users.proto`](apps/api/proto/users.proto)) |

One department from the real response:

```json
{
  "Business Development": {
    "male": 0,
    "female": 7,
    "ageRange": "27-44",
    "hair": { "Black": 1, "Red": 1, "Blonde": 3, "Green": 2 },
    "addressUser": {
      "LillianSimmons": "47571",
      "HazelGardner": "35181",
      "NoraMills": "51983",
      "SophiaJones": "24752",
      "ZoeBennett": "50908",
      "PaisleyBell": "49147",
      "SamanthaMartinez": "53772"
    }
  }
}
```

### How it works

Code: [`apps/api/src/`](apps/api/src)

| File                            | Role                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| `users/dummyjson.ts`            | One request for all users, only the fields we use, 5 s timeout. Failures become `UpstreamError`. |
| `users/transform.ts`            | `summarizeByDepartment`: one pass over the users                                                 |
| `lib/cache-async.ts`            | 60 s cache that also makes concurrent callers share one in-flight request                        |
| `users/department-summaries.ts` | Connects the three above; both servers read through it                                           |
| `http/build-app.ts`             | Fastify app. Dependencies are passed in, so tests never touch the network.                       |
| `grpc/`                         | gRPC server, client, and a CLI to call it                                                        |

### Design decisions

- **One upstream request.** dummyjson returns 30 users by default. `limit=0` returns all 208, and `select=` leaves out the fields we don't use.
- **One pass over the data.** Gender counts, age range, hair colors and addresses all update in a single loop, and the `"min-max"` string is built once at the end. About 2x faster than `groupBy` plus array methods ([Performance](#performance)).
- **Cache with shared in-flight requests.** Results are cached for 60 seconds. When the cache is empty, concurrent requests wait on the same upstream call instead of each making their own (100 requests, 1 call). Failures are not cached.
- **Encode the response once per cache fill.** The cache returns the same object until it refills, so the JSON bytes (and the protobuf bytes for gRPC) are built once and reused ([`memoizeLast`](apps/api/src/lib/memoize-last.ts)). That took HTTP from about 20k to 114k requests/s on my machine, and gRPC up 1.5x. Tests check that new data is served after a refill.
- **No response schema.** I started with a Fastify response schema, which serializes with `fast-json-stringify`, then measured it. This response is mostly dynamic keys (names, hair colors), and there it was about 2x slower than `JSON.stringify`, so I removed it.
- **Clear errors.** Every user is checked for the fields the transform reads. If dummyjson is down, slower than 5 s, or sends data in an unexpected shape, the API answers `502 Bad Gateway` (gRPC: `UNAVAILABLE`). Anything else is a `500` (gRPC: `INTERNAL`) with a generic message; the details go to the log, not the client.
- **gRPC runs locally only.** It needs a long-running HTTP/2 server, which Vercel Functions don't provide. The HTTP API is the deployed part.

### Tests (25)

- **Transform:** the requested shape, empty input, and no mutation of the input.
- **Cache, with fake timers:** TTL expiry, shared in-flight requests, and failures not being cached.
- **dummyjson client:** the request URL; a bad status, an unexpected body, a user with missing fields, and network errors all become `UpstreamError`.
- **HTTP:** every route through Fastify's `inject`, including 502, a 500 that doesn't leak the error message, and fresh data after a cache refill.
- **gRPC:** a real server and client on a random port, error codes, and decoding of zero values.

### Performance

Results from `pnpm bench` on an Apple M4 (10 cores), Node 24.12. Use them to compare approaches on one machine, not as a capacity estimate for the deployed API.

**HTTP, warm cache** (`bench:http`: autocannon, 100 connections, median of 3 rounds)

| How the response is produced                              | req/s       | p99  |
| --------------------------------------------------------- | ----------- | ---- |
| `GET /health`: Fastify's ceiling on this machine          | 124,000     | 1 ms |
| Response schema (`fast-json-stringify`), my first version | 20,434      | 8 ms |
| `JSON.stringify` on every request                         | 34,442      | 5 ms |
| **Encode once per cache fill (shipped)**                  | **114,234** | 1 ms |

Encoding once handles 5.6x the requests of my first version, and reaches 92% of an endpoint that does no work at all.

**gRPC, warm cache** (`bench:grpc`: 100 calls in flight, median of 3 rounds)

| How the response is produced             | calls/s    |
| ---------------------------------------- | ---------- |
| Encode to protobuf on every call         | 6,758      |
| **Encode once per cache fill (shipped)** | **10,102** |

**Transform** (`bench:transform`: mean time per call)

| Users           | Single pass (shipped) | `groupBy` + array methods |
| --------------- | --------------------- | ------------------------- |
| 208 (real size) | 0.017 ms              | 0.036 ms (2.1x slower)    |
| 10,000          | 1.24 ms               | 2.19 ms (1.8x slower)     |
| 100,000         | 16.7 ms               | 35.9 ms (2.2x slower)     |

**Serialization** (`bench:serialize`): for the benchmark's 7.1 KB response (the real one is 6.4 KB), `JSON.stringify` takes 0.011 ms and `fast-json-stringify` with the response schema takes 0.022 ms.

**dummyjson** (`bench:upstream`, the only benchmark that uses the network)

- `select=` cuts the response from 282 KB to 122 KB (57% smaller). The download time stayed about the same (~545 ms), because network latency dominates it.
- 100 concurrent requests on an empty cache made **1** dummyjson call and were all answered in 362 ms.
- One request on a warm cache: 0.25 ms (median of 20).

**How the benchmarks run**

- CPU benchmarks run each implementation at each size in a fresh Node process. My first version ran them all in one process, where shared JIT and GC state made single pass look 1.3x _slower_ at 10,000 users. Isolated, it is 1.8x faster.
- Each HTTP or gRPC server runs in its own process and serves in-memory data, so the results measure the code, not the network. Strategies take turns within each round, so background noise affects all of them equally.
- Before measuring, each strategy's response is checked against the same expected data.
- The data is synthetic but seeded, with the same shape and the same 12 departments as dummyjson ([`bench/fixtures.ts`](apps/api/bench/fixtures.ts)).

### Dashboard (in the web app)

The web app's Assignment 2 page turns the API's response into a dashboard: four headline numbers, four charts, and a detail panel for one department.

| Chart                                    | Question                         | What the data shows                                                        |
| ---------------------------------------- | -------------------------------- | -------------------------------------------------------------------------- |
| Headcount (ranked bars)                  | Which departments are biggest?   | Legal and Marketing (23 each); Business Development is the smallest (7)    |
| Gender balance (diverging bars from 50%) | Is each department balanced?     | 51% women overall, but Business Development is 100% women and Training 30% |
| Age range (range bars)                   | How spread out are the ages?     | Everyone is 23–46; Human Resources has the narrowest range (11 years)      |
| Hair color (heatmap)                     | How are hair colors distributed? | Fairly evenly (Blonde 30 down to Gray and Purple 18): the source is random |

The sentence under each chart title is computed from the data, so it stays true if the data changes.

- **Pick a department anywhere.** Clicking a department in any chart highlights it in all four (the rest turn gray) and opens a panel with its numbers, its hair colors, and a searchable list of names and postal codes. Sorting applies to every chart at once, and a table view shows every number without needing a pointer.
- **Data is loaded on the server, per request.** The page's static shell (title, sidebar, loading skeleton) is prerendered and the dashboard streams in at request time (`connection()`). So `next build` never needs the API, the browser never calls it (no CORS, no public API URL), and a failed request shows an error card with a retry button. The web app doesn't cache the response itself: on serverless hosts Next.js's runtime cache doesn't persist between requests, and the API already caches for a minute.
- **Charts are plain HTML and CSS, no chart library.** The whole dashboard is about 6 KB of gzipped JavaScript and renders on the server. Bars, ranges and a heatmap don't need more, and owning the markup kept accessibility simple: each chart is one Tab stop, the arrow keys move between departments, and every row's accessible name includes its numbers.
- **One color rule per job.** One blue for amounts; blue against orange for "more men" and "more women" (checked for color vision deficiency and contrast with a palette validator); a light-to-dark blue ramp for the heatmap. Selecting a department grays out the rest instead of adding colors.
- **Responsive.** The headline numbers go from two columns to four. Charts stack on narrow screens; on wide screens the two bar charts sit side by side and the age chart and heatmap take the full width. Below 1024 px the nine-column heatmap scrolls inside its card, never the page.
- **Configuration.** The dashboard reads the API from `API_URL` (default `http://localhost:4000`, see [`apps/web/.env.example`](apps/web/.env.example)). On Vercel, set it to the deployed API's URL.

**Tests (23):** the stats and insight sentences (including names like `VictoriaMcDonald`), the API client's error handling, selection across charts, sorting, search, keyboard movement, the table view, and the error card.

## Deployment

Two Vercel projects from this repo, both on Node.js 24.x with `ENABLE_EXPERIMENTAL_COREPACK=1` (so Vercel uses the pnpm version in `packageManager`):

| Project | Root Directory | Preset                | Extra settings                       |
| ------- | -------------- | --------------------- | ------------------------------------ |
| API     | `apps/api`     | Fastify (zero config) | none                                 |
| Web     | `apps/web`     | Next.js               | `API_URL` = the API's production URL |

Every push to `main` deploys both. gRPC is not deployed (see Part 2).

Three things the API needed for Vercel, each found from its build or runtime logs:

- **The entrypoint creates the Fastify app.** Vercel only detects a Fastify entrypoint (`src/index.ts`) that imports `fastify` and creates the instance itself, so it does that and calls `registerRoutes()`. Tests and benchmarks use `buildApp()`, a thin wrapper around the same function.
- **`listen()` is not awaited.** Vercel captures `listen()` while the module loads; a top-level `await` on it kept the module from finishing, and every request hung until it failed with `INTERNAL_FUNCTION_INVOCATION_FAILED`.
- **`undici-types` is hoisted** (`pnpm-workspace.yaml`). Vercel's TypeScript check reads pnpm's symlinked `node_modules` without resolving real paths, so it couldn't reach the `undici-types` that `@types/node` imports, and `Response` came out empty. `tsc` passed; reproducing Vercel's check locally pinned it down.

## Other approaches (for the interview)

The assignment asks for one solution and invites a discussion of others. These are the ones I considered.

### Part 1

| Approach                               | Trade-off                                                                                                                                                                                          |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useReducer` + a custom hook           | No dependency. It can reuse the same pure transitions, with timers in a `useRef(new Map())`. Zustand keeps the timers out of components and lets each component subscribe to only its slice.       |
| Deadline timestamps + one ticker       | Store `expiresAt` per item and check them with one `setInterval`. Makes a numeric countdown ("3 s left") easy and copes better with background-tab timer throttling, but re-renders on every tick. |
| Redux Toolkit + listener middleware    | Timers become side effects in middleware. Good structure for a large app, heavy for this one.                                                                                                      |
| CSS `animationend` triggers the return | Very little JavaScript, but timing then depends on rendering. Can misfire when the tab is hidden or when `prefers-reduced-motion` turns animations off.                                            |

### Part 2

| Approach                                      | Trade-off                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Object.groupBy` + `filter`/`map`/`reduce`    | Reads closer to the spec, but about 2x slower (measured above) and allocates intermediate arrays.                                                                                                                                                                                                                   |
| Response schema (`fast-json-stringify`)       | Documents the response and drops unknown fields. Faster for fixed-shape objects, slower for this map-shaped one.                                                                                                                                                                                                    |
| CDN caching (`Cache-Control: s-maxage=60`)    | On Vercel the CDN would answer repeat requests without running the function at all. The natural next step for the deployed API.                                                                                                                                                                                     |
| Shared cache (Redis, Vercel Runtime Cache)    | Each Vercel instance has its own in-memory cache, so a new instance starts cold. A shared cache fixes that at the cost of a network hop and another service.                                                                                                                                                        |
| Serve stale while refreshing                  | Today the cache expires all at once: the first request after each expiry waits for dummyjson, and if dummyjson is down right then, the API returns 502 although it holds data that is only a minute old. Serving the old value while refreshing in the background (or when the refresh fails) fixes both.           |
| ConnectRPC instead of `@grpc/grpc-js`         | One service definition serves gRPC, gRPC-Web and JSON over HTTP/1.1, so browsers could call it and it could run on Vercel. Needs a code generator (Buf).                                                                                                                                                            |
| Next.js route handler or Hono                 | Could deploy next to the web app. I kept a standalone Fastify service because the assignment asks for an HTTP framework, and it keeps Part 2 independent.                                                                                                                                                           |
| Chart library (Recharts, visx)                | Recharts gives tooltips, animation and responsive containers for free, but its bundle is several times the size of this whole dashboard and it renders in the browser. visx keeps full control but is more code than these simple shapes need. A library pays off for time series, zooming, or thousands of points. |
| Fetching in the browser (SWR, TanStack Query) | Easy polling and per-viewer caching, but the API would need CORS, its URL would be public, and the first paint would wait behind a spinner.                                                                                                                                                                         |

## Known limitations

- **Double-click moves two items.** The second click of a double-click lands on the item that slid up into place. Ignoring clicks with `event.detail > 1` would stop that, but it would also ignore a quick series of single clicks on the top item, so I left the behavior as it is.
- **No dark mode.** The app is light only. The chart palette has dark-mode steps ready if it is added.
- **The cache is per instance.** On Vercel each function instance has its own in-memory cache, and a new instance starts cold. See the shared cache and CDN options above.

## Assumptions

- **Part 1:** item names are unique, so the name serves as the item's id and React key.
- **Part 1:** "the bottom of the main list" means after everything in it at that moment, so items that time out come back in the order they were moved.
- **Part 2:** "users" means all 208 users, not just the first page of 30.
- **Part 2:** `addressUser` keys are `firstName + lastName` with no separator, as in the sample (`TerryMedhurst`). If two people in one department had the same full name, the later one would win. The current data has no such case (208 users, 208 entries).
- **Part 2:** `ageRange` is always `"min-max"`, so a department with one user gives something like `"25-25"`.
- **Part 2:** dummyjson only uses `male` and `female`. Any other value would be counted in neither.
- **Part 2:** the source data is static, so serving a response up to 60 seconds old is fine.
