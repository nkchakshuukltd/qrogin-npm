
import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Typography,
  Box,
  FormControlLabel,
  Switch,
  Tooltip,
} from "@mui/material";
import { useRef } from "react";
import LinearProgress from "@mui/material/LinearProgress";
import { useQr } from "../hooks/useQr";
import { usePollStatus } from "../hooks/usePollStatus";

/**
 * QrWithLink
 * ───────────
 * Renders a QR code with an optional overlay logo plus a secure one‑time link.
 * Users may choose whether that link opens in a *popup* (default) or a *new tab*.
 * The preference is persisted in localStorage so it remembers your last choice.
 *
 * Required props:
 *   ‑ baseUrl, customerId, apiKey  → used by useQr to fetch the QR image and link
 *   ‑ statusBase, onStatus       → used by usePollStatus to poll login status
 *
 * Optional props:
 *   ‑ ttlMs          (QR lifetime in ms)
 *   ‑ logoSrc        (overlay image URL)
 *   ‑ styles         (override style objects for root/img/overlay/linkBtn)
 *   ‑ pollInterval   (ms between status polls, default 3000)
 */
export function QrWithLink({
  baseUrl,
  customerId,
  apiKey,
  ttlMs=87000,
  logoSrc,
  styles = {},
  onStatus,
  statusBase,
  buttonLabel = "Secure One-Time Link",
  pollInterval = 10000,
  maxAttempts = 9
}) {
  // -------------------------------------------------------------------------
  // Hooks for QR + status polling
  // -------------------------------------------------------------------------
    const maxTtlRef = useRef(ttlMs); 
  // if no ttlMs prop was supplied, capture the first ttl value we receive

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

  // -------------------------------------------------------------------------
  // Local state: how should we open the link?
  //   "popup" (default)  → opens in a small child window
  //   "tab"             → opens in a standard background tab
  // -------------------------------------------------------------------------
  const [openMode, setOpenMode] = useState(() => {
    return localStorage.getItem("qroginOpenMode") || "popup";
  });

  useEffect(() => {
    localStorage.setItem("qroginOpenMode", openMode);
  }, [openMode]);

  const [consumed, setConsumed] = useState(false);
  const expired = ttl === 0 || consumed;

  // -------------------------------------------------------------------------
  // Click handler for the secure link button
  // -------------------------------------------------------------------------
  const handleOpen = () => {
    if (!link || ttl === 0) return; // safeguard when QR expired or link missing
    setConsumed(true);
    if (openMode === "popup") {
      // Centre‑ish popup size 600×800; tweak as needed
      const width = 600;
      const height = 800;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const features = [
        `width=${width}`,
        `height=${height}`,
        `left=${left}`,
        `top=${top}`,
        "resizable=yes",
        "scrollbars=yes",
        "noopener",
        "noreferrer",
      ].join(",");

      const popup = window.open(link, "QROGIN_AUTH", features);

      if (popup) {
        popup.focus();
      } else {
        // Most browsers will block only if it wasn't user‑initiated; show fallback
        window.open(link, "_blank", "noopener");
      }
    } else {
      // Standard new tab
      window.open(link, "_blank", "noopener");
    }
  };

  // -------------------------------------------------------------------------
  // Overlay logo element (either image or large letter Q)
  // -------------------------------------------------------------------------
  const overlay = logoSrc ? (
    <img
      src={logoSrc}
      alt="Logo"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "10%",
        background: "#fff",
        objectFit: "contain",
        // padding: "",
        ...styles.overlay,
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
        ...styles.overlay,
      }}
    >
      Q
    </Box>
  );
    const maxSec = maxTtlRef.current / 1000;
  const remaining = expired ? 0 : Math.max(ttl ?? 0, 0);
  const progPct  = (remaining / maxSec) * 100; 
  const barColour = "rgba(240,196,25,0.25)"; // semi-transparent gold
  const baseBg    = "rgba(240,196,25,0.75)";
  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------
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
              filter: expired? "blur(4px)" : "none",
              transition: "filter .3s ease",
              ...styles.img,
            }}
          />

          {/* Overlay logo at centre */}
          <Box
            sx={{
              position: "absolute",
              top: "45%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "18%",
              height: "14%",
            }}
          >
            {overlay}
          </Box>

          {/* {maxTtlRef.current && (
            <Box sx={{ width: 300, mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={(ttl / (maxTtlRef.current/1000)*100)}
                sx={{ height: 6, borderRadius: 3 }}
              />
              
            </Box>
          )} */}

          {/* When QR has expired, show refresh button */}
          {expired && (
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
                onClick={()=>{setConsumed(false);refresh();}}
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

          {/* Secure one‑time link */}
          {link && (
            <Box
              sx={{
                mt: -1,
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Toggle for open‑mode selection */}
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={openMode === "tab"}
                    onChange={(e) =>
                      setOpenMode(e.target.checked ? "tab" : "popup")
                    }
                    inputProps={{ "aria-label": "open in new tab" }}
                  />
                }
                label="Open in new tab"
                sx={{ mb: 1 }}
              />

              {/* <Tooltip title={`Click to open in ${openMode}`}> */}
                {/* <span> */}
                  {/* span wrapper keeps Tooltip happy when Button is disabled */}
                  {/* <Button
                    variant="contained"
                    onClick={handleOpen}
                    disabled={expired}
                    sx={{
                      width: 300, // match QR code width
                      textTransform: "none",
                      ...styles.linkBtn,
                    }}
                  >
                    <Typography
                      sx={{ width: "100%", textAlign: "center" }}
                      variant="subtitle2"
                    >
                      <span
                        style={{
                          fontFamily: "'Fira Mono','Courier New',monospace",
                          fontWeight: 550,
                          fontSize: 20,
                        }}
                      >
                        QROGIN
                      </span>{" "}
                      Secure One‑Time Link
                    </Typography>
                  </Button> */}
                          <span>
                            <Button
                              variant="contained"
                              onClick={handleOpen}
                              disabled={expired}
                              // endIcon={canManuallyRefresh ? <RefreshIcon /> : undefined}
                              sx={{
                                width: 300,
                                textTransform: "none",
                                position: "relative",
                                overflow: "hidden",
                                color: "#000",
                                bgcolor: barColour,
                                "&:hover": { bgcolor: barColour },
                                ...styles.linkBtn,
                                "&::before": {
                                  content: '""',
                                  position: "absolute",
                                  inset: 0,
                                  backgroundColor: baseBg,
                                  transformOrigin: "left",
                                  transform: `scaleX(${progPct / 100})`,
                                  transition: "transform 0.3s linear",
                                  pointerEvents: "none",
                                  borderRadius: "inherit",
                                  zIndex: 0,
                                },
                                "& > *": { position: "relative", zIndex: 1 }, // lift children above bar
                              }}
                            >
<Typography sx={{ width: "100%", textAlign: "center" }} variant="subtitle2">
  {["Continue with", "Login with", "Sign up with"].some(prefix =>
    buttonLabel?.startsWith(prefix)
  ) ? (
    <>
      {buttonLabel}{" "}
      <span
        style={{
          fontFamily: "'Fira Mono','Courier New',monospace",
          fontWeight: 550,
          fontSize: 20,
        }}
      >
        QROGIN
      </span>
    </>
  ) : (
    <>
      <span
        style={{
          fontFamily: "'Fira Mono','Courier New',monospace",
          fontWeight: 550,
          fontSize: 20,
        }}
      >
        QROGIN
      </span>{" "}
      {buttonLabel}
    </>
  )}
</Typography>

                            </Button>
                          </span>
                {/* </span> */}
              {/* </Tooltip> */}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}