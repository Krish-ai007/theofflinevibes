// ─── EVENT REGISTRATION SYSTEM v2 ────────────────────────────────────────────
// ✅ 4-step flow: Overview → Form → Event Info → Ticket
// ✅ Free/Paid detection (₹0 = FREE badge)
// ✅ Duplicate prevention (phone + eventId)
// ✅ Unique TOV-XXXXXXXX ticket IDs
// ✅ QR code (volunteer scannable JSON payload)
// ✅ Save as Image  — canvas-drawn PNG download (no library needed)
// ✅ Print Ticket   — opens a dedicated popup window, prints only the ticket
// ✅ Auto Email     — sends ticket via EmailJS from theofflinevibes@gmail.com
// ✅ Volunteer QR scanner with live attended list
// ✅ Fully responsive (mobile-first)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";

// ══════════════════════════════════════════════════════════════════════════════
//  EMAILJS SETUP (one-time, 5 minutes)
//  1. Go to https://www.emailjs.com  →  sign up free
//  2. Add Service → Gmail → connect theofflinevibes@gmail.com
//  3. Email Templates → Create template with these variables:
//       {{to_name}}  {{to_email}}  {{event_title}}  {{event_date}}
//       {{event_venue}}  {{ticket_id}}  {{ticket_type}}  {{qr_url}}
//     Subject example:  🎟️ Your ticket for {{event_title}} — The Offline Vibes
//  4. Account → API Keys → copy Public Key
//  5. Fill in the three constants below:
// ══════════════════════════════════════════════════════════════════════════════
const EMAILJS_SERVICE_ID  = "service_ilnnpvp";   // e.g. "service_abc123"
const EMAILJS_TEMPLATE_ID = "template_k6ry7a2";  // e.g. "template_xyz789"
const EMAILJS_PUBLIC_KEY  = "Q_RhYxXNpoERKYpI7";   // e.g. "user_XXXXXXXXXXXX"

// ── Utility helpers ──────────────────────────────────────────────────────────
const genTicketId = () =>
  "TOV-" +
  Math.random().toString(36).substr(2,4).toUpperCase() +
  Math.random().toString(36).substr(2,4).toUpperCase();

const nowDate = () =>
  new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
const nowTime = () =>
  new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});

