import React from "react";

export function IgoeLogoHeader() {
  return (
    <header
      style={{
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        height: 64,
      }}
    >
      <img
        src="/Screenshot 2026-04-15 122815.png"
        alt="igoe"
        style={{ height: 32, width: "auto", display: "block" }}
      />
    </header>
  );
}
