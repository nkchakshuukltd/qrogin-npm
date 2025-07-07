import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Typography,
  Box,
  Tooltip,
  SvgIcon,
} from "@mui/material";
import { useQr } from "../hooks/useQr";
import { usePollStatus } from "../hooks/usePollStatus";

/** Feather-weight refresh icon */
function RefreshIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M17.65 6.35a7.95 7.95 0 0 0-11.3 0l-1.2-1.2a.5.5 0 0 0-.85.35V9a.5.5 0 0 0 .5.5h3.5a.5.5 0 0 0 .35-.85L7.81 7.41a5.96 5.96 0 0 1 8.49 0 5.96 5.96 0 0 1 0 8.49 5.96 5.96 0 0 1-8.49 0 .5.5 0 1 0-.71.71 7.96 7.96 0 0 0 11.3 0 7.96 7.96 0 0 0 0-11.3z" />
    </SvgIcon>
  );
}

export function SecureLinkButton({
  baseUrl,
  customerId,
  apiKey,
  ttlMs = 87_000,
  onStatus,
  statusBase,
  pollInterval = 10_000,
  maxAttempts = 9,
  autoRefreshLimit = 2,
  buttonLabel = "Secure One-Time Link",
  styles = {},
}) {
  /* ─────────── hooks & helpers ─────────── */
  const maxTtlRef = useRef(ttlMs);

  const {
    link,
    ttl,
    sessionId,
    err: qrErr,
    refresh,
  } = useQr({ baseUrl, customerId, apiKey }, ttlMs);

  const handleStatus = useCallback((body) => onStatus?.(body), [onStatus]);

  usePollStatus(
    statusBase,
    sessionId,
    handleStatus,
    pollInterval,
    maxAttempts,
    apiKey,
    customerId,
  );

  const [openMode, setOpenMode] = useState(
    () => localStorage.getItem("qroginOpenMode") || "popup",
  );
  useEffect(() => {
    localStorage.setItem("qroginOpenMode", openMode);
  }, [openMode]);

  const [consumed, setConsumed] = useState(false);
  const [autoCount, setAutoCount] = useState(0);

  useEffect(() => {
    if ((ttl ?? 0) <= 0 && autoCount < autoRefreshLimit) {
      setConsumed(false);
      setAutoCount((c) => c + 1);
      refresh();
    }
  }, [ttl, autoCount, autoRefreshLimit, refresh]);

  const expired = (ttl ?? 0) <= 0 || consumed;
  const canManuallyRefresh = expired && autoCount >= autoRefreshLimit;

  const handleOpen = () => {
    if (!link || expired) return;
    setConsumed(true);

    if (openMode === "popup") {
      const width = 600,
        height = 800,
        left = window.screenX + (window.outerWidth - width) / 2,
        top = window.screenY + (window.outerHeight - height) / 2;

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
      if (popup) popup.focus();
      else window.open(link, "_blank", "noopener");
    } else {
      window.open(link, "_blank", "noopener");
    }
  };

  const handleManualRefresh = () => {
    setConsumed(false);
    setAutoCount(0);
    refresh();
  };

  const maxSec = maxTtlRef.current / 1000;
  const remaining = expired ? 0 : Math.max(ttl ?? 0, 0);
  const progPct  = (remaining / maxSec) * 100; 
  // const progPct = 100-Math.min(
  //   100,
  //   Math.max(0, ((maxSec - ttl) / maxSec) * 100),
  // );

  /* colours */
  const barColour = "rgba(240,196,25,0.25)"; // semi-transparent gold
  const baseBg    = "rgba(240,196,25,0.75)";

  /* render */
  const disabled    = expired && !canManuallyRefresh;
  const handleClick = expired ? handleManualRefresh : handleOpen;

  return (
    <Box sx={{ display: "block", textAlign: "center", ...styles.root }}>
      {qrErr && <p style={{ color: "crimson" }}>{qrErr}</p>}

      <Tooltip title={`Click to ${expired ? "request a new link" : `open in ${openMode}`}`}>
        <span>
          <Button
            variant="contained"
            onClick={handleClick}
            disabled={disabled}
            endIcon={canManuallyRefresh ? <RefreshIcon /> : undefined}
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
      </Tooltip>
    </Box>
  );
}
