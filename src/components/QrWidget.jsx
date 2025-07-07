import React from "react";
import { useRef,useCallback } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useQr } from "../hooks/useQr";
import { usePollStatus } from "../hooks/usePollStatus";
import LinearProgress from "@mui/material/LinearProgress";

export function QrWidget({
  baseUrl,
  customerId,
  apiKey,
  logoSrc,
  ttlMs = 55000,
  styles = {},
  onStatus,
  statusBase,
  pollInterval = 5000,
  maxAttempts = 9
}) {
  const maxTtlRef = useRef(ttlMs); 

 const {
    qrSrc,
    sessionId,
    link,
    ttl,
    err: qrErr,
    refresh,
  } = useQr({ baseUrl, customerId, apiKey }, ttlMs);

  const handleStatus = useCallback(
    (body) => {
      onStatus?.(body);     // forward to parent if supplied
    },
    [onStatus]              // will very rarely change
  );

  const { error: pollErr } = usePollStatus(
    statusBase,
    sessionId,
    handleStatus,
    pollInterval,
    maxAttempts,
    apiKey,
    customerId
  );

  const overlay = logoSrc ? (
    <img
      src={logoSrc}
      alt="Logo"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "5%",
        background: "#fff",
        objectFit: "contain",
        ...styles.overlay
      }}
    />
  ) : (
    <Box
      sx={{
        width: "25%",
        height: "25%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "2rem",
        fontWeight: 700,
        background: "#fff",
        borderRadius: "5%",
        ...styles.overlay
      }}
    >
      Q
    </Box>
  );

  return (
    <Box
      sx={{
        display: "block",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        ...styles.root,
      }}
    >
      {/* Any errors from hooks */}
      {qrErr && <p style={{ color: "crimson" }}>{qrErr}</p>}
      {pollErr && <p style={{ color: "crimson" }}>{pollErr}</p>}

      {qrSrc && (
        <Box sx={{ position: "relative", display: "inline-block" }}>
          <Typography>
            <span
              style={{
                fontFamily: "'Fira Mono','Courier New',monospace",
                fontWeight: 550,
                fontSize: 30,
              }}
            >
              QROGIN
            </span>
          </Typography>

          {/* QR image itself */}
          <img
            src={qrSrc}
            alt="QR code"
            style={{
              width: 300,
              height: 300,
              border: "1px solid #ccc",
              borderRadius: 8,
              filter: ttl===0? "blur(4px)" : "none",
              transition: "filter .3s ease",
              ...styles.img,
            }}
          />

          {/* Overlay logo at centre */}
          <Box
            sx={{
              position: "absolute",
              top: "52%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "18%",
              height: "14%",
            }}
          >
            {overlay}
          </Box>

          {maxTtlRef.current && (
            <Box sx={{ width: 300, mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={(ttl / (maxTtlRef.current/1000)*100)}
                sx={{ height: 6, borderRadius: 3 }}
              />
              
            </Box>
          )}

          {/* When QR has expired, show refresh button */}
          {ttl===0 && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: "rgba(255,255,255,0.6)",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <button
                onClick={refresh}
                style={{
                  padding: "10px 18px",
                  fontWeight: 600,
                  border: "3px solid #f0c419",
                  background: "rgba(255,255,237,.9)",
                  cursor: "pointer",
                }}
              >
                New code
              </button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
