# Why Option Chain Isn’t “True” Real-Time (and What Limits It)

## How the data flows

```
[Exchange / FYERS] → [Option Chain Service] → [API] → [Frontend]
```

1. **Frontend** polls `GET /api/option-chain/NIFTY` every **2 seconds**.
2. **Option chain service** does **not** read from DB for this API. For each request it:
   - Fetches **spot price** (from FYERS bridge or market-data service),
   - Calls **FYERS** (or mock) to get option chain (OI, LTP, etc.),
   - Returns that snapshot.
3. So **every time the frontend polls, the backend fetches fresh data**. The 15s **scheduler** only writes to MongoDB (e.g. for history); it does **not** control how fresh the “latest” API response is.

So in theory the option chain on screen is at most **~2 seconds old** (one poll interval).

---

## What can still cause “delay” or stale feeling

1. **HTTP caching**  
   Browser or gateway may cache `GET /api/option-chain/NIFTY`. Then the UI can show an old response even though the backend would return new data if the request reached it.  
   **Fix:** Send `Cache-Control: no-store` (and optionally `Pragma: no-cache`) from the API, and optionally add a cache-busting query param (e.g. `?t=<timestamp>`) on the frontend so every poll is a distinct, uncached request.

2. **FYERS rate limit**  
   FYERS has a **daily** limit (e.g. 10,000 requests/day). Polling every 1s for NIFTY + BANKNIFTY = 2 req/s → 7,200/hour → you can hit the daily cap in a few hours. So we don’t poll every 1s; we use **2s** (or 5s) to balance freshness vs rate limit. That’s why we say “as fast as possible” instead of “every second no matter what.”

3. **Mock data**  
   With `MOCK_KEY`, the service returns **random** OI/LTP each time. It’s “new” every 2s but not real market movement, so it can feel odd or “not real-time” in a different way.

4. **Real-time would require push**  
   True real-time (no poll delay at all) would need the **data source** (e.g. FYERS/NSE) to **push** updates (e.g. WebSocket). Our stack today is **pull**: we ask every 2s. So there will always be up to one poll interval of delay.

---

## Summary

| What                    | Cause of delay / limit                          |
|-------------------------|--------------------------------------------------|
| “Not real-time”         | We **poll** every 2s; real-time needs **push**.  |
| “As fast as possible”   | FYERS **rate limit** (daily cap) limits how often we can poll. |
| Stale / same data       | **Caching** (browser/gateway) can return old response. |
| Spot mismatch (fixed)   | Spot in option chain now comes from **live ticker** (same as NIFTY 50). |

So: **option chain data is refreshed on every API call (every 2s from the frontend)**. The main things that can still make it feel delayed are caching and the 2s poll interval; the 15s scheduler is **not** the bottleneck for the “latest” API response.
