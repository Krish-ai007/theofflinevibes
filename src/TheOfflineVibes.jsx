// ─── TheOfflineVibes.jsx ─────────────────────────────────────────────────────
// Palette: #FFFAF3 Cream · #FFF2DB Warm Cream · #FFE5BF Peach · #F62440 Crimson
// Premium, editorial event experience · Mobile-first · Standalone registration page
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { VolunteerScanner, REGISTRATION_STYLES, EVENT_EXTRA_FIELDS } from "./EventRegistration";

// ─── FIREBASE ────────────────────────────────────────────────
const FB_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};
let _db = null;
function db() {
  if (_db) return _db;
  if (!window.firebase) return null;
  if (!window.firebase.apps?.length) window.firebase.initializeApp(FB_CONFIG);
  _db = window.firebase.firestore(); return _db;
}
function authInstance() {
  if (!window.firebase) return null;
  if (!window.firebase.apps?.length) window.firebase.initializeApp(FB_CONFIG);
  return window.firebase.auth();
}
async function loginWithEmail(e, p) { return authInstance().signInWithEmailAndPassword(e, p); }
async function logoutUser() { return authInstance().signOut(); }
function onAuthChange(cb) { const a = authInstance(); if (!a) return () => {}; return a.onAuthStateChanged(cb); }
const LS = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)||"null"); } catch { return null; } },
  set: (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
export async function fbAdd(col, data) {
  const d = db();
  if (d) return (await d.collection(col).add({...data, createdAt: window.firebase.firestore.FieldValue.serverTimestamp()})).id;
  const arr = LS.get(col)||[]; const id = Date.now().toString();
  arr.unshift({...data, id, createdAt: new Date().toISOString()}); LS.set(col, arr); return id;
}
export async function fbGet(col) {
  const d = db();
  if (d) { try { const s = await d.collection(col).orderBy("createdAt","desc").get(); return s.docs.map(doc => ({id:doc.id,...doc.data()})); } catch { return []; } }
  return LS.get(col)||[];
}
export async function fbGetOne(col, id) {
  const d = db();
  if (d) { try { const doc = await d.collection(col).doc(id).get(); return doc.exists ? {id:doc.id,...doc.data()} : null; } catch { return null; } }
  return (LS.get(col)||[]).find(x => x.id===id) || null;
}
export async function fbUpdate(col, id, data) {
  const d = db(); if (d) return d.collection(col).doc(id).update(data);
  const arr = LS.get(col)||[]; const i = arr.findIndex(x=>x.id===id);
  if (i>=0) arr[i]={...arr[i],...data}; LS.set(col, arr);
}
async function fbDelete(col, id) {
  const d = db(); if (d) return d.collection(col).doc(id).delete();
  LS.set(col, (LS.get(col)||[]).filter(x=>x.id!==id));
}
export const qrUrl = (t,s=240) => `https://api.qrserver.com/v1/create-qr-code/?size=${s}x${s}&ecc=H&data=${encodeURIComponent(t)}`;
export const genTicketId = () => "TOV-"+Math.random().toString(36).substr(2,4).toUpperCase()+Math.random().toString(36).substr(2,4).toUpperCase();
export const nowDate = () => new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
export const nowTime = () => new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});

// ─── UPI ─────────────────────────────────────────────────────
export const UPI_ID   = "theofflinevibes@upi"; // ← change this
export const UPI_NAME = "The Offline Vibes";

// ─── STATIC DATA ─────────────────────────────────────────────
const CHAPTERS = [
  { city:"Surat",     status:"founding", desc:"The birthplace. Where real connections first began." },
  { city:"Vadodara",  status:"soon",     desc:"A growing community choosing experiences over screens." },
  { city:"Ahmedabad", status:"soon",     desc:"Coming soon to Gujarat's cultural capital." },
];
const EXPS = [
  { title:"Digital Detox Camps",        desc:"2D/1N forest retreats. Phone lockbox. Trekking, bonfire, journaling & real conversations.", tag:"POPULAR" },
  { title:"No-Phone Café Nights",         desc:"Board games, conversation cards, live acoustic music. Phone at the door.",                  tag:"WEEKLY"  },
  { title:"Mystery Road Trips",           desc:"Destination revealed at departure. Sunrise hikes, cycling clubs, meet-strangers dinners.",   tag:"ADVENTURE"},
  { title:"Premium Retreats",            desc:"Himachal. Goa. Coorg. Multi-day immersions for founders & remote workers.",                  tag:"EXCLUSIVE"},
  { title:"Map & Compass City Hunts",   desc:"Paper maps, cryptic riddles. Teams race to find hidden checkpoints. No GPS allowed.",        tag:"TEAM"    },
  { title:"Escape the Woods (Overnight)", desc:"A narrative-driven overnight camp — solve physical puzzles scattered through the forest.",    tag:"OVERNIGHT"},
];
const STORIES = [
  { tag:"WENT VIRAL",  q:"100 people gave up phones for 48 hours. None of them wanted it to end.",          author:"Surat Camp, Oct 2024"   },
  { tag:"REAL STORY",  q:"We took strangers into a forest with no internet. They left as lifelong friends.", author:"Mystery Trip, Sep 2024" },
  { tag:"MOST SHARED", q:"People literally cried reconnecting with real life. No phones. Just humans.",       author:"Café Night, Nov 2024"   },
];
const FAQS = [
  { q:"What happens to my phone?",  a:"We provide a numbered lockbox. Your phone is stored safely — you get it back at the end. It's liberating, not scary." },
  { q:"Who comes to these events?", a:"IT professionals, students, founders, couples, and anyone craving real human connection. Ages 18–35 mostly." },
  { q:"Are the events safe?",       a:"100%. All venues are vetted, all guides are trained. We have emergency protocols and safety briefings at every event." },
  { q:"Can I get a refund?",        a:"Full refund up to 48 hours before the event. After that, you can transfer your spot to a friend." },
];

// ─── PALETTE ─────────────────────────────────────────────────
// #F62440  Crimson (primary brand / CTAs)
// #FFFAF3  Cream (page background)
// #FFF2DB  Warm cream (panels, paper)
// #FFE5BF  Peach (soft accents, highlights)
// #1A1A1A  Near-black (text, dark sections)
// #FFFFFF  White

