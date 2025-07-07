

// import { useEffect, useRef, useState } from "react";

// export function usePollStatus(
//   base,
//   sessionId,
//   onStatus,
//   interval = 5000,
//   maxAttempts = 12,
//   apiKey,
//   customerId
// ) {
//   const timerRef    = useRef();
//   const attemptRef  = useRef(0);
//   const onStatusRef = useRef(onStatus);

//   const [data,  setData]  = useState();
//   const [error, setError] = useState();

//   /* keep latest onStatus */
//   useEffect(() => { onStatusRef.current = onStatus; }, [onStatus]);

//   useEffect(() => {
//     if (!base || !sessionId || !apiKey) return;

//     clearInterval(timerRef.current);
//     attemptRef.current = 0;

//     /* build URL safely */
//     const urlObj = new URL(base);          // works even if base already has query
//     //urlObj.searchParams.set("session_id", sessionId);
//     const url = urlObj.toString();

//     const fetchStatus = async () => {
//       if (++attemptRef.current > maxAttempts) {
//         clearInterval(timerRef.current);
//         return;
//       }

//       try {
//         const res = await fetch(url, {
//           method: "GET",
//           headers: {
//             "x-api-key": apiKey,
//             "TENANT_ID": customerId,
//             "session_id":sessionId 
//           }
//         });

//         if (!res.ok) throw new Error(`HTTP ${res.status}`);

//         const body = await res.json();
//         setData(body);
//         setError(undefined);
//         onStatusRef.current?.(body);

//         if (["AUTHENTICATED", "DENIED", "EXPIRED"].includes(body.status)) {
//           clearInterval(timerRef.current);
//         }
//       } catch (e) {
//         setError(e.message || "Unknown error");
//       }
//     };

//     fetchStatus();
//     timerRef.current = setInterval(fetchStatus, interval);
//     return () => clearInterval(timerRef.current);

//   }, [base, sessionId, interval, maxAttempts, apiKey, customerId]);

//   return { data, error };
// }

import { useEffect, useRef, useState } from "react";

export function usePollStatus(
  base,
  sessionId,
  onStatus,
  interval = 5000,         // kept for fallback compatibility
  maxAttempts = 12,
  apiKey,
  customerId
) {
  const timerRef = useRef(null);
  const attemptRef = useRef(0);
  const onStatusRef = useRef(onStatus);

  const [data, setData] = useState();
  const [error, setError] = useState();

  useEffect(() => {
    onStatusRef.current = onStatus;
  }, [onStatus]);

  useEffect(() => {
    if (!base || !sessionId || !apiKey) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    attemptRef.current = 0;

    const urlObj = new URL(base);
    const url = urlObj.toString();

    // Create non-linear delay pattern
    const delayPattern = generateNonLinearDelays(maxAttempts);

    const fetchStatus = async () => {
      const attempt = attemptRef.current++;
      if (attempt >= maxAttempts) return;

      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "x-api-key": apiKey,
            "TENANT_ID": customerId,
            "session_id": sessionId
          }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const body = await res.json();
        setData(body);
        setError(undefined);
        onStatusRef.current?.(body);

        if (["AUTHENTICATED", "DENIED", "EXPIRED"].includes(body.status)) return;

      } catch (e) {
        setError(e.message || "Unknown error");
      }

      // Schedule next call using precomputed delay
      timerRef.current = setTimeout(fetchStatus, delayPattern[attempt] || interval);
    };

    fetchStatus();
    return () => clearTimeout(timerRef.current);
  }, [base, sessionId, apiKey, customerId, maxAttempts]);

  return { data, error };
}

// Example normal-distribution-like spacing: more attempts between 10s–40s
function generateNonLinearDelays(maxAttempts) {
  const delays = [];
  const mean = 25000; // peak density around 25s
  const stdDev = 10000; // spread of distribution
  const totalSpan = 60000; // total polling window (60s)

  const gaussian = (x) =>
    (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
    Math.exp(-((x - mean) ** 2) / (2 * stdDev ** 2));

  const step = totalSpan / maxAttempts;
  let time = 0;

  for (let i = 0; i < maxAttempts; i++) {
    const weight = gaussian(time);
    delays.push(step * (1 + weight * 30)); // scale weight into ms offset
    time += step;
  }

  return delays;
}
