/**
 * EventRegistration.jsx — The Offline Vibes
 * Drop-in replacement for the EventModal component.
 *
 * Features:
 *  • Free & paid event support (₹0 = "Free Event" badge)
 *  • 4-step flow: Details → Personal Info → Confirm → Ticket
 *  • Duplicate registration prevention (localStorage + Firestore check)
 *  • Unique ticket ID + scannable QR code
 *  • QR scan landing page (volunteer view) with attended list
 *  • Fully responsive (mobile-first)
 *  • Smooth animated step transitions
 *
 * Usage:
 *   Replace <EventModal event={sel} onClose={()=>setSel(null)}/> with:
 *   <EventModal event={sel} onClose={()=>setSel(null)}/>
 *   (same API, just swap the import / inline definition)
 *
 * Volunteer QR Scan:
 *   Add route /scan?tid=TOV-XXXXXXX to your app and render <ScanPage/>
 *   OR host ScanPage as a standalone page.
 */

import { useState, useEffect, useRef } from "react";

// ─── helpers ────────────────────────────────────────────────
const genId = () =>
  "TOV-" + Math.random().toString(36).substr(2, 9).toUpperCase();
const nowDate = () =>
  new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const nowTime = () =>
  new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
const qrUrl = (text) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    text
  )}&bgcolor=ffffff&color=1C1917&qzone=2`;

// ─── Firebase helpers (same pattern as parent app) ──────────
function db() {
  if (!window.firebase) return null;
  if (!window.firebase.apps?.length) return null;
  return window.firebase.firestore();
}
const LS = {
  get: (k) => {
    try {
      return JSON.parse(localStorage.getItem(k) || "null");
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};

async function fbAdd(col, data) {
  const d = db();
  if (d)
    return (
      await d.collection(col).add({
        ...data,
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
      })
    ).id;
  const arr = LS.get(col) || [];
  const id = Date.now().toString();
  arr.unshift({ ...data, id, createdAt: new Date().toISOString() });
  LS.set(col, arr);
  return id;
}

async function fbGet(col) {
  const d = db();
  if (d) {
    try {
      const s = await d
        .collection(col)
        .orderBy("createdAt", "desc")
        .get();
      return s.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch {
      return [];
    }
  }
  return LS.get(col) || [];
}

async function fbUpdate(col, id, data) {
  const d = db();
  if (d) return d.collection(col).doc(id).update(data);
  const arr = LS.get(col) || [];
  const i = arr.findIndex((x) => x.id === id);
  if (i >= 0) arr[i] = { ...arr[i], ...data };
  LS.set(col, arr);
}

/** Check if (phone OR email) already registered for this event */
async function checkDuplicate(eventId, phone, email) {
  const all = await fbGet("registrations");
  return all.some(
    (r) =>
      r.eventId === eventId &&
      (r.phone?.replace(/\s/g, "") === phone.replace(/\s/g, "") ||
        r.email?.toLowerCase() === email.toLowerCase())
  );
}

// ─── STYLES ─────────────────────────────────────────────────
const REG_STYLES = `
/* ── Registration Modal Styles ── */
.reg-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 12, 10, 0.82);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  backdrop-filter: blur(14px);
  animation: regFadeIn 0.22s ease;
}
@keyframes regFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.reg-modal {
  background: #FFFDF9;
  border-radius: 28px;
  width: 100%;
  max-width: 560px;
  max-height: 94vh;
  overflow-y: auto;
  box-shadow: 0 32px 96px rgba(28, 25, 23, 0.28), 0 0 0 1px rgba(255, 112, 67, 0.12);
  scrollbar-width: thin;
  scrollbar-color: #FF7043 transparent;
  animation: regSlideUp 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.reg-modal::-webkit-scrollbar { width: 3px; }
.reg-modal::-webkit-scrollbar-thumb { background: #FF7043; border-radius: 4px; }
@keyframes regSlideUp {
  from { opacity: 0; transform: translateY(24px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Step transition ── */
.reg-step {
  animation: stepIn 0.28s cubic-bezier(0.34, 1.4, 0.64, 1);
}
@keyframes stepIn {
  from { opacity: 0; transform: translateX(18px); }
  to { opacity: 1; transform: translateX(0); }
}

/* ── Header ── */
.reg-header {
  padding: 24px 24px 0;
  position: sticky;
  top: 0;
  background: #FFFDF9;
  z-index: 10;
  border-radius: 28px 28px 0 0;
}
.reg-header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
  gap: 12px;
}
.reg-event-info { flex: 1; }
.reg-event-title {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 18px;
  font-weight: 800;
  color: #1C1917;
  line-height: 1.25;
  margin-bottom: 6px;
  letter-spacing: -0.3px;
}
.reg-event-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.reg-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
.reg-badge-free { background: #E8F5E9; color: #1B5E20; border: 1px solid rgba(67,160,71,0.25); }
.reg-badge-paid { background: #FFF0EA; color: #FF7043; border: 1px solid rgba(255,112,67,0.25); }
.reg-badge-type { background: #E3F2FD; color: #1565C0; border: 1px solid rgba(21,101,192,0.2); }
.reg-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #F5F0EB;
  border: none;
  color: #78716C;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.reg-close:hover { background: #FFF0EA; color: #FF7043; }

/* ── Stepper ── */
.reg-stepper {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 20px;
}
.reg-step-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  position: relative;
}
.reg-step-dot::after {
  content: '';
  position: absolute;
  top: 14px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: #E5E0DB;
  z-index: 0;
}
.reg-step-dot:last-child::after { display: none; }
.reg-step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  position: relative;
  z-index: 1;
  transition: all 0.3s;
  border: 2px solid #E5E0DB;
  background: #fff;
  color: #A8A29E;
}
.reg-step-circle.done {
  background: #FF7043;
  border-color: #FF7043;
  color: #fff;
}
.reg-step-circle.active {
  background: #FF7043;
  border-color: #FF7043;
  color: #fff;
  box-shadow: 0 0 0 4px rgba(255,112,67,0.18);
}
.reg-step-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #A8A29E;
  transition: color 0.3s;
  white-space: nowrap;
}
.reg-step-label.active { color: #FF7043; }

/* ── Body ── */
.reg-body { padding: 20px 24px 28px; }

/* ── Form fields ── */
.reg-field { margin-bottom: 14px; }
.reg-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #57534E;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.reg-inp {
  width: 100%;
  padding: 12px 16px;
  background: #FEF6EC;
  border: 1.5px solid rgba(28, 25, 23, 0.1);
  border-radius: 12px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 15px;
  color: #1C1917;
  outline: none;
  transition: all 0.2s;
  -webkit-appearance: none;
}
.reg-inp:focus {
  border-color: #FF7043;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(255, 112, 67, 0.1);
}
.reg-inp::placeholder { color: #A8A29E; }
.reg-inp.error { border-color: #EF4444; background: #FFF5F5; }
.reg-inp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.reg-select {
  width: 100%;
  padding: 12px 16px;
  background: #FEF6EC;
  border: 1.5px solid rgba(28, 25, 23, 0.1);
  border-radius: 12px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 15px;
  color: #1C1917;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23A8A29E' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 40px;
}
.reg-select:focus { border-color: #FF7043; background-color: #fff; box-shadow: 0 0 0 4px rgba(255,112,67,0.1); }
.reg-err-msg { font-size: 12px; color: #EF4444; margin-top: 4px; font-weight: 600; }

/* ── Event details card ── */
.reg-detail-card {
  background: #fff;
  border: 1.5px solid rgba(28, 25, 23, 0.08);
  border-radius: 18px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 2px 16px rgba(28,25,23,0.06);
}
.reg-detail-hero {
  background: linear-gradient(135deg, #1a0a0a, #2e1a0a);
  padding: 22px 22px 18px;
  position: relative;
  overflow: hidden;
}
.reg-detail-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255,112,67,0.12) 1px, transparent 1px);
  background-size: 20px 20px;
}
.reg-detail-hero-emoji {
  font-size: 38px;
  display: block;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}
.reg-detail-hero-title {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  position: relative;
  z-index: 1;
}
.reg-detail-hero-type {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #FF7043;
  margin-bottom: 6px;
  position: relative;
  z-index: 1;
}
.reg-detail-body { padding: 18px 22px; }
.reg-detail-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(28,25,23,0.06);
}
.reg-detail-row:last-child { border-bottom: none; padding-bottom: 0; }
.reg-detail-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  background: #FEF6EC;
}
.reg-detail-text { flex: 1; min-width: 0; }
.reg-detail-key {
  font-size: 10px;
  font-weight: 700;
  color: #A8A29E;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin-bottom: 2px;
}
.reg-detail-val {
  font-size: 14px;
  color: #1C1917;
  font-weight: 600;
  line-height: 1.4;
}
.reg-detail-val.sun { color: #FF7043; }
.reg-detail-val.green { color: #43A047; font-weight: 700; }
.reg-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
.reg-chip {
  padding: 3px 10px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 700;
  background: #F5F0EB;
  color: #57534E;
  border: 1px solid rgba(28,25,23,0.08);
}
.reg-chip-green { background: #E8F5E9; color: #2E7D32; border-color: rgba(67,160,71,0.2); }
.reg-chip-sun { background: #FFF0EA; color: #FF7043; border-color: rgba(255,112,67,0.2); }

/* ── Summary / confirm ── */
.reg-summary {
  background: #fff;
  border: 1.5px solid rgba(28,25,23,0.08);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(28,25,23,0.05);
}
.reg-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
  border-bottom: 1px solid rgba(28,25,23,0.05);
}
.reg-summary-row:last-child { border-bottom: none; padding-bottom: 0; }
.reg-summary-key { color: #78716C; }
.reg-summary-val { font-weight: 700; color: #1C1917; }
.reg-summary-val.sun { color: #FF7043; font-size: 16px; }

/* ── Ticket ── */
.reg-ticket {
  background: linear-gradient(145deg, #1C1917, #2C2118);
  border-radius: 22px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 16px 48px rgba(28,25,23,0.28);
}
.reg-ticket-header {
  padding: 22px 22px 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.reg-ticket-brand {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 13px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.2px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.reg-ticket-live {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #43A047;
  animation: ticketLivePulse 2s infinite;
}
@keyframes ticketLivePulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(67,160,71,0.5); }
  60% { box-shadow: 0 0 0 6px rgba(67,160,71,0); }
}
.reg-ticket-status {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #43A047;
  background: rgba(67,160,71,0.12);
  border: 1px solid rgba(67,160,71,0.25);
  padding: 4px 10px;
  border-radius: 100px;
}
.reg-ticket-qr-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 22px 16px;
}
.reg-ticket-qr {
  width: 160px;
  height: 160px;
  background: #fff;
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 0 0 3px rgba(255,112,67,0.4);
  margin-bottom: 10px;
}
.reg-ticket-qr img { width: 100%; height: 100%; display: block; border-radius: 8px; }
.reg-ticket-scan-hint {
  font-size: 10px;
  color: rgba(255,255,255,0.35);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-weight: 600;
}
.reg-ticket-divider {
  display: flex;
  align-items: center;
  gap: 0;
  position: relative;
  margin: 0 -1px;
}
.reg-ticket-divider::before {
  content: '';
  flex: 1;
  height: 1px;
  border-top: 1.5px dashed rgba(255,255,255,0.12);
}
.reg-ticket-circle-left,
.reg-ticket-circle-right {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #FFFDF9;
  flex-shrink: 0;
}
.reg-ticket-body {
  padding: 16px 22px 22px;
}
.reg-ticket-id {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 20px;
  font-weight: 800;
  color: #FF7043;
  letter-spacing: 2px;
  text-align: center;
  margin-bottom: 16px;
}
.reg-ticket-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}
.reg-ticket-row:last-child { margin-bottom: 0; }
.reg-ticket-k {
  font-size: 10px;
  color: rgba(255,255,255,0.4);
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  flex-shrink: 0;
}
.reg-ticket-v {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  text-align: right;
}
.reg-ticket-v.sun { color: #FF7043; }
.reg-ticket-v.green { color: #66BB6A; }

/* ── Buttons ── */
.reg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 700;
  border-radius: 100px;
  transition: all 0.22s;
  letter-spacing: 0.1px;
  width: 100%;
  padding: 14px 24px;
  font-size: 15px;
}
.reg-btn-primary {
  background: #FF7043;
  color: #fff;
  box-shadow: 0 4px 18px rgba(255,112,67,0.3);
}
.reg-btn-primary:hover:not(:disabled) {
  background: #F4511E;
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(255,112,67,0.35);
}
.reg-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.reg-btn-secondary {
  background: #F5F0EB;
  color: #1C1917;
  border: 1.5px solid rgba(28,25,23,0.1);
  margin-top: 10px;
}
.reg-btn-secondary:hover { background: #EDE8E3; }
.reg-btn-back {
  background: none;
  color: #78716C;
  border: none;
  padding: 10px 0;
  font-size: 13px;
  cursor: pointer;
  font-family: 'Instrument Sans', sans-serif;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: color 0.2s;
  width: auto;
  margin-bottom: 14px;
}
.reg-btn-back:hover { color: #FF7043; }
.reg-btn-print {
  background: #1C1917;
  color: #fff;
  margin-top: 10px;
}
.reg-btn-print:hover { background: #333; transform: translateY(-2px); }

/* ── Duplicate / error states ── */
.reg-dup-box {
  background: #FFF9E6;
  border: 1.5px solid rgba(255,179,0,0.3);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
}
.reg-dup-icon { font-size: 40px; margin-bottom: 10px; }
.reg-dup-title {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 18px;
  font-weight: 800;
  color: #1C1917;
  margin-bottom: 6px;
}
.reg-dup-sub { font-size: 13px; color: #78716C; line-height: 1.65; }

/* ── Free event banner ── */
.reg-free-banner {
  background: linear-gradient(135deg, #E8F5E9, #F1F8E9);
  border: 1.5px solid rgba(67,160,71,0.25);
  border-radius: 14px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}
.reg-free-icon { font-size: 26px; }
.reg-free-text { font-size: 13px; color: #2E7D32; font-weight: 600; line-height: 1.5; }
.reg-free-price {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: #2E7D32;
  margin-left: auto;
  white-space: nowrap;
}

/* ── Success tip ── */
.reg-tip {
  background: #F5F0EB;
  border-radius: 12px;
  padding: 12px 16px;
  margin-top: 14px;
  font-size: 12px;
  color: #78716C;
  line-height: 1.65;
  text-align: center;
}
.reg-tip b { color: #1C1917; }

/* ── SCAN PAGE (volunteer view) ── */
.scan-wrap {
  min-height: 100vh;
  background: #0F0C0A;
  color: #fff;
  font-family: 'Instrument Sans', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 20px;
}
.scan-logo {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 16px;
  font-weight: 800;
  color: #FF7043;
  letter-spacing: -0.3px;
  margin-bottom: 32px;
}
.scan-card {
  background: #1C1917;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  padding: 32px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.4);
}
.scan-status-ok {
  background: rgba(67,160,71,0.12);
  border: 1px solid rgba(67,160,71,0.3);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  margin-bottom: 20px;
}
.scan-status-warn {
  background: rgba(255,179,0,0.1);
  border: 1px solid rgba(255,179,0,0.3);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  margin-bottom: 20px;
}
.scan-status-err {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  margin-bottom: 20px;
}
.scan-big-icon { font-size: 48px; margin-bottom: 8px; }
.scan-name {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 4px;
}
.scan-tid {
  font-size: 12px;
  color: #FF7043;
  font-weight: 700;
  letter-spacing: 1.5px;
  font-family: monospace;
}
.scan-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  font-size: 13px;
}
.scan-row:last-child { border-bottom: none; }
.scan-row-k { color: rgba(255,255,255,0.4); }
.scan-row-v { font-weight: 700; color: #fff; }
.scan-btn-mark {
  width: 100%;
  padding: 14px;
  background: #43A047;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 16px;
  transition: all 0.2s;
}
.scan-btn-mark:hover { background: #388E3C; transform: translateY(-2px); }
.scan-btn-mark:disabled { opacity: 0.5; cursor: not-allowed; }
.scan-attended-list { margin-top: 32px; width: 100%; max-width: 480px; }
.scan-attended-h {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 14px;
  font-weight: 800;
  color: rgba(255,255,255,0.5);
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.scan-attended-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1C1917;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
}
.scan-attended-name {
  font-weight: 700;
  color: #fff;
  font-size: 14px;
}
.scan-attended-tid {
  font-size: 11px;
  color: #FF7043;
  font-family: monospace;
  letter-spacing: 0.5px;
}
.scan-attended-time {
  font-size: 11px;
  color: rgba(255,255,255,0.3);
}

/* ── Responsive ── */
@media (max-width: 600px) {
  .reg-modal { border-radius: 20px; max-height: 96vh; }
  .reg-header { padding: 18px 18px 0; border-radius: 20px 20px 0 0; }
  .reg-body { padding: 16px 18px 24px; }
  .reg-inp-row { grid-template-columns: 1fr; gap: 0; }
  .reg-detail-hero { padding: 18px 18px 14px; }
  .reg-detail-body { padding: 14px 16px; }
  .reg-ticket-qr { width: 140px; height: 140px; }
  .reg-event-title { font-size: 16px; }
  .reg-stepper { gap: 0; }
  .reg-step-label { font-size: 8px; }
  .reg-btn { padding: 13px 20px; font-size: 14px; }
}
@media (max-width: 380px) {
  .reg-modal { border-radius: 16px; }
  .reg-step-label { display: none; }
}
`;

// ─── EVENT MODAL (main export) ───────────────────────────────
export function EventModal({ event, onClose }) {
  // Steps: 1=Details, 2=PersonalInfo, 3=Confirm, 4=Ticket
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const modalRef = useRef(null);
  const isFree = !event.price || parseInt(event.price) === 0;

  const upd = (k) => (e) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  // Build the QR data string — contains all info volunteer needs
  const buildQrData = (tid) => {
    const name = `${form.firstName.trim()} ${form.lastName.trim()}`;
    return JSON.stringify({
      tid,
      name,
      event: event.title,
      eventId: event.id,
      phone: form.phone.trim(),
      date: event.date || "",
      status: "CONFIRMED",
      action: "SCAN_CHECK_IN",
    });
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.gender) e.gender = "Required";
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "Enter a valid 10-digit number";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goConfirm = async () => {
    if (!validate()) return;
    setBusy(true);
    const dup = await checkDuplicate(
      event.id,
      form.phone.replace(/\s/g, ""),
      form.email.trim()
    );
    setBusy(false);
    if (dup) {
      setIsDuplicate(true);
      return;
    }
    setStep(3);
    modalRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmReg = async () => {
    setBusy(true);
    const tid = genId();
    setTicketId(tid);
    const name = `${form.firstName.trim()} ${form.lastName.trim()}`;
    await fbAdd("registrations", {
      ticketId: tid,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      name,
      gender: form.gender,
      phone: form.phone.trim(),
      email: form.email.trim(),
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date || "",
      eventVenue: event.venue || "",
      price: isFree ? "0" : String(event.price),
      status: "confirmed",
      attended: false,
      date: nowDate(),
      time: nowTime(),
    });
    // Also cache locally to speed up future duplicate checks
    const key = `reg_${event.id}`;
    LS.set(key, { tid, phone: form.phone.trim(), email: form.email.trim() });
    setBusy(false);
    setStep(4);
    setTimeout(
      () => modalRef.current?.scrollTo({ top: 0, behavior: "smooth" }),
      50
    );
  };

  const goStep = (s) => {
    setStep(s);
    setTimeout(
      () => modalRef.current?.scrollTo({ top: 0, behavior: "smooth" }),
      10
    );
  };

  const STEPS = [
    { label: "Event", icon: "📋" },
    { label: "Your Info", icon: "👤" },
    { label: "Confirm", icon: "✓" },
    { label: "Ticket", icon: "🎫" },
  ];

  // Event enriched details
  const activities = event.activities || event.games || null;
  const refreshments = event.refreshments ?? null;
  const timing = event.timing || event.time || null;
  const location = event.location || event.venue || null;
  const mapUrl = location
    ? `https://maps.google.com/?q=${encodeURIComponent(location)}`
    : null;

  const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
  const qrData = ticketId ? buildQrData(ticketId) : "";

  return (
    <>
      <style>{REG_STYLES}</style>
      <div
        className="reg-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="reg-modal" ref={modalRef}>
          {/* ── HEADER ── */}
          <div className="reg-header">
            <div className="reg-header-top">
              <div className="reg-event-info">
                <div className="reg-event-title">
                  {event.emoji && (
                    <span style={{ marginRight: 6 }}>{event.emoji}</span>
                  )}
                  {event.title}
                </div>
                <div className="reg-event-meta">
                  {isFree ? (
                    <span className="reg-badge reg-badge-free">
                      ✦ Free Event
                    </span>
                  ) : (
                    <span className="reg-badge reg-badge-paid">
                      ₹{event.price}
                    </span>
                  )}
                  {event.type && (
                    <span className="reg-badge reg-badge-type">
                      {event.type}
                    </span>
                  )}
                </div>
              </div>
              <button className="reg-close" onClick={onClose}>
                ✕
              </button>
            </div>

            {/* ── STEPPER ── */}
            <div className="reg-stepper">
              {STEPS.map((s, i) => {
                const n = i + 1;
                const done = step > n;
                const active = step === n;
                return (
                  <div className="reg-step-dot" key={i}>
                    <div
                      className={`reg-step-circle ${
                        done ? "done" : active ? "active" : ""
                      }`}
                    >
                      {done ? "✓" : n}
                    </div>
                    <span
                      className={`reg-step-label ${active ? "active" : ""}`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="reg-body">
            {/* ━━━ STEP 1: EVENT DETAILS ━━━ */}
            {step === 1 && (
              <div className="reg-step">
                <div className="reg-detail-card">
                  <div className="reg-detail-hero">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          opacity: 0.35,
                        }}
                      />
                    ) : null}
                    <div
                      style={{ position: "relative", zIndex: 1 }}
                    >
                      <div className="reg-detail-hero-type">
                        {event.type || "Offline Experience"}
                      </div>
                      <div style={{ fontSize: 40, marginBottom: 6 }}>
                        {event.emoji || "🎉"}
                      </div>
                      <div className="reg-detail-hero-title">
                        {event.title}
                      </div>
                    </div>
                  </div>
                  <div className="reg-detail-body">
                    {/* Date */}
                    {event.date && (
                      <div className="reg-detail-row">
                        <div className="reg-detail-icon">📅</div>
                        <div className="reg-detail-text">
                          <div className="reg-detail-key">Date</div>
                          <div className="reg-detail-val">{event.date}</div>
                        </div>
                      </div>
                    )}

                    {/* Timing */}
                    <div className="reg-detail-row">
                      <div className="reg-detail-icon">⏰</div>
                      <div className="reg-detail-text">
                        <div className="reg-detail-key">Event Timing</div>
                        <div className="reg-detail-val">
                          {timing || "Timing will be shared on WhatsApp"}
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="reg-detail-row">
                      <div className="reg-detail-icon">📍</div>
                      <div className="reg-detail-text">
                        <div className="reg-detail-key">Location / Venue</div>
                        <div className="reg-detail-val">
                          {location || "—"}
                          {mapUrl && (
                            <a
                              href={mapUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                marginLeft: 8,
                                fontSize: 11,
                                color: "#FF7043",
                                fontWeight: 700,
                                textDecoration: "none",
                              }}
                            >
                              View on Map ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Spots */}
                    {event.spots && (
                      <div className="reg-detail-row">
                        <div className="reg-detail-icon">👥</div>
                        <div className="reg-detail-text">
                          <div className="reg-detail-key">Availability</div>
                          <div className="reg-detail-val">
                            {event.spots} spots total (limited)
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Refreshments */}
                    <div className="reg-detail-row">
                      <div className="reg-detail-icon">🍵</div>
                      <div className="reg-detail-text">
                        <div className="reg-detail-key">Refreshments</div>
                        {refreshments ? (
                          <div>
                            <div
                              className="reg-detail-val green"
                              style={{ marginBottom: 6 }}
                            >
                              ✅ Included
                            </div>
                            <div className="reg-chips">
                              {Array.isArray(refreshments) ? (
                                refreshments.map((r, i) => (
                                  <span key={i} className="reg-chip reg-chip-green">
                                    {r}
                                  </span>
                                ))
                              ) : (
                                <span className="reg-chip reg-chip-green">
                                  {refreshments}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="reg-detail-val" style={{ color: "#A8A29E" }}>
                            Not included — bring your own snacks 🎒
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Games & Activities */}
                    <div className="reg-detail-row">
                      <div className="reg-detail-icon">🎮</div>
                      <div className="reg-detail-text">
                        <div className="reg-detail-key">Games & Activities</div>
                        {activities ? (
                          <div className="reg-chips" style={{ marginTop: 6 }}>
                            {Array.isArray(activities) ? (
                              activities.map((a, i) => (
                                <span key={i} className="reg-chip reg-chip-sun">
                                  {a}
                                </span>
                              ))
                            ) : (
                              <span
                                className="reg-detail-val"
                                style={{ marginTop: 2 }}
                              >
                                {activities}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div
                            className="reg-detail-val"
                            style={{ color: "#A8A29E" }}
                          >
                            Details will be shared before the event 📲
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="reg-detail-row">
                      <div className="reg-detail-icon">💳</div>
                      <div className="reg-detail-text">
                        <div className="reg-detail-key">Entry Fee</div>
                        <div
                          className={`reg-detail-val ${
                            isFree ? "green" : "sun"
                          }`}
                        >
                          {isFree ? "🎉 FREE — No charge!" : `₹${event.price} per person`}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {event.description && (
                      <div className="reg-detail-row">
                        <div className="reg-detail-icon">📝</div>
                        <div className="reg-detail-text">
                          <div className="reg-detail-key">About</div>
                          <div
                            className="reg-detail-val"
                            style={{
                              fontWeight: 400,
                              color: "#57534E",
                              lineHeight: 1.6,
                              fontSize: 13,
                            }}
                          >
                            {event.description}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  className="reg-btn reg-btn-primary"
                  onClick={() => goStep(2)}
                >
                  Register Now →
                </button>
              </div>
            )}

            {/* ━━━ STEP 2: PERSONAL INFO ━━━ */}
            {step === 2 && (
              <div className="reg-step">
                <button className="reg-btn-back" onClick={() => goStep(1)}>
                  ← Back to Event Details
                </button>

                {isDuplicate && (
                  <div className="reg-dup-box" style={{ marginBottom: 18 }}>
                    <div className="reg-dup-icon">⚠️</div>
                    <div className="reg-dup-title">Already Registered</div>
                    <div className="reg-dup-sub">
                      This phone number or email is already registered for this
                      event. Each person can register only once.
                      <br />
                      If this is a mistake, contact us on WhatsApp.
                    </div>
                  </div>
                )}

                {isFree && (
                  <div className="reg-free-banner">
                    <div className="reg-free-icon">🎉</div>
                    <div className="reg-free-text">
                      This is a <b>free event</b>.<br />
                      No payment required — just show up!
                    </div>
                    <div className="reg-free-price">₹0</div>
                  </div>
                )}

                <div className="reg-inp-row">
                  <div className="reg-field">
                    <label className="reg-label">First Name *</label>
                    <input
                      className={`reg-inp ${errors.firstName ? "error" : ""}`}
                      placeholder="Riya"
                      value={form.firstName}
                      onChange={upd("firstName")}
                    />
                    {errors.firstName && (
                      <div className="reg-err-msg">{errors.firstName}</div>
                    )}
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">Last Name *</label>
                    <input
                      className={`reg-inp ${errors.lastName ? "error" : ""}`}
                      placeholder="Patel"
                      value={form.lastName}
                      onChange={upd("lastName")}
                    />
                    {errors.lastName && (
                      <div className="reg-err-msg">{errors.lastName}</div>
                    )}
                  </div>
                </div>

                <div className="reg-field">
                  <label className="reg-label">Gender *</label>
                  <select
                    className={`reg-select ${errors.gender ? "error" : ""}`}
                    value={form.gender}
                    onChange={upd("gender")}
                  >
                    <option value="">Select gender…</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  {errors.gender && (
                    <div className="reg-err-msg">{errors.gender}</div>
                  )}
                </div>

                <div className="reg-field">
                  <label className="reg-label">WhatsApp Number *</label>
                  <input
                    className={`reg-inp ${errors.phone ? "error" : ""}`}
                    type="tel"
                    inputMode="numeric"
                    placeholder="98765 43210"
                    value={form.phone}
                    onChange={upd("phone")}
                    maxLength={10}
                  />
                  {errors.phone && (
                    <div className="reg-err-msg">{errors.phone}</div>
                  )}
                </div>

                <div className="reg-field">
                  <label className="reg-label">Email Address *</label>
                  <input
                    className={`reg-inp ${errors.email ? "error" : ""}`}
                    type="email"
                    inputMode="email"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={upd("email")}
                    onKeyDown={(e) => e.key === "Enter" && goConfirm()}
                  />
                  {errors.email && (
                    <div className="reg-err-msg">{errors.email}</div>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: "#A8A29E",
                    marginBottom: 18,
                    lineHeight: 1.6,
                  }}
                >
                  🔒 Your info is safe and only used for event communication.
                  Each person can register only once per event.
                </div>

                <button
                  className="reg-btn reg-btn-primary"
                  onClick={goConfirm}
                  disabled={busy}
                >
                  {busy ? "Checking…" : "Review & Confirm →"}
                </button>
              </div>
            )}

            {/* ━━━ STEP 3: CONFIRM ━━━ */}
            {step === 3 && (
              <div className="reg-step">
                <button className="reg-btn-back" onClick={() => goStep(2)}>
                  ← Edit Info
                </button>

                <div
                  style={{
                    fontSize: 14,
                    color: "#57534E",
                    marginBottom: 14,
                    fontWeight: 500,
                  }}
                >
                  Please review your details before confirming. Your unique
                  ticket will be generated after this step.
                </div>

                <div className="reg-summary">
                  {[
                    ["Full Name", `${form.firstName} ${form.lastName}`],
                    ["Gender", form.gender],
                    ["WhatsApp", form.phone],
                    ["Email", form.email],
                    ["Event", event.title],
                    ["Date", event.date || "TBA"],
                    ["Venue", event.venue || "TBA"],
                    ["Entry Fee", isFree ? "₹0 — Free" : `₹${event.price}`],
                  ].map(([k, v]) => (
                    <div className="reg-summary-row" key={k}>
                      <span className="reg-summary-key">{k}</span>
                      <span
                        className={`reg-summary-val ${
                          k === "Entry Fee" ? "sun" : ""
                        }`}
                        style={{
                          color:
                            k === "Entry Fee" && isFree
                              ? "#43A047"
                              : undefined,
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>

                {isFree ? (
                  <div className="reg-free-banner" style={{ marginBottom: 18 }}>
                    <div className="reg-free-icon">🎉</div>
                    <div className="reg-free-text">
                      <b>Free event!</b> No payment needed.
                      <br />
                      Your ticket will be generated instantly.
                    </div>
                    <div className="reg-free-price">₹0</div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#FFF0EA",
                      border: "1.5px solid rgba(255,112,67,0.2)",
                      borderRadius: 14,
                      padding: 16,
                      marginBottom: 18,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 28,
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                        fontWeight: 800,
                        color: "#FF7043",
                      }}
                    >
                      ₹{event.price}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#78716C", marginTop: 2 }}
                    >
                      Pay at the venue / via UPI · theofflinevibes@upi
                    </div>
                  </div>
                )}

                <button
                  className="reg-btn reg-btn-primary"
                  onClick={confirmReg}
                  disabled={busy}
                >
                  {busy ? "Generating ticket…" : "Confirm & Get Ticket 🎫"}
                </button>
                <button
                  className="reg-btn reg-btn-secondary"
                  onClick={() => goStep(2)}
                >
                  Edit Details
                </button>
              </div>
            )}

            {/* ━━━ STEP 4: TICKET ━━━ */}
            {step === 4 && (
              <div className="reg-step">
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: 18,
                  }}
                >
                  <div style={{ fontSize: 40, marginBottom: 6 }}>🎉</div>
                  <div
                    style={{
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#1C1917",
                      marginBottom: 4,
                    }}
                  >
                    You're Registered!
                  </div>
                  <div style={{ fontSize: 13, color: "#78716C" }}>
                    Show this ticket at the event entry
                  </div>
                </div>

                <div className="reg-ticket">
                  <div className="reg-ticket-header">
                    <div className="reg-ticket-brand">
                      <div className="reg-ticket-live" />
                      The Offline Vibes
                    </div>
                    <div className="reg-ticket-status">✓ CONFIRMED</div>
                  </div>

                  <div className="reg-ticket-qr-wrap">
                    <div className="reg-ticket-qr">
                      <img src={qrUrl(qrData)} alt="Entry QR Code" />
                    </div>
                    <div className="reg-ticket-scan-hint">
                      Scan at venue entry
                    </div>
                  </div>

                  <div className="reg-ticket-divider">
                    <div className="reg-ticket-circle-left" />
                    <div style={{ flex: 1, borderTop: "1.5px dashed rgba(255,255,255,0.12)" }} />
                    <div className="reg-ticket-circle-right" />
                  </div>

                  <div className="reg-ticket-body">
                    <div className="reg-ticket-id">{ticketId}</div>
                    {[
                      ["Name", fullName || "—"],
                      ["Gender", form.gender],
                      ["Contact", form.phone],
                      ["Event", event.title],
                      ["Date", event.date || "TBA"],
                      ["Venue", event.venue || "TBA"],
                      ["Fee", isFree ? "FREE ✓" : `₹${event.price}`],
                      ["Status", "✅ CONFIRMED"],
                    ].map(([k, v]) => (
                      <div className="reg-ticket-row" key={k}>
                        <span className="reg-ticket-k">{k}</span>
                        <span
                          className={`reg-ticket-v ${
                            k === "Fee"
                              ? isFree
                                ? "green"
                                : "sun"
                              : k === "Status"
                              ? "green"
                              : ""
                          }`}
                          style={{
                            maxWidth: 220,
                            wordBreak: "break-word",
                            textAlign: "right",
                          }}
                        >
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="reg-tip">
                  📲 <b>Screenshot this ticket</b> or print it. Our volunteers
                  will scan the QR code at the entry gate to check you in.
                  {!isFree && (
                    <>
                      <br />
                      💳 Please carry ₹{event.price} cash / UPI ready at
                      the venue.
                    </>
                  )}
                </div>

                <button
                  className="reg-btn reg-btn-print"
                  style={{ marginTop: 14 }}
                  onClick={() => window.print()}
                >
                  🖨️ Print / Save Ticket
                </button>
                <button
                  className="reg-btn reg-btn-secondary"
                  onClick={onClose}
                >
                  Done — Back to Events
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── VOLUNTEER SCAN PAGE ─────────────────────────────────────
/**
 * ScanPage — used by volunteers.
 * Usage: <ScanPage/>
 * Reads ?tid=TOV-XXXXXXX from the URL.
 * Shows registrant details, marks them as attended,
 * and maintains a live attended list.
 */
export function ScanPage() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [alreadyAttended, setAlreadyAttended] = useState(false);
  const [marking, setMarking] = useState(false);
  const [markedNow, setMarkedNow] = useState(false);
  const [attended, setAttended] = useState([]);

  const tid = new URLSearchParams(window.location.search).get("tid") || "";

  useEffect(() => {
    loadRecord();
    loadAttended();
  }, [tid]);

  const loadRecord = async () => {
    setLoading(true);
    if (!tid) { setNotFound(true); setLoading(false); return; }
    const all = await fbGet("registrations");
    const found = all.find((r) => r.ticketId === tid);
    if (!found) { setNotFound(true); setLoading(false); return; }
    setRecord(found);
    if (found.attended) setAlreadyAttended(true);
    setLoading(false);
  };

  const loadAttended = async () => {
    const all = await fbGet("registrations");
    const done = all
      .filter((r) => r.attended)
      .sort((a, b) => (b.attendedAt || "") > (a.attendedAt || "") ? 1 : -1);
    setAttended(done);
  };

  const markAttended = async () => {
    if (!record) return;
    setMarking(true);
    await fbUpdate("registrations", record.id, {
      attended: true,
      attendedAt: nowDate() + " " + nowTime(),
    });
    setAlreadyAttended(false);
    setMarkedNow(true);
    setMarking(false);
    await loadAttended();
  };

  return (
    <>
      <style>{REG_STYLES}</style>
      <div className="scan-wrap">
        <div className="scan-logo">⚡ The Offline Vibes — Volunteer Check-In</div>

        <div className="scan-card">
          {loading && (
            <div style={{ textAlign: "center", color: "#fff", padding: 40 }}>
              Loading…
            </div>
          )}

          {!loading && notFound && (
            <div className="scan-status-err">
              <div className="scan-big-icon">❌</div>
              <div className="scan-name" style={{ fontSize: 18 }}>
                Ticket Not Found
              </div>
              <div
                style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6 }}
              >
                ID: {tid || "—"}
              </div>
            </div>
          )}

          {!loading && record && (
            <>
              {/* Status banner */}
              {markedNow ? (
                <div className="scan-status-ok">
                  <div className="scan-big-icon">✅</div>
                  <div className="scan-name">{record.name}</div>
                  <div className="scan-tid">{record.ticketId}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#66BB6A",
                      marginTop: 6,
                      fontWeight: 700,
                    }}
                  >
                    Marked as ATTENDED just now
                  </div>
                </div>
              ) : alreadyAttended ? (
                <div className="scan-status-warn">
                  <div className="scan-big-icon">⚠️</div>
                  <div className="scan-name">{record.name}</div>
                  <div className="scan-tid">{record.ticketId}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#FFB300",
                      marginTop: 6,
                      fontWeight: 700,
                    }}
                  >
                    Already checked in · {record.attendedAt}
                  </div>
                </div>
              ) : (
                <div className="scan-status-ok" style={{ borderColor: "rgba(255,112,67,0.3)", background: "rgba(255,112,67,0.08)" }}>
                  <div className="scan-big-icon">🎫</div>
                  <div className="scan-name">{record.name}</div>
                  <div className="scan-tid">{record.ticketId}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#FF7043",
                      marginTop: 6,
                      fontWeight: 700,
                    }}
                  >
                    Valid ticket — not yet checked in
                  </div>
                </div>
              )}

              {/* Details */}
              {[
                ["Gender", record.gender || "—"],
                ["Phone", record.phone],
                ["Email", record.email],
                ["Event", record.eventTitle],
                ["Date", record.eventDate || "—"],
                ["Venue", record.eventVenue || "—"],
                ["Fee", record.price === "0" ? "Free" : `₹${record.price}`],
                ["Registered", record.date + " " + record.time],
                ["Status", record.status?.toUpperCase()],
              ].map(([k, v]) => (
                <div className="scan-row" key={k}>
                  <span className="scan-row-k">{k}</span>
                  <span className="scan-row-v">{v}</span>
                </div>
              ))}

              {/* Mark attended button */}
              {!markedNow && !alreadyAttended && (
                <button
                  className="scan-btn-mark"
                  onClick={markAttended}
                  disabled={marking}
                >
                  {marking ? "Marking…" : "✅ Mark as Attended"}
                </button>
              )}
            </>
          )}
        </div>

        {/* Attended list */}
        {attended.length > 0 && (
          <div className="scan-attended-list">
            <div className="scan-attended-h">
              Attended ({attended.length})
            </div>
            {attended.map((a) => (
              <div className="scan-attended-item" key={a.id}>
                <div>
                  <div className="scan-attended-name">{a.name}</div>
                  <div className="scan-attended-tid">{a.ticketId}</div>
                </div>
                <div className="scan-attended-time">{a.attendedAt}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default EventModal;