const qrUrl = (text, size = 240) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=H&data=${encodeURIComponent(text)}`;

const buildQrData = (ticketId, name, eventTitle) =>
  JSON.stringify({ tid: ticketId, name, event: eventTitle });

// ── EmailJS sender ───────────────────────────────────────────────────────────
async function sendTicketEmail({ toEmail, toName, eventTitle, eventDate, eventVenue, ticketId, isFree, price }) {
  // Dynamically load EmailJS SDK so you don't need to touch index.html
  if (!window.emailjs) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
    window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  const qrData = buildQrData(ticketId, toName, eventTitle);

  return window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_email:          toEmail,
    to_name:           toName,
    event_title:       eventTitle,
    event_date:        eventDate  || "TBA",
    event_venue:       eventVenue || "TBA",
    ticket_id:         ticketId,
    ticket_type:       isFree ? "FREE" : `₹${price}`,
    ticket_type_label: isFree ? "FREE" : "PAID",
    // Badge colours — referenced in the HTML template
    badge_bg:          isFree ? "rgba(67,160,71,0.22)"  : "rgba(255,112,67,0.20)",
    badge_color:       isFree ? "#66BB6A"                : "#FF7043",
    entry_badge_bg:    isFree ? "#E8F5E9"                : "#FFF0EA",
    entry_badge_color: isFree ? "#1B5E20"                : "#C94A00",
    qr_url:            qrUrl(qrData, 200),
    reply_to:          "theofflinevibes@gmail.com",
  });
}

// ── Print: opens a dedicated popup window, prints only the ticket ────────────
function printTicket({ ticketId, name, eventTitle, eventDate, eventVenue, phone, gender, isFree, price }) {
  const qrSrc = qrUrl(buildQrData(ticketId, name, eventTitle), 260);
  const badgeBg  = isFree ? "rgba(67,160,71,0.22)"   : "rgba(255,112,67,0.20)";
  const badgeFg  = isFree ? "#66BB6A"                 : "#FF7043";
  const badgeTxt = isFree ? "FREE"                    : "PAID";
  const entryTxt = isFree ? "FREE ✅"                  : `₹${price}`;

  const rows = [
    ["Name",    name],
    ["Event",   eventTitle],
    ["Date",    eventDate  || "TBA"],
    ["Venue",   eventVenue || "TBA"],
    ["Contact", phone],
    ["Gender",  gender],
    ["Entry",   entryTxt],
  ];

  const rowsHtml = rows.map(([k,v]) => `
    <div class="row">
      <span class="k">${k}</span>
      <span class="v">${v || "—"}</span>
    </div>`).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Ticket ${ticketId} — The Offline Vibes</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Instrument+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#f5f0eb;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:'Instrument Sans',Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .ticket{background:linear-gradient(145deg,#1C1917,#2D2420);border-radius:22px;width:360px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.35)}
  .th{padding:18px 22px 14px;border-bottom:1px dashed rgba(255,255,255,.14);display:flex;justify-content:space-between;align-items:center}
  .brand{font-family:'Bricolage Grotesque',sans-serif;font-size:14px;font-weight:800;color:#fff;display:flex;align-items:center;gap:8px}
  .dot{width:7px;height:7px;border-radius:50%;background:#43A047;flex-shrink:0}
  .badge{background:${badgeBg};color:${badgeFg};border-radius:100px;font-size:10px;font-weight:700;padding:3px 12px;letter-spacing:1px;text-transform:uppercase}
  .tb{padding:20px 22px}
  .qr-wrap{display:flex;flex-direction:column;align-items:center;margin-bottom:16px}
  .qr-frame{width:156px;height:156px;background:#fff;border-radius:16px;padding:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.4)}
  .qr-frame img{width:100%;height:100%;display:block}
  .qr-hint{font-size:10px;color:rgba(255,255,255,.3);margin-top:8px;letter-spacing:.5px;text-align:center}
  .tid{font-family:'Courier New',monospace;font-size:16px;font-weight:700;color:#FF7043;text-align:center;letter-spacing:3px;margin-bottom:14px}
  .row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:12px}
  .row:last-child{border-bottom:none}
  .k{color:rgba(255,255,255,.4);font-weight:600}
  .v{color:#fff;font-weight:700;text-align:right;max-width:200px}
  .status{background:rgba(67,160,71,.15);border-top:1px dashed rgba(255,255,255,.1);padding:12px 22px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:11px;font-weight:700;color:#66BB6A;letter-spacing:.5px}
  @media print{body{background:#fff}.ticket{box-shadow:none}}
</style>
</head>
<body>
<div class="ticket">
  <div class="th">
    <div class="brand"><div class="dot"></div>The Offline Vibes</div>
    <div class="badge">${badgeTxt}</div>
  </div>
  <div class="tb">
    <div class="qr-wrap">
      <div class="qr-frame"><img src="${qrSrc}" alt="QR Code" crossorigin="anonymous"></div>
      <div class="qr-hint">SCAN AT ENTRY GATE</div>
    </div>
    <div class="tid">${ticketId}</div>
    ${rowsHtml}
  </div>
  <div class="status"><span>✅</span><span>REGISTRATION CONFIRMED</span></div>
</div>
<script>
  // Wait for QR image to load before printing
  var img = document.querySelector('.qr-frame img');
  function doPrint() { window.focus(); window.print(); }
  if (img.complete) { setTimeout(doPrint, 400); }
  else { img.onload = function(){ setTimeout(doPrint, 400); }; }
  window.onafterprint = function(){ window.close(); };
<\/script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=500,height=720,scrollbars=no,toolbar=no,menubar=no");
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
  } else {
    alert("Pop-up was blocked. Please allow pop-ups for this site and try again.");
  }
}

// ── Save as Image: canvas-drawn PNG, no libraries ────────────────────────────
function roundRect(ctx, x, y, w, h, r, fillStyle) {
  const radii = Array.isArray(r) ? r : [r, r, r, r];
  ctx.beginPath();
  ctx.moveTo(x + radii[0], y);
  ctx.lineTo(x + w - radii[1], y);
  ctx.arcTo(x + w, y,         x + w, y + radii[1], radii[1]);
  ctx.lineTo(x + w, y + h - radii[2]);
  ctx.arcTo(x + w, y + h,     x + w - radii[2], y + h, radii[2]);
  ctx.lineTo(x + radii[3], y + h);
  ctx.arcTo(x, y + h,         x, y + h - radii[3], radii[3]);
  ctx.lineTo(x, y + radii[0]);
  ctx.arcTo(x, y,             x + radii[0], y, radii[0]);
  ctx.closePath();
  if (fillStyle !== undefined) { ctx.fillStyle = fillStyle; ctx.fill(); }
}

async function downloadTicketImage({ ticketId, name, eventTitle, eventDate, eventVenue, phone, gender, isFree, price }) {
  const qrSrc = qrUrl(buildQrData(ticketId, name, eventTitle), 200);

  const qrImg = await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error("QR load failed"));
    img.src = qrSrc;
  });

  const SCALE = 2;         // retina
  const W = 380, H = 596;
  const canvas = document.createElement("canvas");
  canvas.width  = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  // ── Card background ──
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#1C1917");
  grad.addColorStop(1, "#2D2420");
  roundRect(ctx, 0, 0, W, H, 20, grad);

  // ── Subtle header area ──
  roundRect(ctx, 0, 0, W, 58, [20, 20, 0, 0], "rgba(255,255,255,0.03)");

  // ── Brand dot ──
  ctx.beginPath();
  ctx.arc(24, 29, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#43A047";
  ctx.fill();

  // ── Brand text ──
  ctx.font = "700 13px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("The Offline Vibes", 36, 33);

  // ── Entry badge ──
  const badgeTxt = isFree ? "FREE" : "PAID";
  const badgeBg  = isFree ? "rgba(67,160,71,0.22)"  : "rgba(255,112,67,0.20)";
  const badgeFg  = isFree ? "#66BB6A"                : "#FF7043";
  const bW = 48, bH = 20;
  const bX = W - bW - 18, bY = 19;
  roundRect(ctx, bX, bY, bW, bH, 10, badgeBg);
  ctx.font = "700 10px Arial";
  ctx.fillStyle = badgeFg;
  ctx.textAlign = "center";
  ctx.fillText(badgeTxt, bX + bW / 2, bY + 14);
  ctx.textAlign = "left";

  // ── Dashed header divider ──
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 58); ctx.lineTo(W, 58); ctx.stroke();
  ctx.restore();

  // ── QR code ──
  const qrSize = 144;
  const qrX = (W - qrSize) / 2;
  const qrY = 76;
  roundRect(ctx, qrX - 9, qrY - 9, qrSize + 18, qrSize + 18, 16, "#ffffff");
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // ── "Scan at entry" ──
  ctx.font = "500 10px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.textAlign = "center";
  ctx.fillText("SCAN AT ENTRY GATE", W / 2, qrY + qrSize + 22);

  // ── Ticket ID ──
  ctx.font = "bold 16px 'Courier New', monospace";
  ctx.fillStyle = "#FF7043";
  ctx.fillText(ticketId, W / 2, qrY + qrSize + 44);
  ctx.textAlign = "left";

  // ── Detail rows ──
  const rows = [
    ["Name",    name],
    ["Event",   eventTitle],
    ["Date",    eventDate  || "TBA"],
    ["Venue",   eventVenue || "TBA"],
    ["Contact", phone],
    ["Gender",  gender],
    ["Entry",   isFree ? "FREE" : `\u20B9${price}`],
  ];

  let ry = qrY + qrSize + 62;
  ctx.save();
  rows.forEach(([k, v]) => {
    // row divider
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(18, ry - 3); ctx.lineTo(W - 18, ry - 3); ctx.stroke();

    ctx.font = "600 11px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText(k, 20, ry + 11);

    ctx.font = "bold 11px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    const val = String(v || "—").slice(0, 34);
    ctx.fillText(val, W - 20, ry + 11);
    ctx.textAlign = "left";
    ry += 28;
  });
  ctx.restore();

  // ── Status bar ──
  roundRect(ctx, 0, H - 44, W, 44, [0, 0, 20, 20], "rgba(67,160,71,0.14)");
  // dashed top border
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, H - 44); ctx.lineTo(W, H - 44); ctx.stroke();
  ctx.restore();

  ctx.font = "bold 11px Arial";
  ctx.fillStyle = "#66BB6A";
  ctx.textAlign = "center";
  ctx.fillText("✅  REGISTRATION CONFIRMED", W / 2, H - 18);
  ctx.textAlign = "left";

  // ── Trigger download ──
  const link = document.createElement("a");
  link.download = `${ticketId}.png`;
  link.href = canvas.toDataURL("image/png", 1.0);
  link.click();
}

// ── STYLES ───────────────────────────────────────────────────────────────────
export const REGISTRATION_STYLES = `
/* Overlay */
.reg-overlay{position:fixed;inset:0;background:rgba(10,8,6,.82);z-index:4000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(14px);animation:regFadeIn .2s ease}
@keyframes regFadeIn{from{opacity:0}to{opacity:1}}

