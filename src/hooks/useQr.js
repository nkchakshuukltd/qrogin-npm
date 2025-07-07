import { useEffect, useRef, useState } from "react";

export function useQr({ baseUrl, customerId, apiKey }, ttlMs = 55000) {
  const [qrSrc, setQrSrc] = useState();
  const [sessionId, setSessionId] = useState();
  const [link, setLink] = useState();
  const [ttl, setTtl] = useState(0);
  const [err, setErr] = useState();

  const timer = useRef();

  const fetchQr = async () => {
    clearInterval(timer.current);
    setErr(undefined);
    setTtl(0);

    try {
      const res = await fetch(baseUrl.replace(/\/$/, "/qr-user"), {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "TENANT_ID": customerId
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const body = await res.json();          // { session_id, qr_src, ttl, link? }
    
      setQrSrc(`data:image/png;base64,${body.qr_png_b64}`);
      setSessionId(body.session_id);
      setLink(body.mobile_url);
      setTtl(Math.round((body.ttl ?? ttlMs) / 1000));

      timer.current = setInterval(
        () => setTtl(t => (t > 0 ? t - 1 : 0)),
        1000
      );
    } catch (e) {
      setErr(e.message || "Unknown error");
    }
  };

  useEffect(() => {
    fetchQr();
    return () => clearInterval(timer.current);
  }, [baseUrl, customerId, apiKey]); 

  return { qrSrc, sessionId, link, ttl, err, refresh: fetchQr };
}