// ─── GLOBAL STYLES ───────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;font-size:16px}
body{background:#FFFAF3;color:#1A1A1A;font-family:'Instrument Sans',sans-serif;overflow-x:hidden;line-height:1.6;cursor:none}
::selection{background:#F62440;color:#fff}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:#F62440;border-radius:4px}

:root{
  --green:    #F62440;
  --green-d:  #C71830;
  --green-lt: #FDE7EA;
  --green-g:  rgba(246,36,64,.18);
  --orange:   #FFE5BF;
  --orange-lt:#FFF2DB;
  --orange-g: rgba(255,229,191,.2);
  --red:      #F62440;
  --red-d:    #C71830;
  --red-lt:   #FDE7EA;
  --red-g:    rgba(246,36,64,.2);
  --light:    #FFFAF3;
  --white:    #FFFFFF;
  --dark:     #1A1A1A;
  --dark2:    #2D2D2D;
  --dark3:    #444;
  --muted:    #6B7280;
  --muted2:   #9CA3AF;
  --border:   rgba(26,26,26,.1);
  --border2:  rgba(26,26,26,.06);
  --card:     #FFFFFF;
  --paper:    #FFF2DB;
  --gold:     #B8860B;
  --inactive: #EFE6DA;
  --ease:     cubic-bezier(.16,1,.3,1);
}

/* ── CURSOR ── */
.cursor{width:10px;height:10px;background:var(--red);border-radius:50%;position:fixed;pointer-events:none;z-index:99999;mix-blend-mode:multiply}
.cursor-ring{width:32px;height:32px;border:2px solid rgba(246,36,64,.4);border-radius:50%;position:fixed;pointer-events:none;z-index:99998;transition:all .1s linear}
.cursor-ring.hov{transform:scale(2.1);border-color:var(--red)}

/* ── NAVBAR ── */
.nav{
  position:fixed;top:0;left:0;right:0;z-index:900;
  padding:18px 48px;display:flex;justify-content:space-between;
  align-items:center;transition:all .35s;
  /* transparent on hero — no background */
}
/* Scrolled state: white pill-style solid bar */
.nav.solid{
  background:rgba(255,255,255,.97);
  backdrop-filter:blur(20px);
  border-bottom:1.5px solid rgba(246,36,64,.12);
  padding:13px 48px;
  box-shadow:0 4px 28px rgba(26,26,26,.1);
}

/* Logo — white on hero, green when scrolled */
.nav-logo{
  font-family:'Bricolage Grotesque',sans-serif;
  font-size:18px;font-weight:800;
  color:#fff;
  display:flex;align-items:center;gap:10px;
  letter-spacing:-.3px;text-decoration:none;
  transition:color .3s;
}
.nav.solid .nav-logo{color:var(--green)}

.nav-dot{
  width:8px;height:8px;border-radius:50%;
  background:#F62440;flex-shrink:0;
  animation:pulse 2.2s ease-in-out infinite;
}
@keyframes pulse{
  0%,100%{box-shadow:0 0 0 0 rgba(246,36,64,.5)}
  60%{box-shadow:0 0 0 8px rgba(246,36,64,0)}
}

/* Links — white semi-transparent on hero, muted on solid */
.nav-links{display:flex;gap:28px;list-style:none}
.nav-links a{
  text-decoration:none;font-size:14px;font-weight:600;
  color:rgba(255,255,255,.8);
  transition:color .25s;position:relative;padding-bottom:3px;
  letter-spacing:.1px;
}
.nav.solid .nav-links a{color:var(--muted)}
.nav-links a::after{
  content:'';position:absolute;bottom:0;left:0;right:0;
  height:2px;background:var(--green);border-radius:2px;
  transform:scaleX(0);transform-origin:left;transition:transform .25s;
}
.nav-links a:hover{color:#fff}
.nav.solid .nav-links a:hover{color:var(--dark)}
.nav-links a:hover::after{transform:scaleX(1)}

/* CTA button — white outline on hero, solid green when scrolled */
.nav-btn{
  border:none;padding:10px 24px;border-radius:100px;
  font-family:'Instrument Sans',sans-serif;font-size:14px;font-weight:700;
  cursor:none;transition:all .25s;letter-spacing:.2px;
  /* transparent hero state */
  background:#fff;color:var(--green);
  box-shadow:0 2px 14px rgba(0,0,0,.12);
}
.nav-btn:hover{
  background:var(--orange);color:var(--dark);
  transform:translateY(-2px);
  box-shadow:0 8px 22px rgba(255,229,191,.35);
}
/* Solid state */
.nav.solid .nav-btn{
  background:var(--green);color:#fff;
  box-shadow:0 4px 14px var(--green-g);
}
.nav.solid .nav-btn:hover{
  background:var(--green-d);color:#fff;
  transform:translateY(-2px);
  box-shadow:0 8px 24px var(--green-g);
}

.nav-mobile-btn{
  display:none;background:none;border:none;
  cursor:pointer;padding:8px;
  color:#fff;font-size:22px;line-height:1;
  transition:color .2s;
}
.nav.solid .nav-mobile-btn{color:var(--dark)}

/* ── HERO ── */
.hero{min-height:100vh;background:var(--green);position:relative;overflow:hidden;display:flex;align-items:center}
.hero-pattern{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1px);background-size:28px 28px;pointer-events:none}
/* Subtle top vignette so nav links stay legible over any background variation */
.hero-top-fade{
  position:absolute;top:0;left:0;right:0;height:120px;
  background:linear-gradient(to bottom,rgba(14,40,24,.25),transparent);
  pointer-events:none;z-index:1;
}
.hero-glow{position:absolute;width:640px;height:640px;border-radius:50%;background:radial-gradient(circle,rgba(255,229,191,.22) 0%,rgba(246,36,64,.1) 45%,transparent 70%);top:-160px;right:-180px;animation:drift 12s ease-in-out infinite;pointer-events:none}
@keyframes drift{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-20px,24px) scale(1.05)}}
.hero-inner{max-width:1200px;margin:0 auto;padding:110px 48px 80px;display:grid;grid-template-columns:1.1fr 1fr;gap:72px;align-items:center;width:100%;position:relative;z-index:2}
.hero-tag{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.9);font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:6px 16px;border-radius:100px;margin-bottom:24px}
.hero-h1{font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(42px,5.5vw,70px);font-weight:800;line-height:1.06;color:#fff;margin-bottom:20px;letter-spacing:-.8px}
.hero-h1 em{font-style:normal;color:var(--orange)}
.hero-p{font-size:17px;line-height:1.78;color:rgba(255,255,255,.72);margin-bottom:40px;max-width:460px}
.hero-actions{display:flex;gap:14px;flex-wrap:wrap}
.hero-stats-row{display:flex;gap:40px;margin-top:48px;padding-top:40px;border-top:1px solid rgba(255,255,255,.15)}
.hero-stat-n{font-family:'Bricolage Grotesque',sans-serif;font-size:30px;font-weight:800;color:var(--orange);line-height:1}
.hero-stat-l{font-size:11px;color:rgba(255,255,255,.5);margin-top:3px;letter-spacing:.8px;text-transform:uppercase}

/* Hero right — phone + cards */
.hero-right{position:relative;display:flex;justify-content:center;align-items:center}
.hero-phone{width:248px;background:#0A1208;border-radius:42px;padding:18px 12px 26px;box-shadow:0 40px 100px rgba(0,0,0,.45);position:relative;z-index:3;border:1.5px solid rgba(255,255,255,.1);animation:float 6s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
.hero-phone-notch{width:70px;height:5px;background:rgba(255,255,255,.1);border-radius:10px;margin:0 auto 12px}
.hero-phone-screen{background:#111;border-radius:24px;overflow:hidden;padding:14px}
.phone-tag{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--orange);margin-bottom:6px}
.phone-title{font-family:'Bricolage Grotesque',sans-serif;font-size:14px;font-weight:700;color:#fff;margin-bottom:8px;line-height:1.3}
.phone-chips{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px}
.pchip{padding:3px 8px;border-radius:100px;font-size:9px;font-weight:700}
.pc-g{background:rgba(246,36,64,.25);color:#FFE5BF}
.pc-o{background:rgba(255,229,191,.2);color:var(--orange)}
.pc-w{background:rgba(255,255,255,.1);color:rgba(255,255,255,.7)}
.phone-meta{font-size:10px;color:rgba(255,255,255,.35);margin-bottom:10px}
.phone-price{font-family:'Bricolage Grotesque',sans-serif;font-size:19px;font-weight:800;color:var(--orange);margin-bottom:10px}
.phone-btn{background:var(--red);color:#fff;border:none;width:100%;padding:8px;border-radius:100px;font-family:'Instrument Sans',sans-serif;font-size:11px;font-weight:700}
.float-card{position:absolute;background:rgba(255,255,255,.12);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:12px 16px;font-family:'Instrument Sans',sans-serif}
.fc1{top:-12px;right:-32px;animation:fc1 4s ease-in-out infinite}
.fc2{bottom:32px;left:-48px;animation:fc2 5s ease-in-out infinite}
@keyframes fc1{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes fc2{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}
.fc-icon{font-size:18px;margin-bottom:4px}
.fc-label{font-size:9px;color:rgba(255,255,255,.45);font-weight:600;letter-spacing:.5px;text-transform:uppercase}
.fc-val{font-family:'Bricolage Grotesque',sans-serif;font-size:13px;font-weight:700;color:#fff;margin-top:2px}

/* ── MARQUEE ── */
.marquee-wrap{background:var(--dark);padding:14px 0;overflow:hidden;border-top:1px solid rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06)}
.marquee-track{display:flex;animation:scroll 26s linear infinite;white-space:nowrap}
.marquee-item{display:inline-flex;align-items:center;gap:14px;font-family:'Bricolage Grotesque',sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.75);padding:0 32px}
.marquee-sep{color:var(--orange);font-size:6px}
@keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}

/* ── BUTTONS ── */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:none;font-family:'Instrument Sans',sans-serif;font-weight:700;border-radius:100px;transition:all .22s;letter-spacing:.2px;text-decoration:none}
.btn-green{background:var(--green);color:#fff;padding:14px 32px;font-size:15px;box-shadow:0 4px 16px var(--green-g)}
.btn-green:hover{background:var(--green-d);transform:translateY(-2px);box-shadow:0 10px 28px var(--green-g)}
.btn-red{background:var(--red);color:#fff;padding:14px 32px;font-size:15px;box-shadow:0 4px 16px var(--red-g)}
.btn-red:hover{background:var(--red-d);transform:translateY(-2px);box-shadow:0 10px 28px var(--red-g)}
.btn-orange{background:var(--orange);color:var(--dark);padding:14px 32px;font-size:15px;box-shadow:0 4px 16px var(--orange-g)}
.btn-orange:hover{background:#F2CFA0;color:var(--dark);transform:translateY(-2px)}
.btn-outline{background:transparent;color:#fff;border:2px solid rgba(255,255,255,.35);padding:13px 30px;font-size:15px}
.btn-outline:hover{border-color:#fff;background:rgba(255,255,255,.1);transform:translateY(-2px)}
.btn-outline-dark{background:transparent;color:var(--dark);border:2px solid var(--border);padding:13px 28px;font-size:14px}
.btn-outline-dark:hover{border-color:var(--green);color:var(--green);transform:translateY(-1px)}
.btn-white{background:#fff;color:var(--green);padding:14px 32px;font-size:15px;box-shadow:0 4px 18px rgba(26,26,26,.14)}
.btn-white:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(26,26,26,.18)}
.btn-sm{padding:8px 18px !important;font-size:12px !important}
.btn-xs{padding:5px 12px !important;font-size:11px !important}
.btn-ds{background:var(--green-lt);color:var(--green);border:1px solid rgba(246,36,64,.2);padding:8px 16px;font-size:12px}
.btn-ds:hover{background:#FBD6DC}
.btn-dr{background:var(--red-lt);color:var(--red-d);border:1px solid rgba(246,36,64,.15);padding:8px 16px;font-size:12px}
.btn-dr:hover{background:#FBD6DC}
.btn-dn{background:var(--light);color:var(--muted);border:1px solid var(--border);padding:8px 16px;font-size:12px}
.btn-dn:hover{background:#E0DEDE}
.btn-dark{background:var(--dark);color:#fff;border:none;padding:8px 16px;font-size:12px}
.btn-dark:hover{background:var(--dark2)}
.btn:disabled{opacity:.5;cursor:not-allowed;transform:none !important;box-shadow:none !important}

/* ── SECTIONS ── */
.sec{padding:88px 48px}
.sec-inner{max-width:1200px;margin:0 auto}
.sec-label{display:inline-flex;align-items:center;gap:8px;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--green);margin-bottom:12px}
.sec-label::before{content:'';width:20px;height:2.5px;background:var(--green);border-radius:2px;display:block}
.sec-h2{font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(28px,3.6vw,50px);font-weight:800;color:var(--dark);margin-bottom:12px;line-height:1.08;letter-spacing:-.4px}
.sec-p{font-size:16px;color:var(--muted);line-height:1.75;max-width:500px}

/* ── STATS ── */
.stats-sec{background:var(--dark);padding:56px 48px}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);max-width:1000px;margin:0 auto;border:1px solid rgba(255,255,255,.07);border-radius:20px;overflow:hidden}
.stat-box{padding:36px 24px;text-align:center;border-right:1px solid rgba(255,255,255,.07);transition:background .2s}
.stat-box:last-child{border-right:none}
.stat-box:hover{background:rgba(255,255,255,.03)}
.stat-n{font-family:'Bricolage Grotesque',sans-serif;font-size:46px;font-weight:800;color:var(--orange);line-height:1;margin-bottom:6px}
.stat-l{font-size:12px;color:rgba(255,255,255,.38);font-weight:600;letter-spacing:.5px;text-transform:uppercase}

/* ════════════════════════════════════════════════
   ── EVENTS — BOOKMYSHOW STYLE ──
   ════════════════════════════════════════════════ */
.ev-section{background:var(--paper);padding:80px 48px}
.ev-section-dark{background:var(--dark)}
.ev-hero-banner{
  background:var(--green);border-radius:24px;
  padding:48px 56px;margin-bottom:48px;position:relative;overflow:hidden;
}
.ev-hero-banner::before{
  content:'';position:absolute;inset:0;
  background-image:radial-gradient(rgba(255,255,255,.07) 1px,transparent 1px);
  background-size:24px 24px;pointer-events:none;
}
.ev-banner-glow{
  position:absolute;width:400px;height:400px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,229,191,.2),transparent 65%);
  top:-100px;right:-100px;pointer-events:none;
}
.ev-banner-inner{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:24px}
.ev-banner-label{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.6);margin-bottom:10px}
.ev-banner-h{font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(26px,3.5vw,44px);font-weight:800;color:#fff;line-height:1.1;letter-spacing:-.4px}
.ev-banner-h span{color:var(--orange)}
.ev-banner-sub{font-size:15px;color:rgba(255,255,255,.65);margin-top:8px;line-height:1.6}
.ev-banner-right{display:flex;flex-direction:column;align-items:flex-end;gap:14px;flex-shrink:0}
.ev-live-badge{background:rgba(246,36,64,.9);color:#fff;font-size:11px;font-weight:700;padding:5px 14px;border-radius:100px;display:flex;align-items:center;gap:6px;letter-spacing:.5px;text-transform:uppercase}
.ev-live-dot{width:6px;height:6px;border-radius:50%;background:#fff;animation:pulse 1.5s ease-in-out infinite}

/* Filter row */
.ev-filter-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:36px;align-items:center}
.ev-filter-btn{background:var(--white);border:1.5px solid var(--border);color:var(--muted);font-family:'Instrument Sans',sans-serif;font-size:12px;font-weight:600;padding:7px 18px;border-radius:100px;cursor:none;transition:all .2s;letter-spacing:.3px}
.ev-filter-btn.on,.ev-filter-btn:hover{background:var(--green);border-color:var(--green);color:#fff}
.ev-count-badge{background:var(--red-lt);color:var(--red);font-size:11px;font-weight:700;padding:4px 12px;border-radius:100px;margin-left:auto;border:1px solid rgba(246,36,64,.2)}

/* Card grid — 3 cols desktop, 2 tablet, 1 mobile */
.ev-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}

/* BMS-style card */
.ev-card{
  background:var(--white);border-radius:20px;overflow:hidden;
  border:1.5px solid var(--border2);transition:all .3s;cursor:none;
  position:relative;
}
.ev-card:hover{transform:translateY(-7px);box-shadow:0 24px 64px rgba(26,26,26,.14);border-color:var(--green)}
.ev-card.sold-out{opacity:.65;cursor:not-allowed}
.ev-card.sold-out:hover{transform:none;box-shadow:none;border-color:var(--border2)}

/* Card banner image */
.ev-card-img{height:200px;position:relative;overflow:hidden;background:var(--light);display:flex;align-items:center;justify-content:center;font-size:52px}
.ev-card-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .4s}
.ev-card:hover .ev-card-img img{transform:scale(1.05)}
.ev-card-img-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(26,26,26,.65) 0%,transparent 55%)}

/* Card badges */
.ev-badge{position:absolute;font-family:'Bricolage Grotesque',sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:5px 12px;border-radius:100px}
.ev-badge-tl{top:12px;left:12px}
.ev-badge-tr{top:12px;right:12px}
.ev-badge-new{background:var(--orange);color:var(--dark);box-shadow:0 4px 10px var(--orange-g)}
.ev-badge-hot{background:var(--red);color:#fff;box-shadow:0 4px 10px var(--red-g)}
.ev-badge-free{background:var(--green);color:#fff;box-shadow:0 4px 10px var(--green-g)}
.ev-badge-sold{background:#555;color:rgba(255,255,255,.8)}

/* Inside card */
.ev-card-body{padding:18px 20px 20px}
.ev-card-category{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--green);margin-bottom:6px;display:flex;align-items:center;gap:6px}
.ev-card-title{font-family:'Bricolage Grotesque',sans-serif;font-size:17px;font-weight:700;color:var(--dark);margin-bottom:10px;line-height:1.3}
.ev-card-meta{display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--muted);margin-bottom:14px}
.ev-card-meta span{display:flex;align-items:center;gap:6px}

/* Spots progress */
.ev-spots-row{display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:600;margin-bottom:5px}
.ev-spots-bar{height:4px;background:var(--light);border-radius:4px;overflow:hidden;margin-bottom:14px}
.ev-spots-fill{height:100%;border-radius:4px;transition:width .5s ease}

/* Card footer */
.ev-card-footer{display:flex;justify-content:space-between;align-items:center}
.ev-price{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;font-weight:800;color:var(--dark)}
.ev-price-free{color:var(--green);font-size:18px}
.ev-price small{font-size:12px;font-weight:500;color:var(--muted2)}

/* Empty */
.ev-empty{text-align:center;padding:72px 32px;background:var(--white);border-radius:20px;border:2px dashed var(--border)}
.ev-empty-icon{font-size:52px;margin-bottom:14px}
.ev-empty-h{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;font-weight:700;color:var(--dark);margin-bottom:8px}
.ev-empty-p{color:var(--muted2);font-size:14px}

/* ── FEATURED EVENT (BookMyShow-style full-width hero card) ── */
.ev-featured{
  background:var(--white);border-radius:24px;overflow:hidden;
  border:1.5px solid var(--border2);margin-bottom:32px;
  display:grid;grid-template-columns:1fr 1fr;
  box-shadow:0 8px 40px rgba(26,26,26,.1);
}
.ev-featured-img{height:100%;min-height:300px;position:relative;background:var(--light);display:flex;align-items:center;justify-content:center;font-size:80px;overflow:hidden}
.ev-featured-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.ev-featured-img-overlay{position:absolute;inset:0;background:linear-gradient(135deg,rgba(26,26,26,.55),rgba(246,36,64,.3))}
.ev-monogram{position:relative;z-index:2;font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:64px;color:rgba(255,255,255,.92);letter-spacing:-1px}
.ev-monogram-sm{font-size:38px}
.ev-featured-badges{position:absolute;top:16px;left:16px;display:flex;gap:8px;flex-wrap:wrap}
.ev-featured-body{padding:36px 40px;display:flex;flex-direction:column;justify-content:center}
.ev-featured-eyebrow{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--green);margin-bottom:10px}
.ev-featured-title{font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(22px,2.8vw,34px);font-weight:800;color:var(--dark);margin-bottom:14px;line-height:1.2;letter-spacing:-.3px}
.ev-featured-desc{font-size:14px;color:var(--muted);line-height:1.7;margin-bottom:20px}
.ev-featured-meta{display:flex;flex-direction:column;gap:8px;font-size:13px;color:var(--muted);margin-bottom:24px}
.ev-featured-meta span{display:flex;align-items:center;gap:8px}
.ev-featured-footer{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.ev-featured-price{font-family:'Bricolage Grotesque',sans-serif;font-size:32px;font-weight:800;color:var(--dark)}

/* ── EXPERIENCES ── */
.exp-sec{background:var(--white)}
.exp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:48px}
.exp-card{background:var(--paper);border:1.5px solid var(--border2);border-radius:18px;padding:28px;transition:all .28s;position:relative;overflow:hidden}
.exp-card:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(26,26,26,.1);border-color:var(--green);background:#fff}
.exp-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
.exp-index{font-family:'Bricolage Grotesque',sans-serif;font-size:13px;font-weight:800;color:var(--green);letter-spacing:1px}
.exp-tag{font-family:'Bricolage Grotesque',sans-serif;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:4px 10px;border-radius:100px}
.exp-tag-g{background:var(--green-lt);color:var(--green);border:1px solid rgba(246,36,64,.2)}
.exp-tag-o{background:var(--orange-lt);color:#8A5A18;border:1px solid rgba(255,229,191,.3)}
.exp-tag-r{background:var(--red-lt);color:var(--red-d);border:1px solid rgba(246,36,64,.2)}
.exp-tag-d{background:var(--light);color:var(--dark3);border:1px solid var(--border)}
.exp-title{font-family:'Bricolage Grotesque',sans-serif;font-size:17px;font-weight:700;color:var(--dark);margin-bottom:8px;letter-spacing:-.2px}
.exp-desc{font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:16px}
.exp-num{position:absolute;bottom:-10px;right:14px;font-family:'Bricolage Grotesque',sans-serif;font-size:80px;font-weight:800;color:rgba(26,26,26,.04);line-height:1}

/* ── CHAPTERS ── */
.ch-sec{background:var(--paper)}
.ch-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:48px}
.ch-card{background:var(--white);border:1.5px solid var(--border2);border-radius:18px;padding:28px;transition:all .28s;position:relative;overflow:hidden;box-shadow:0 2px 10px rgba(26,26,26,.05)}
.ch-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:3px 3px 0 0}
.ch-card.founding::before{background:linear-gradient(90deg,var(--green),var(--orange))}
.ch-card.soon::before{background:linear-gradient(90deg,#C5BFBA,#ADA8A3)}
.ch-card:hover{transform:translateY(-5px);box-shadow:0 16px 42px rgba(26,26,26,.1)}
.ch-card.founding:hover{border-color:rgba(246,36,64,.3)}
.ch-emoji{width:52px;height:52px;border-radius:50%;background:var(--green-lt);color:var(--green);display:flex;align-items:center;justify-content:center;font-family:'Bricolage Grotesque',sans-serif;font-size:20px;font-weight:800;margin-bottom:16px}
.ch-status{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:4px 12px;border-radius:100px;margin-bottom:12px}
.ch-status-live{background:var(--green-lt);color:var(--green);border:1px solid rgba(246,36,64,.2)}
.ch-status-soon{background:var(--light);color:var(--muted);border:1px solid var(--border)}
.ch-dot{width:6px;height:6px;border-radius:50%}
.ch-dot-live{background:#F62440;animation:pulse 2s ease-in-out infinite}
.ch-dot-dim{background:var(--muted2)}
.ch-city{font-family:'Bricolage Grotesque',sans-serif;font-size:26px;font-weight:800;color:var(--dark);margin-bottom:6px;letter-spacing:-.4px}
.ch-desc{font-size:13px;color:var(--muted);line-height:1.65;margin-bottom:20px}

/* ── START CHAPTER ── */
.start-sec{background:var(--green);padding:88px 48px;position:relative;overflow:hidden}
.start-sec::before{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.08) 1.5px,transparent 1.5px);background-size:24px 24px}
.start-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center;position:relative;z-index:1}
.start-h2{font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(28px,3.8vw,48px);font-weight:800;color:#fff;line-height:1.1;margin-bottom:14px;letter-spacing:-.4px}
.start-p{font-size:16px;color:rgba(255,255,255,.75);line-height:1.75;margin-bottom:28px}
.benefit-row{display:flex;align-items:center;gap:12px;margin-bottom:12px;color:rgba(255,255,255,.88);font-size:14px;font-weight:500}
.benefit-icon{font-size:18px}
.host-card{background:#fff;border-radius:20px;padding:32px;box-shadow:0 16px 56px rgba(26,26,26,.15)}
.host-card h3{font-family:'Bricolage Grotesque',sans-serif;font-size:21px;font-weight:800;color:var(--dark);margin-bottom:7px;letter-spacing:-.3px}
.host-card p{font-size:13px;color:var(--muted);margin-bottom:22px;line-height:1.65}

/* ── GALLERY ── */
.gallery-sec{background:var(--white);padding:88px 48px}
.photos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:48px}
.photo-item{border-radius:14px;overflow:hidden;aspect-ratio:4/3;cursor:none;transition:all .3s;position:relative;background:var(--light)}
.photo-item:hover{transform:scale(1.025);box-shadow:0 18px 50px rgba(26,26,26,.16)}
.photo-item img{width:100%;height:100%;object-fit:cover}
.photo-item:nth-child(5n+1){grid-column:span 2}
.photo-cap{position:absolute;bottom:0;left:0;right:0;padding:14px;background:linear-gradient(to top,rgba(26,26,26,.72),transparent);color:#fff;font-size:12px;font-weight:500;transform:translateY(100%);transition:transform .3s}
.photo-item:hover .photo-cap{transform:translateY(0)}

/* ── STORIES ── */
.stories-sec{background:var(--dark);padding:88px 48px}
.stories-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:48px}
.story-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:18px;padding:28px;transition:all .28s;position:relative;overflow:hidden}
.story-card:hover{transform:translateY(-5px);border-color:rgba(246,36,64,.4);background:rgba(255,255,255,.08)}
.story-tag{font-size:12px;font-weight:700;color:var(--orange);margin-bottom:12px;display:block}
.story-q{font-family:'Bricolage Grotesque',sans-serif;font-size:16px;font-weight:600;color:#fff;line-height:1.55;margin-bottom:14px;font-style:italic}
.story-author{font-size:11px;color:rgba(255,255,255,.35);letter-spacing:.3px}
.story-mark{position:absolute;bottom:-14px;right:16px;font-size:100px;color:rgba(246,36,64,.1);font-family:'Bricolage Grotesque',sans-serif;line-height:1}

/* ── FAQ ── */
.faq-sec{background:var(--paper);padding:88px 48px}
.faq-list{max-width:760px;margin:48px auto 0}
.faq-item{border-bottom:1px solid var(--border)}
.faq-q{display:flex;justify-content:space-between;align-items:center;padding:20px 0;cursor:none;font-size:15px;font-weight:600;color:var(--dark);transition:color .2s;gap:14px}
.faq-q:hover{color:var(--green)}
.faq-icon{font-size:20px;color:var(--green);transition:transform .3s;flex-shrink:0}
.faq-icon.open{transform:rotate(45deg)}
.faq-a{font-size:14px;color:var(--muted);line-height:1.75;padding-bottom:20px;max-height:0;overflow:hidden;transition:max-height .38s ease,padding .38s ease}
.faq-a.open{max-height:200px}

/* ── CTA ── */
.cta-sec{background:var(--red);padding:100px 48px;text-align:center;position:relative;overflow:hidden}
.cta-sec::before{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.08) 1px,transparent 1px);background-size:26px 26px;pointer-events:none}
.cta-glow{position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(255,229,191,.3),transparent 65%);top:50%;left:50%;transform:translate(-50%,-50%)}
.cta-inner{position:relative;z-index:1}
.cta-h2{font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(34px,5vw,62px);font-weight:800;color:#fff;margin-bottom:14px;line-height:1.05;letter-spacing:-.5px}
.cta-h2 em{font-style:normal;color:var(--orange)}
.cta-p{font-size:17px;color:rgba(255,255,255,.65);max-width:400px;margin:0 auto 44px;line-height:1.7}
.cta-form{display:flex;gap:10px;max-width:420px;margin:0 auto}
.cta-inp{flex:1;padding:13px 20px;background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.2);border-radius:100px;font-family:'Instrument Sans',sans-serif;font-size:14px;color:#fff;outline:none;transition:all .2s}
.cta-inp::placeholder{color:rgba(255,255,255,.45)}
.cta-inp:focus{border-color:rgba(255,255,255,.5);background:rgba(255,255,255,.18)}

/* ── FOOTER ── */
footer{background:#0D0D0D;padding:64px 48px 32px;border-top:1px solid rgba(255,255,255,.05)}
.footer-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:44px;max-width:1200px;margin:0 auto 48px}
.footer-brand{font-family:'Bricolage Grotesque',sans-serif;font-size:16px;font-weight:800;color:#fff;display:flex;align-items:center;gap:8px;margin-bottom:10px;letter-spacing:-.2px}
.footer-p{font-size:13px;color:rgba(255,255,255,.3);line-height:1.7}
.footer-col-h{font-family:'Bricolage Grotesque',sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,.25);margin-bottom:16px;font-weight:700}
.footer-col a{display:block;color:rgba(255,255,255,.4);text-decoration:none;font-size:13px;margin-bottom:10px;transition:color .2s}
.footer-col a:hover{color:var(--orange)}
.footer-bottom{border-top:1px solid rgba(255,255,255,.06);padding-top:22px;display:flex;justify-content:space-between;align-items:center;max-width:1200px;margin:0 auto;flex-wrap:wrap;gap:12px}
.footer-copy{font-size:11px;color:rgba(255,255,255,.18)}
.admin-btn{background:none;border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.2);font-family:'Instrument Sans',sans-serif;font-size:11px;padding:6px 14px;border-radius:100px;cursor:none;transition:all .2s}
.admin-btn:hover{color:var(--orange);border-color:rgba(255,229,191,.3)}

/* ── POPUP ── */
.popup-overlay{position:fixed;inset:0;background:rgba(13,13,13,.82);z-index:3000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(14px)}
.popup-box{background:#fff;border-radius:22px;max-width:400px;width:100%;padding:40px 36px;text-align:center;position:relative;animation:slideIn .35s cubic-bezier(.34,1.56,.64,1) both;box-shadow:0 24px 72px rgba(13,13,13,.2)}
@keyframes slideIn{from{opacity:0;transform:scale(.92) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}
.popup-icon{width:68px;height:68px;background:var(--green-lt);border:2px solid rgba(246,36,64,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 18px}
.popup-h2{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;font-weight:800;color:var(--dark);margin-bottom:7px;letter-spacing:-.3px}
.popup-p{font-size:13px;color:var(--muted);line-height:1.65;margin-bottom:22px}
.popup-close{position:absolute;top:12px;right:12px;background:var(--light);border:none;color:var(--muted);width:28px;height:28px;border-radius:50%;cursor:none;display:flex;align-items:center;justify-content:center;font-size:13px;transition:all .2s}
.popup-close:hover{background:var(--red);color:#fff}
.popup-skip{margin-top:12px;font-size:12px;color:var(--muted2);cursor:none;background:none;border:none;font-family:'Instrument Sans',sans-serif;transition:color .2s}
.popup-skip:hover{color:var(--muted)}
.success-msg{color:var(--green);font-size:13px;margin-top:8px;font-weight:600}

/* ── FORM INPUTS (shared) ── */
.inp{width:100%;padding:11px 15px;background:var(--paper);border:1.5px solid var(--border);border-radius:11px;font-family:'Instrument Sans',sans-serif;font-size:14px;color:var(--dark);outline:none;transition:all .2s}
.inp:focus{border-color:var(--green);background:#fff;box-shadow:0 0 0 4px var(--green-g)}
.inp::placeholder{color:var(--muted2)}
.inp.err{border-color:var(--red);background:var(--red-lt)}
.inp-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}

/* ── MODAL ── */
.modal-overlay{position:fixed;inset:0;background:rgba(13,13,13,.75);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(12px);animation:fadeIn .2s ease}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal-box{background:#fff;border-radius:22px;max-width:520px;width:100%;max-height:92vh;overflow-y:auto;animation:slideIn .3s cubic-bezier(.34,1.56,.64,1) both;box-shadow:0 24px 72px rgba(13,13,13,.2)}
.modal-hd{padding:26px 26px 0;display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}
.modal-hd-title{font-family:'Bricolage Grotesque',sans-serif;font-size:20px;font-weight:800;color:var(--dark);line-height:1.2;letter-spacing:-.3px}
.modal-hd-sub{font-size:12px;color:var(--muted);margin-top:2px}
.modal-x{background:var(--light);border:none;color:var(--muted);width:28px;height:28px;border-radius:50%;cursor:none;transition:all .2s;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.modal-x:hover{background:var(--red);color:#fff}
.modal-body{padding:0 26px 26px}
.field{margin-bottom:14px}
.field label{display:block;font-size:11px;font-weight:700;color:var(--dark);margin-bottom:5px;letter-spacing:.3px}

/* ── PAY MODAL ── */
.pay-overlay{position:fixed;inset:0;background:rgba(13,13,13,.88);z-index:4500;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(16px);animation:fadeIn .2s ease}
.pay-box{background:var(--dark2);border:1px solid rgba(255,255,255,.09);border-radius:24px;width:100%;max-width:460px;max-height:94vh;overflow-y:auto;animation:slideIn .3s cubic-bezier(.34,1.56,.64,1) both;box-shadow:0 28px 80px rgba(0,0,0,.5)}
.pay-hd{padding:22px 26px 0;display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
.pay-hd-title{font-family:'Bricolage Grotesque',sans-serif;font-size:19px;font-weight:800;color:#fff;letter-spacing:-.3px}
.pay-close{background:rgba(255,255,255,.08);border:none;color:rgba(255,255,255,.5);width:28px;height:28px;border-radius:50%;cursor:none;display:flex;align-items:center;justify-content:center;font-size:13px;transition:all .2s}
.pay-close:hover{background:var(--red);color:#fff}
.pay-body{padding:0 26px 26px}
.upi-amount{font-family:'Bricolage Grotesque',sans-serif;font-size:40px;font-weight:800;color:var(--orange);text-align:center;margin-bottom:4px}
.upi-sub{font-size:11px;color:rgba(255,255,255,.4);text-align:center;letter-spacing:.5px;text-transform:uppercase;margin-bottom:18px}
.upi-qr{width:192px;height:192px;background:#fff;border-radius:16px;padding:9px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 28px rgba(0,0,0,.4),0 0 0 3px var(--orange)}
.upi-qr img{width:100%;height:100%;display:block}
.upi-id{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:9px 14px;font-family:'Courier New',monospace;font-size:13px;color:var(--orange);font-weight:700;text-align:center;margin-bottom:16px;letter-spacing:.5px}
.upi-steps{margin-bottom:18px}
.upi-step{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:12px;color:rgba(255,255,255,.55);line-height:1.5}
.upi-step:last-child{border-bottom:none}
.upi-step-n{width:20px;height:20px;border-radius:50%;background:var(--red);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.pay-note{background:rgba(255,229,191,.1);border:1px solid rgba(255,229,191,.2);border-radius:9px;padding:10px 14px;font-size:11px;color:rgba(255,255,255,.55);line-height:1.6;margin-bottom:16px}
/* ticket */
.ticket-card{background:linear-gradient(145deg,#0A0A0A,#1A1A1A);border-radius:18px;overflow:hidden;margin-bottom:12px;border:1px solid rgba(255,229,191,.25)}
.ticket-hd{padding:14px 18px;border-bottom:1px dashed rgba(255,255,255,.12);display:flex;justify-content:space-between;align-items:center}
.ticket-brand{font-family:'Bricolage Grotesque',sans-serif;font-size:13px;font-weight:800;color:#fff;display:flex;align-items:center;gap:7px}
.ticket-dot{width:6px;height:6px;border-radius:50%;background:#F62440;animation:pulse 2s infinite;flex-shrink:0}
.ticket-type{border-radius:100px;font-size:9px;font-weight:700;padding:3px 10px;letter-spacing:1px;text-transform:uppercase}
.ticket-type-paid{background:rgba(255,229,191,.2);color:var(--orange)}
.ticket-type-free{background:rgba(246,36,64,.2);color:#FFE5BF}
.ticket-body-inner{padding:16px 18px}
.ticket-qr-wrap{display:flex;flex-direction:column;align-items:center;margin-bottom:12px}
.ticket-qr{width:140px;height:140px;background:#fff;border-radius:14px;padding:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 24px rgba(0,0,0,.4)}
.ticket-qr img{width:100%;height:100%}
.ticket-qr-hint{font-size:9px;color:rgba(255,255,255,.28);margin-top:6px;letter-spacing:.5px;text-align:center}
.ticket-id{font-family:'Courier New',monospace;font-size:14px;font-weight:700;color:var(--orange);text-align:center;letter-spacing:2px;margin-bottom:11px}
.ticket-row{display:flex;justify-content:space-between;align-items:flex-start;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:11px;gap:8px}
.ticket-row:last-child{border-bottom:none}
.ticket-k{color:rgba(255,255,255,.35);font-weight:600;flex-shrink:0}
.ticket-v{color:#fff;font-weight:600;text-align:right}
.ticket-status{background:rgba(246,36,64,.15);border-top:1px dashed rgba(255,255,255,.1);padding:10px 18px;display:flex;align-items:center;justify-content:center;gap:7px;font-size:10px;font-weight:700;color:#FFE5BF;letter-spacing:.5px}

/* ── ADMIN LOGIN ── */
.adm-login-overlay{position:fixed;inset:0;background:rgba(13,13,13,.95);z-index:5000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(20px)}
.adm-login-box{background:#fff;border:1px solid var(--border);border-radius:22px;padding:44px 40px;max-width:380px;width:90%;text-align:center;animation:slideIn .35s cubic-bezier(.34,1.56,.64,1) both;box-shadow:0 24px 72px rgba(13,13,13,.2)}
.adm-login-icon{font-size:40px;margin-bottom:18px}
.adm-login-h{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;font-weight:800;color:var(--dark);margin-bottom:5px;letter-spacing:-.3px}
.adm-login-sub{font-size:13px;color:var(--muted);margin-bottom:26px;line-height:1.6}
.adm-login-err{color:var(--red);font-size:12px;margin-top:8px;font-weight:600}

/* ── ADMIN PANEL ── */
.adm-wrap{position:fixed;inset:0;background:#FFFAF3;z-index:5000;overflow-y:auto}
.adm-side{position:fixed;top:0;left:0;bottom:0;width:230px;background:var(--dark);z-index:10;display:flex;flex-direction:column;padding:22px 0}
.adm-logo{padding:0 20px 22px;border-bottom:1px solid rgba(255,255,255,.07)}
.adm-logo-txt{font-family:'Bricolage Grotesque',sans-serif;font-size:14px;font-weight:800;color:#fff;display:flex;align-items:center;gap:8px;letter-spacing:-.2px}
.adm-logo-sub{font-size:10px;color:rgba(255,255,255,.26);letter-spacing:1px;margin-top:3px}
.adm-nav-link{display:flex;align-items:center;gap:10px;padding:10px 20px;font-size:13px;font-weight:500;color:rgba(255,255,255,.42);cursor:none;transition:all .2s;border-left:3px solid transparent}
.adm-nav-link:hover{color:rgba(255,255,255,.82);background:rgba(255,255,255,.04)}
.adm-nav-link.on{color:var(--orange);border-left-color:var(--orange);background:rgba(255,229,191,.08)}
.adm-nav-ico{font-size:15px}
.adm-badge{background:var(--red);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:100px;margin-left:auto}
.adm-main{margin-left:230px;padding:36px;min-height:100vh}
.adm-topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px}
.adm-page-h{font-family:'Bricolage Grotesque',sans-serif;font-size:24px;font-weight:800;color:var(--dark);letter-spacing:-.4px}
.adm-stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.adm-stat{background:#fff;border:1px solid var(--border2);border-radius:14px;padding:20px 18px;box-shadow:0 1px 6px rgba(26,26,26,.06)}
.adm-stat-ico{font-size:22px;margin-bottom:7px}
.adm-stat-n{font-family:'Bricolage Grotesque',sans-serif;font-size:34px;font-weight:800;color:var(--red);line-height:1}
.adm-stat-l{font-size:10px;color:var(--muted2);font-weight:600;letter-spacing:.5px;margin-top:4px;text-transform:uppercase}
.adm-card{background:#fff;border:1px solid var(--border2);border-radius:14px;padding:22px;margin-bottom:18px;box-shadow:0 1px 6px rgba(26,26,26,.05)}
.adm-card-h{font-family:'Bricolage Grotesque',sans-serif;font-size:17px;font-weight:700;color:var(--dark);margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;letter-spacing:-.2px}
.adm-tbl{width:100%;border-collapse:collapse}
.adm-tbl th{text-align:left;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted2);border-bottom:1.5px solid var(--border2);font-weight:700}
.adm-tbl td{padding:13px 12px;font-size:12px;border-bottom:1px solid rgba(26,26,26,.04);vertical-align:middle;color:var(--dark)}
.adm-tbl tr:hover td{background:rgba(246,36,64,.025)}
.adm-tbl tr:last-child td{border-bottom:none}
.pill{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700;letter-spacing:.3px}
.pill-pending{background:var(--orange-lt);color:#8A5A18;border:1px solid rgba(255,229,191,.3)}
.pill-approved{background:var(--green-lt);color:var(--green-d);border:1px solid rgba(246,36,64,.2)}
.pill-rejected{background:var(--inactive);color:var(--muted);border:1px solid var(--border)}
.pill-paid{background:var(--green-lt);color:var(--green-d);border:1px solid rgba(246,36,64,.2)}
.pill-new{background:#FFF2DB;color:#8A5A18;border:1px solid rgba(138,90,24,.2)}
.adm-inp{width:100%;padding:9px 13px;background:var(--paper);border:1.5px solid var(--border);border-radius:9px;font-family:'Instrument Sans',sans-serif;font-size:13px;outline:none;transition:all .2s;color:var(--dark)}
.adm-inp:focus{border-color:var(--green);background:#fff;box-shadow:0 0 0 3px var(--green-g)}
.adm-inp::placeholder{color:var(--muted2)}
.adm-ta{width:100%;padding:9px 13px;background:var(--paper);border:1.5px solid var(--border);border-radius:9px;font-family:'Instrument Sans',sans-serif;font-size:13px;outline:none;resize:vertical;min-height:80px;color:var(--dark);transition:all .2s}
.adm-ta:focus{border-color:var(--green)}
.adm-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.adm-fg{margin-bottom:12px}
.adm-lbl{display:block;font-size:10px;font-weight:700;color:var(--muted);margin-bottom:5px;letter-spacing:.5px;text-transform:uppercase}
.act-row{display:flex;gap:6px;flex-wrap:wrap}
.photo-grid-adm{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
.photo-thumb{aspect-ratio:1;border-radius:10px;overflow:hidden;position:relative;background:var(--light);border:1px solid var(--border)}
.photo-thumb img{width:100%;height:100%;object-fit:cover}
.photo-del{position:absolute;top:5px;right:5px;background:rgba(13,13,13,.72);color:#fff;border:none;border-radius:50%;width:20px;height:20px;font-size:10px;cursor:none;display:flex;align-items:center;justify-content:center;transition:background .2s}
.photo-del:hover{background:var(--red)}
.msg-ok{background:var(--green-lt);color:var(--green-d);border:1px solid rgba(246,36,64,.2);padding:10px 14px;border-radius:9px;margin-bottom:12px;font-size:12px;font-weight:600}
.contact-btn{display:inline-flex;align-items:center;gap:4px;background:var(--green-lt);color:var(--green-d);border:1px solid rgba(246,36,64,.2);padding:4px 10px;border-radius:100px;font-size:10px;font-weight:700;text-decoration:none;cursor:none;transition:all .2s}
.contact-btn:hover{background:#FBD6DC}
.highlight-row td{background:rgba(246,36,64,.03) !important}

/* ── REG PAGE (standalone) ── */
.reg-page{min-height:100vh;background:var(--paper);padding:80px 24px 48px}
.reg-page-inner{max-width:560px;margin:0 auto}
.reg-page-back{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:var(--muted);text-decoration:none;margin-bottom:28px;cursor:none;transition:color .2s;background:none;border:none;font-family:'Instrument Sans',sans-serif}
.reg-page-back:hover{color:var(--green)}
.reg-event-card{background:var(--green);border-radius:20px;padding:28px 32px;margin-bottom:32px;position:relative;overflow:hidden}
.reg-event-card::before{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.07) 1px,transparent 1px);background-size:22px 22px}
.reg-event-inner{position:relative;z-index:1}
.reg-event-type{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.6);margin-bottom:8px}
.reg-event-title{font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(22px,4vw,30px);font-weight:800;color:#fff;margin-bottom:14px;line-height:1.2;letter-spacing:-.4px}
.reg-event-meta{display:flex;flex-direction:column;gap:6px;font-size:13px;color:rgba(255,255,255,.65);margin-bottom:18px}
.reg-event-meta span{display:flex;align-items:center;gap:8px}
.reg-event-price-row{display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,.15);padding-top:14px}
.reg-event-price{font-family:'Bricolage Grotesque',sans-serif;font-size:26px;font-weight:800;color:var(--orange)}
.reg-event-free{background:rgba(246,36,64,.4);color:#fff;border-radius:100px;font-size:12px;font-weight:700;padding:5px 14px;display:flex;align-items:center;gap:6px}

/* Form card */
.reg-form-card{background:#fff;border-radius:20px;padding:32px;box-shadow:0 4px 24px rgba(26,26,26,.08);border:1.5px solid var(--border2)}
.reg-form-h{font-family:'Bricolage Grotesque',sans-serif;font-size:20px;font-weight:800;color:var(--dark);margin-bottom:22px;letter-spacing:-.3px}
.reg-field{margin-bottom:16px}
.reg-field label{display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;letter-spacing:.5px;text-transform:uppercase}
.reg-field input,.reg-field select{width:100%;padding:12px 15px;background:var(--paper);border:1.5px solid var(--border);border-radius:11px;font-family:'Instrument Sans',sans-serif;font-size:15px;color:var(--dark);outline:none;transition:all .2s;-webkit-appearance:none;appearance:none}
.reg-field input:focus,.reg-field select:focus{border-color:var(--green);background:#fff;box-shadow:0 0 0 4px var(--green-g)}
.reg-field input::placeholder{color:var(--muted2)}
.reg-field input.err,.reg-field select.err{border-color:var(--red);background:var(--red-lt)}
.reg-err-msg{font-size:11px;color:var(--red);margin-top:4px;font-weight:600}
.reg-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.reg-hint{background:var(--orange-lt);border:1px solid rgba(255,229,191,.25);border-radius:10px;padding:10px 14px;font-size:12px;color:var(--muted);margin-bottom:18px;line-height:1.55}
.reg-dup{text-align:center;padding:24px 0}
.reg-dup-icon{font-size:38px;margin-bottom:10px}
.reg-dup-h{font-family:'Bricolage Grotesque',sans-serif;font-size:19px;font-weight:800;color:var(--dark);margin-bottom:7px}
.reg-dup-p{font-size:13px;color:var(--muted);line-height:1.65}
.reg-dup-tid{font-family:'Courier New',monospace;font-size:15px;font-weight:700;color:var(--orange);margin:10px 0}

/* ── RESPONSIVE ── */
@media(max-width:1024px){
  .hero-inner{grid-template-columns:1fr;text-align:center;gap:48px}
  .hero-right{display:none}
  .hero-stats-row{justify-content:center}
  .hero-p{max-width:100%}
  .ev-featured{grid-template-columns:1fr}
  .ev-featured-img{min-height:220px}
  .ev-featured-body{padding:24px 28px}
  .exp-grid{grid-template-columns:1fr 1fr}
  .ch-grid{grid-template-columns:1fr 1fr}
  .start-inner{grid-template-columns:1fr;gap:40px}
  .stats-grid{grid-template-columns:1fr 1fr}
  .footer-top{grid-template-columns:1fr 1fr;gap:32px}
  .stories-grid{grid-template-columns:1fr}
  .adm-stats-row{grid-template-columns:1fr 1fr}
  .ev-grid{grid-template-columns:1fr 1fr}
}
@media(max-width:768px){
  .nav{padding:14px 20px}
  .nav.solid{padding:12px 20px}
  .nav-links{display:none}
  .nav-mobile-btn{display:block}
  .cursor,.cursor-ring{display:none}
  body{cursor:auto}
  .sec{padding:64px 20px}
  .stats-sec,.start-sec,.gallery-sec,.stories-sec,.faq-sec,.cta-sec,.ev-section{padding:64px 20px}
  footer{padding:52px 20px 28px}
  .ev-grid{grid-template-columns:1fr}
  .ch-grid{grid-template-columns:1fr}
  .exp-grid{grid-template-columns:1fr}
  .photos-grid{grid-template-columns:1fr 1fr}
  .adm-side{display:none}
  .adm-main{margin-left:0;padding:18px}
  .adm-2col{grid-template-columns:1fr}
  .cta-form{flex-direction:column}
  .inp-row{grid-template-columns:1fr}
  .stats-grid{grid-template-columns:1fr 1fr;border-radius:16px}
  .stat-box{border-right:none;border-bottom:1px solid rgba(255,255,255,.07);padding:24px 16px}
  .stat-n{font-size:36px}
  .hero-inner{padding:96px 20px 64px;gap:32px}
  .hero-h1{font-size:40px}
  .hero-stats-row{display:grid;grid-template-columns:1fr 1fr;gap:20px;justify-content:start}
  .hero-stat-n{font-size:24px}
  .ev-hero-banner{padding:32px 24px}
  .ev-banner-inner{flex-direction:column;align-items:flex-start}
  .ev-banner-right{align-items:flex-start}
  .ev-featured{grid-template-columns:1fr}
  .reg-row{grid-template-columns:1fr}
  .nav-mobile-btn{display:block}
  .adm-stats-row{grid-template-columns:1fr 1fr}
  .stories-grid{grid-template-columns:1fr}
  .start-inner{gap:32px}
  .footer-top{grid-template-columns:1fr}
}
@media(max-width:480px){
  .ev-hero-banner{padding:24px 18px;border-radius:16px}
  .ev-featured-body{padding:20px 20px}
  .reg-form-card{padding:22px 18px}
  .reg-event-card{padding:22px 20px;border-radius:16px}
}
`;

// ─── TICKET HELPERS ───────────────────────────────────────────
async function downloadTicketImage({ ticketId, name, eventTitle, eventDate, eventVenue, phone, isFree, price }) {
  const qrSrc = qrUrl(JSON.stringify({tid:ticketId,name,event:eventTitle}), 200);
  const img = await new Promise((res,rej) => { const i=new Image(); i.crossOrigin='anonymous'; i.onload=()=>res(i); i.onerror=rej; i.src=qrSrc; });
  const W=380,H=560,S=2;
  const c=document.createElement('canvas'); c.width=W*S; c.height=H*S;
  const x=c.getContext('2d'); x.scale(S,S);
  x.fillStyle='#0A0A0A'; x.beginPath(); x.roundRect(0,0,W,H,20); x.fill();
  x.fillStyle='rgba(255,229,191,.08)'; x.fillRect(0,0,W,56);
  x.fillStyle='#F62440'; x.beginPath(); x.arc(22,28,5,0,Math.PI*2); x.fill();
  x.font='700 12px Arial'; x.fillStyle='#fff'; x.fillText('The Offline Vibes',34,32);
  const bW=isFree?40:38,bX=W-bW-16,bY=18;
  x.fillStyle=isFree?'rgba(246,36,64,.25)':'rgba(255,229,191,.2)'; x.beginPath(); x.roundRect(bX,bY,bW,19,9); x.fill();
  x.font='700 9px Arial'; x.fillStyle=isFree?'#FFE5BF':'#FFE5BF'; x.textAlign='center'; x.fillText(isFree?'FREE':'PAID',bX+bW/2,bY+13); x.textAlign='left';
  x.strokeStyle='rgba(255,255,255,.1)'; x.setLineDash([4,4]); x.lineWidth=1; x.beginPath(); x.moveTo(0,56); x.lineTo(W,56); x.stroke(); x.setLineDash([]);
  const qS=136,qX=(W-qS)/2,qY=72;
  x.fillStyle='#fff'; x.beginPath(); x.roundRect(qX-8,qY-8,qS+16,qS+16,13); x.fill();
  x.drawImage(img,qX,qY,qS,qS);
  x.font='500 9px Arial'; x.fillStyle='rgba(255,255,255,.3)'; x.textAlign='center'; x.fillText('SCAN AT ENTRY GATE',W/2,qY+qS+20);
  x.font='bold 15px Courier New'; x.fillStyle='#FFE5BF'; x.fillText(ticketId,W/2,qY+qS+40); x.textAlign='left';
  const rows=[['Name',name],['Event',eventTitle],['Date',eventDate||'TBA'],['Venue',eventVenue||'TBA'],['Contact',phone],['Entry',isFree?'FREE':'₹'+price]];
  let ry=qY+qS+58;
  rows.forEach(([k,v])=>{
    x.strokeStyle='rgba(255,255,255,.07)'; x.lineWidth=1; x.beginPath(); x.moveTo(16,ry-3); x.lineTo(W-16,ry-3); x.stroke();
    x.font='600 10px Arial'; x.fillStyle='rgba(255,255,255,.35)'; x.fillText(k,18,ry+10);
    x.font='700 10px Arial'; x.fillStyle='#fff'; x.textAlign='right'; x.fillText(String(v||'—').slice(0,30),W-18,ry+10); x.textAlign='left';
    ry+=26;
  });
  x.fillStyle='rgba(246,36,64,.15)'; x.beginPath(); x.roundRect(0,H-40,W,40,[0,0,20,20]); x.fill();
  x.font='700 10px Arial'; x.fillStyle='#FFE5BF'; x.textAlign='center'; x.fillText(' REGISTRATION CONFIRMED',W/2,H-16); x.textAlign='left';
  const a=document.createElement('a'); a.download=`${ticketId}.png`; a.href=c.toDataURL('image/png',1); a.click();
}

function printTicket({ ticketId, name, eventTitle, eventDate, eventVenue, phone, isFree, price }) {
  const qrSrc = qrUrl(JSON.stringify({tid:ticketId,name,event:eventTitle}), 260);
  const rows=[['Name',name],['Event',eventTitle],['Date',eventDate||'TBA'],['Venue',eventVenue||'TBA'],['Contact',phone],['Entry',isFree?'FREE':'₹'+price]];
  const rowsHtml=rows.map(([k,v])=>`<div class="row"><span class="k">${k}</span><span class="v">${v||'—'}</span></div>`).join('');
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${ticketId}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#FFFAF3;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.t{background:linear-gradient(145deg,#0A0A0A,#1A1A1A);border-radius:20px;width:356px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.4);border:1px solid rgba(255,229,191,.2)}.th{padding:16px 20px 13px;border-bottom:1px dashed rgba(255,255,255,.12);display:flex;justify-content:space-between;align-items:center}.b{font-size:13px;font-weight:800;color:#fff}.dot{width:6px;height:6px;border-radius:50%;background:#F62440;display:inline-block;margin-right:6px}.badge{background:${isFree?'rgba(246,36,64,.25)':'rgba(255,229,191,.2)'};color:${isFree?'#FFE5BF':'#FFE5BF'};border-radius:100px;font-size:9px;font-weight:700;padding:3px 11px;text-transform:uppercase;letter-spacing:1px}.tb{padding:18px 20px}.qw{display:flex;flex-direction:column;align-items:center;margin-bottom:14px}.qf{width:148px;height:148px;background:#fff;border-radius:14px;padding:9px;box-shadow:0 6px 22px rgba(0,0,0,.4)}.qf img{width:100%;height:100%;display:block}.qh{font-size:9px;color:rgba(255,255,255,.28);margin-top:7px;letter-spacing:.5px}.tid{font-family:'Courier New',monospace;font-size:15px;font-weight:700;color:#FFE5BF;text-align:center;letter-spacing:2.5px;margin-bottom:12px}.row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:11px}.row:last-child{border-bottom:none}.k{color:rgba(255,255,255,.35);font-weight:600}.v{color:#fff;font-weight:700;text-align:right}.sb{background:rgba(246,36,64,.14);border-top:1px dashed rgba(255,255,255,.1);padding:11px 20px;text-align:center;font-size:10px;font-weight:700;color:#FFE5BF;letter-spacing:.5px}</style></head><body><div class="t"><div class="th"><div class="b"><span class="dot"></span>The Offline Vibes</div><div class="badge">${isFree?'FREE':'PAID'}</div></div><div class="tb"><div class="qw"><div class="qf"><img src="${qrSrc}" crossorigin="anonymous"></div><div class="qh">SCAN AT ENTRY GATE</div></div><div class="tid">${ticketId}</div>${rowsHtml}</div><div class="sb">REGISTRATION CONFIRMED</div></div><script>var img=document.querySelector('.qf img');function p(){window.focus();window.print();}if(img.complete){setTimeout(p,400);}else{img.onload=function(){setTimeout(p,400);};}window.onafterprint=function(){window.close()};<\/script></body></html>`;
  const win=window.open('','_blank','width=500,height=700,scrollbars=no,toolbar=no,menubar=no');
  if(win){win.document.write(html);win.document.close();}else alert('Pop-up blocked — please allow pop-ups.');
}

// ─── PAYMENT MODAL ────────────────────────────────────────────
export function PaymentModal({ event, regData, onClose }) {
  const isFree = !event.price || parseInt(event.price) === 0;
  const [step, setStep] = useState('pay');
  const [tid,  setTid]  = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const upiUri = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=${event.price}&cu=INR&tn=${encodeURIComponent(regData.name+' | '+event.title)}`;
  const payQR  = qrUrl(upiUri, 220);

  const confirm = async () => {
    setBusy(true);
    try {
      const newTid = genTicketId(); setTid(newTid);
      await fbAdd('registrations', {
        ...regData,
        eventId:    event.id,
        eventTitle: event.title,
        eventDate:  event.date,
        eventVenue: event.venue||'',
        ticketId:   newTid,
        price:      event.price||'0',
        status:     isFree?'free':'paid',
        attended:   false,
        date:       nowDate(),
        time:       nowTime(),
      });
      setStep('ticket');
    } catch { alert('Error saving registration. Please try again.'); }
    finally { setBusy(false); }
  };

  const qrData = tid ? JSON.stringify({tid,name:regData.name,event:event.title}) : '';
  const ticketP = { ticketId:tid, name:regData.name, eventTitle:event.title, eventDate:event.date, eventVenue:event.venue||'', phone:regData.phone, isFree, price:event.price };

  const handleSave = async () => {
    setSaving(true);
    try { await downloadTicketImage(ticketP); } catch { alert('Save failed — please screenshot your ticket.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="pay-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="pay-box">
        <div className="pay-hd">
          <div className="pay-hd-title">
            {step==='pay' && (isFree ? 'Confirm Registration' : 'Complete Payment')}
            {step==='ticket' && 'Your Entry Ticket'}
          </div>
          <button className="pay-close" onClick={onClose}>✕</button>
        </div>
        <div className="pay-body">
          {step==='pay' && (isFree ? (
            <div style={{textAlign:'center',padding:'18px 0 22px'}}>
              <div style={{fontSize:48,marginBottom:10}}></div>
              <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:20,fontWeight:800,color:'#fff',marginBottom:7}}>Free Event!</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,.5)',lineHeight:1.65,marginBottom:22}}>No payment required. Click below to get your entry ticket instantly.</div>
              <button className="btn btn-green" style={{width:'100%'}} onClick={confirm} disabled={busy}>{busy?'Generating…':'Confirm & Get Ticket →'}</button>
            </div>
          ) : (

          
            <>
              <div style={{textAlign:'center',marginBottom:16}}>
                <div className="upi-amount">₹{event.price}</div>
                <div className="upi-sub">{event.title}</div>
                <div className="upi-qr"><img src={payQR} alt="UPI QR" crossOrigin="anonymous"/></div>
                <div className="upi-id">{UPI_ID}</div>
              </div>
              <div className="upi-steps">
                {['Open GPay, PhonePe, Paytm or any UPI app',`Scan the QR above OR pay to UPI: ${UPI_ID}`,`Pay exactly ₹${event.price} with note: ${regData.name}`,'Return here and click the button below'].map((s,i)=>(
                  <div className="upi-step" key={i}><div className="upi-step-n">{i+1}</div><span>{s}</span></div>
                ))}
              </div>
              <div className="pay-note">Click "I've Paid" only after completing payment. Our team verifies all payments. Fraudulent confirmations are automatically flagged.</div>
              <button className="btn btn-orange" style={{width:'100%'}} onClick={confirm} disabled={busy}>{busy?'Generating ticket…':`I've Paid ₹${event.price} — Get My Ticket →`}</button>
            </>
            ))}   
          {step==='ticket' && tid && (
            <>
              <div className="ticket-card">
                <div className="ticket-hd">
                  <div className="ticket-brand"><div className="ticket-dot"/>The Offline Vibes</div>
                  <div className={`ticket-type ${isFree?'ticket-type-free':'ticket-type-paid'}`}>{isFree?'FREE':'PAID'}</div>
                </div>
                <div className="ticket-body-inner">
                  <div className="ticket-qr-wrap">
                    <div className="ticket-qr"><img src={qrUrl(qrData)} alt="Entry QR" crossOrigin="anonymous"/></div>
                    <div className="ticket-qr-hint">Show this QR at the entry gate</div>
                  </div>
                  <div className="ticket-id">{tid}</div>
                  {[['Name',regData.name],['Event',event.title],['Date',event.date||'TBA'],['Venue',event.venue||'TBA'],['Contact',regData.phone],['Gender',regData.gender],['Entry',isFree?'FREE':`₹${event.price}`]].map(([k,v])=>(
                    <div className="ticket-row" key={k}><span className="ticket-k">{k}</span><span className="ticket-v">{v}</span></div>
                  ))}
                </div>
                <div className="ticket-status"><span></span><span>REGISTRATION CONFIRMED</span></div>
              </div>
              <div style={{background:'rgba(255,229,191,.1)',border:'1px solid rgba(255,229,191,.2)',borderRadius:9,padding:'8px 13px',fontSize:11,color:'rgba(255,255,255,.55)',marginBottom:12,textAlign:'center',lineHeight:1.55}}>
                <strong style={{color:'#fff'}}>Screenshot or save this ticket.</strong> Show the QR at the entry gate.
              </div>
              <div style={{display:'flex',gap:9,marginBottom:9}}>
                <button className="btn btn-outline" style={{flex:1,padding:'10px 0',fontSize:13}} onClick={handleSave} disabled={saving}>{saving?'Saving…':'Save Image'}</button>
                <button className="btn btn-outline" style={{flex:1,padding:'10px 0',fontSize:13}} onClick={()=>printTicket(ticketP)}>Print</button>
              </div>
              <button className="btn btn-green" style={{width:'100%'}} onClick={onClose}>Done</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── REGISTRATION FORM (reusable for both modal and standalone page) ──────────
export function RegistrationForm({ event, onClose, isPage = false, registrations = [] }) {
  const isFree = !event.price || parseInt(event.price) === 0;
  const [form, setForm] = useState({ firstName:'', lastName:'', gender:'', phone:'', email:'' });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [dupTid, setDupTid] = useState(null);

  const upd = k => e => { setForm(p=>({...p,[k]:e.target.value})); setErrs(p=>({...p,[k]:''})); };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim())  e.lastName  = 'Required';
    if (!form.gender)           e.gender    = 'Please select';
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g,'')))
      e.phone = 'Enter valid 10-digit Indian mobile';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter valid email';
    setErrs(e); return Object.keys(e).length === 0;
  };

  const proceed = async () => {
    if (!validate()) return;
    setBusy(true);
    const regs = await fbGet('registrations');
    const dup = regs.find(r => r.eventId===event.id && r.phone?.replace(/\s/g,'')===form.phone.replace(/\s/g,''));
    setBusy(false);
    if (dup) { setDupTid(dup.ticketId); return; }
    setShowPay(true);
  };

  const regData = { firstName:form.firstName.trim(), lastName:form.lastName.trim(), name:`${form.firstName.trim()} ${form.lastName.trim()}`, gender:form.gender, phone:form.phone.trim(), email:form.email.trim() };

  // Inline input style for dark backgrounds
  const fi = (hasErr) => ({ width:'100%',padding:'12px 15px',background:hasErr?'var(--red-lt)':'var(--paper)',border:`1.5px solid ${hasErr?'var(--red)':'var(--border)'}`,borderRadius:11,fontFamily:'Instrument Sans,sans-serif',fontSize:15,color:'var(--dark)',outline:'none' });
  const fl = { display:'block',fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:6,letterSpacing:'.5px',textTransform:'uppercase' };

  if (showPay) return <PaymentModal event={event} regData={regData} onClose={isPage ? () => setShowPay(false) : onClose}/>;

  const Wrap = isPage ? 'div' : 'div';

  return (
    <Wrap className={isPage ? 'reg-form-card' : ''}>
      {dupTid ? (
        <div className="reg-dup">
          <div className="reg-dup-icon"></div>
          <div className="reg-dup-h">Already Registered!</div>
          <p className="reg-dup-p">This mobile number is already registered for this event.</p>
          <div className="reg-dup-tid">{dupTid}</div>
          <p style={{fontSize:12,color:'var(--muted)',marginBottom:16}}>Your ticket ID is shown above. Check your email or registration confirmation.</p>
          {!isPage && <button className="btn btn-dn btn-sm" onClick={onClose}>Close</button>}
          {isPage && <button className="btn btn-outline-dark btn-sm" onClick={()=>setDupTid(null)}>Try Different Number</button>}
        </div>
      ) : (
        <>
          {isPage && <div className="reg-form-h">Your Details</div>}
          <div className="reg-row" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label style={fl}>First Name *</label>
              <input style={fi(errs.firstName)} placeholder="Aarav" value={form.firstName} onChange={upd('firstName')} autoFocus={isPage}/>
              {errs.firstName && <div className="reg-err-msg">{errs.firstName}</div>}
            </div>
            <div>
              <label style={fl}>Last Name *</label>
              <input style={fi(errs.lastName)} placeholder="Shah" value={form.lastName} onChange={upd('lastName')}/>
              {errs.lastName && <div className="reg-err-msg">{errs.lastName}</div>}
            </div>
          </div>
          <div style={{marginTop:12}}>
            <label style={fl}>Gender *</label>
            <select style={{...fi(errs.gender)}} value={form.gender} onChange={upd('gender')}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
            {errs.gender && <div className="reg-err-msg">{errs.gender}</div>}
          </div>
          <div style={{marginTop:12}}>
            <label style={fl}>WhatsApp / Mobile *</label>
            <input style={fi(errs.phone)} type="tel" placeholder="98765 43210" value={form.phone} onChange={upd('phone')} maxLength={11}/>
            {errs.phone && <div className="reg-err-msg">{errs.phone}</div>}
          </div>
          <div style={{marginTop:12,marginBottom:18}}>
            <label style={fl}>Email Address *</label>
            <input style={fi(errs.email)} type="email" placeholder="you@email.com" value={form.email} onChange={upd('email')} onKeyDown={e=>e.key==='Enter'&&proceed()}/>
            {errs.email && <div className="reg-err-msg">{errs.email}</div>}
          </div>
          <div className="reg-hint">One registration per mobile number per event. Your ticket is generated immediately after {isFree?'confirmation':'payment'}.</div>
          <button className={`btn ${isFree?'btn-green':'btn-orange'}`} style={{width:'100%'}} onClick={proceed} disabled={busy}>
            {busy ? 'Checking…' : isFree ? 'Get Free Ticket →' : `Continue → Pay ₹${event.price}`}
          </button>
        </>
      )}
    </Wrap>
  );
}

// ─── STANDALONE REGISTRATION PAGE ────────────────────────────
// Mount at: /register?eventId=XXXX
// Or with React Router: /register/:eventId
export function EventRegistrationPage() {
  const [event,   setEvent]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound,setNotFound]= useState(false);

  useEffect(() => {
    const load = async () => {
      // Get eventId from URL params
      const params = new URLSearchParams(window.location.search);
      const id = params.get('eventId') || window.location.pathname.split('/').pop();
      if (!id || id === 'register') { setNotFound(true); setLoading(false); return; }
      const ev = await fbGetOne('events', id);
      if (!ev) { setNotFound(true); setLoading(false); return; }
      setEvent(ev); setLoading(false);
    };
    load();
  }, []);

  const isFree = !event?.price || parseInt(event?.price) === 0;
  const totalSpots = event?.spots ? parseInt(event.spots) : null;

  if (loading) return (
    <div className="reg-page">
      <div style={{textAlign:'center',padding:80}}>
        <div style={{width:36,height:36,border:'3px solid rgba(246,36,64,.2)',borderTopColor:'var(--green)',borderRadius:'50%',animation:'spin .7s linear infinite',margin:'0 auto 14px'}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{color:'var(--muted)',fontSize:14}}>Loading event…</div>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="reg-page">
      <div style={{textAlign:'center',padding:'60px 20px'}}>
        <div style={{fontSize:52,marginBottom:16}}></div>
        <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:24,fontWeight:800,color:'var(--dark)',marginBottom:8}}>Event Not Found</div>
        <p style={{color:'var(--muted)',fontSize:15,marginBottom:24}}>This event link is invalid or has expired.</p>
        <a href="/" className="btn btn-green">← Back to Website</a>
      </div>
    </div>
  );

  return (
    <>
      <style>{STYLES + REGISTRATION_STYLES}</style>
      <div className="reg-page">
        <div className="reg-page-inner">
          <a href="/" className="reg-page-back">← theofflinevibe.in</a>

          {/* Event banner card */}
          <div className="reg-event-card">
            {event.imageUrl && (
              <div style={{borderRadius:14,overflow:'hidden',marginBottom:18,height:180,position:'relative'}}>
                <img src={event.imageUrl} alt={event.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(26,26,26,.5),transparent)'}}/>
              </div>
            )}
            <div className="reg-event-inner">
              <div className="reg-event-type">{event.type || 'Experience'}</div>
              <div className="reg-event-title">{event.title}</div>
              <div className="reg-event-meta">
                {event.date && <span>{event.date}{event.timing ? ` · ${event.timing}` : ''}</span>}
                {event.venue && <span>{event.venue}</span>}
                {event.address && <span>{event.address}</span>}
                {totalSpots !== null && <span>{totalSpots} total spots</span>}
              </div>
              {event.description && (
                <div style={{fontSize:13,color:'rgba(255,255,255,.65)',lineHeight:1.65,marginBottom:16,borderTop:'1px solid rgba(255,255,255,.15)',paddingTop:14}}>
                  {event.description}
                </div>
              )}
              {/* Refreshments & activities */}
              {(event.refreshments||event.activities) && (
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
                  {(event.refreshments||'').split(',').filter(Boolean).map(r=>(
                    <span key={r} style={{background:'rgba(246,36,64,.3)',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:100}}>{r.trim()}</span>
                  ))}
                  {(event.activities||'').split(',').filter(Boolean).map(a=>(
                    <span key={a} style={{background:'rgba(255,229,191,.25)',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:100}}>{a.trim()}</span>
                  ))}
                </div>
              )}
              <div style={{background:'rgba(10,10,10,.3)',borderRadius:10,padding:'8px 14px',display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                <span style={{fontSize:16}}></span>
                <span style={{fontSize:12,color:'rgba(255,255,255,.6)'}}>Phone goes in the lockbox at entry. Picked up at the end.</span>
              </div>
              <div className="reg-event-price-row">
                <span style={{fontSize:12,color:'rgba(255,255,255,.5)',fontWeight:600}}>Entry Fee</span>
                {isFree
                  ? <div className="reg-event-free">FREE EVENT</div>
                  : <div className="reg-event-price">₹{event.price}<span style={{fontSize:13,color:'rgba(255,255,255,.5)',fontWeight:500}}>/person</span></div>}
              </div>
            </div>
          </div>

          {/* Registration form */}
          <RegistrationForm event={event} isPage={true}/>

          <div style={{textAlign:'center',marginTop:24,fontSize:12,color:'var(--muted2)'}}>
            By registering you agree to our terms. Need help?{' '}
            <a href="mailto:theofflinevibes@gmail.com" style={{color:'var(--green)',fontWeight:600}}>Email us</a>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── EVENT MODAL (popup version for homepage) ─────────────────
function EventModal({ event, onClose, registrations }) {
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-hd">
          <div><div className="modal-hd-title">{event.title}</div><div className="modal-hd-sub">{event.type||'Experience'} · {event.date}</div></div>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <RegistrationForm event={event} onClose={onClose} isPage={false} registrations={registrations}/>
        </div>
      </div>
    </div>
  );
}

// ─── CURSOR ──────────────────────────────────────────────────
function Cursor() {
  const cRef = useRef(null), rRef = useRef(null);
  useEffect(() => {
    const move = e => {
      if (cRef.current) { cRef.current.style.left=e.clientX-5+'px'; cRef.current.style.top=e.clientY-5+'px'; }
      if (rRef.current) { rRef.current.style.left=e.clientX-16+'px'; rRef.current.style.top=e.clientY-16+'px'; }
    };
    const over = e => { if (e.target.matches('button,a,[class*="card"],[class*="ev-"],[class*="ch-"]')) rRef.current?.classList.add('hov'); };
    const out  = () => rRef.current?.classList.remove('hov');
    window.addEventListener('mousemove',move); window.addEventListener('mouseover',over); window.addEventListener('mouseout',out);
    return () => { window.removeEventListener('mousemove',move); window.removeEventListener('mouseover',over); window.removeEventListener('mouseout',out); };
  }, []);
  return (<><div className="cursor" ref={cRef}/><div className="cursor-ring" ref={rRef}/></>);
}

// ─── NAVBAR ──────────────────────────────────────────────────
function Navbar({ onJoin }) {
  const [solid,   setSolid]   = useState(false);
  const [menuOpen,setMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => { setSolid(window.scrollY > 60); };
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const go = id => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const LINKS = [['Events','events'],['Experiences','experiences'],['Chapters','chapters'],['Gallery','gallery'],['FAQs','faq']];

  return (
    <>
      <nav className={`nav${solid ? ' solid' : ''}`}>
        {/* Logo */}
        <div className="nav-logo">
          <div className="nav-dot"/>
          The Offline Vibes
        </div>

        {/* Desktop links */}
        <ul className="nav-links">
          {LINKS.map(([l,id]) => (
            <li key={id}>
              <a href="#" onClick={e => { e.preventDefault(); go(id); }}>{l}</a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <button className="nav-btn" onClick={onJoin}>Join Now</button>

        {/* Mobile hamburger */}
        <button
          className="nav-mobile-btn"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div style={{
          position:'fixed',top:56,left:0,right:0,zIndex:899,
          background:'rgba(255,255,255,.98)',backdropFilter:'blur(20px)',
          borderBottom:'1.5px solid rgba(246,36,64,.12)',
          boxShadow:'0 8px 32px rgba(26,26,26,.12)',
          padding:'16px 24px 20px',
          display:'flex',flexDirection:'column',gap:4,
          animation:'fadeIn .2s ease',
        }}>
          {LINKS.map(([l,id]) => (
            <button key={id} onClick={() => go(id)} style={{
              background:'none',border:'none',textAlign:'left',
              padding:'12px 4px',fontFamily:'Instrument Sans,sans-serif',
              fontSize:16,fontWeight:600,color:'var(--dark)',cursor:'pointer',
              borderBottom:'1px solid rgba(26,26,26,.06)',
              transition:'color .2s',
            }}
              onMouseEnter={e => e.target.style.color='var(--green)'}
              onMouseLeave={e => e.target.style.color='var(--dark)'}
            >{l}</button>
          ))}
          <button
            onClick={() => { setMenuOpen(false); onJoin(); }}
            className="btn btn-green"
            style={{ marginTop:10, width:'100%', fontSize:15 }}
          >Join the Community</button>
        </div>
      )}
    </>
  );
}

// ─── HERO ────────────────────────────────────────────────────
function Hero({ onJoin, nextEvent, regCount }) {
  const go = id => document.getElementById(id)?.scrollIntoView({behavior:'smooth'});
  const total = nextEvent?.spots ? parseInt(nextEvent.spots) : null;
  const left  = total !== null ? Math.max(0, total - regCount) : null;
  const spotsLabel = left===null?'Open':left===0?'Sold Out':left<=5?`${left} left!`:`${left} left`;
  const spotsColor = left===0?'#FF6B7D':left!==null&&left<=5?'var(--orange)':'#FFE5BF';

  return (
    <section className="hero" id="home">
      <div className="hero-pattern"/><div className="hero-top-fade"/><div className="hero-glow"/>
      <div className="hero-inner">
        <div>
          <div className="hero-tag"><div className="nav-dot"/>Now Live · Surat, Gujarat</div>
          <h1 className="hero-h1">Real life is<br/>waiting for you<br/><em>offline.</em></h1>
          <p className="hero-p">Forests. Bonfires. Strangers worth knowing. We build experiences where phones go in a box and life becomes extraordinary.</p>
          <div className="hero-actions">
            <button className="btn btn-white" onClick={()=>go('events')}>Browse Events →</button>
            <button className="btn btn-outline" onClick={onJoin}>Join Community</button>
          </div>
          <div className="hero-stats-row">
            {[["Growing","Members"],["Founding","Events Done"],["Surat","City"],["100%","Return Rate"]].map(([n,l])=>(
              <div key={l}><div className="hero-stat-n">{n}</div><div className="hero-stat-l">{l}</div></div>
            ))}
          </div>
        </div>
        <div className="hero-right">
          <div className="float-card fc1">
            <div className="fc-icon"></div>
            <div className="fc-label">Phone Status</div>
            <div className="fc-val">In Lockbox</div>
          </div>
          <div className="hero-phone">
            <div className="hero-phone-notch"/>
            <div className="hero-phone-screen">
              {nextEvent ? (
                <>
                  <div className="phone-tag">Next Event</div>
                  <div className="phone-title">{nextEvent.title}</div>
                  <div className="phone-chips">
                    {nextEvent.type && <span className="pchip pc-g">{nextEvent.type}</span>}
                    <span className="pchip pc-o">No Phones</span>
                    {nextEvent.venue && <span className="pchip pc-w">{nextEvent.venue.split(' ')[0]}</span>}
                  </div>
                  <div className="phone-meta">{nextEvent.date&&<>{nextEvent.date}</>}{nextEvent.venue&&<> · {nextEvent.venue}</>}</div>
                  <div className="phone-price">{nextEvent.price==='0'?'FREE':`₹${nextEvent.price}`}</div>
                  <button className="phone-btn" onClick={()=>go('events')}>Register Now</button>
                </>
              ) : (
                <>
                  <div className="phone-tag">Coming Soon</div>
                  <div className="phone-title">Next event being planned</div>
                  <div className="phone-chips"><span className="pchip pc-g">No Phones</span><span className="pchip pc-o">Real Vibes</span></div>
                  <div className="phone-meta">Stay tuned · Surat & beyond</div>
                  <div className="phone-price">₹TBA</div>
                  <button className="phone-btn" onClick={()=>go('events')}>See Events</button>
                </>
              )}
            </div>
          </div>
          <div className="float-card fc2">
            <div className="fc-icon">{left===0?'':left!==null&&left<=5?'':''}</div>
            <div className="fc-label">{nextEvent?(nextEvent.title.length>14?nextEvent.title.slice(0,14)+'…':nextEvent.title):'Spots'}</div>
            <div className="fc-val" style={{color:spotsColor}}>{spotsLabel}</div>
            {nextEvent&&regCount>0&&<div style={{fontSize:9,color:'rgba(255,255,255,.4)',marginTop:2}}>{regCount} registered</div>}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── MARQUEE ─────────────────────────────────────────────────
function Marquee() {
  const items = ["Digital Detox","No Phone Zones","Real Connections","Forest Retreats","Bonfire Nights","Sunrise Hikes","Mystery Trips","Offline Living","Café Nights","Tribe Building"];
  return (
    <div className="marquee-wrap">
      <div className="marquee-track">
        {[...items,...items].map((x,i)=><span className="marquee-item" key={i}>{x}<span className="marquee-sep">●</span></span>)}
      </div>
    </div>
  );
}

// ─── EVENTS SECTION — BOOKMYSHOW STYLE ───────────────────────
function EventsSection({ events, registrations }) {
  const [sel,    setSel]    = useState(null);
  const [filter, setFilter] = useState('All');
  const GRADS = ['linear-gradient(135deg,#0A1208,#152010)','linear-gradient(135deg,#100A08,#201008)','linear-gradient(135deg,#081015,#0A1830)','linear-gradient(135deg,#100808,#200A0A)'];

  const regCount = id => (registrations||[]).filter(r=>r.eventId===id).length;
  const types    = ['All', ...new Set(events.map(e=>e.type).filter(Boolean))];
  const filtered = filter==='All' ? events : events.filter(e=>e.type===filter);
  const featured = filtered[0];
  const rest     = filtered.slice(1);

  return (
    <section className="ev-section" id="events">
      <div className="sec-inner">

        {/* Bold header banner */}
        <div className="ev-hero-banner">
          <div className="ev-banner-glow"/>
          <div className="ev-banner-inner">
            <div>
              <div className="ev-banner-label">Live Events · Surat, Gujarat</div>
              <div className="ev-banner-h">Upcoming <span>Experiences</span></div>
              <div className="ev-banner-sub">Register directly here — no app, no redirect, no waiting.</div>
            </div>
            <div className="ev-banner-right">
              <div className="ev-live-badge"><div className="ev-live-dot"/>{events.length} Event{events.length!==1?'s':''} Live</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {/* Direct link copy button */}
                <button className="btn btn-white btn-sm" onClick={()=>{navigator.clipboard?.writeText(window.location.origin+'/events');alert('Events page link copied!');}}>Share Link</button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter pills */}
        {types.length > 1 && (
          <div className="ev-filter-row">
            {types.map(t=>(
              <button key={t} className={`ev-filter-btn${filter===t?' on':''}`} onClick={()=>setFilter(t)}>{t}</button>
            ))}
            <div className="ev-count-badge">{filtered.length} event{filtered.length!==1?'s':''}</div>
          </div>
        )}

        {filtered.length===0 ? (
          <div className="ev-empty">
            <div className="ev-empty-icon"></div>
            <div className="ev-empty-h">No Events Yet</div>
            <p className="ev-empty-p">Our team is planning something epic. Check back soon!</p>
          </div>
        ) : (
          <>
            {/* ── Featured event — full-width hero card ── */}
            {featured && (() => {
              const total  = featured.spots ? parseInt(featured.spots) : null;
              const reg    = regCount(featured.id);
              const left   = total!==null ? Math.max(0,total-reg) : null;
              const sold   = left===0;
              const hot    = left!==null&&left>0&&left<=5;
              const isFree = !featured.price||parseInt(featured.price)===0;
              const fillPct= total ? Math.min(100,(reg/total)*100) : 0;
              const fillClr= sold?'var(--red)':hot?'var(--orange)':'var(--green)';

              return (
                <div className="ev-featured" onClick={()=>!sold&&setSel(featured)} style={{cursor:sold?'not-allowed':'pointer'}}>
                  <div className="ev-featured-img" style={{background:featured.color||GRADS[0]}}>
                    {featured.imageUrl&&<img src={featured.imageUrl} alt={featured.title}/>}
                    <div className="ev-featured-img-overlay"/>
                    <div className="ev-featured-badges">
                      {!sold&&<div className="ev-badge ev-badge-new">FEATURED</div>}
                      {sold&&<div className="ev-badge ev-badge-sold">SOLD OUT</div>}
                      {hot&&!sold&&<div className="ev-badge ev-badge-hot">{left} LEFT</div>}
                      {isFree&&!sold&&<div className="ev-badge ev-badge-free">FREE</div>}
                    </div>
                    {!featured.imageUrl&&<div className="ev-monogram">{featured.title?featured.title.charAt(0):'?'}</div>}
                  </div>
                  <div className="ev-featured-body">
                    <div className="ev-featured-eyebrow">{featured.type||'Experience'}</div>
                    <div className="ev-featured-title">{featured.title}</div>
                    {featured.description&&<div className="ev-featured-desc">{featured.description.slice(0,120)}{featured.description.length>120?'…':''}</div>}
                    <div className="ev-featured-meta">
                      {featured.date&&<span>{featured.date}{featured.timing?` · ${featured.timing}`:''}</span>}
                      {featured.venue&&<span>{featured.venue}</span>}
                      {total!==null&&<span style={{color:fillClr,fontWeight:700}}>{sold?'Sold Out':hot?`Only ${left} of ${total} spots left!`:`${left} of ${total} spots remaining`}</span>}
                    </div>
                    {total!==null&&(
                      <div>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,fontWeight:600,marginBottom:5,color:'var(--muted)'}}>
                          <span>Seats filled</span><span style={{color:fillClr}}>{Math.round(fillPct)}%</span>
                        </div>
                        <div className="ev-spots-bar"><div className="ev-spots-fill" style={{width:`${fillPct}%`,background:fillClr}}/></div>
                      </div>
                    )}
                    <div className="ev-featured-footer">
                      <div className="ev-featured-price" style={{color:isFree?'var(--green)':'var(--dark)'}}>
                        {isFree?'FREE ENTRY':`₹${featured.price}`}
                        {!isFree&&<span style={{fontSize:13,fontWeight:500,color:'var(--muted2)'}}>/person</span>}
                      </div>
                      <button
                        className={`btn ${isFree?'btn-green':'btn-red'}`}
                        disabled={sold}
                        style={sold?{opacity:.5,cursor:'not-allowed',background:'#888'}:{}}
                        onClick={e=>{e.stopPropagation();if(!sold)setSel(featured);}}
                      >
                        {sold?'Sold Out':'Register Now →'}
                      </button>
                    </div>
                    {/* Share registration link */}
                    <div style={{marginTop:12}}>
                      <button
                        className="btn btn-outline-dark btn-sm"
                        onClick={e=>{e.stopPropagation();const url=`${window.location.origin}/register?eventId=${featured.id}`;navigator.clipboard?.writeText(url);alert('Registration link copied!\n'+url);}}
                        style={{fontSize:11}}
                      >
                        Copy Registration Link
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Rest events grid ── */}
            {rest.length > 0 && (
              <div className="ev-grid">
                {rest.map((ev,i)=>{
                  const total  = ev.spots?parseInt(ev.spots):null;
                  const reg    = regCount(ev.id);
                  const left   = total!==null?Math.max(0,total-reg):null;
                  const sold   = left===0;
                  const hot    = left!==null&&left>0&&left<=5;
                  const isFree = !ev.price||parseInt(ev.price)===0;
                  const fillPct= total?Math.min(100,(reg/total)*100):0;
                  const fillClr= sold?'var(--red)':hot?'var(--orange)':'var(--green)';
                  return (
                    <div key={ev.id} className={`ev-card${sold?' sold-out':''}`} onClick={()=>!sold&&setSel(ev)}>
                      <div className="ev-card-img" style={{background:ev.color||GRADS[i%GRADS.length]}}>
                        {ev.imageUrl&&<img src={ev.imageUrl} alt={ev.title}/>}
                        <div className="ev-card-img-overlay"/>
                        {sold&&<div className="ev-badge ev-badge-tl ev-badge-sold">SOLD OUT</div>}
                        {!sold&&hot&&<div className="ev-badge ev-badge-tl ev-badge-hot">{left} LEFT</div>}
                        {!sold&&!hot&&<div className="ev-badge ev-badge-tl ev-badge-new">NEW</div>}
                        {isFree&&!sold&&<div className="ev-badge ev-badge-tr ev-badge-free">FREE</div>}
                        {!ev.imageUrl&&<div className="ev-monogram ev-monogram-sm">{ev.title?ev.title.charAt(0):'?'}</div>}
                      </div>
                      <div className="ev-card-body">
                        <div className="ev-card-category">{ev.type||'Experience'}</div>
                        <div className="ev-card-title">{ev.title}</div>
                        <div className="ev-card-meta">
                          {ev.date&&<span>{ev.date}{ev.timing?` · ${ev.timing}`:''}</span>}
                          {ev.venue&&<span>{ev.venue}</span>}
                          {total!==null&&<span style={{color:fillClr,fontWeight:700}}>{sold?'Sold Out':hot?`Only ${left} left!`:`${left} of ${total} left`}</span>}
                        </div>
                        {total!==null&&(
                          <>
                            <div className="ev-spots-row">
                              <span style={{color:'var(--muted2)'}}>Seats filled</span>
                              <span style={{color:fillClr}}>{Math.round(fillPct)}%</span>
                            </div>
                            <div className="ev-spots-bar"><div className="ev-spots-fill" style={{width:`${fillPct}%`,background:fillClr}}/></div>
                          </>
                        )}
                        <div className="ev-card-footer">
                          <div className={isFree?'ev-price ev-price-free':'ev-price'}>
                            {isFree?'FREE ENTRY':<>₹{ev.price}<small>/person</small></>}
                          </div>
                          <div style={{display:'flex',gap:7,flexDirection:'column',alignItems:'flex-end'}}>
                            <button
                              className={`btn btn-sm ${isFree?'btn-green':'btn-red'}`}
                              disabled={sold}
                              style={sold?{opacity:.4,cursor:'not-allowed',background:'#888'}:{}}
                              onClick={e=>{e.stopPropagation();if(!sold)setSel(ev);}}
                            >
                              {sold?'Sold Out':'Register →'}
                            </button>
                            <button
                              className="btn-xs"
                              style={{background:'none',border:'none',color:'var(--green)',fontSize:10,fontWeight:700,cursor:'pointer',padding:'2px 0',fontFamily:'Instrument Sans,sans-serif'}}
                              onClick={e=>{e.stopPropagation();const url=`${window.location.origin}/register?eventId=${ev.id}`;navigator.clipboard?.writeText(url);alert('Registration link copied!');}}
                            >
                              Share Link
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      {sel&&<EventModal event={sel} onClose={()=>setSel(null)} registrations={registrations}/>}
    </section>
  );
}

// ─── STATS ───────────────────────────────────────────────────
function Stats() {
  return (
    <section className="stats-sec">
      <div className="stats-grid">
        {[["Growing","Members"],["Founding","Events Done"],["Surat","City"],["100%","Return Rate"]].map(([n,l])=>(
          <div className="stat-box" key={l}><div className="stat-n">{n}</div><div className="stat-l">{l}</div></div>
        ))}
      </div>
    </section>
  );
}

// ─── EXPERIENCES ─────────────────────────────────────────────
function Experiences() {
  const TAGS = ['exp-tag-g','exp-tag-o','exp-tag-d','exp-tag-r','exp-tag-g','exp-tag-o'];
  return (
    <section className="sec exp-sec" id="experiences">
      <div className="sec-inner">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:20}}>
          <div><div className="sec-label">What We Do</div><h2 className="sec-h2">Curated Offline<br/>Experiences</h2></div>
          <p className="sec-p" style={{textAlign:'right',maxWidth:240,color:'var(--muted2)'}}>Every event makes you feel something real.</p>
        </div>
        <div className="exp-grid">
          {EXPS.map((e,i)=>(
            <div className="exp-card" key={i}>
              <div className="exp-top"><span className="exp-index">{String(i+1).padStart(2,'0')}</span><span className={`exp-tag ${TAGS[i]}`}>{e.tag}</span></div>
              <div className="exp-title">{e.title}</div>
              <div className="exp-desc">{e.desc}</div>
              <div className="exp-num">0{i+1}</div>
            </div>
          ))}
        </div>
        <p style={{textAlign:'center',marginTop:28,fontSize:15,color:'var(--muted2)',fontWeight:500}}>And many more exciting events and games.</p>
      </div>
    </section>
  );
}

// ─── CHAPTERS ────────────────────────────────────────────────
function ChapterLeadModal({ city, onClose }) {
  const [f,setF]=useState({name:'',email:'',phone:'',city:city||''}); const [done,setDone]=useState(false);
  const upd=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const submit=async()=>{ if(!f.name||!f.phone||!f.email) return alert('Please fill all required fields'); await fbAdd('chapter_leads',{...f,status:'pending',date:nowDate()}); setDone(true); };
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-hd"><div className="modal-hd-title">Become Chapter Lead{city?` — ${city}`:''}</div><button className="modal-x" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          {!done ? <>
            <p style={{fontSize:13,color:'var(--muted)',marginBottom:16,lineHeight:1.65}}>Lead the offline revolution in your city. Build a real tribe — not a following.</p>
            <div className="field"><label>Full Name *</label><input className="inp" placeholder="Your name" value={f.name} onChange={upd('name')}/></div>
            <div className="inp-row">
              <div className="field"><label>Email *</label><input className="inp" type="email" placeholder="you@email.com" value={f.email} onChange={upd('email')}/></div>
              <div className="field"><label>WhatsApp *</label><input className="inp" type="tel" placeholder="98765 43210" value={f.phone} onChange={upd('phone')}/></div>
            </div>
            <div className="field"><label>Your City *</label><input className="inp" placeholder="City" value={f.city} onChange={upd('city')}/></div>
            <button className="btn btn-green" style={{width:'100%'}} onClick={submit}>Apply as Chapter Lead →</button>
          </> : <div style={{textAlign:'center',padding:20}}>
            <div style={{fontSize:44,marginBottom:10}}></div>
            <h3 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:19,fontWeight:800,color:'var(--dark)',marginBottom:7}}>Application Sent!</h3>
            <p style={{fontSize:13,color:'var(--muted)',lineHeight:1.7}}>We'll reach out on <b style={{color:'var(--green)'}}>{f.phone}</b> soon.</p>
            <button className="btn btn-dn btn-sm" style={{marginTop:16}} onClick={onClose}>Close</button>
          </div>}
        </div>
      </div>
    </div>
  );
}

function Chapters({ onHost }) {
  const [lead,setLead]=useState(null);
  return (
    <section className="sec ch-sec" id="chapters">
      <div className="sec-inner">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:20}}>
          <div><div className="sec-label">Our Chapters</div><h2 className="sec-h2">Find Your Chapter</h2><p className="sec-p" style={{marginTop:8}}>Spreading across Gujarat — one city at a time.</p></div>
          <button className="btn btn-green" onClick={onHost}>Start a Chapter</button>
        </div>
        <div className="ch-grid">
          {CHAPTERS.map((c,i)=>(
            <div key={i} className={`ch-card ${c.status}`}>
              <div className="ch-emoji">{c.city.charAt(0)}</div>
              <div className={`ch-status ${c.status==='founding'?'ch-status-live':'ch-status-soon'}`}>
                <div className={`ch-dot ${c.status==='founding'?'ch-dot-live':'ch-dot-dim'}`}/>
                {c.status==='founding'?'Founding Chapter':'Coming Soon'}
              </div>
              <div className="ch-city">{c.city}</div>
              <p className="ch-desc">{c.desc}</p>
              <button className={`btn btn-sm ${c.status==='founding'?'btn-green':'btn-outline-dark'}`} onClick={()=>setLead(c.city)}>
                {c.status==='founding'?'Join Surat Chapter':`Become Lead — ${c.city}`}
              </button>
            </div>
          ))}
        </div>
      </div>
      {lead&&<ChapterLeadModal city={lead} onClose={()=>setLead(null)}/>}
    </section>
  );
}

// ─── START CHAPTER ────────────────────────────────────────────
function HostModal({ onClose }) {
  const [f,setF]=useState({name:'',email:'',phone:'',city:'',about:''}); const [done,setDone]=useState(false);
  const upd=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const submit=async()=>{ if(!f.name||!f.phone||!f.email||!f.city) return alert('Please fill all required fields'); await fbAdd('host_requests',{...f,status:'pending',date:nowDate()}); setDone(true); };
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-hd"><div className="modal-hd-title">Start a Chapter</div><button className="modal-x" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          {!done ? <>
            <p style={{fontSize:13,color:'var(--muted)',marginBottom:18,lineHeight:1.65}}>Bring The Offline Vibes to your city. Our team reviews every request personally.</p>
            <div className="inp-row">
              <div className="field"><label>Full Name *</label><input className="inp" placeholder="Your name" value={f.name} onChange={upd('name')}/></div>
              <div className="field"><label>City *</label><input className="inp" placeholder="Your city" value={f.city} onChange={upd('city')}/></div>
            </div>
            <div className="inp-row">
              <div className="field"><label>Email *</label><input className="inp" type="email" placeholder="you@email.com" value={f.email} onChange={upd('email')}/></div>
              <div className="field"><label>WhatsApp *</label><input className="inp" type="tel" placeholder="98765 43210" value={f.phone} onChange={upd('phone')}/></div>
            </div>
            <div className="field"><label>Why do you want to lead? (optional)</label><textarea className="inp" style={{resize:'vertical',minHeight:76}} placeholder="Tell us about yourself…" value={f.about} onChange={upd('about')}/></div>
            <button className="btn btn-green" style={{width:'100%'}} onClick={submit}>Submit Request →</button>
          </> : <div style={{textAlign:'center',padding:'22px 0'}}>
            <div style={{fontSize:44,marginBottom:12}}></div>
            <h3 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:19,fontWeight:800,color:'var(--dark)',marginBottom:7}}>Request Sent!</h3>
            <p style={{fontSize:13,color:'var(--muted)',lineHeight:1.7}}>We got your request for <b>{f.city}</b>. We'll contact you on <b style={{color:'var(--green)'}}>{f.phone}</b> soon.</p>
            <button className="btn btn-dn btn-sm" style={{marginTop:18}} onClick={onClose}>Close</button>
          </div>}
        </div>
      </div>
    </div>
  );
}

function StartChapterCTA({ onHost }) {
  return (
    <section className="start-sec">
      <div className="start-inner">
        <div>
          <h2 className="start-h2">Bring The Offline Vibes to Your City</h2>
          <p className="start-p">Become a Chapter Host. Organise events, build a real community, and lead the offline revolution in your city.</p>
          {[['','Organise offline events in your city'],['','Connect with like-minded humans'],['','Build a real community — not online'],['','Full support from our core team']].map(([ico,txt])=>(
            <div className="benefit-row" key={txt}><span className="benefit-icon">{ico}</span><span>{txt}</span></div>
          ))}
        </div>
        <div className="host-card">
          <h3>Register as a Host</h3>
          <p>Your request will be reviewed by our admin team. Once approved, we'll reach out personally to onboard you.</p>
          <button className="btn btn-green" style={{width:'100%'}} onClick={onHost}>Apply as Chapter Host →</button>
        </div>
      </div>
    </section>
  );
}

// ─── GALLERY ─────────────────────────────────────────────────
function Gallery({ photos }) {
  const [lb,setLb]=useState(null);
  return (
    <section className="gallery-sec" id="gallery">
      <div className="sec-inner">
        <div className="sec-label">Memories</div>
        <h2 className="sec-h2">Events in Photos</h2>
        <p className="sec-p" style={{marginTop:8}}>Real moments from real events. No filters, no fakes.</p>
        {photos.length===0 ? (
          <div style={{textAlign:'center',padding:'72px 32px',background:'var(--paper)',borderRadius:20,border:'2px dashed var(--border)',marginTop:48}}>
            <div style={{fontSize:48,marginBottom:12}}></div>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:20,fontWeight:700,color:'var(--dark)',marginBottom:6}}>Photos Coming Soon</div>
            <div style={{color:'var(--muted2)',fontSize:13}}>Our team will post event photos here after each event.</div>
          </div>
        ) : (
          <div className="photos-grid">
            {photos.map((p,i)=>(
              <div className="photo-item" key={i} onClick={()=>setLb(p)}>
                <img src={p.url} alt={p.caption||''}/>
                {p.caption&&<div className="photo-cap">{p.caption}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      {lb&&(
        <div className="modal-overlay" onClick={()=>setLb(null)}>
          <div style={{maxWidth:800,width:'90%'}}>
            <img src={lb.url} alt="" style={{width:'100%',borderRadius:14,maxHeight:'80vh',objectFit:'contain'}}/>
            {lb.caption&&<div style={{textAlign:'center',color:'rgba(255,255,255,.6)',marginTop:8,fontSize:12}}>{lb.caption}</div>}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── STORIES ─────────────────────────────────────────────────
function Stories() {
  return (
    <section className="stories-sec">
      <div className="sec-inner">
        <div className="sec-label" style={{color:'var(--orange)'}}>Real Stories</div>
        <h2 className="sec-h2" style={{color:'#fff'}}>Moments That Actually Happened</h2>
        <div className="stories-grid" style={{marginTop:48}}>
          {STORIES.map((s,i)=>(
            <div className="story-card" key={i}>
              <div className="story-tag">{s.tag}</div>
              <p className="story-q">"{s.q}"</p>
              <div className="story-author">— {s.author}</div>
              <div className="story-mark">"</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────
function FAQ() {
  const [open,setOpen]=useState(null);
  return (
    <section className="faq-sec" id="faq">
      <div className="sec-inner">
        <div className="sec-label">Got Questions</div>
        <h2 className="sec-h2">FAQs</h2>
        <div className="faq-list">
          {FAQS.map((f,i)=>(
            <div className="faq-item" key={i}>
              <div className="faq-q" onClick={()=>setOpen(open===i?null:i)}><span>{f.q}</span><span className={`faq-icon${open===i?' open':''}`}>+</span></div>
              <div className={`faq-a${open===i?' open':''}`}>{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────
function CTASection() {
  const [phone,setPhone]=useState(''); const [done,setDone]=useState(false);
  const submit=async()=>{ if(!phone.trim()) return; await fbAdd('leads',{phone,name:'—',source:'cta',date:nowDate(),time:nowTime()}); setDone(true); setPhone(''); };
  return (
    <section className="cta-sec">
      <div className="cta-glow"/>
      <div className="cta-inner">
        <h2 className="cta-h2">The Next Event Is<br/><em>Filling Fast.</em></h2>
        <p className="cta-p">Join people choosing real life. Early access to every event before it sells out.</p>
        {!done ? (
          <div className="cta-form">
            <input className="cta-inp" type="tel" placeholder="Your WhatsApp number" value={phone} onChange={e=>setPhone(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/>
            <button className="btn btn-white" onClick={submit} style={{color:'var(--red)'}}>Join</button>
          </div>
        ) : <p style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:18,color:'rgba(255,255,255,.9)',fontWeight:700}}>You're in! Watch your WhatsApp.</p>}
      </div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────
function Footer({ onAdmin }) {
  return (
    <footer>
      <div className="footer-top">
        <div>
          <div className="footer-brand"><div className="nav-dot"/>The Offline Vibes</div>
          <p className="footer-p">A lifestyle movement for people choosing real life over screens. Founded in Surat, Gujarat. Built by humans, for humans.</p>
        </div>
        {[['Experiences',['Detox Camps','Café Nights','Road Trips','Premium Retreats']],['Community',['Membership','WhatsApp Group','Chapters','Host Program']],['Connect',['Instagram','YouTube','Contact Us','Press']]].map(([h,links])=>(
          <div key={h}>
            <div className="footer-col-h">{h}</div>
            <div className="footer-col">{links.map(l=><a key={l} href="#">{l}</a>)}</div>
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <p className="footer-copy">© 2025 The Offline Vibes. All rights reserved.</p>
        <button className="admin-btn" onClick={onAdmin}>Admin</button>
      </div>
    </footer>
  );
}

// ─── POPUP ───────────────────────────────────────────────────
function Popup({ onClose }) {
  const [name,setName]=useState(''); const [phone,setPhone]=useState('');
  const [busy,setBusy]=useState(false); const [done,setDone]=useState(false);
  const submit=async()=>{ if(!phone.trim()) return; setBusy(true); await fbAdd('leads',{name:name.trim()||'—',phone:phone.trim(),source:'popup',date:nowDate(),time:nowTime()}); setBusy(false); setDone(true); setTimeout(onClose,2000); };
  return (
    <div className="popup-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="popup-box">
        <button className="popup-close" onClick={onClose}>✕</button>
        <div className="popup-icon"></div>
        <h2 className="popup-h2">Join the Vibes</h2>
        <p className="popup-p">Real adventures. Real connections. No screens.<br/>Drop your WhatsApp — get invited to events first.</p>
        <div className="field"><input className="inp" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)}/></div>
        <div className="field"><input className="inp" type="tel" placeholder="WhatsApp number" value={phone} onChange={e=>setPhone(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/></div>
        <button className="btn btn-green" style={{width:'100%'}} onClick={submit} disabled={busy||done}>
          {busy?'Saving…':done?'You\'re in!':'Join the Community →'}
        </button>
        {done&&<p className="success-msg">Saved! Watch your WhatsApp for the first invite.</p>}
        <button className="popup-skip" onClick={onClose}>I'll explore first</button>
      </div>
    </div>
  );
}

// ─── ADMIN LOGIN ─────────────────────────────────────────────
function AdminLogin({ onSuccess, onCancel }) {
  const [email,setEmail]=useState(''); const [pw,setPw]=useState('');
  const [err,setErr]=useState(''); const [busy,setBusy]=useState(false);
  const login=async()=>{ if(!email.trim()||!pw.trim()) return setErr('Please enter email and password.'); setBusy(true); setErr('');
    try { await loginWithEmail(email.trim(),pw); onSuccess(); } catch { setErr('Wrong email or password. Try again.'); setPw(''); } finally { setBusy(false); } };
  return (
    <div className="adm-login-overlay">
      <div className="adm-login-box">
        <div className="adm-login-icon"></div>
        <h2 className="adm-login-h">Admin Access</h2>
        <p className="adm-login-sub">Sign in with your admin account to access the dashboard.</p>
        <input className="inp" type="email" placeholder="Admin email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} autoFocus style={{marginBottom:10}}/>
        <input className="inp" type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()}/>
        {err&&<p className="adm-login-err">{err}</p>}
        <button className="btn btn-green" style={{width:'100%',marginTop:14}} onClick={login} disabled={busy}>{busy?'Signing in…':'Unlock Dashboard →'}</button>
        <button className="btn btn-dn btn-sm" style={{width:'100%',marginTop:10}} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ─────────────────────────────────────────────
function AdminPanel({ onClose }) {
  const [tab,setTab]=useState('dashboard');
  const [leads,setLeads]=useState([]); const [events,setEvents]=useState([]); const [regs,setRegs]=useState([]);
  const [hosts,setHosts]=useState([]); const [chLeads,setChLeads]=useState([]); const [photos,setPhotos]=useState([]);
  const [loading,setLoading]=useState(true);
  const [newEv,setNewEv]=useState({title:'',date:'',venue:'',price:'',spots:'',type:'',description:'',color:'',timing:'',location:'',refreshments:'',activities:'',imageUrl:''});
  const [photoUrl,setPhotoUrl]=useState(''); const [photoCap,setPhotoCap]=useState('');
  const [saving,setSaving]=useState(false); const [saveMsg,setSaveMsg]=useState('');

  const load=async()=>{ setLoading(true); const [l,e,r,h,cl,p]=await Promise.all([fbGet('leads'),fbGet('events'),fbGet('registrations'),fbGet('host_requests'),fbGet('chapter_leads'),fbGet('photos')]); setLeads(l);setEvents(e);setRegs(r);setHosts(h);setChLeads(cl);setPhotos(p);setLoading(false); };
  useEffect(()=>{load();},[]);

  const saveEv=async()=>{ const ok=newEv.price==='0'||newEv.price===0||(newEv.price!==''&&newEv.price!==null); if(!newEv.title||!newEv.date||!ok) return alert('Title, date and price required');
    setSaving(true); await fbAdd('events',{...newEv,highlighted:true}); setSaveMsg('Event published! Now live on the website.');
    setNewEv({title:'',date:'',venue:'',price:'',spots:'',type:'',description:'',color:'',timing:'',location:'',refreshments:'',activities:'',imageUrl:''});
    await load(); setSaving(false); setTimeout(()=>setSaveMsg(''),4000); };

  const delEv=async(id,title)=>{ if(!confirm(`Delete "${title}"?\nThis also deletes ALL registrations for this event.`)) return;
    await fbDelete('events',id); const d=db(); if(d){const s=await d.collection('registrations').where('eventId','==',id).get(); if(!s.empty){const b=d.batch();s.docs.forEach(doc=>b.delete(doc.ref));await b.commit();}} await load(); };

  const updStatus=async(col,id,status)=>{ await fbUpdate(col,id,{status}); await load(); };
  const addPhoto=async()=>{ if(!photoUrl.trim()) return alert('Enter a photo URL'); await fbAdd('photos',{url:photoUrl.trim(),caption:photoCap.trim(),date:nowDate()}); setPhotoUrl('');setPhotoCap('');await load(); };
  const delPhoto=async id=>{ await fbDelete('photos',id);await load(); };
  const exportCSV=(data,name)=>{ if(!data.length) return; const keys=Object.keys(data[0]).filter(k=>k!=='id'&&k!=='createdAt'); const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]||''}"`).join(','))].join('\n'); const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=`${name}.csv`;a.click(); };
  const logout=async()=>{await logoutUser();onClose();};
  const pendingH=hosts.filter(h=>h.status==='pending').length;
  const pendingC=chLeads.filter(c=>c.status==='pending').length;

  const NAV=[['dashboard','','Dashboard',0],['leads','','Community',leads.length],['events','','Events',0],['registrations','','Registrations',regs.length],['hosts','','Host Requests',pendingH],['chapters','','Chapter Leads',pendingC],['photos','','Gallery',0],['scanner','','QR Scanner',0]];

  return (
    <div className="adm-wrap">
      <div className="adm-side">
        <div className="adm-logo"><div className="adm-logo-txt"><div className="nav-dot"/>Admin Panel</div><div className="adm-logo-sub">The Offline Vibes</div></div>
        <div style={{marginTop:12,flex:1}}>
          {NAV.map(([id,ico,lbl,badge])=>(
            <div key={id} className={`adm-nav-link${tab===id?' on':''}`} onClick={()=>setTab(id)}>
              <span className="adm-nav-ico">{ico}</span>{lbl}
              {badge>0&&<span className="adm-badge">{badge}</span>}
            </div>
          ))}
        </div>
        <div style={{padding:'14px 16px',borderTop:'1px solid rgba(255,255,255,.07)',display:'flex',flexDirection:'column',gap:7}}>
          <button className="btn btn-dn btn-sm" style={{width:'100%',borderRadius:100}} onClick={load}>↻ Refresh</button>
          <button className="btn btn-dr btn-sm" style={{width:'100%',borderRadius:100}} onClick={logout}>Logout</button>
          <button className="btn btn-dn btn-sm" style={{width:'100%',borderRadius:100}} onClick={onClose}>← Back to Site</button>
        </div>
      </div>
      <div className="adm-main">
        <div className="adm-topbar"><div className="adm-page-h">{NAV.find(n=>n[0]===tab)?.[2]||'Admin'}</div><div style={{fontSize:12,color:'var(--muted2)'}}>Logged in as Admin</div></div>
        {loading&&<div style={{textAlign:'center',padding:80,color:'var(--muted)',fontSize:15}}>Loading…</div>}

        {/* DASHBOARD */}
        {!loading&&tab==='dashboard'&&<>
          <div className="adm-stats-row">
            {[['',events.length,'Events'],['',regs.length,'Registrations'],['',leads.length,'Community'],['',pendingH+pendingC,'Pending']].map(([ico,n,l])=>(
              <div className="adm-stat" key={l}><div className="adm-stat-ico">{ico}</div><div className="adm-stat-n">{n}</div><div className="adm-stat-l">{l}</div></div>
            ))}
          </div>
          <div className="adm-card">
            <div className="adm-card-h">Recent Community Joins <button className="btn btn-sm btn-dark" onClick={()=>setTab('leads')}>View All →</button></div>
            {leads.slice(0,5).length===0?<p style={{color:'var(--muted2)'}}>No community members yet.</p>:(
              <table className="adm-tbl">
                <thead><tr><th>Name</th><th>WhatsApp</th><th>Source</th><th>Date</th><th>Contact</th></tr></thead>
                <tbody>{leads.slice(0,5).map(l=>(<tr key={l.id} className={l.source==='popup'?'highlight-row':''}><td style={{fontWeight:700}}>{l.name}</td><td>{l.phone}</td><td><span className="pill pill-new">{l.source}</span></td><td style={{color:'var(--muted2)',fontSize:12}}>{l.date}</td><td><a className="contact-btn" href={`https://wa.me/91${l.phone?.replace(/\s/g,'')}`} target="_blank" rel="noreferrer">WhatsApp</a></td></tr>))}</tbody>
              </table>
            )}
          </div>
          <div className="adm-card">
            <div className="adm-card-h">Pending Requests <span style={{fontSize:12,color:'var(--muted2)',fontWeight:400}}>{pendingH+pendingC} pending</span></div>
            {pendingH+pendingC===0?<p style={{color:'var(--muted2)'}}>No pending requests.</p>:(
              <table className="adm-tbl">
                <thead><tr><th>Name</th><th>City</th><th>WhatsApp</th><th>Type</th><th>Action</th></tr></thead>
                <tbody>
                  {hosts.filter(h=>h.status==='pending').slice(0,3).map(h=>(<tr key={h.id}><td style={{fontWeight:700}}>{h.name}</td><td>{h.city}</td><td>{h.phone}</td><td><span className="pill pill-pending">Host</span></td><td><div className="act-row"><button className="btn btn-ds btn-sm" onClick={()=>updStatus('host_requests',h.id,'approved')}>✓ Approve</button><button className="btn btn-dr btn-sm" onClick={()=>updStatus('host_requests',h.id,'rejected')}>✕ Reject</button></div></td></tr>))}
                  {chLeads.filter(c=>c.status==='pending').slice(0,3).map(c=>(<tr key={c.id}><td style={{fontWeight:700}}>{c.name}</td><td>{c.city}</td><td>{c.phone}</td><td><span className="pill pill-new">Chapter</span></td><td><div className="act-row"><button className="btn btn-ds btn-sm" onClick={()=>updStatus('chapter_leads',c.id,'approved')}>✓ Approve</button><button className="btn btn-dr btn-sm" onClick={()=>updStatus('chapter_leads',c.id,'rejected')}>✕ Reject</button></div></td></tr>))}
                </tbody>
              </table>
            )}
          </div>
        </>}

        {/* LEADS */}
        {!loading&&tab==='leads'&&(
          <div className="adm-card">
            <div className="adm-card-h">Community Members ({leads.length}) <button className="btn btn-sm btn-dark" onClick={()=>exportCSV(leads,'community_leads')}>Export CSV</button></div>
            {leads.length===0?<p style={{color:'var(--muted2)'}}>No community members yet.</p>:(
              <table className="adm-tbl">
                <thead><tr><th>#</th><th>Name</th><th>WhatsApp</th><th>Source</th><th>Date</th><th>Time</th><th>Contact</th></tr></thead>
                <tbody>{leads.map((l,i)=>(<tr key={l.id} className={l.source==='popup'?'highlight-row':''}><td style={{color:'var(--muted2)'}}>{leads.length-i}</td><td style={{fontWeight:700}}>{l.name}</td><td style={{fontFamily:'monospace',color:'var(--green)',fontSize:13}}>{l.phone}</td><td><span className={`pill ${l.source==='popup'?'pill-paid':'pill-new'}`}>{l.source}</span></td><td style={{color:'var(--muted2)',fontSize:12}}>{l.date}</td><td style={{color:'var(--muted2)',fontSize:12}}>{l.time}</td><td><a className="contact-btn" href={`https://wa.me/91${l.phone?.replace(/[\s\-+]/g,'')}`} target="_blank" rel="noreferrer">Chat</a></td></tr>))}</tbody>
              </table>
            )}
          </div>
        )}

        {/* EVENTS */}
        {!loading&&tab==='events'&&<>
          <div className="adm-card">
            <div className="adm-card-h">Create New Event</div>
            {saveMsg&&<div className="msg-ok">{saveMsg}</div>}
            <div className="adm-2col">
              <div className="adm-fg"><label className="adm-lbl">Event Title *</label><input className="adm-inp" placeholder="Forest Detox Camp" value={newEv.title} onChange={e=>setNewEv(p=>({...p,title:e.target.value}))}/></div>
              <div className="adm-fg"><label className="adm-lbl">Event Type</label><input className="adm-inp" placeholder="Detox Camp / Trek / Café Night" value={newEv.type} onChange={e=>setNewEv(p=>({...p,type:e.target.value}))}/></div>
              <div className="adm-fg"><label className="adm-lbl">Date *</label><input className="adm-inp" type="date" value={newEv.date} onChange={e=>setNewEv(p=>({...p,date:e.target.value}))}/></div>
              <div className="adm-fg"><label className="adm-lbl">Timing</label><input className="adm-inp" placeholder="6:00 PM – 10:00 PM" value={newEv.timing||''} onChange={e=>setNewEv(p=>({...p,timing:e.target.value}))}/></div>
              <div className="adm-fg"><label className="adm-lbl">Venue</label><input className="adm-inp" placeholder="Surat Outskirts" value={newEv.venue} onChange={e=>setNewEv(p=>({...p,venue:e.target.value}))}/></div>
              <div className="adm-fg"><label className="adm-lbl">Full Address</label><input className="adm-inp" placeholder="Vansda National Park, Navsari" value={newEv.location||''} onChange={e=>setNewEv(p=>({...p,location:e.target.value}))}/></div>
            </div>
            <div className="adm-2col">
              <div className="adm-fg">
                <label className="adm-lbl">Entry Fee (₹)</label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,fontWeight:600,color:'var(--muted)',marginBottom:7}}>
                  <input type="checkbox" checked={newEv.price==='0'||newEv.price===0} onChange={e=>setNewEv(p=>({...p,price:e.target.checked?'0':''}))} style={{width:15,height:15,accentColor:'var(--green)'}}/>
                  <span>This is a <b style={{color:'var(--green)'}}>FREE</b> event</span>
                </label>
                <input className="adm-inp" type="number" placeholder="2500" value={newEv.price==='0'?'':newEv.price} disabled={newEv.price==='0'||newEv.price===0} style={newEv.price==='0'?{opacity:.4,cursor:'not-allowed'}:{}} onChange={e=>setNewEv(p=>({...p,price:e.target.value}))}/>
                {(newEv.price==='0'||newEv.price===0)&&<div style={{fontSize:10,color:'var(--green)',fontWeight:700,marginTop:3}}>Free event — no payment required</div>}
              </div>
              <div className="adm-fg"><label className="adm-lbl">Spots Available</label><input className="adm-inp" type="number" placeholder="30" value={newEv.spots} onChange={e=>setNewEv(p=>({...p,spots:e.target.value}))}/></div>
            </div>
            <div className="adm-2col">
              <div className="adm-fg"><label className="adm-lbl">Refreshments (CSV)</label><input className="adm-inp" placeholder="Tea, Snacks, Bonfire" value={newEv.refreshments||''} onChange={e=>setNewEv(p=>({...p,refreshments:e.target.value}))}/></div>
              <div className="adm-fg"><label className="adm-lbl">Activities (CSV)</label><input className="adm-inp" placeholder="Trekking, Journaling, Games" value={newEv.activities||''} onChange={e=>setNewEv(p=>({...p,activities:e.target.value}))}/></div>
              <div className="adm-fg"><label className="adm-lbl">Card Image URL</label><input className="adm-inp" placeholder="https://i.imgur.com/..." value={newEv.imageUrl||''} onChange={e=>setNewEv(p=>({...p,imageUrl:e.target.value}))}/></div>
            </div>
            <div style={{marginTop:8,borderTop:'1px solid var(--border2)',paddingTop:12}}>
              <div className="adm-lbl" style={{marginBottom:10}}>Additional Event Info</div>
              <div className="adm-2col">
                {EVENT_EXTRA_FIELDS.map(({key,label,placeholder})=>(
                  <div className="adm-fg" key={key}><label className="adm-lbl">{label}</label><input className="adm-inp" placeholder={placeholder} value={newEv[key]||''} onChange={e=>setNewEv(p=>({...p,[key]:e.target.value}))}/></div>
                ))}
              </div>
            </div>
            <div className="adm-fg"><label className="adm-lbl">Description</label><textarea className="adm-ta" placeholder="Describe the event…" value={newEv.description} onChange={e=>setNewEv(p=>({...p,description:e.target.value}))}/></div>
            <button className="btn btn-green" onClick={saveEv} disabled={saving}>{saving?'Publishing…':'Publish Event'}</button>
          </div>
          <div className="adm-card">
            <div className="adm-card-h">All Events ({events.length}) <button className="btn btn-sm btn-dark" onClick={()=>exportCSV(events,'events')}>CSV</button></div>
            {events.length===0?<p style={{color:'var(--muted2)'}}>No events yet.</p>:(
              <div style={{overflowX:'auto'}}><table className="adm-tbl">
                <thead><tr><th>Title</th><th>Date</th><th>Timing</th><th>Venue</th><th>Price</th><th>Spots</th><th>Reg Link</th><th>Action</th></tr></thead>
                <tbody>{events.map(ev=>(
                  <tr key={ev.id}>
                    <td style={{fontWeight:700}}>{ev.emoji} {ev.title}</td>
                    <td>{ev.date||'—'}</td>
                    <td style={{fontSize:11,color:'var(--muted2)'}}>{ev.timing||'—'}</td>
                    <td style={{fontSize:11,color:'var(--muted2)'}}>{ev.venue||'—'}</td>
                    <td style={{fontWeight:700}}>{ev.price==='0'||ev.price===0?<span style={{color:'var(--green)'}}>FREE</span>:<span style={{color:'var(--red)'}}>₹{ev.price}</span>}</td>
                    <td>{ev.spots||'—'}</td>
                    <td>
                      <button className="btn btn-ds btn-xs" onClick={()=>{const url=`${window.location.origin}/register?eventId=${ev.id}`;navigator.clipboard?.writeText(url);alert('Link copied!\n'+url);}}>
                        Copy Link
                      </button>
                    </td>
                    <td><button className="btn btn-dr btn-sm" onClick={()=>delEv(ev.id,ev.title)}>Delete</button></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        </>}

        {/* REGISTRATIONS */}
        {!loading&&tab==='registrations'&&(
          <div className="adm-card">
            <div className="adm-card-h">Registrations ({regs.length}) <button className="btn btn-sm btn-dark" onClick={()=>exportCSV(regs,'registrations')}>Export</button></div>
            {regs.length===0?<p style={{color:'var(--muted2)'}}>No registrations yet.</p>:(
              <div style={{overflowX:'auto'}}><table className="adm-tbl">
                <thead><tr><th>#</th><th>Name</th><th>Gender</th><th>Phone</th><th>Email</th><th>Event</th><th>Ticket ID</th><th>Entry</th><th>Attended</th><th>Date</th><th>Contact</th></tr></thead>
                <tbody>{regs.map((r,i)=>(
                  <tr key={r.id}>
                    <td style={{color:'var(--muted2)'}}>{regs.length-i}</td>
                    <td style={{fontWeight:700}}>{r.name}</td>
                    <td style={{fontSize:11}}>{r.gender||'—'}</td>
                    <td>{r.phone}</td>
                    <td style={{color:'var(--muted2)',fontSize:11}}>{r.email}</td>
                    <td style={{maxWidth:110,overflow:'hidden',textOverflow:'ellipsis',fontSize:11}}>{r.eventTitle}</td>
                    <td style={{fontFamily:'monospace',color:'var(--orange)',fontSize:10}}>{r.ticketId}</td>
                    <td style={{fontWeight:700}}>{r.price==='0'||r.price===0?<span style={{color:'var(--green)'}}>FREE</span>:<span style={{color:'var(--red)'}}>₹{r.price}</span>}</td>
                    <td>{r.attended?<span className="pill pill-approved">Yes</span>:<span className="pill pill-pending">No</span>}</td>
                    <td style={{color:'var(--muted2)',fontSize:11}}>{r.date}</td>
                    <td><a className="contact-btn" href={`https://wa.me/91${r.phone?.replace(/[\s\-+]/g,'')}`} target="_blank" rel="noreferrer"></a></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        )}

        {/* HOSTS */}
        {!loading&&tab==='hosts'&&(
          <div className="adm-card">
            <div className="adm-card-h">Host Requests <button className="btn btn-sm btn-dark" onClick={()=>exportCSV(hosts,'host_requests')}>Export</button></div>
            {hosts.length===0?<p style={{color:'var(--muted2)'}}>No host requests yet.</p>:(
              <table className="adm-tbl">
                <thead><tr><th>#</th><th>Name</th><th>City</th><th>Email</th><th>Phone</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{hosts.map((h,i)=>(<tr key={h.id}><td style={{color:'var(--muted2)'}}>{i+1}</td><td style={{fontWeight:700}}>{h.name}</td><td>{h.city}</td><td style={{fontSize:11,color:'var(--muted2)'}}>{h.email}</td><td>{h.phone}</td><td style={{fontSize:11,color:'var(--muted2)'}}>{h.date}</td><td><span className={`pill ${h.status==='approved'?'pill-approved':h.status==='rejected'?'pill-rejected':'pill-pending'}`}>{h.status||'pending'}</span></td><td>{h.status==='pending'&&<div className="act-row"><button className="btn btn-ds btn-sm" onClick={()=>updStatus('host_requests',h.id,'approved')}>✓</button><button className="btn btn-dr btn-sm" onClick={()=>updStatus('host_requests',h.id,'rejected')}>✕</button><a className="contact-btn" href={`https://wa.me/91${h.phone?.replace(/[\s\-+]/g,'')}`} target="_blank" rel="noreferrer"></a></div>}</td></tr>))}</tbody>
              </table>
            )}
          </div>
        )}

        {/* CHAPTER LEADS */}
        {!loading&&tab==='chapters'&&(
          <div className="adm-card">
            <div className="adm-card-h">Chapter Lead Applications <button className="btn btn-sm btn-dark" onClick={()=>exportCSV(chLeads,'chapter_leads')}>Export</button></div>
            {chLeads.length===0?<p style={{color:'var(--muted2)'}}>No chapter lead applications yet.</p>:(
              <table className="adm-tbl">
                <thead><tr><th>#</th><th>Name</th><th>City</th><th>Email</th><th>Phone</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{chLeads.map((c,i)=>(<tr key={c.id}><td style={{color:'var(--muted2)'}}>{i+1}</td><td style={{fontWeight:700}}>{c.name}</td><td>{c.city}</td><td style={{fontSize:11,color:'var(--muted2)'}}>{c.email}</td><td>{c.phone}</td><td style={{fontSize:11,color:'var(--muted2)'}}>{c.date}</td><td><span className={`pill ${c.status==='approved'?'pill-approved':c.status==='rejected'?'pill-rejected':'pill-pending'}`}>{c.status||'pending'}</span></td><td>{c.status==='pending'&&<div className="act-row"><button className="btn btn-ds btn-sm" onClick={()=>updStatus('chapter_leads',c.id,'approved')}>✓</button><button className="btn btn-dr btn-sm" onClick={()=>updStatus('chapter_leads',c.id,'rejected')}>✕</button><a className="contact-btn" href={`https://wa.me/91${c.phone?.replace(/[\s\-+]/g,'')}`} target="_blank" rel="noreferrer"></a></div>}</td></tr>))}</tbody>
              </table>
            )}
          </div>
        )}

        {/* GALLERY */}
        {!loading&&tab==='photos'&&<>
          <div className="adm-card">
            <div className="adm-card-h">Add Event Photo</div>
            <div className="adm-fg"><label className="adm-lbl">Photo URL</label><input className="adm-inp" placeholder="https://i.imgur.com/..." value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)}/></div>
            <div className="adm-fg"><label className="adm-lbl">Caption (optional)</label><input className="adm-inp" placeholder="Forest Detox Camp — Nov 2025" value={photoCap} onChange={e=>setPhotoCap(e.target.value)}/></div>
            <button className="btn btn-green" onClick={addPhoto}>Add to Gallery</button>
          </div>
          <div className="adm-card">
            <div className="adm-card-h">Gallery ({photos.length} photos)</div>
            {photos.length===0?<p style={{color:'var(--muted2)'}}>No photos yet.</p>:(
              <div className="photo-grid-adm">{photos.map((p,i)=>(<div className="photo-thumb" key={p.id||i}><img src={p.url} alt={p.caption} onError={e=>e.target.style.display='none'}/><button className="photo-del" onClick={()=>delPhoto(p.id)}>✕</button></div>))}</div>
            )}
          </div>
        </>}

        {/* QR SCANNER */}
        {!loading&&tab==='scanner'&&<VolunteerScanner onClose={()=>setTab('dashboard')} fbGet={fbGet} fbUpdate={fbUpdate}/>}
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function App() {
  // Routing: check if URL is /register
  const isRegPage = window.location.pathname.startsWith('/register');
  if (isRegPage) return <EventRegistrationPage/>;

  const [popup,setPopup]               = useState(false);
  const [showAdminLogin,setAdminLogin] = useState(false);
  const [showAdmin,setShowAdmin]       = useState(false);
  const [adminUser,setAdminUser]       = useState(null);
  const [host,setHost]                 = useState(false);
  const [events,setEvents]             = useState([]);
  const [photos,setPhotos]             = useState([]);
  const [registrations,setRegistrations] = useState([]);

  useEffect(()=>{
    const t=setTimeout(()=>setPopup(true),1600);
    loadData();
    let unsub=()=>{};
    const timer=setTimeout(()=>{
      unsub=onAuthChange(user=>{setAdminUser(user);if(user){setAdminLogin(false);setShowAdmin(true);}else{setShowAdmin(false);}});
    },500);
    return()=>{clearTimeout(t);clearTimeout(timer);unsub();};
  },[]);

  const loadData=async()=>{
    const [ev,ph,regs]=await Promise.all([fbGet('events'),fbGet('photos'),fbGet('registrations')]);
    setEvents(ev);setPhotos(ph);setRegistrations(regs);
  };

  const nextEvent    = events.length>0?events[0]:null;
  const nextEventReg = nextEvent?registrations.filter(r=>r.eventId===nextEvent.id).length:0;
  const handleAdmin  = ()=>adminUser?setShowAdmin(true):setAdminLogin(true);

  return (
    <>
      <style>{STYLES + REGISTRATION_STYLES}</style>
      <Cursor/>
      {popup&&<Popup onClose={()=>setPopup(false)}/>}
      {showAdminLogin&&<AdminLogin onSuccess={()=>{setAdminLogin(false);setShowAdmin(true);}} onCancel={()=>setAdminLogin(false)}/>}
      {showAdmin&&adminUser&&<AdminPanel onClose={()=>setShowAdmin(false)}/>}
      {host&&<HostModal onClose={()=>setHost(false)}/>}
      <Navbar onJoin={()=>setPopup(true)}/>
      <Hero onJoin={()=>setPopup(true)} nextEvent={nextEvent} regCount={nextEventReg}/>
      <Marquee/>
      <EventsSection events={events} registrations={registrations}/>
      <Stats/>
      <Experiences/>
      <Chapters onHost={()=>setHost(true)}/>
      <StartChapterCTA onHost={()=>setHost(true)}/>
      <Gallery photos={photos}/>
      <Stories/>
      <FAQ/>
      <CTASection/>
      <Footer onAdmin={handleAdmin}/>
    </>
  );
}