/* Modal box */
.reg-box{background:#FEF6EC;border-radius:28px;width:100%;max-width:520px;max-height:94vh;overflow-y:auto;overflow-x:hidden;animation:regSlideUp .32s cubic-bezier(.34,1.56,.64,1) both;box-shadow:0 28px 80px rgba(10,8,6,.28);position:relative}
@keyframes regSlideUp{from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}

/* Progress */
.reg-progress{height:3px;background:rgba(28,25,23,.1);border-radius:3px;margin:0 28px;overflow:hidden}
.reg-progress-fill{height:100%;background:#FF7043;border-radius:3px;transition:width .4s cubic-bezier(.4,0,.2,1)}
.reg-steps{display:flex;gap:6px;margin:10px 28px 0}
.reg-step-dot{height:4px;border-radius:4px;background:rgba(28,25,23,.1);flex:1;transition:background .3s}
.reg-step-dot.done{background:#FF7043}
.reg-step-dot.active{background:#FFB300}

/* Header */
.reg-hd{padding:18px 28px 0;display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.reg-hd-left{flex:1}
.reg-step-label{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#FF7043;margin-bottom:4px;display:block}
.reg-hd-title{font-family:'Bricolage Grotesque',sans-serif;font-size:20px;font-weight:800;color:#1C1917;line-height:1.2;letter-spacing:-.4px}
.reg-hd-sub{font-size:13px;color:#78716C;margin-top:3px}
.reg-x{width:32px;height:32px;border-radius:50%;background:rgba(28,25,23,.08);border:none;color:#78716C;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;transition:all .2s}
.reg-x:hover{background:#FF7043;color:#fff}

/* Body */
.reg-body{padding:18px 28px 28px}

/* Free badge */
.free-badge{display:inline-flex;align-items:center;gap:6px;background:#E8F5E9;color:#1B5E20;border:1.5px solid rgba(27,94,32,.2);border-radius:100px;font-size:12px;font-weight:700;padding:5px 14px;letter-spacing:.5px}

/* Event summary card */
.ev-summary{background:#1C1917;border-radius:18px;padding:20px;margin-bottom:18px;position:relative;overflow:hidden}
.ev-summary::before{content:'';position:absolute;top:-40px;right:-40px;width:140px;height:140px;border-radius:50%;background:radial-gradient(circle,rgba(255,112,67,.18),transparent 70%)}
.ev-sum-type{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#FF7043;margin-bottom:6px}
.ev-sum-title{font-family:'Bricolage Grotesque',sans-serif;font-size:17px;font-weight:700;color:#fff;margin-bottom:12px;line-height:1.3}
.ev-sum-row{display:flex;align-items:center;gap:8px;font-size:12px;color:rgba(255,255,255,.55);margin-bottom:4px}
.ev-sum-price{display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.1)}
.ev-price-label{font-size:11px;color:rgba(255,255,255,.4);font-weight:600}
.ev-price-val{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;font-weight:800;color:#FF7043}

/* Form fields */
.rf{margin-bottom:14px}
.rf label{display:block;font-size:11px;font-weight:700;color:#57534E;margin-bottom:6px;letter-spacing:.5px;text-transform:uppercase}
.rf input,.rf select{width:100%;padding:12px 16px;background:#fff;border:1.5px solid rgba(28,25,23,.12);border-radius:12px;font-family:'Instrument Sans',sans-serif;font-size:15px;color:#1C1917;outline:none;transition:all .2s;-webkit-appearance:none;appearance:none}
.rf input:focus,.rf select:focus{border-color:#FF7043;box-shadow:0 0 0 4px rgba(255,112,67,.12)}
.rf input::placeholder{color:#A8A29E}
.rf input.err,.rf select.err{border-color:#C62828;background:#FFF5F5}
.rf-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.rf-err{font-size:11px;color:#C62828;margin-top:4px;font-weight:600}

/* Event info */
.ev-info-section{margin-bottom:20px}
.ev-info-section h4{font-family:'Bricolage Grotesque',sans-serif;font-size:12px;font-weight:700;color:#FF7043;text-transform:uppercase;letter-spacing:1px;margin-bottom:9px;display:flex;align-items:center;gap:6px}
.ev-info-card{background:#fff;border:1.5px solid rgba(28,25,23,.08);border-radius:14px;padding:14px}
.ev-info-row{display:flex;gap:9px;align-items:flex-start;padding:7px 0;border-bottom:1px solid rgba(28,25,23,.06);font-size:12px}
.ev-info-row:last-child{border-bottom:none;padding-bottom:0}
.ev-info-row-text{flex:1;color:#57534E}
.ev-info-row-text strong{color:#1C1917;display:block;font-size:12px;margin-bottom:1px}
.ev-chip-list{display:flex;flex-wrap:wrap;gap:6px}
.ev-chip{background:#F5F0EB;color:#57534E;border:1px solid rgba(28,25,23,.1);border-radius:100px;font-size:11px;font-weight:600;padding:3px 10px}
.ev-chip.green{background:#E8F5E9;color:#1B5E20;border-color:rgba(27,94,32,.15)}
.ev-chip.red{background:#FFEBEE;color:#C62828;border-color:rgba(198,40,40,.15)}
.ev-map-link{background:#F5F0EB;border-radius:10px;height:44px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#A8A29E;gap:7px;margin-top:8px;border:1px solid rgba(28,25,23,.08);text-decoration:none;transition:all .2s}
.ev-map-link:hover{background:#EDE8E3;color:#57534E}

/* Ticket */
.ticket-wrap{background:linear-gradient(145deg,#1C1917,#2D2420);border-radius:20px;overflow:hidden;margin-bottom:12px}
.ticket-header{padding:16px 20px;border-bottom:1px dashed rgba(255,255,255,.12);display:flex;justify-content:space-between;align-items:center}
.ticket-brand{font-family:'Bricolage Grotesque',sans-serif;font-size:14px;font-weight:800;color:#fff;display:flex;align-items:center;gap:8px}
.ticket-live-dot{width:7px;height:7px;border-radius:50%;background:#43A047;animation:tldot 2s infinite;flex-shrink:0}
@keyframes tldot{0%,100%{box-shadow:0 0 0 0 rgba(67,160,71,.5)}60%{box-shadow:0 0 0 7px rgba(67,160,71,0)}}
.ticket-badge{border-radius:100px;font-size:10px;font-weight:700;padding:3px 11px;letter-spacing:1px;text-transform:uppercase}
.ticket-badge-paid{background:rgba(255,112,67,.18);color:#FF7043}
.ticket-badge-free{background:rgba(67,160,71,.2);color:#66BB6A}
.ticket-body{padding:16px 20px}
.ticket-qr-wrap{display:flex;flex-direction:column;align-items:center;margin-bottom:14px}
.ticket-qr-frame{width:150px;height:150px;background:#fff;border-radius:16px;padding:9px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 28px rgba(0,0,0,.4)}
.ticket-qr-frame img{width:100%;height:100%;display:block}
.ticket-qr-hint{font-size:10px;color:rgba(255,255,255,.3);margin-top:7px;letter-spacing:.5px;text-align:center}
.ticket-id{font-family:'Courier New',monospace;font-size:15px;font-weight:700;color:#FF7043;text-align:center;letter-spacing:2px;margin-bottom:13px}
.ticket-row{display:flex;justify-content:space-between;align-items:flex-start;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:12px;gap:8px}
.ticket-row:last-child{border-bottom:none}
.ticket-k{color:rgba(255,255,255,.38);font-weight:600;flex-shrink:0}
.ticket-v{color:#fff;font-weight:600;text-align:right}
.ticket-status-bar{background:rgba(67,160,71,.15);border-top:1px dashed rgba(255,255,255,.1);padding:11px 20px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:11px;font-weight:700;color:#66BB6A;letter-spacing:.5px}

/* Dup box */
.dup-box{background:#FFF8E1;border:1.5px solid rgba(255,179,0,.3);border-radius:14px;padding:18px;text-align:center;margin-bottom:14px}
.dup-title{font-family:'Bricolage Grotesque',sans-serif;font-size:17px;font-weight:700;color:#1C1917;margin-bottom:5px}
.dup-sub{font-size:13px;color:#78716C;line-height:1.6}

/* Buttons */
.reg-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px 24px;border:none;border-radius:100px;cursor:pointer;font-family:'Instrument Sans',sans-serif;font-size:15px;font-weight:700;transition:all .22s;letter-spacing:.1px}
.reg-btn-primary{background:#FF7043;color:#fff;box-shadow:0 4px 18px rgba(255,112,67,.3)}
.reg-btn-primary:hover{background:#F4511E;transform:translateY(-2px);box-shadow:0 8px 28px rgba(255,112,67,.35)}
.reg-btn-primary:disabled{opacity:.55;transform:none;box-shadow:none;cursor:not-allowed}
.reg-btn-secondary{background:rgba(28,25,23,.07);color:#57534E;border:1.5px solid rgba(28,25,23,.12)}
.reg-btn-secondary:hover{background:rgba(28,25,23,.12);transform:translateY(-1px)}
.reg-btn-secondary:disabled{opacity:.55;transform:none;cursor:not-allowed}
.reg-btn-free{background:#43A047;color:#fff;box-shadow:0 4px 18px rgba(67,160,71,.3)}
.reg-btn-free:hover{background:#388E3C;transform:translateY(-2px)}
.reg-btn-free:disabled{opacity:.55;transform:none;cursor:not-allowed}
.reg-btn-row{display:flex;gap:10px;margin-top:8px}
.reg-btn-row .reg-btn{flex:1}

/* Email status */
.email-status{display:flex;align-items:center;gap:8px;font-size:12px;padding:9px 14px;border-radius:10px;margin-bottom:12px;font-weight:600}
.email-sending{background:rgba(255,179,0,.1);color:#78716C;border:1px solid rgba(255,179,0,.22)}
.email-sent{background:#E8F5E9;color:#1B5E20;border:1px solid rgba(27,94,32,.15)}
.email-failed{background:#FFEBEE;color:#C62828;border:1px solid rgba(198,40,40,.12)}

/* Loading */
.reg-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;gap:14px}
.reg-spinner{width:36px;height:36px;border:3px solid rgba(255,112,67,.2);border-top-color:#FF7043;border-radius:50%;animation:rspin .7s linear infinite}
@keyframes rspin{to{transform:rotate(360deg)}}

/* Scanner */
.scanner-overlay{position:fixed;inset:0;background:rgba(10,8,6,.9);z-index:5000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(16px);animation:regFadeIn .2s ease}
.scanner-box{background:#FEF6EC;border-radius:28px;width:100%;max-width:480px;max-height:92vh;overflow-y:auto;box-shadow:0 28px 80px rgba(10,8,6,.4);animation:regSlideUp .3s cubic-bezier(.34,1.56,.64,1) both}
.scanner-hd{padding:22px 24px 0;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.scanner-hd-title{font-family:'Bricolage Grotesque',sans-serif;font-size:19px;font-weight:800;color:#1C1917;letter-spacing:-.3px}
.scanner-body{padding:0 24px 24px}
.scanner-input-wrap{background:#fff;border:2px solid #FF7043;border-radius:14px;display:flex;align-items:center;overflow:hidden;margin-bottom:16px;box-shadow:0 0 0 4px rgba(255,112,67,.1)}
.scanner-input{flex:1;padding:13px 15px;border:none;outline:none;font-family:'Courier New',monospace;font-size:15px;color:#1C1917;background:transparent;letter-spacing:1px}
.scanner-input::placeholder{color:#A8A29E;font-family:'Instrument Sans',sans-serif;letter-spacing:0}
.scanner-search-btn{background:#FF7043;color:#fff;border:none;padding:13px 17px;cursor:pointer;font-size:18px;transition:background .2s}
.scanner-search-btn:hover{background:#F4511E}
.scan-result{border-radius:14px;padding:16px;margin-bottom:12px;border:1.5px solid}
.scan-result.success{background:#E8F5E9;border-color:rgba(27,94,32,.2)}
.scan-result.already{background:#FFF8E1;border-color:rgba(255,179,0,.3)}
.scan-result.error{background:#FFEBEE;border-color:rgba(198,40,40,.15)}
.scan-result-name{font-family:'Bricolage Grotesque',sans-serif;font-size:19px;font-weight:800;color:#1C1917;margin-bottom:3px}
.scan-result-id{font-family:'Courier New',monospace;font-size:12px;font-weight:700;color:#FF7043;margin-bottom:8px}
.scan-result-meta{font-size:12px;color:#78716C;line-height:1.65}
.scan-attend-btn{width:100%;padding:11px;border:none;border-radius:100px;background:#43A047;color:#fff;cursor:pointer;font-family:'Instrument Sans',sans-serif;font-size:14px;font-weight:700;margin-top:10px;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px}
.scan-attend-btn:hover{background:#388E3C;transform:translateY(-1px)}
.scan-attend-btn:disabled{opacity:.55;cursor:not-allowed;transform:none}
.attended-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(28,25,23,.08);font-size:12px}
.attended-row:last-child{border-bottom:none}
.attended-badge{background:#E8F5E9;color:#1B5E20;border-radius:100px;font-size:9px;font-weight:700;padding:3px 9px;letter-spacing:.5px}

/* Responsive */
@media(max-width:540px){
  .reg-box{border-radius:20px}
  .reg-hd,.reg-body{padding-left:18px;padding-right:18px}
  .reg-progress,.reg-steps{margin-left:18px;margin-right:18px}
  .rf-row{grid-template-columns:1fr}
  .reg-btn-row{flex-direction:column}
  .ticket-qr-frame{width:130px;height:130px}
}
`;

// ── STEP LABELS ───────────────────────────────────────────────────────────────
const STEP_LABELS = ["Event", "Details", "About Event", "Ticket"];

// ─────────────────────────────────────────────────────────────────────────────
//  EventModal
// ─────────────────────────────────────────────────────────────────────────────
export function EventModal({ event, onClose, fbAdd, fbGet, fbUpdate }) {
  const isFree = !event.price || parseInt(event.price) === 0;

  const [step,        setStep]        = useState(1);
  const [form,        setForm]        = useState({ firstName:"", lastName:"", gender:"", phone:"", email:"" });
  const [errors,      setErrors]      = useState({});
  const [busy,        setBusy]        = useState(false);
  const [ticketId,    setTicketId]    = useState("");
  const [dupTicket,   setDupTicket]   = useState(null);
  const [emailStatus, setEmailStatus] = useState(null); // null | 'sending' | 'sent' | 'failed'
  const [saving,      setSaving]      = useState(false);

  const upd = k => e => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setErrors(p => ({ ...p, [k]: "" }));
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.firstName.trim())  e.firstName = "Required";
    if (!form.lastName.trim())   e.lastName  = "Required";
    if (!form.gender)            e.gender    = "Please select";
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g,"")))
      e.phone = "Enter valid 10-digit Indian mobile number";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter valid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Step 2 → 3: check duplicate ────────────────────────────────────────────
  const checkDuplicate = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      const regs = await fbGet("registrations");
      const existing = regs.find(r =>
        r.eventId === event.id &&
        r.phone?.replace(/\s/g,"") === form.phone.replace(/\s/g,"")
      );
      if (existing) {
        setDupTicket(existing);
        setTicketId(existing.ticketId);
        setStep(4);
      } else {
        setStep(3);
      }
    } catch {
      setStep(3); // network error — let them proceed, Firestore will catch on submit
    } finally {
      setBusy(false);
    }
  };

  // ── Step 3 → 4: save registration + send email ─────────────────────────────
  const confirm = async () => {
    if (dupTicket) { onClose(); return; }
    setBusy(true);
    try {
      const tid      = genTicketId();
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;
      setTicketId(tid);
      await fbAdd("registrations", {
        firstName:  form.firstName.trim(),
        lastName:   form.lastName.trim(),
        name:       fullName,
        gender:     form.gender,
        phone:      form.phone.trim(),
        email:      form.email.trim(),
        eventId:    event.id,
        eventTitle: event.title,
        eventDate:  event.date,
        eventVenue: event.venue || "",
        ticketId:   tid,
        price:      isFree ? "0" : event.price,
        status:     "paid",
        attended:   false,
        date:       nowDate(),
        time:       nowTime(),
      });
      setStep(4);

      // Send email asynchronously — don't block ticket display
      if (form.email.trim()) {
        setEmailStatus("sending");
        sendTicketEmail({
          toEmail:    form.email.trim(),
          toName:     fullName,
          eventTitle: event.title,
          eventDate:  event.date,
          eventVenue: event.venue || "",
          ticketId:   tid,
          isFree,
          price:      event.price,
        })
          .then(() => setEmailStatus("sent"))
          .catch(() => setEmailStatus("failed"));
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong saving your registration. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // ── Derived display values ──────────────────────────────────────────────────
  const progress     = ((step - 1) / 3) * 100;
  const displayName  = dupTicket?.name   || `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
  const displayPhone = dupTicket?.phone  || form.phone;
  const displayGender= dupTicket?.gender || form.gender;

  const qrData = ticketId
    ? buildQrData(ticketId, displayName || "Attendee", event.title)
    : "";

  // Params for print / save helpers
  const ticketParams = {
    ticketId,
    name:       displayName,
    eventTitle: event.title,
    eventDate:  event.date,
    eventVenue: event.venue || "",
    phone:      displayPhone,
    gender:     displayGender,
    isFree,
    price:      event.price,
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await downloadTicketImage(ticketParams);
    } catch (err) {
      console.error(err);
      alert("Could not save image. Please take a screenshot instead.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => printTicket(ticketParams);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="reg-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="reg-box">

        {/* ── Progress bar + step dots ── */}
        <div style={{ padding:"18px 28px 8px" }}>
          <div className="reg-progress">
            <div className="reg-progress-fill" style={{ width:`${progress}%` }} />
          </div>
          <div className="reg-steps">
            {STEP_LABELS.map((l, i) => (
              <div key={l} className={`reg-step-dot ${i+1 < step ? "done" : i+1 === step ? "active" : ""}`} title={l} />
            ))}
          </div>
        </div>

        {/* ── Header ── */}
        <div className="reg-hd">
          <div className="reg-hd-left">
            <span className="reg-step-label">Step {step} of 4 — {STEP_LABELS[step-1]}</span>
            <div className="reg-hd-title">
              {step===1 && "Event Overview"}
              {step===2 && "Your Details"}
              {step===3 && "What to Expect"}
              {step===4 && (dupTicket ? "Already Registered ⚠️" : "You're In! 🎉")}
            </div>
            <div className="reg-hd-sub">{event.title}</div>
          </div>
          <button className="reg-x" onClick={onClose}>✕</button>
        </div>

        <div className="reg-body">

          {/* ════ STEP 1: Overview ════ */}
          {step === 1 && (
            <>
              <div className="ev-summary">
                <div className="ev-sum-type">{event.type || "Experience"}</div>
                <div className="ev-sum-title">{event.title}</div>
                <div className="ev-sum-meta">
                  {event.date && (
                    <div className="ev-sum-row">
                      <span>📅</span>
                      <span>
                        {event.date}
                        {event.startTime ? ` · ${event.startTime}` : ""}
                        {event.endTime   ? ` – ${event.endTime}`   : ""}
                      </span>
                    </div>
                  )}
                  {event.venue && <div className="ev-sum-row"><span>📍</span><span>{event.venue}</span></div>}
                  {event.spots && <div className="ev-sum-row"><span>👥</span><span>{event.spots} spots available</span></div>}
                </div>
                <div className="ev-sum-price">
                  <span className="ev-price-label">Entry</span>
                  {isFree
                    ? <span className="free-badge">✅ FREE EVENT</span>
                    : <span className="ev-price-val">₹{event.price}<span style={{fontSize:12,color:"rgba(255,112,67,.6)",fontWeight:500}}>/person</span></span>
                  }
                </div>
              </div>

              {event.description && (
                <div style={{fontSize:14,color:"#57534E",lineHeight:1.7,marginBottom:18,background:"#fff",borderRadius:14,padding:16,border:"1.5px solid rgba(28,25,23,.08)"}}>
                  {event.description}
                </div>
              )}

              <button className={`reg-btn ${isFree ? "reg-btn-free" : "reg-btn-primary"}`} onClick={() => setStep(2)}>
                {isFree ? "Register for Free →" : "Continue to Register →"}
              </button>
            </>
          )}

          {/* ════ STEP 2: Form ════ */}
          {step === 2 && (
            <>
              <div className="rf-row">
                <div className="rf">
                  <label>First Name *</label>
                  <input
                    className={errors.firstName ? "err" : ""}
                    placeholder="Aarav" value={form.firstName}
                    onChange={upd("firstName")} autoFocus
                  />
                  {errors.firstName && <div className="rf-err">{errors.firstName}</div>}
                </div>
                <div className="rf">
                  <label>Last Name *</label>
                  <input
                    className={errors.lastName ? "err" : ""}
                    placeholder="Shah" value={form.lastName}
                    onChange={upd("lastName")}
                  />
                  {errors.lastName && <div className="rf-err">{errors.lastName}</div>}
                </div>
              </div>

              <div className="rf">
                <label>Gender *</label>
                <select className={errors.gender ? "err" : ""} value={form.gender} onChange={upd("gender")}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {errors.gender && <div className="rf-err">{errors.gender}</div>}
              </div>

              <div className="rf">
                <label>WhatsApp / Mobile *</label>
                <input
                  className={errors.phone ? "err" : ""}
                  type="tel" placeholder="98765 43210"
                  value={form.phone} onChange={upd("phone")} maxLength={11}
                />
                {errors.phone && <div className="rf-err">{errors.phone}</div>}
              </div>

              <div className="rf">
                <label>Email Address *</label>
                <input
                  className={errors.email ? "err" : ""}
                  type="email" placeholder="you@email.com"
                  value={form.email} onChange={upd("email")}
                  onKeyDown={e => e.key === "Enter" && checkDuplicate()}
                />
                {errors.email && <div className="rf-err">{errors.email}</div>}
              </div>

              <div style={{background:"rgba(255,179,0,.08)",border:"1px solid rgba(255,179,0,.2)",borderRadius:10,padding:"9px 13px",fontSize:12,color:"#78716C",marginBottom:16,lineHeight:1.6}}>
                💡 Don't Forget to Download your Ticket after Registration.No Ticket No Entry.
              </div>

              <div className="reg-btn-row">
                <button
                  className="reg-btn reg-btn-secondary"
                  onClick={() => setStep(1)}
                  style={{ flex:"0 0 44px", padding:"14px 0" }}
                >←</button>
                <button
                  className={`reg-btn ${isFree ? "reg-btn-free" : "reg-btn-primary"}`}
                  onClick={checkDuplicate} disabled={busy}
                >
                  {busy ? "Checking…" : "Continue →"}
                </button>
              </div>
            </>
          )}

          {/* ════ STEP 3: Event Info ════ */}
          {step === 3 && (
            <>
              {/* Timings */}
              <div className="ev-info-section">
                <h4>⏰ Timings</h4>
                <div className="ev-info-card">
                  <div className="ev-info-row">
                    <span>🗓️</span>
                    <div className="ev-info-row-text">
                      <strong>{event.date || "Date TBA"}</strong>
                      {event.startTime && <span>{event.startTime}{event.endTime ? ` to ${event.endTime}` : ""}</span>}
                    </div>
                  </div>
                  {event.meetTime && (
                    <div className="ev-info-row">
                      <span>🤝</span>
                      <div className="ev-info-row-text"><strong>Meet / Arrive By</strong>{event.meetTime}</div>
                    </div>
                  )}
                  {event.duration && (
                    <div className="ev-info-row">
                      <span>⌛</span>
                      <div className="ev-info-row-text"><strong>Duration</strong>{event.duration}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="ev-info-section">
                <h4>📍 Location</h4>
                <div className="ev-info-card">
                  <div className="ev-info-row">
                    <span>🏢</span>
                    <div className="ev-info-row-text">
                      <strong>{event.venue || "Venue TBA"}</strong>
                      {event.address && <span>{event.address}</span>}
                    </div>
                  </div>
                  {(event.mapLink || event.venue) && (
                    <a
                      href={event.mapLink || `https://www.google.com/maps/search/${encodeURIComponent((event.venue||"")+" "+(event.address||""))}`}
                      target="_blank" rel="noreferrer" className="ev-map-link"
                    >
                      📌 Open in Google Maps →
                    </a>
                  )}
                </div>
              </div>

              {/* Refreshments */}
              <div className="ev-info-section">
                <h4>☕ Refreshments</h4>
                <div className="ev-info-card">
                  <div className="ev-chip-list">
                    {(event.refreshmentsOffered || event.refreshments)
                      ? (event.refreshmentsOffered || event.refreshments).split(",").map(r =>
                          <span key={r} className="ev-chip green">✅ {r.trim()}</span>)
                      : <span className="ev-chip">Details to be announced</span>
                    }
                    {event.refreshmentsNotOffered &&
                      event.refreshmentsNotOffered.split(",").map(r =>
                        <span key={r} className="ev-chip red">❌ {r.trim()}</span>)
                    }
                  </div>
                </div>
              </div>

              {/* Games & Activities */}
              <div className="ev-info-section">
                <h4>🎮 Games & Activities</h4>
                <div className="ev-info-card">
                  <div className="ev-chip-list">
                    {event.activities
                      ? event.activities.split(",").map(a => <span key={a} className="ev-chip">🎯 {a.trim()}</span>)
                      : <span className="ev-chip">Details to be announced</span>
                    }
                  </div>
                </div>
              </div>

              {/* What to bring */}
              {event.bringAlong && (
                <div className="ev-info-section">
                  <h4>🎒 What to Bring</h4>
                  <div className="ev-info-card">
                    <div className="ev-chip-list">
                      {event.bringAlong.split(",").map(b => <span key={b} className="ev-chip">📦 {b.trim()}</span>)}
                    </div>
                  </div>
                </div>
              )}

              {/* Phone policy */}
              <div style={{background:"#1C1917",borderRadius:13,padding:"11px 15px",marginBottom:18,display:"flex",alignItems:"center",gap:11}}>
                <span style={{fontSize:20}}>📱</span>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"#FF7043",marginBottom:1}}>Phone Policy</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.5)"}}>Phone goes in the lockbox at entry. Picked up at the end. It's the whole vibe 🌿</div>
                </div>
              </div>

              <div className="reg-btn-row">
                <button
                  className="reg-btn reg-btn-secondary"
                  onClick={() => setStep(2)}
                  style={{ flex:"0 0 44px", padding:"14px 0" }}
                >←</button>
                <button
                  className={`reg-btn ${isFree ? "reg-btn-free" : "reg-btn-primary"}`}
                  onClick={confirm} disabled={busy}
                >
                  {busy ? "Generating ticket…" : isFree ? "✅ Confirm Free Registration" : "✅ Confirm & Get Ticket"}
                </button>
              </div>
            </>
          )}

          {/* ════ STEP 4: Ticket ════ */}
          {step === 4 && (
            <>
              {/* Already-registered notice */}
              {dupTicket && (
                <div className="dup-box">
                  <div style={{fontSize:34,marginBottom:8}}>⚠️</div>
                  <div className="dup-title">Already Registered!</div>
                  <div className="dup-sub">
                    This mobile number is already registered for this event.<br/>
                    Here is your existing ticket.
                  </div>
                </div>
              )}

              {/* Email status banner */}
              {emailStatus && !dupTicket && (
                <div className={`email-status email-${emailStatus}`}>
                  {emailStatus === "sending" && <><span>⏳</span> Sending ticket to <strong>{form.email}</strong>…</>}
                  {emailStatus === "sent"    && <><span>✅</span> Ticket emailed to <strong>{form.email}</strong></>}
                  {emailStatus === "failed"  && <><span>⚠️</span> Email failed — please screenshot or save your ticket</>}
                </div>
              )}

              {ticketId ? (
                <>
                  {/* ── The ticket card ── */}
                  <div className="ticket-wrap">
                    <div className="ticket-header">
                      <div className="ticket-brand">
                        <div className="ticket-live-dot" />
                        The Offline Vibes
                      </div>
                      <div className={`ticket-badge ${isFree ? "ticket-badge-free" : "ticket-badge-paid"}`}>
                        {isFree ? "FREE" : "PAID"}
                      </div>
                    </div>

                    <div className="ticket-body">
                      <div className="ticket-qr-wrap">
                        <div className="ticket-qr-frame">
                          <img
                            src={qrUrl(qrData)}
                            alt="Entry QR Code"
                            crossOrigin="anonymous"
                          />
                        </div>
                        <div className="ticket-qr-hint">Show this QR at the entry gate</div>
                      </div>

                      <div className="ticket-id">{ticketId}</div>

                      {[
                        ["Name",    displayName],
                        ["Event",   event.title],
                        ["Date",    event.date    || "TBA"],
                        ["Venue",   event.venue   || "TBA"],
                        ["Contact", displayPhone],
                        ["Gender",  displayGender],
                        ["Entry",   isFree ? "FREE" : `₹${event.price}`],
                      ].map(([k, v]) => (
                        <div className="ticket-row" key={k}>
                          <span className="ticket-k">{k}</span>
                          <span className="ticket-v">{v}</span>
                        </div>
                      ))}
                    </div>

                    <div className="ticket-status-bar">
                      <span>✅</span>
                      <span>{dupTicket ? "PREVIOUSLY CONFIRMED" : "REGISTRATION CONFIRMED"}</span>
                    </div>
                  </div>

                  {/* Hint */}
                  <div style={{background:"rgba(255,112,67,.06)",border:"1px solid rgba(255,112,67,.12)",borderRadius:11,padding:"9px 13px",fontSize:12,color:"#78716C",marginBottom:14,lineHeight:1.6,textAlign:"center"}}>
                    📲 <strong style={{color:"#1C1917"}}>Save or print this ticket.</strong> Show the QR code to our volunteer at entry.
                  </div>

                  {/* Action row: Save Image + Print */}
                  <div className="reg-btn-row" style={{marginBottom:10}}>
                    <button
                      className="reg-btn reg-btn-secondary"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "⏳ Saving…" : "💾 Save Image"}
                    </button>
                    <button
                      className="reg-btn reg-btn-secondary"
                      onClick={handlePrint}
                    >
                      🖨️ Print Ticket
                    </button>
                  </div>

                  {/* Done */}
                  <button className="reg-btn reg-btn-primary" onClick={onClose}>
                    Done ✦
                  </button>
                </>
              ) : (
                <div className="reg-loading">
                  <div className="reg-spinner" />
                  <div style={{fontSize:13,color:"#78716C"}}>Generating your ticket…</div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  VolunteerScanner
// ─────────────────────────────────────────────────────────────────────────────
export function VolunteerScanner({ onClose, fbGet, fbUpdate }) {
  const [query,    setQuery]    = useState("");
  const [result,   setResult]   = useState(null);
  const [attended, setAttended] = useState([]);
  const [marking,  setMarking]  = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { loadAttended(); inputRef.current?.focus(); }, []);

  const loadAttended = async () => {
    try {
      const regs = await fbGet("registrations");
      setAttended(
        regs
          .filter(r => r.attended)
          .sort((a,b) => (b.attendedAt||"").localeCompare(a.attendedAt||""))
      );
    } catch {}
  };

  const search = async () => {
    const raw = query.trim();
    if (!raw) return;
    try {
      const regs = await fbGet("registrations");

      // Parse JSON payload if it came from a QR scanner app
      let ticketId = raw.toUpperCase();
      try {
        const parsed = JSON.parse(raw);
        if (parsed.tid) ticketId = parsed.tid.toUpperCase();
      } catch {}

      const reg = regs.find(r => r.ticketId?.toUpperCase() === ticketId);

      if (!reg)          { setResult({ type:"notfound" }); return; }
      if (reg.attended)  { setResult({ type:"already", data:reg }); return; }
      setResult({ type:"found", data:reg });
    } catch {
      setResult({ type:"notfound" });
    }
  };

  const markAttended = async () => {
    if (!result?.data) return;
    setMarking(true);
    try {
      await fbUpdate("registrations", result.data.id, {
        attended:   true,
        attendedAt: nowDate() + " " + nowTime(),
      });
      setResult({ type:"marked", data:result.data });
      await loadAttended();
    } catch {
      alert("Failed to mark attendance. Try again.");
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="scanner-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="scanner-box">
        <div className="scanner-hd">
          <div>
            <div className="scanner-hd-title">🎫 Volunteer Scanner</div>
            <div style={{fontSize:12,color:"#A8A29E",marginTop:2}}>
              Type Ticket ID or paste QR scan result → Enter
            </div>
          </div>
          <button className="reg-x" onClick={onClose}>✕</button>
        </div>

        <div className="scanner-body">
          <div className="scanner-input-wrap">
            <input
              ref={inputRef}
              className="scanner-input"
              placeholder="TOV-XXXXXXXX"
              value={query}
              onChange={e => { setQuery(e.target.value); setResult(null); }}
              onKeyDown={e => e.key === "Enter" && search()}
            />
            <button className="scanner-search-btn" onClick={search}>🔍</button>
          </div>

          {result && (
            <>
              {result.type === "found" && (
                <div className="scan-result success">
                  <div className="scan-result-name">{result.data.name}</div>
                  <div className="scan-result-id">{result.data.ticketId}</div>
                  <div className="scan-result-meta">
                    📞 {result.data.phone}<br/>
                    🎟️ {result.data.eventTitle}<br/>
                    ⚧ {result.data.gender} · Registered {result.data.date}
                  </div>
                  <button className="scan-attend-btn" onClick={markAttended} disabled={marking}>
                    {marking ? "Marking…" : "✅ Mark as Attended"}
                  </button>
                </div>
              )}
              {result.type === "marked" && (
                <div className="scan-result success">
                  <div style={{fontSize:26,marginBottom:7}}>✅</div>
                  <div className="scan-result-name">{result.data.name}</div>
                  <div className="scan-result-id">{result.data.ticketId}</div>
                  <div className="scan-result-meta">Marked as attended successfully!</div>
                </div>
              )}
              {result.type === "already" && (
                <div className="scan-result already">
                  <div style={{fontSize:26,marginBottom:7}}>⚠️</div>
                  <div className="scan-result-name">{result.data.name}</div>
                  <div className="scan-result-id">{result.data.ticketId}</div>
                  <div className="scan-result-meta">
                    Already attended at {result.data.attendedAt || "—"}
                  </div>
                </div>
              )}
              {result.type === "notfound" && (
                <div className="scan-result error">
                  <div style={{fontSize:26,marginBottom:7}}>❌</div>
                  <div style={{fontWeight:700,color:"#C62828",marginBottom:3}}>Ticket Not Found</div>
                  <div style={{fontSize:12,color:"#78716C"}}>Check the ID and try again.</div>
                </div>
              )}
            </>
          )}

          {/* Attended list */}
          <div style={{marginTop:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:15,fontWeight:700,color:"#1C1917"}}>
                Attended ({attended.length})
              </div>
              <button
                onClick={loadAttended}
                style={{background:"none",border:"1px solid rgba(28,25,23,.1)",borderRadius:100,fontSize:11,padding:"4px 12px",color:"#78716C",cursor:"pointer"}}
              >↻ Refresh</button>
            </div>

            {attended.length === 0 ? (
              <div style={{textAlign:"center",padding:"24px 0",color:"#A8A29E",fontSize:13}}>
                No attendees scanned yet
              </div>
            ) : (
              attended.map(r => (
                <div className="attended-row" key={r.id}>
                  <div>
                    <div style={{fontWeight:700,color:"#1C1917",fontSize:13}}>{r.name}</div>
                    <div style={{fontFamily:"'Courier New',monospace",fontSize:11,color:"#FF7043"}}>{r.ticketId}</div>
                    <div style={{fontSize:11,color:"#A8A29E"}}>{r.attendedAt}</div>
                  </div>
                  <span className="attended-badge">ATTENDED</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Extra admin fields (wire into your admin event create form) ───────────────
export const EVENT_EXTRA_FIELDS = [
  { key:"startTime",              label:"Start Time",                     placeholder:"10:00 AM" },
  { key:"endTime",                label:"End Time",                       placeholder:"1:00 PM"  },
  { key:"meetTime",               label:"Meet / Arrive By",               placeholder:"9:45 AM"  },
  { key:"duration",               label:"Duration",                       placeholder:"3 hours"  },
  { key:"address",                label:"Full Address",                   placeholder:"Plot 12, Adajan, Surat" },
  { key:"mapLink",                label:"Google Maps Link",               placeholder:"https://maps.google.com/..." },
  { key:"refreshmentsOffered",    label:"Refreshments Offered (CSV)",     placeholder:"Tea, Snacks, Water" },
  { key:"refreshmentsNotOffered", label:"Refreshments NOT Offered (CSV)", placeholder:"Alcohol, Lunch" },
  { key:"activities",             label:"Games & Activities (CSV)",       placeholder:"Bonfire, Journaling, Group Games" },
  { key:"bringAlong",             label:"What to Bring (CSV)",            placeholder:"ID Proof, Comfortable shoes" },
];
