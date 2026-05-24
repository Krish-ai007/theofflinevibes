import { useState, useEffect, useRef } from "react";

// ─── FIREBASE CONFIG (already configured) ───────────────────
const FB_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ─── ADMIN CREDENTIALS (change these!) ──────────────────────
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

let _db = null;
function db() {
  if (_db) return _db;
  if (!window.firebase) return null;
  if (!window.firebase.apps?.length) window.firebase.initializeApp(FB_CONFIG);
  _db = window.firebase.firestore();
  return _db;
}
const LS = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)||"null"); } catch { return null; } },
  set: (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} },
};
async function fbAdd(col, data) {
  const d = db();
  if (d) return (await d.collection(col).add({...data, createdAt: window.firebase.firestore.FieldValue.serverTimestamp()})).id;
  const arr = LS.get(col)||[];
  const id = Date.now().toString();
  arr.unshift({...data, id, createdAt: new Date().toISOString()});
  LS.set(col, arr);
  return id;
}
async function fbGet(col) {
  const d = db();
  if (d) { try { const s = await d.collection(col).orderBy("createdAt","desc").get(); return s.docs.map(doc=>({id:doc.id,...doc.data()})); } catch { return []; } }
  return LS.get(col)||[];
}
async function fbUpdate(col, id, data) {
  const d = db();
  if (d) return d.collection(col).doc(id).update(data);
  const arr = LS.get(col)||[];
  const i = arr.findIndex(x=>x.id===id);
  if (i>=0) arr[i]={...arr[i],...data};
  LS.set(col, arr);
}
async function fbDelete(col, id) {
  const d = db();
  if (d) return d.collection(col).doc(id).delete();
  const arr = (LS.get(col)||[]).filter(x=>x.id!==id);
  LS.set(col, arr);
}
const qrUrl = t => `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(t)}`;
const genId = () => Math.random().toString(36).substr(2,9).toUpperCase();
const nowDate = () => new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
const nowTime = () => new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});

// ─── STATIC DATA ────────────────────────────────────────────
const CHAPTERS = [
  { city:"Surat", status:"founding", emoji:"🌊", desc:"The birthplace of The Offline Vibes. Where real connections first began." },
  { city:"Vadodara", status:"soon", emoji:"🏛️", desc:"A growing community choosing experiences over screens." },
  { city:"Ahmedabad", status:"soon", emoji:"🌆", desc:"Coming soon to Gujarat's cultural capital. Stay tuned." },
];
const EXPS = [
  { icon:"🏕️", title:"Digital Detox Camps", desc:"2D/1N forest retreats. Phone lockbox. Trekking, bonfire, journaling & real conversations.", tag:"MOST POPULAR" },
  { icon:"☕", title:"No-Phone Café Nights", desc:"Board games, conversation cards, live acoustic music. Phone at the door. Humans inside.", tag:"EVERY WEEK" },
  { icon:"🌅", title:"Mystery Road Trips", desc:"Destination revealed at departure. Sunrise hikes, cycling clubs, meet-strangers dinners.", tag:"ADVENTURE" },
  { icon:"🏔️", title:"Premium Retreats", desc:"Himachal. Goa. Coorg. Multi-day immersions for founders & remote workers to fully reset.", tag:"EXCLUSIVE" },
  { icon:"🗺️", title:"Map & Compass City Hunts", desc:"Paper maps, a compass, and cryptic riddles. Teams of strangers explore the city, talk to locals for hints, and race to find hidden checkpoints. No GPS allowed.", tag:"TEAM PLAY" },
  { icon:"🌲", title:"Escape the Woods (Overnight)", desc:"A narrative-driven overnight camp where you solve physical puzzles scattered through the forest — find the combination to unlock the bonfire marshmallows and more.", tag:"OVERNIGHT" },
];
const STORIES = [
  { tag:"🔥 WENT VIRAL", q:"100 people gave up phones for 48 hours. None of them wanted it to end.", author:"Surat Camp, Oct 2024" },
  { tag:"💚 REAL STORY", q:"We took strangers into a forest with no internet. They left as lifelong friends.", author:"Mystery Trip, Sep 2024" },
  { tag:"✨ MOST SHARED", q:"People literally cried reconnecting with real life. No phones. No reels. Just humans.", author:"Café Night, Nov 2024" },
];
const FAQS = [
  { q:"What happens to my phone?", a:"We provide a numbered lockbox. Your phone is stored safely — you get it back at the end. It's liberating, not scary." },
  { q:"Who comes to these events?", a:"IT professionals, students, founders, couples, and anyone craving real human connection. Ages 18–35 mostly, from all walks of life." },
  { q:"Are the events safe?", a:"100%. All venues are vetted, all guides are trained. We have emergency protocols and safety briefings at every event." },
  { q:"Can I get a refund?", a:"Full refund up to 48 hours before the event. After that, you can transfer your spot to a friend." },
];

// ─── STYLES ─────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap');

/* ── RESET & BASE ── */
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
html { scroll-behavior:smooth; font-size:16px; }
body {
  background:#FEF6EC;
  color:#1C1917;
  font-family:'Instrument Sans', sans-serif;
  overflow-x:hidden;
  line-height:1.6;
  cursor:none;
}
::selection { background:#FF7043; color:#fff; }
::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#FF7043; border-radius:4px; }

/* ── DESIGN TOKENS ── */
:root {
  /* Warm Palette */
  --sun:      #FF7043;   /* warm orange — primary CTA */
  --sun-lt:   #FFF0EA;   /* tint for backgrounds */
  --sun-glow: rgba(255,112,67,.18);
  --sky:      #29B6D4;   /* energetic teal — accent */
  --sky-lt:   #E6F8FC;
  --grass:    #43A047;   /* nature green — positive states */
  --grass-lt: #E8F5E9;
  --honey:    #FFB300;   /* amber — warmth, fun */
  --honey-lt: #FFF8E1;
  --lilac:    #7E57C2;   /* purple — premium, events */
  --lilac-lt: #EDE7F6;
  --rose:     #E91E8C;   /* hot pink — energy, playful */
  --rose-lt:  #FCE4F4;

  --ink:      #1C1917;   /* near-black text */
  --ink2:     #57534E;   /* secondary text */
  --ink3:     #A8A29E;   /* muted text */
  --paper:    #FEF6EC;   /* warm cream base */
  --paper2:   #FDF0DC;   /* slightly deeper cream */
  --card:     #FFFFFF;   /* card white */
  --border:   rgba(28,25,23,.1);
  --border2:  rgba(28,25,23,.06);

  --r-sm:  10px;
  --r-md:  16px;
  --r-lg:  24px;
  --r-xl:  32px;
  --r-2xl: 48px;
}

/* ── CUSTOM CURSOR ── */
.cursor {
  width:10px; height:10px; background:var(--sun);
  border-radius:50%; position:fixed; pointer-events:none;
  z-index:99999; transition:transform .12s; mix-blend-mode:multiply;
}
.cursor-ring {
  width:34px; height:34px; border:2px solid rgba(255,112,67,.5);
  border-radius:50%; position:fixed; pointer-events:none;
  z-index:99998; transition:all .1s linear;
}
.cursor-ring.hover { transform:scale(2); border-color:var(--sun); }

/* ── NAVBAR ── */
.nav {
  position:fixed; top:0; left:0; right:0; z-index:900;
  padding:18px 52px; display:flex; justify-content:space-between;
  align-items:center; transition:all .35s;
}
.nav.solid {
  background:rgba(254,246,236,.96); backdrop-filter:blur(20px);
  border-bottom:1px solid var(--border); padding:13px 52px;
  box-shadow:0 2px 24px rgba(255,112,67,.06);
}
.nav-logo {
  font-family:'Bricolage Grotesque',sans-serif; font-size:18px;
  font-weight:800; color:var(--ink); display:flex;
  align-items:center; gap:10px; letter-spacing:-.3px;
}
.nav-live-dot {
  width:9px; height:9px; border-radius:50%; background:#43A047;
  flex-shrink:0; animation:livePop 2.2s ease-in-out infinite;
}
@keyframes livePop {
  0%,100% { box-shadow:0 0 0 0 rgba(67,160,71,.5); }
  60%      { box-shadow:0 0 0 8px rgba(67,160,71,0); }
}
.nav-links { display:flex; gap:28px; list-style:none; }
.nav-links a {
  color:var(--ink2); text-decoration:none; font-size:14px;
  font-weight:500; transition:color .2s; position:relative;
  padding-bottom:3px;
}
.nav-links a::after {
  content:''; position:absolute; bottom:0; left:0; right:0;
  height:2px; background:var(--sun); border-radius:2px;
  transform:scaleX(0); transform-origin:left; transition:transform .25s;
}
.nav-links a:hover { color:var(--ink); }
.nav-links a:hover::after { transform:scaleX(1); }
.nav-cta {
  background:var(--sun); color:#fff; border:none; padding:11px 26px;
  border-radius:100px; font-family:'Instrument Sans',sans-serif;
  font-size:14px; font-weight:600; cursor:none; transition:all .22s;
  box-shadow:0 4px 16px var(--sun-glow);
}
.nav-cta:hover { background:#F4511E; transform:translateY(-2px); box-shadow:0 8px 28px var(--sun-glow); }

/* ── HERO ── */
.hero {
  min-height:100vh; background:var(--paper);
  display:flex; align-items:center;
  position:relative; overflow:hidden; padding-top:80px;
}
/* Hero background elements matching JSX class names */
.hero-grid {
  position:absolute; inset:0;
  background-image:radial-gradient(rgba(28,25,23,.06) 1.2px,transparent 1.2px);
  background-size:28px 28px; pointer-events:none;
}
.hero-glow {
  position:absolute; width:560px; height:560px; border-radius:50%;
  background:radial-gradient(circle, rgba(255,179,0,.14) 0%, rgba(255,112,67,.1) 40%, transparent 70%);
  top:-140px; right:-120px; pointer-events:none;
  animation:blobDrift 10s ease-in-out infinite;
}
@keyframes blobDrift {
  0%,100% { transform:translate(0,0) scale(1); }
  50%      { transform:translate(-20px,22px) scale(1.06); }
}
.hero-inner {
  max-width:1200px; margin:0 auto; padding:80px 52px;
  display:grid; grid-template-columns:1fr 1fr; gap:72px;
  align-items:center; width:100%; position:relative; z-index:2;
}
.hero-eyebrow, .hero-tag {
  display:inline-flex; align-items:center; gap:8px;
  background:var(--card); border:1.5px solid var(--border);
  color:var(--ink2); font-size:12px; font-weight:600;
  letter-spacing:.8px; text-transform:uppercase; padding:7px 18px;
  border-radius:100px; margin-bottom:28px;
  box-shadow:0 2px 10px rgba(28,25,23,.06);
}
.hero-h1 {
  font-family:'Bricolage Grotesque',sans-serif;
  font-size:clamp(44px,5.5vw,70px); font-weight:800;
  line-height:1.08; color:var(--ink); margin-bottom:22px;
  letter-spacing:-.5px;
}
.h1-sun  { color:var(--sun); display:inline; }
.h1-sky  { color:var(--sky); display:inline; }
.h1-wave { display:inline-block; animation:wave 2.8s ease-in-out infinite; }
@keyframes wave { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(14deg)} 50%{transform:rotate(-6deg)} 75%{transform:rotate(10deg)} }
.hero-sub {
  font-size:17px; line-height:1.75; color:var(--ink2);
  margin-bottom:44px; max-width:460px;
}
.hero-actions, .hero-btns { display:flex; gap:14px; flex-wrap:wrap; align-items:center; }
.hero-social-proof, .hero-stats {
  display:flex; align-items:center; gap:12px;
  margin-top:40px; padding-top:32px;
  border-top:1px solid var(--border);
}
.avatar-stack { display:flex; }
.avatar-stack span {
  width:34px; height:34px; border-radius:50%; border:2.5px solid var(--paper);
  display:flex; align-items:center; justify-content:center;
  font-size:16px; margin-left:-8px; background:var(--paper2);
  flex-shrink:0;
}
.avatar-stack span:first-child { margin-left:0; }
.social-proof-txt { font-size:13px; color:var(--ink2); line-height:1.4; }
.social-proof-txt strong { color:var(--ink); font-weight:700; }
.hero-stat-n { font-family:'Bricolage Grotesque',sans-serif; font-size:26px; font-weight:800; color:var(--sun); line-height:1; }
.hero-stat-l { font-size:11px; color:var(--ink3); margin-top:2px; letter-spacing:.5px; text-transform:uppercase; }

/* HERO VISUAL */
.hero-visual {
  display:flex; justify-content:center;
  align-items:center; position:relative;
}
.hero-phone, .hero-phone-mockup {
  width:248px; background:var(--ink); border-radius:40px;
  padding:20px 14px 28px; box-shadow:0 32px 80px rgba(28,25,23,.22);
  position:relative; z-index:3;
  border:2px solid rgba(255,255,255,.08);
  animation:phoneHover 6s ease-in-out infinite;
}
@keyframes phoneHover { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
.phone-island, .phone-notch { width:76px;height:6px;background:rgba(255,255,255,.1);border-radius:10px;margin:0 auto 14px; }
.phone-screen-inner, .phone-screen { background:#111; border-radius:26px; overflow:hidden; }
.phone-notif {
  background:#1C1917; border:1px solid rgba(255,255,255,.08);
  border-radius:14px; padding:12px 14px; margin:10px;
}
.phone-notif-top { display:flex;align-items:center;gap:8px;margin-bottom:8px; }
.phone-notif-icon { font-size:18px; }
.phone-notif-app { font-size:10px;color:rgba(255,255,255,.4);font-weight:600;letter-spacing:.5px; }
.phone-notif-time { font-size:9px;color:rgba(255,255,255,.25);margin-left:auto; }
.phone-notif-title { font-family:'Bricolage Grotesque',sans-serif;font-size:13px;font-weight:700;color:#fff;margin-bottom:3px; }
.phone-notif-body { font-size:11px;color:rgba(255,255,255,.5);line-height:1.4; }
.phone-ev-preview, .phone-event-card { padding:12px 14px 14px; }
.phone-ev-type, .phone-ev-tag { font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--sun);margin-bottom:6px; }
.phone-ev-name, .phone-ev-title { font-family:'Bricolage Grotesque',sans-serif;font-size:15px;font-weight:700;color:#fff;margin-bottom:10px;line-height:1.3; }
.phone-chips, .phone-ev-chips { display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px; }
.pchip { padding:3px 9px;border-radius:100px;font-size:9px;font-weight:700; }
.pchip-sun { background:rgba(255,112,67,.15);color:var(--sun); }
.pchip-sky { background:rgba(41,182,212,.15);color:var(--sky); }
.pchip-grass { background:rgba(67,160,71,.15);color:var(--grass); }
.pchip-coral { background:rgba(255,112,67,.15);color:var(--sun); }
.pchip-mint { background:rgba(41,182,212,.15);color:var(--sky); }
.phone-ev-footer { display:flex;justify-content:space-between;align-items:center; }
.phone-price, .phone-ev-price { font-family:'Bricolage Grotesque',sans-serif;font-size:18px;font-weight:800;color:var(--sun); }
.phone-reg-btn, .phone-ev-btn {
  background:var(--sun); color:#fff; border:none;
  font-family:'Instrument Sans',sans-serif; font-size:10px;
  font-weight:700; padding:7px 14px; border-radius:100px;
}
/* Floating cards beside phone */
.hf-card, .hero-float-card {
  position:absolute; background:var(--card);
  border:1.5px solid var(--border); border-radius:18px;
  padding:14px 16px; box-shadow:0 8px 32px rgba(28,25,23,.1);
  font-family:'Instrument Sans',sans-serif;
}
.hf1, .hfc1 { top:-10px; right:-30px; animation:hfloat1 4s ease-in-out infinite; }
.hf2, .hfc2 { bottom:40px; left:-48px; animation:hfloat2 5s ease-in-out infinite; }
.hf3 { top:40%; right:-52px; animation:hfloat1 6s ease-in-out infinite reverse; }
@keyframes hfloat1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes hfloat2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }
.hf-icon, .hfc-icon { font-size:22px; margin-bottom:4px; }
.hf-label, .hfc-label { font-size:10px; color:var(--ink3); font-weight:600; letter-spacing:.5px; text-transform:uppercase; }
.hf-val, .hfc-val { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; color:var(--ink); margin-top:2px; }

/* ── BUTTONS ── */
.btn {
  display:inline-flex; align-items:center; gap:8px;
  border:none; cursor:none; font-family:'Instrument Sans',sans-serif;
  font-weight:600; border-radius:100px; transition:all .22s;
  letter-spacing:.1px;
}
.btn-sun {
  background:var(--sun); color:#fff; padding:14px 32px; font-size:15px;
  box-shadow:0 4px 18px var(--sun-glow);
}
.btn-sun:hover { background:#F4511E; transform:translateY(-2px); box-shadow:0 10px 32px var(--sun-glow); }
.btn-outline-ink {
  background:transparent; color:var(--ink);
  border:2px solid var(--border); padding:13px 30px; font-size:15px;
}
.btn-outline-ink:hover { border-color:var(--ink); background:rgba(28,25,23,.04); transform:translateY(-2px); }
.btn-sky { background:var(--sky); color:#fff; padding:12px 26px; font-size:14px; box-shadow:0 4px 16px rgba(41,182,212,.25); }
.btn-sky:hover { background:#1EA8C5; transform:translateY(-2px); }
.btn-grass { background:var(--grass); color:#fff; padding:12px 26px; font-size:14px; }
.btn-grass:hover { background:#388E3C; transform:translateY(-2px); }
.btn-honey { background:var(--honey); color:var(--ink); padding:12px 26px; font-size:14px; box-shadow:0 4px 16px rgba(255,179,0,.25); }
.btn-honey:hover { background:#FFA000; transform:translateY(-2px); }
.btn-white { background:#fff; color:var(--sun); padding:14px 32px; font-size:15px; box-shadow:0 4px 20px rgba(28,25,23,.12); }
.btn-white:hover { transform:translateY(-2px); box-shadow:0 10px 36px rgba(28,25,23,.18); }
.btn-sm { padding:8px 18px !important; font-size:12px !important; }
.btn-danger-soft { background:#FFF0EA; color:#C62828; border:1px solid rgba(198,40,40,.15); padding:8px 16px; font-size:12px; }
.btn-danger-soft:hover { background:#FFE0D6; }
.btn-success-soft { background:var(--grass-lt); color:#1B5E20; border:1px solid rgba(27,94,32,.15); padding:8px 16px; font-size:12px; }
.btn-success-soft:hover { background:#C8E6C9; }
.btn-neutral { background:#F5F0EB; color:var(--ink2); border:1px solid var(--border); padding:8px 16px; font-size:12px; }
.btn-neutral:hover { background:#EDE8E3; }
.btn-dark { background:var(--ink); color:#fff; border:1px solid rgba(28,25,23,.8); padding:8px 16px; font-size:12px; }
.btn-dark:hover { background:#333; }
.btn-neutral:hover { background:#EDE8E3; }
.btn:disabled { opacity:.55; cursor:not-allowed; transform:none !important; box-shadow:none !important; }

/* ── MARQUEE ── */
.marquee-wrap { background:var(--sun); padding:15px 0; overflow:hidden; }
.marquee-track { display:flex; animation:marqueescroll 22s linear infinite; white-space:nowrap; }
.marquee-item {
  display:inline-flex; align-items:center; gap:16px;
  font-family:'Bricolage Grotesque',sans-serif; font-size:13px;
  font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
  color:rgba(255,255,255,.85); padding:0 36px;
}
.marquee-sep { color:rgba(255,255,255,.4); font-size:8px; }
@keyframes marqueescroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }

/* ── SECTIONS ── */
.sec { padding:96px 52px; }
.sec-inner { max-width:1200px; margin:0 auto; }
.sec-tag {
  display:inline-flex; align-items:center; gap:8px;
  font-size:11px; font-weight:700; letter-spacing:2px;
  text-transform:uppercase; color:var(--sun); margin-bottom:14px;
}
.sec-tag::before { content:''; width:20px; height:2.5px; background:var(--sun); border-radius:2px; display:block; }
.sec-h2 {
  font-family:'Bricolage Grotesque',sans-serif;
  font-size:clamp(30px,3.8vw,50px); font-weight:800;
  color:var(--ink); margin-bottom:14px;
  line-height:1.1; letter-spacing:-.3px;
}
.sec-sub { font-size:16px; color:var(--ink2); line-height:1.75; max-width:520px; }

/* ── STATS ── */
.stats-strip { background:var(--ink); padding:56px 52px; }
.stats-row {
  display:grid; grid-template-columns:repeat(4,1fr);
  max-width:1000px; margin:0 auto;
  border:1px solid rgba(255,255,255,.08);
  border-radius:20px; overflow:hidden;
}
.stat-cell {
  padding:36px 24px; text-align:center;
  border-right:1px solid rgba(255,255,255,.08);
  transition:background .2s;
}
.stat-cell:last-child { border-right:none; }
.stat-cell:hover { background:rgba(255,255,255,.03); }
.stat-n {
  font-family:'Bricolage Grotesque',sans-serif; font-size:48px;
  font-weight:800; color:var(--sun); line-height:1; margin-bottom:6px;
}
.stat-l { font-size:12px; color:rgba(255,255,255,.45); font-weight:600; letter-spacing:.5px; }

/* ── EVENTS ── */
.events-sec { background:var(--paper); }
.events-top { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:48px; flex-wrap:wrap; gap:20px; }
.events-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
.ev-card {
  background:var(--card); border-radius:22px; overflow:hidden;
  border:1.5px solid var(--border2); transition:all .3s; cursor:none;
  box-shadow:0 2px 12px rgba(28,25,23,.06);
}
.ev-card:hover {
  transform:translateY(-6px);
  box-shadow:0 20px 56px rgba(28,25,23,.14);
  border-color:var(--sun);
}
.ev-card-img {
  height:186px; display:flex; align-items:center; justify-content:center;
  font-size:52px; position:relative; overflow:hidden;
}
.ev-card-img img { position:absolute;inset:0;width:100%;height:100%;object-fit:cover; }
.ev-card-img-overlay { position:absolute;inset:0;background:linear-gradient(to top,rgba(28,25,23,.4),transparent); }
.ev-new-badge {
  position:absolute; top:12px; left:12px;
  background:var(--sun); color:#fff;
  font-family:'Bricolage Grotesque',sans-serif;
  font-size:10px; font-weight:700; letter-spacing:1px;
  text-transform:uppercase; padding:5px 14px; border-radius:100px;
  box-shadow:0 4px 12px var(--sun-glow);
}
.ev-card-body { padding:22px; }
.ev-type {
  font-size:10px; font-weight:700; letter-spacing:1.5px;
  text-transform:uppercase; color:var(--sky); margin-bottom:8px;
}
.ev-title {
  font-family:'Bricolage Grotesque',sans-serif; font-size:18px;
  font-weight:700; color:var(--ink); margin-bottom:10px; line-height:1.3;
}
.ev-meta { display:flex;flex-direction:column;gap:4px;font-size:13px;color:var(--ink2);margin-bottom:18px; }
.ev-footer { display:flex;justify-content:space-between;align-items:center; }
.ev-price { font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:800; color:var(--ink); }
.ev-price small { font-size:12px; font-weight:500; color:var(--ink3); }
.ev-card.featured { border-color:rgba(255,112,67,.3); box-shadow:0 8px 32px rgba(255,112,67,.12); }
.empty-box {
  text-align:center; padding:80px 40px; background:var(--card);
  border-radius:22px; border:2px dashed rgba(28,25,23,.1);
}
.empty-emoji { font-size:56px; margin-bottom:14px; }
.empty-title { font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:700; margin-bottom:8px; color:var(--ink); }
.empty-sub { color:var(--ink3); font-size:15px; }

/* ── EXPERIENCES ── */
.exp-sec { background:var(--paper2); }
.exp-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:18px; margin-top:56px; }
.exp-card {
  background:var(--card); border:1.5px solid var(--border2);
  border-radius:22px; padding:32px; transition:all .3s;
  position:relative; overflow:hidden;
  box-shadow:0 2px 12px rgba(28,25,23,.05);
}
.exp-card:hover { transform:translateY(-4px); box-shadow:0 16px 48px rgba(28,25,23,.12); border-color:var(--sun); }
.exp-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
.exp-icon { font-size:36px; }
.exp-badge {
  font-family:'Bricolage Grotesque',sans-serif; font-size:9px;
  font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
  padding:5px 12px; border-radius:100px;
}
.badge-sun { background:var(--sun-lt); color:var(--sun); border:1px solid rgba(255,112,67,.2); }
.badge-sky { background:var(--sky-lt); color:var(--sky); border:1px solid rgba(41,182,212,.2); }
.badge-grass { background:var(--grass-lt); color:var(--grass); border:1px solid rgba(67,160,71,.2); }
.badge-lilac { background:var(--lilac-lt); color:var(--lilac); border:1px solid rgba(126,87,194,.2); }
.exp-title { font-family:'Bricolage Grotesque',sans-serif; font-size:20px; font-weight:700; color:var(--ink); margin-bottom:10px; letter-spacing:-.2px; }
.exp-desc { font-size:14px; color:var(--ink2); line-height:1.75; margin-bottom:20px; }
.exp-price-tag { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800; color:var(--sun); }
.exp-num { position:absolute; bottom:-8px; right:18px; font-family:'Bricolage Grotesque',sans-serif; font-size:88px; font-weight:800; color:rgba(28,25,23,.04); line-height:1; }

/* ── CHAPTERS ── */
.chapters-sec { background:var(--paper); }
.chapters-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:56px; }
.ch-card {
  background:var(--card); border:1.5px solid var(--border2);
  border-radius:22px; padding:30px; transition:all .28s;
  position:relative; overflow:hidden;
  box-shadow:0 2px 12px rgba(28,25,23,.05);
}
.ch-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:3px 3px 0 0; }
.ch-card.founding::before { background:linear-gradient(90deg,var(--sun),var(--honey),#FFD54F); }
.ch-card.soon::before { background:linear-gradient(90deg,#D7CCC8,#BCAAA4); }
.ch-card:hover { transform:translateY(-5px); box-shadow:0 18px 48px rgba(28,25,23,.12); }
.ch-card.founding:hover { border-color:rgba(255,112,67,.25); }
.ch-city-emoji { font-size:44px; margin-bottom:16px; display:block; }
.ch-status-badge {
  display:inline-flex; align-items:center; gap:7px;
  font-size:11px; font-weight:700; letter-spacing:.8px;
  text-transform:uppercase; padding:5px 14px;
  border-radius:100px; margin-bottom:14px;
}
.badge-founding { background:var(--sun-lt); color:var(--sun); border:1px solid rgba(255,112,67,.2); }
.badge-soon { background:#F5F0EB; color:var(--ink3); border:1px solid var(--border); }
.ch-dot { width:7px; height:7px; border-radius:50%; }
.ch-dot.live { background:var(--grass); animation:livePop 2.2s ease-in-out infinite; }
.ch-dot.dim { background:var(--ink3); }
.ch-city-name { font-family:'Bricolage Grotesque',sans-serif; font-size:28px; font-weight:800; color:var(--ink); margin-bottom:8px; letter-spacing:-.5px; }
.ch-desc { font-size:14px; color:var(--ink2); line-height:1.65; margin-bottom:24px; }

/* ── START CHAPTER ── */
.start-sec {
  background:var(--sun); padding:96px 52px;
  position:relative; overflow:hidden;
}
.start-sec::before {
  content:''; position:absolute; inset:0;
  background-image:radial-gradient(rgba(255,255,255,.12) 1.5px,transparent 1.5px);
  background-size:26px 26px;
}
.start-sec-noise { display:none; }
.start-inner {
  max-width:1100px; margin:0 auto;
  display:grid; grid-template-columns:1fr 1fr;
  gap:80px; align-items:center; position:relative; z-index:1;
}
.start-h2 {
  font-family:'Bricolage Grotesque',sans-serif;
  font-size:clamp(32px,4vw,52px); font-weight:800;
  color:#fff; line-height:1.1; margin-bottom:16px; letter-spacing:-.5px;
}
.start-sub { font-size:16px; color:rgba(255,255,255,.8); line-height:1.75; margin-bottom:32px; }
.benefit-row { display:flex; align-items:center; gap:12px; margin-bottom:14px; color:rgba(255,255,255,.9); font-size:15px; font-weight:500; }
.benefit-icon { font-size:22px; }
.host-card {
  background:#fff; border-radius:24px; padding:36px;
  box-shadow:0 16px 64px rgba(28,25,23,.18);
}
.host-card h3 { font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:800; color:var(--ink); margin-bottom:8px; letter-spacing:-.3px; }
.host-card p { font-size:14px; color:var(--ink2); margin-bottom:26px; line-height:1.65; }

/* ── GALLERY ── */
.gallery-sec { background:var(--paper2); padding:96px 52px; }
.photos-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:56px; }
.photo-item {
  border-radius:18px; overflow:hidden; aspect-ratio:4/3;
  cursor:none; transition:all .3s; position:relative;
  background:var(--paper2); border:1px solid var(--border);
  box-shadow:0 2px 10px rgba(28,25,23,.06);
}
.photo-item:hover { transform:scale(1.025); box-shadow:0 20px 56px rgba(28,25,23,.18); }
.photo-item img { width:100%; height:100%; object-fit:cover; }
.photo-item:nth-child(5n+1) { grid-column:span 2; }
.photo-cap-overlay {
  position:absolute; bottom:0; left:0; right:0; padding:16px;
  background:linear-gradient(to top,rgba(28,25,23,.7),transparent);
  color:#fff; font-size:13px; font-weight:500;
  transform:translateY(100%); transition:transform .3s;
}
.photo-item:hover .photo-cap-overlay { transform:translateY(0); }

/* ── STORIES ── */
.stories-sec { background:var(--honey-lt); padding:96px 52px; }
.stories-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:56px; }
.story-card {
  background:var(--card); border:1.5px solid var(--border2);
  border-radius:22px; padding:30px; transition:all .28s;
  position:relative; overflow:hidden;
  box-shadow:0 2px 12px rgba(28,25,23,.05);
}
.story-card:hover { transform:translateY(-5px); box-shadow:0 18px 48px rgba(28,25,23,.12); }
.story-vibe-tag { font-size:12px; font-weight:700; color:var(--sun); margin-bottom:14px; display:block; }
.story-q { font-family:'Bricolage Grotesque',sans-serif; font-size:17px; font-weight:600; color:var(--ink); line-height:1.55; margin-bottom:16px; font-style:italic; }
.story-author { font-size:12px; color:var(--ink3); letter-spacing:.3px; }
.story-mark { position:absolute; bottom:-16px; right:18px; font-size:110px; color:rgba(255,112,67,.07); font-family:'Bricolage Grotesque',sans-serif; line-height:1; }

/* ── FAQ ── */
.faq-sec { background:var(--paper); padding:96px 52px; }
.faq-list { max-width:780px; margin:56px auto 0; }
.faq-item { border-bottom:1px solid var(--border); }
.faq-q {
  display:flex; justify-content:space-between; align-items:center;
  padding:22px 0; cursor:none; font-size:16px; font-weight:600;
  color:var(--ink); transition:color .2s; gap:16px;
}
.faq-q:hover { color:var(--sun); }
.faq-icon { font-size:22px; color:var(--sun); transition:transform .3s; flex-shrink:0; }
.faq-icon.open { transform:rotate(45deg); }
.faq-a {
  font-size:15px; color:var(--ink2); line-height:1.75;
  padding-bottom:22px; max-height:0; overflow:hidden;
  transition:max-height .38s ease, padding .38s ease;
}
.faq-a.open { max-height:200px; }

/* ── CTA ── */
.cta-sec {
  background:var(--ink); padding:108px 52px;
  text-align:center; position:relative; overflow:hidden;
}
.cta-glow {
  position:absolute; width:560px; height:560px; border-radius:50%;
  background:radial-gradient(circle,rgba(255,112,67,.16),transparent 70%);
  top:50%; left:50%; transform:translate(-50%,-50%);
  animation:blobDrift 10s ease-in-out infinite;
}
.cta-bg-text { position:absolute; font-family:'Bricolage Grotesque',sans-serif; font-size:180px; font-weight:800; color:rgba(255,112,67,.05); top:50%; left:50%; transform:translate(-50%,-50%); white-space:nowrap; pointer-events:none; letter-spacing:-6px; user-select:none; }
.cta-inner { position:relative; z-index:1; }
.cta-h2 {
  font-family:'Bricolage Grotesque',sans-serif;
  font-size:clamp(38px,5.5vw,66px); font-weight:800;
  color:#fff; margin-bottom:16px; line-height:1.05; letter-spacing:-.5px;
}
.cta-sun { color:var(--sun); }
.cta-sub { font-size:17px; color:rgba(255,255,255,.55); max-width:420px; margin:0 auto 48px; line-height:1.7; }
.cta-form { display:flex; gap:10px; max-width:440px; margin:0 auto; }
.cta-inp {
  flex:1; padding:14px 22px; background:rgba(255,255,255,.08);
  border:1.5px solid rgba(255,255,255,.15); border-radius:100px;
  font-family:'Instrument Sans',sans-serif; font-size:15px;
  color:#fff; outline:none; transition:all .2s;
}
.cta-inp::placeholder { color:rgba(255,255,255,.35); }
.cta-inp:focus { border-color:rgba(255,112,67,.5); background:rgba(255,112,67,.08); }

/* ── FOOTER ── */
footer { background:#111; padding:72px 52px 36px; border-top:1px solid rgba(255,255,255,.06); }
.footer-top { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:48px; max-width:1200px; margin:0 auto 56px; }
.footer-brand { font-family:'Bricolage Grotesque',sans-serif; font-size:17px; font-weight:800; color:#fff; display:flex; align-items:center; gap:10px; margin-bottom:12px; letter-spacing:-.2px; }
.footer-p { font-size:13px; color:rgba(255,255,255,.35); line-height:1.75; }
.footer-col-h { font-family:'Bricolage Grotesque',sans-serif; font-size:10px; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,.3); margin-bottom:18px; font-weight:700; }
.footer-col a { display:block; color:rgba(255,255,255,.48); text-decoration:none; font-size:14px; margin-bottom:12px; transition:color .2s; }
.footer-col a:hover { color:var(--sun); }
.footer-bottom { border-top:1px solid rgba(255,255,255,.07); padding-top:24px; display:flex; justify-content:space-between; align-items:center; max-width:1200px; margin:0 auto; }
.footer-copy { font-size:12px; color:rgba(255,255,255,.2); }
.admin-tiny { background:none; border:1px solid rgba(255,255,255,.1); color:rgba(255,255,255,.2); font-family:'Instrument Sans',sans-serif; font-size:11px; padding:7px 16px; border-radius:100px; cursor:none; transition:all .2s; }
.admin-tiny:hover { color:var(--sun); border-color:rgba(255,112,67,.3); }

/* ── MODALS ── */
.modal-bg {
  position:fixed; inset:0; background:rgba(28,25,23,.75);
  z-index:2000; display:flex; align-items:center; justify-content:center;
  padding:20px; backdrop-filter:blur(12px); animation:fadeUp .2s ease;
}
@keyframes fadeUp { from{opacity:0} to{opacity:1} }
.modal-box {
  background:var(--card); border-radius:24px; max-width:540px;
  width:100%; max-height:92vh; overflow-y:auto;
  animation:scaleIn .3s cubic-bezier(.34,1.56,.64,1) both;
  box-shadow:0 24px 80px rgba(28,25,23,.22);
}
@keyframes scaleIn { from{opacity:0;transform:scale(.92) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
.modal-hd { padding:28px 28px 0; display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
.modal-hd-title { font-family:'Bricolage Grotesque',sans-serif; font-size:21px; font-weight:800; color:var(--ink); line-height:1.2; letter-spacing:-.3px; }
.modal-hd-sub { font-size:13px; color:var(--ink2); margin-top:3px; }
.modal-x { background:#F5F0EB; border:none; color:var(--ink2); width:30px; height:30px; border-radius:50%; cursor:none; transition:all .2s; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
.modal-x:hover { background:var(--sun-lt); color:var(--sun); }
.modal-body { padding:0 28px 28px; }
.field { margin-bottom:16px; }
.field label { display:block; font-size:12px; font-weight:700; color:var(--ink); margin-bottom:6px; letter-spacing:.3px; }
.inp { width:100%; padding:12px 16px; background:var(--paper); border:1.5px solid var(--border); border-radius:12px; font-family:'Instrument Sans',sans-serif; font-size:15px; color:var(--ink); outline:none; transition:all .2s; }
.inp:focus { border-color:var(--sun); background:#fff; box-shadow:0 0 0 4px var(--sun-glow); }
.inp::placeholder { color:var(--ink3); }
.inp-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

/* ── PAYMENT / TICKET ── */
.pay-box { background:var(--sun-lt); border:1.5px solid rgba(255,112,67,.2); border-radius:18px; padding:28px; text-align:center; }
.qr-ring { width:180px; height:180px; background:#fff; border-radius:18px; padding:10px; margin:18px auto; border:3px solid var(--sun); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 28px var(--sun-glow); }
.qr-ring img { width:100%; height:100%; }
.ticket-card { background:linear-gradient(135deg,var(--ink),#2C2825); border-radius:20px; padding:28px; color:#fff; position:relative; overflow:hidden; }
.ticket-card::before { content:'OFFLINE VIBES'; position:absolute; font-family:'Bricolage Grotesque',sans-serif; font-size:64px; font-weight:800; opacity:.04; top:50%; left:50%; transform:translate(-50%,-50%); white-space:nowrap; pointer-events:none; }
.ticket-qr { width:138px; height:138px; background:#fff; border-radius:14px; padding:8px; margin:0 auto 18px; }
.ticket-qr img { width:100%; height:100%; }
.ticket-id { font-family:'Bricolage Grotesque',sans-serif; font-size:17px; font-weight:800; color:var(--sun); text-align:center; margin-bottom:14px; letter-spacing:1.5px; }
.ticket-divider { border:none; border-top:1px dashed rgba(255,255,255,.15); margin:14px 0; }
.ticket-row { display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px; }
.ticket-k { color:rgba(255,255,255,.45); }
.ticket-v { font-weight:700; color:#fff; }

/* ── POPUP ── */
.popup-wrap { position:fixed; inset:0; background:rgba(28,25,23,.8); z-index:3000; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(16px); }
.popup-card { background:var(--card); border-radius:26px; max-width:420px; width:100%; padding:42px 38px; text-align:center; position:relative; animation:scaleIn .35s cubic-bezier(.34,1.56,.64,1) both; box-shadow:0 24px 80px rgba(28,25,23,.2); }
.popup-icon { width:72px; height:72px; background:var(--sun-lt); border:2px solid rgba(255,112,67,.2); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:30px; margin:0 auto 20px; }
.popup-h2 { font-family:'Bricolage Grotesque',sans-serif; font-size:24px; font-weight:800; color:var(--ink); margin-bottom:8px; letter-spacing:-.3px; }
.popup-p { font-size:14px; color:var(--ink2); line-height:1.7; margin-bottom:26px; }
.popup-x { position:absolute; top:14px; right:14px; background:#F5F0EB; border:none; color:var(--ink2); width:30px; height:30px; border-radius:50%; cursor:none; display:flex; align-items:center; justify-content:center; font-size:14px; transition:all .2s; }
.popup-x:hover { background:var(--sun-lt); color:var(--sun); }
.popup-skip { margin-top:14px; font-size:12px; color:var(--ink3); cursor:none; background:none; border:none; font-family:'Instrument Sans',sans-serif; transition:color .2s; }
.popup-skip:hover { color:var(--ink2); }
.success-msg { color:var(--grass); font-size:14px; margin-top:10px; font-weight:600; }

/* ── ADMIN LOGIN ── */
.admin-login-wrap { position:fixed; inset:0; background:rgba(28,25,23,.92); z-index:5000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(20px); }
.admin-login-box { background:var(--card); border:1px solid var(--border); border-radius:24px; padding:48px 44px; max-width:400px; width:90%; text-align:center; animation:scaleIn .35s cubic-bezier(.34,1.56,.64,1) both; box-shadow:0 24px 80px rgba(28,25,23,.18); }
.admin-login-icon { font-size:44px; margin-bottom:20px; }
.admin-login-h { font-family:'Bricolage Grotesque',sans-serif; font-size:24px; font-weight:800; color:var(--ink); margin-bottom:6px; letter-spacing:-.3px; }
.admin-login-sub { font-size:13px; color:var(--ink2); margin-bottom:28px; line-height:1.6; }
.admin-login-err { color:#C62828; font-size:13px; margin-top:10px; font-weight:600; }

/* ── ADMIN PANEL ── */
.adm-wrap { position:fixed; inset:0; background:#F8F3EC; z-index:5000; overflow-y:auto; }
.adm-side { position:fixed; top:0; left:0; bottom:0; width:240px; background:var(--ink); z-index:10; display:flex; flex-direction:column; padding:24px 0; }
.adm-logo-box { padding:0 22px 24px; border-bottom:1px solid rgba(255,255,255,.08); }
.adm-logo-txt { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:800; color:#fff; display:flex; align-items:center; gap:8px; letter-spacing:-.2px; }
.adm-logo-sub { font-size:10px; color:rgba(255,255,255,.3); letter-spacing:1px; margin-top:4px; }
.adm-link { display:flex; align-items:center; gap:11px; padding:11px 22px; font-size:13px; font-weight:500; color:rgba(255,255,255,.5); cursor:none; transition:all .2s; border-left:3px solid transparent; }
.adm-link:hover { color:rgba(255,255,255,.85); background:rgba(255,255,255,.04); }
.adm-link.on { color:var(--sun); border-left-color:var(--sun); background:rgba(255,112,67,.08); }
.adm-link-ico { font-size:16px; }
.adm-badge { background:var(--sun); color:#fff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:100px; margin-left:auto; }
.adm-main { margin-left:240px; padding:40px; min-height:100vh; }
.adm-topbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; }
.adm-page-h { font-family:'Bricolage Grotesque',sans-serif; font-size:26px; font-weight:800; color:var(--ink); letter-spacing:-.5px; }
.adm-stat-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:28px; }
.adm-stat { background:var(--card); border:1px solid var(--border2); border-radius:16px; padding:22px 20px; box-shadow:0 1px 8px rgba(28,25,23,.05); }
.adm-stat-ico { font-size:24px; margin-bottom:8px; }
.adm-stat-n { font-family:'Bricolage Grotesque',sans-serif; font-size:38px; font-weight:800; color:var(--sun); line-height:1; }
.adm-stat-l { font-size:11px; color:var(--ink3); font-weight:600; letter-spacing:.5px; margin-top:6px; text-transform:uppercase; }
.adm-card { background:var(--card); border:1px solid var(--border2); border-radius:16px; padding:26px; margin-bottom:20px; box-shadow:0 1px 8px rgba(28,25,23,.05); }
.adm-card-h { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:700; color:var(--ink); margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; letter-spacing:-.2px; }
.adm-tbl { width:100%; border-collapse:collapse; }
.adm-tbl th { text-align:left; padding:9px 14px; font-size:10px; letter-spacing:2px; text-transform:uppercase; color:var(--ink3); border-bottom:1.5px solid var(--border2); font-weight:700; }
.adm-tbl td { padding:14px 14px; font-size:13px; border-bottom:1px solid rgba(28,25,23,.04); vertical-align:middle; color:var(--ink); }
.adm-tbl tr:hover td { background:rgba(255,112,67,.03); }
.adm-tbl tr:last-child td { border-bottom:none; }
.pill { display:inline-flex; align-items:center; padding:3px 10px; border-radius:100px; font-size:10px; font-weight:700; letter-spacing:.3px; }
.pill-pending { background:var(--honey-lt); color:#E65100; border:1px solid rgba(255,179,0,.25); }
.pill-approved { background:var(--grass-lt); color:#1B5E20; border:1px solid rgba(67,160,71,.2); }
.pill-rejected { background:#FFEBEE; color:#C62828; border:1px solid rgba(198,40,40,.15); }
.pill-paid { background:var(--grass-lt); color:#1B5E20; border:1px solid rgba(67,160,71,.2); }
.pill-new { background:var(--lilac-lt); color:#4527A0; border:1px solid rgba(126,87,194,.2); }
.adm-inp { width:100%; padding:10px 14px; background:var(--paper); border:1.5px solid var(--border); border-radius:10px; font-family:'Instrument Sans',sans-serif; font-size:14px; outline:none; transition:all .2s; color:var(--ink); }
.adm-inp:focus { border-color:var(--sun); background:#fff; box-shadow:0 0 0 3px var(--sun-glow); }
.adm-inp::placeholder { color:var(--ink3); }
.adm-ta { width:100%; padding:10px 14px; background:var(--paper); border:1.5px solid var(--border); border-radius:10px; font-family:'Instrument Sans',sans-serif; font-size:14px; outline:none; resize:vertical; min-height:90px; color:var(--ink); transition:all .2s; }
.adm-ta:focus { border-color:var(--sun); }
.adm-2col { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.adm-fg { margin-bottom:14px; }
.adm-lbl { display:block; font-size:11px; font-weight:700; color:var(--ink2); margin-bottom:6px; letter-spacing:.5px; text-transform:uppercase; }
.act-row { display:flex; gap:7px; flex-wrap:wrap; }
.photo-grid-adm { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-top:14px; }
.photo-thumb { aspect-ratio:1; border-radius:12px; overflow:hidden; position:relative; background:var(--paper2); border:1px solid var(--border); }
.photo-thumb img { width:100%; height:100%; object-fit:cover; }
.photo-del { position:absolute; top:5px; right:5px; background:rgba(28,25,23,.75); color:#fff; border:none; border-radius:50%; width:22px; height:22px; font-size:11px; cursor:none; display:flex; align-items:center; justify-content:center; transition:background .2s; }
.photo-del:hover { background:#C62828; }
.msg-ok { background:var(--grass-lt); color:#1B5E20; border:1px solid rgba(67,160,71,.2); padding:12px 16px; border-radius:10px; margin-bottom:14px; font-size:13px; font-weight:600; }
.contact-btn { display:inline-flex; align-items:center; gap:5px; background:var(--grass-lt); color:#1B5E20; border:1px solid rgba(67,160,71,.2); padding:5px 12px; border-radius:100px; font-size:11px; font-weight:700; text-decoration:none; cursor:none; transition:all .2s; }
.contact-btn:hover { background:#C8E6C9; }
.highlight-row td { background:rgba(255,112,67,.04) !important; }

/* ── RESPONSIVE ── */
@media(max-width:1024px) {
  .hero-inner { grid-template-columns:1fr; text-align:center; }
  .hero-visual { display:none; }
  .hero-social-proof, .hero-stats { justify-content:center; }
  .hero-sub { max-width:100%; }
  .exp-grid { grid-template-columns:1fr; }
  .chapters-grid { grid-template-columns:1fr 1fr; }
  .start-inner { grid-template-columns:1fr; gap:40px; }
  .stats-row { grid-template-columns:1fr 1fr; }
  .footer-top { grid-template-columns:1fr 1fr; gap:32px; }
  .stories-grid { grid-template-columns:1fr; }
  .adm-stat-row { grid-template-columns:1fr 1fr; }
}
@media(max-width:768px) {
  .nav { padding:14px 20px; }
  .nav-links { display:none; }
  .cursor, .cursor-ring { display:none; }
  body { cursor:auto; }
  .sec { padding:72px 22px; }
  .stats-strip, .start-sec, .gallery-sec, .stories-sec, .faq-sec, .cta-sec { padding:72px 22px; }
  footer { padding:56px 22px 28px; }
  .events-grid { grid-template-columns:1fr; }
  .chapters-grid { grid-template-columns:1fr; }
  .photos-grid { grid-template-columns:1fr 1fr; }
  .adm-side { display:none; }
  .adm-main { margin-left:0; padding:20px; }
  .adm-2col { grid-template-columns:1fr; }
  .cta-form { flex-direction:column; }
  .events-top { flex-direction:column; align-items:flex-start; gap:14px; }
  .inp-row { grid-template-columns:1fr; }
}
`;

// ─── CURSOR ──────────────────────────────────────────────────
function Cursor() {
  const cursorRef = useRef(null);
  const ringRef = useRef(null);
  useEffect(() => {
    const move = e => {
      if (cursorRef.current) { cursorRef.current.style.left = e.clientX-6+'px'; cursorRef.current.style.top = e.clientY-6+'px'; }
      if (ringRef.current) { ringRef.current.style.left = e.clientX-18+'px'; ringRef.current.style.top = e.clientY-18+'px'; }
    };
    const over = e => { if(e.target.matches('button,a,[class*="card"],[class*="btn"],[class*="ev-"],[class*="ch-"]')) ringRef.current?.classList.add('hover'); };
    const out = () => ringRef.current?.classList.remove('hover');
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', over);
    window.addEventListener('mouseout', out);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseover', over); window.removeEventListener('mouseout', out); };
  }, []);
  return (<><div className="cursor" ref={cursorRef}/><div className="cursor-ring" ref={ringRef}/></>);
}

// ─── FAQ ─────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section className="faq-sec" id="faq">
      <div className="sec-inner">
        <div className="sec-tag">Got Questions</div>
        <h2 className="sec-h2">FAQs</h2>
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <div className="faq-item" key={i}>
              <div className="faq-q" onClick={() => setOpen(open===i?null:i)}>
                <span>{f.q}</span>
                <span className={`faq-icon${open===i?" open":""}`}>+</span>
              </div>
              <div className={`faq-a${open===i?" open":""}`}>{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── POPUP ───────────────────────────────────────────────────
function Popup({ onClose }) {
  const [name,setName]=useState(""); const [phone,setPhone]=useState("");
  const [busy,setBusy]=useState(false); const [done,setDone]=useState(false);
  const submit = async () => {
    if (!phone.trim()) return;
    setBusy(true);
    await fbAdd("leads", { name:name.trim()||"—", phone:phone.trim(), source:"popup", date:nowDate(), time:nowTime() });
    setBusy(false); setDone(true); setTimeout(onClose, 2000);
  };
  return (
    <div className="popup-wrap" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="popup-card">
        <button className="popup-x" onClick={onClose}>✕</button>
        <div className="popup-icon">🌿</div>
        <h2 className="popup-h2">Join the Vibes</h2>
        <p className="popup-p">Real adventures. Real connections. No screens.<br/>Drop your WhatsApp — get invited to events first.</p>
        <div className="field"><input className="inp" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)}/></div>
        <div className="field"><input className="inp" type="tel" placeholder="WhatsApp number" value={phone} onChange={e=>setPhone(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
        <button className="btn btn-sun" style={{width:"100%",justifyContent:"center"}} onClick={submit} disabled={busy||done}>
          {busy?"Saving…":done?"🎉 You're in!":"Join the Community →"}
        </button>
        {done && <p className="success-msg">✅ Saved! Watch your WhatsApp for the first invite.</p>}
        <button className="popup-skip" onClick={onClose}>I'll explore first</button>
      </div>
    </div>
  );
}

// ─── EVENT REGISTER MODAL ────────────────────────────────────
function EventModal({ event, onClose }) {
  const [step,setStep]=useState(1);
  const [f,setF]=useState({name:"",email:"",phone:"",city:""});
  const [busy,setBusy]=useState(false); const [tid,setTid]=useState("");
  const upd = k => e => setF(p=>({...p,[k]:e.target.value}));
  const goPayment = () => {
    if (!f.name||!f.email||!f.phone||!f.city) return alert("Please fill all fields");
    setStep(2);
  };
  const confirmPay = async () => {
    setBusy(true);
    const t = "TOV-"+genId(); setTid(t);
    await fbAdd("registrations", {...f, eventId:event.id, eventTitle:event.title, eventDate:event.date, eventVenue:event.venue, ticketId:t, price:event.price, status:"paid", date:nowDate(), time:nowTime()});
    setBusy(false); setStep(3);
  };
  const qd = step===2
    ? `Pay ₹${event.price} to theofflinevibes@upi | ${f.name} | ${event.title}`
    : `TICKET:${tid}|EVENT:${event.title}|DATE:${event.date}|NAME:${f.name}|PAID:₹${event.price}|STATUS:PAID`;
  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-hd">
          <div>
            <div className="modal-hd-title">{step===1?"Register for Event":step===2?"Complete Payment":"Your Entry Ticket 🎉"}</div>
            <div className="modal-hd-sub">{event.title}</div>
          </div>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {step===1 && <>
            <div className="field"><label>Full Name *</label><input className="inp" placeholder="Your name" value={f.name} onChange={upd("name")}/></div>
            <div className="inp-row">
              <div className="field"><label>Email *</label><input className="inp" type="email" placeholder="you@email.com" value={f.email} onChange={upd("email")}/></div>
              <div className="field"><label>WhatsApp *</label><input className="inp" type="tel" placeholder="98765 43210" value={f.phone} onChange={upd("phone")}/></div>
            </div>
            <div className="field"><label>Your City *</label><input className="inp" placeholder="Surat" value={f.city} onChange={upd("city")}/></div>
            <div style={{background:"var(--sun-lt)",border:"1px solid rgba(255,112,67,.2)",borderRadius:12,padding:16,marginBottom:18}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,color:"var(--ink)"}}><span>{event.title}</span><span style={{color:"var(--sun)"}}>₹{event.price}</span></div>
              <div style={{fontSize:12,color:"var(--ink2)",marginTop:4}}>{event.date} · {event.venue}</div>
            </div>
            <button className="btn btn-sun" style={{width:"100%",justifyContent:"center"}} onClick={goPayment}>Continue to Payment →</button>
          </>}
          {step===2 && <div className="pay-box">
            <div style={{fontFamily:"Unbounded,sans-serif",fontSize:11,fontWeight:700,color:"var(--sun)",letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>Scan & Pay</div>
            <div style={{fontFamily:"Unbounded,sans-serif",fontSize:36,fontWeight:900,color:"var(--sun)",marginBottom:4}}>₹{event.price}</div>
            <div style={{fontSize:13,color:"var(--ink2)",marginBottom:8}}>{event.title}</div>
            <div className="qr-ring"><img src={qrUrl(qd)} alt="Payment QR"/></div>
            <div style={{fontSize:12,color:"var(--ink2)",marginBottom:6}}>UPI: <b style={{color:"var(--sun)"}}>theofflinevibes@upi</b></div>
            <div style={{fontSize:11,color:"var(--ink3)",marginBottom:18,lineHeight:1.5}}>After paying, click the button below to get your entry ticket</div>
            <button className="btn btn-sun" style={{width:"100%",justifyContent:"center"}} onClick={confirmPay} disabled={busy}>{busy?"Generating…":"I've Paid — Get My Ticket →"}</button>
          </div>}
          {step===3 && <>
            <div className="ticket-card">
              <div style={{textAlign:"center",marginBottom:16}}>
                <div style={{fontFamily:"Unbounded,sans-serif",fontSize:11,fontWeight:700,color:"var(--sun)",letterSpacing:2,textTransform:"uppercase"}}>The Offline Vibes</div>
                <div style={{fontSize:10,color:"var(--ink3)",letterSpacing:2}}>ENTRY PASS</div>
              </div>
              <div className="ticket-qr"><img src={qrUrl(qd)} alt="Entry QR"/></div>
              <div className="ticket-id">{tid}</div>
              <div className="ticket-divider"/>
              {[["Event",event.title],["Date",event.date],["Venue",event.venue||"—"],["Name",f.name],["Contact",f.phone],["Paid",`₹${event.price}`],["Status","✅ CONFIRMED"]].map(([k,v])=>(
                <div className="ticket-row" key={k}><span className="ticket-k">{k}</span><span className="ticket-v">{v}</span></div>
              ))}
            </div>
            <div style={{textAlign:"center",marginTop:14,fontSize:12,color:"var(--ink2)",lineHeight:1.6}}>📲 Show this QR at the venue entry. Screenshot it!</div>
            <button className="btn btn-sun" style={{marginTop:18,width:"100%",justifyContent:"center"}} onClick={()=>window.print()}>🖨️ Print / Download Ticket</button>
          </>}
        </div>
      </div>
    </div>
  );
}

// ─── HOST MODAL ───────────────────────────────────────────────
function HostModal({ onClose }) {
  const [f,setF]=useState({name:"",email:"",phone:"",city:"",about:""});
  const [done,setDone]=useState(false);
  const upd = k => e => setF(p=>({...p,[k]:e.target.value}));
  const submit = async () => {
    if (!f.name||!f.phone||!f.email||!f.city) return alert("Please fill all required fields");
    await fbAdd("host_requests",{...f,status:"pending",date:nowDate()});
    setDone(true);
  };
  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-hd"><div className="modal-hd-title">Start a Chapter</div><button className="modal-x" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          {!done ? <>
            <p style={{fontSize:14,color:"var(--ink2)",marginBottom:20,lineHeight:1.65}}>Bring The Offline Vibes to your city. Our team reviews every request and contacts approved hosts personally.</p>
            <div className="inp-row">
              <div className="field"><label>Full Name *</label><input className="inp" placeholder="Your name" value={f.name} onChange={upd("name")}/></div>
              <div className="field"><label>City *</label><input className="inp" placeholder="Your city" value={f.city} onChange={upd("city")}/></div>
            </div>
            <div className="inp-row">
              <div className="field"><label>Email *</label><input className="inp" type="email" placeholder="you@email.com" value={f.email} onChange={upd("email")}/></div>
              <div className="field"><label>WhatsApp *</label><input className="inp" type="tel" placeholder="98765 43210" value={f.phone} onChange={upd("phone")}/></div>
            </div>
            <div className="field"><label>Why do you want to lead? (optional)</label><textarea className="inp" style={{resize:"vertical",minHeight:80}} placeholder="Tell us about yourself…" value={f.about} onChange={upd("about")}/></div>
            <button className="btn btn-sun" style={{width:"100%",justifyContent:"center"}} onClick={submit}>Submit Request →</button>
          </> : <div style={{textAlign:"center",padding:"24px 0"}}>
            <div style={{fontSize:52,marginBottom:14}}>🎉</div>
            <h3 style={{fontFamily:"Unbounded,sans-serif",fontSize:20,fontWeight:900,color:"var(--ink)",marginBottom:8,letterSpacing:"-.5px"}}>Request Sent!</h3>
            <p style={{fontSize:14,color:"var(--ink2)",lineHeight:1.7}}>We got your request for <b style={{color:"var(--ink)"}}>{f.city}</b>. We'll contact you on <b style={{color:"var(--sun)"}}>{f.phone}</b> soon.</p>
            <button className="btn btn-neutral btn-sm" style={{marginTop:20}} onClick={onClose}>Close</button>
          </div>}
        </div>
      </div>
    </div>
  );
}

// ─── CHAPTER LEAD MODAL ───────────────────────────────────────
function ChapterLeadModal({ city, onClose }) {
  const [f,setF]=useState({name:"",email:"",phone:"",city:city||""});
  const [done,setDone]=useState(false);
  const upd = k => e => setF(p=>({...p,[k]:e.target.value}));
  const submit = async () => {
    if (!f.name||!f.phone||!f.email) return alert("Please fill all required fields");
    await fbAdd("chapter_leads",{...f,status:"pending",date:nowDate()});
    setDone(true);
  };
  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-hd"><div className="modal-hd-title">Become Chapter Lead{city?` — ${city}`:""}</div><button className="modal-x" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          {!done ? <>
            <p style={{fontSize:14,color:"var(--ink2)",marginBottom:18,lineHeight:1.65}}>Lead the offline revolution in your city. Build a real tribe — not a following.</p>
            <div className="field"><label>Full Name *</label><input className="inp" placeholder="Your name" value={f.name} onChange={upd("name")}/></div>
            <div className="inp-row">
              <div className="field"><label>Email *</label><input className="inp" type="email" placeholder="you@email.com" value={f.email} onChange={upd("email")}/></div>
              <div className="field"><label>WhatsApp *</label><input className="inp" type="tel" placeholder="98765 43210" value={f.phone} onChange={upd("phone")}/></div>
            </div>
            <div className="field"><label>Your City *</label><input className="inp" placeholder="City" value={f.city} onChange={upd("city")}/></div>
            <button className="btn btn-sun" style={{width:"100%",justifyContent:"center"}} onClick={submit}>Apply as Chapter Lead →</button>
          </> : <div style={{textAlign:"center",padding:20}}>
            <div style={{fontSize:52,marginBottom:12}}>🌿</div>
            <h3 style={{fontFamily:"Unbounded,sans-serif",fontSize:20,fontWeight:900,color:"var(--ink)",marginBottom:8}}>Application Sent!</h3>
            <p style={{fontSize:14,color:"var(--ink2)",lineHeight:1.7}}>We'll reach out on <b style={{color:"var(--sun)"}}>{f.phone}</b> soon.</p>
            <button className="btn btn-neutral btn-sm" style={{marginTop:18}} onClick={onClose}>Close</button>
          </div>}
        </div>
      </div>
    </div>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────────
function Navbar({ onJoin }) {
  const [solid,setSolid]=useState(false);
  useEffect(()=>{ const h=()=>setSolid(window.scrollY>60); window.addEventListener("scroll",h); return()=>window.removeEventListener("scroll",h); },[]);
  const go = id => document.getElementById(id)?.scrollIntoView({behavior:"smooth"});
  return (
    <nav className={`nav${solid?" solid":""}`}>
      <div className="nav-logo"><div className="nav-live-dot"/>The Offline Vibes</div>
      <ul className="nav-links">
        {[["Events","events"],["Experiences","experiences"],["Chapters","chapters"],["Gallery","gallery"],["FAQs","faq"]].map(([l,id])=>(
          <li key={id}><a href="#" onClick={e=>{e.preventDefault();go(id);}}>{l}</a></li>
        ))}
      </ul>
      <button className="nav-cta" onClick={onJoin}>Join Now ✦</button>
    </nav>
  );
}

// ─── HERO ────────────────────────────────────────────────────
function Hero({ onJoin, nextEvent, registrationCount }) {
  const go = id => document.getElementById(id)?.scrollIntoView({behavior:"smooth"});

  // Calculate real spots left
  const totalSpots = nextEvent?.spots ? parseInt(nextEvent.spots) : null;
  const spotsLeft = totalSpots !== null ? Math.max(0, totalSpots - registrationCount) : null;
  const spotsLabel = spotsLeft === null
    ? "Open"
    : spotsLeft === 0
    ? "Sold Out 😢"
    : spotsLeft <= 5
    ? `${spotsLeft} left — hurry!`
    : `${spotsLeft} remaining`;
  const spotsColor = spotsLeft === 0 ? "#ef4444" : spotsLeft !== null && spotsLeft <= 5 ? "#FF7043" : "var(--grass)";
  const spotsIcon = spotsLeft === 0 ? "❌" : spotsLeft !== null && spotsLeft <= 5 ? "🔥" : "✅";

  return (
    <section className="hero">
      <div className="hero-grid"/><div className="hero-glow"/>
      <div className="hero-inner">
        <div>
          <div className="hero-tag"><div className="nav-live-dot"/>Now Live in Surat · Gujarat</div>
          <h1 className="hero-h1">Life hits<br/>different<br/><span className="h1-sun">offline.</span></h1>
          <p className="hero-sub">We curate real experiences — forests, bonfires, silences, strangers worth knowing. Phones go in the box. Life gets extraordinary.</p>
          <div className="hero-btns">
            <button className="btn btn-sun" onClick={()=>go("events")}>Find Events →</button>
            <button className="btn btn-outline-ink" onClick={onJoin}>Join Community</button>
          </div>
          <div className="hero-stats">
            {[["2K+","Members"],["50+","Events Done"],["3","Cities"],["98%","Return Rate"]].map(([n,l])=>(
              <div key={l}><div className="hero-stat-n">{n}</div><div className="hero-stat-l">{l}</div></div>
            ))}
          </div>
        </div>
        <div className="hero-visual">
          {/* ── Right floating card: Phone Status (brand statement) ── */}
          <div className="hero-float-card hfc1">
            <div className="hfc-icon">📱</div>
            <div className="hfc-label">Phone Status</div>
            <div className="hfc-val">In Lockbox 🔒</div>
          </div>

          {/* ── Centre: Phone mockup with REAL next event ── */}
          <div className="hero-phone-mockup">
            <div className="phone-notch"/>
            <div className="phone-screen">
              {nextEvent ? (
                <div className="phone-event-card">
                  <div className="phone-ev-tag">🔥 Next Event</div>
                  <div className="phone-ev-title">{nextEvent.title}</div>
                  <div className="phone-ev-chips">
                    {nextEvent.type && <span className="pchip pchip-sun">{nextEvent.type}</span>}
                    <span className="pchip pchip-coral">No Phones</span>
                    {nextEvent.venue && <span className="pchip pchip-mint">{nextEvent.venue.split(" ")[0]}</span>}
                  </div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginBottom:8}}>
                    {nextEvent.date && <>📅 {nextEvent.date}</>}
                    {nextEvent.venue && <> · 📍 {nextEvent.venue}</>}
                  </div>
                  <div className="phone-ev-price">₹{nextEvent.price}</div>
                  <button className="phone-ev-btn" onClick={()=>go("events")}>Register Now</button>
                </div>
              ) : (
                <div className="phone-event-card">
                  <div className="phone-ev-tag">🌿 Coming Soon</div>
                  <div className="phone-ev-title">Next event being planned</div>
                  <div className="phone-ev-chips">
                    <span className="pchip pchip-sun">No Phones</span>
                    <span className="pchip pchip-coral">Real Vibes</span>
                  </div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginBottom:8}}>Stay tuned · Surat & beyond</div>
                  <div className="phone-ev-price">₹TBA</div>
                  <button className="phone-ev-btn" onClick={()=>go("events")}>See All Events</button>
                </div>
              )}
            </div>
          </div>

          {/* ── Left floating card: REAL spots left ── */}
          <div className="hero-float-card hfc2">
            <div className="hfc-icon">{spotsIcon}</div>
            <div className="hfc-label">
              {nextEvent ? `${nextEvent.title.length > 16 ? nextEvent.title.slice(0,16)+"…" : nextEvent.title}` : "Spots"}
            </div>
            <div className="hfc-sub-label" style={{fontSize:10,color:"var(--ink3)",marginBottom:4,fontWeight:600,letterSpacing:.5,textTransform:"uppercase"}}>
              {totalSpots !== null ? `of ${totalSpots} total` : "Open seats"}
            </div>
            <div className="hfc-val" style={{color:spotsColor}}>{spotsLabel}</div>
            {nextEvent && registrationCount > 0 && (
              <div style={{fontSize:10,color:"var(--ink3)",marginTop:4,fontWeight:500}}>
                {registrationCount} registered so far
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── MARQUEE ────────────────────────────────────────────────
function Marquee() {
  const items = ["Digital Detox","No Phone Zones","Real Connections","Forest Retreats","Bonfire Nights","Sunrise Hikes","Mystery Trips","Offline Living","Café Nights","Tribe Building"];
  return (
    <div className="marquee-wrap">
      <div className="marquee-track">
        {[...items,...items].map((x,i)=><span className="marquee-item" key={i}>{x}<span className="marquee-sep">✦</span></span>)}
      </div>
    </div>
  );
}

// ─── EVENTS ──────────────────────────────────────────────────
function EventsSection({ events }) {
  const [sel,setSel]=useState(null);
  const GRADS=["linear-gradient(135deg,#1a0a0a,#2a1212)","linear-gradient(135deg,#0a1a16,#0d2820)","linear-gradient(135deg,#0e0a1a,#181030)","linear-gradient(135deg,#1a1200,#2a1e00)"];
  return (
    <section className="sec events-sec" id="events">
      <div className="sec-inner">
        <div className="events-top">
          <div>
            <div className="sec-tag">Upcoming Events</div>
            <h2 className="sec-h2">Events Near You</h2>
            <p className="sec-sub">Real experiences. All events posted live by our team — no dummies.</p>
          </div>
        </div>
        {events.length===0 ? (
          <div className="empty-box">
            <div className="empty-emoji">🎪</div>
            <div className="empty-title">No Events Yet</div>
            <div className="empty-sub">Our team is cooking up something epic. Check back soon!</div>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((ev,i)=>(
              <div key={ev.id} className={`ev-card${i===0?" featured":""}`} onClick={()=>setSel(ev)}>
                <div className="ev-card-img" style={{background:ev.color||GRADS[i%GRADS.length]}}>
                  {ev.imageUrl && <img src={ev.imageUrl} alt={ev.title}/>}
                  <div className="ev-card-img-overlay"/>
                  {i===0 && <div className="ev-new-badge">NEW ✦</div>}
                  <div style={{position:"relative",zIndex:2,fontSize:44}}>{!ev.imageUrl && (ev.emoji||"🎉")}</div>
                </div>
                <div className="ev-card-body">
                  <div className="ev-type">{ev.type||"Experience"}</div>
                  <div className="ev-title">{ev.title}</div>
                  <div className="ev-meta">
                    <span>📅 {ev.date}</span>
                    <span>📍 {ev.venue||"—"}</span>
                    <span>👥 {ev.spots||"Limited"} spots</span>
                  </div>
                  <div className="ev-footer">
                    <div className="ev-price">₹{ev.price}<small>/person</small></div>
                    <button className="btn btn-sun btn-sm">Register</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {sel && <EventModal event={sel} onClose={()=>setSel(null)}/>}
    </section>
  );
}

// ─── STATS ───────────────────────────────────────────────────
function Stats() {
  return (
    <section className="stats-strip">
      <div className="stats-row">
        {[["2K+","Community Members"],["50+","Events Hosted"],["3","Cities & Growing"],["98%","Come Back Again"]].map(([n,l])=>(
          <div className="stat-cell" key={l}><div className="stat-n">{n}</div><div className="stat-l">{l}</div></div>
        ))}
      </div>
    </section>
  );
}

// ─── EXPERIENCES ─────────────────────────────────────────────
function Experiences() {
  const BADGE_CLASSES = ["badge-sun","badge-sky","badge-grass","badge-lilac","badge-honey","badge-rose","badge-sky"];
  return (
    <section className="sec exp-sec" id="experiences">
      <div className="sec-inner">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:20}}>
          <div>
            <div className="sec-tag">What We Do</div>
            <h2 className="sec-h2">Curated Offline<br/>Experiences</h2>
          </div>
          <p className="sec-sub" style={{textAlign:"right",maxWidth:260,color:"var(--ink3)"}}>Every event is designed to make you feel something real.</p>
        </div>
        <div className="exp-grid">
          {EXPS.map((e,i)=>(
            <div className="exp-card" key={i}>
              <div className="exp-card-top">
                <div className="exp-icon">{e.icon}</div>
                <span className={`exp-badge ${BADGE_CLASSES[i % BADGE_CLASSES.length]}`}>{e.tag}</span>
              </div>
              <div className="exp-title">{e.title}</div>
              <div className="exp-desc">{e.desc}</div>
              <div className="exp-num">0{i+1}</div>
            </div>
          ))}
        </div>
        <p style={{textAlign:"center",marginTop:32,fontSize:16,color:"var(--ink3)",fontWeight:500,letterSpacing:".2px"}}>✦ And many more exciting events and games.</p>
      </div>
    </section>
  );
}

// ─── CHAPTERS ────────────────────────────────────────────────
function Chapters({ onHost }) {
  const [lead,setLead]=useState(null);
  return (
    <section className="sec chapters-sec" id="chapters">
      <div className="sec-inner">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:20}}>
          <div>
            <div className="sec-tag">Our Chapters</div>
            <h2 className="sec-h2">Find Your Chapter</h2>
            <p className="sec-sub" style={{marginTop:8}}>The Offline Vibes is spreading across Gujarat — one city at a time.</p>
          </div>
          <button className="btn btn-sun" onClick={onHost}>Start a Chapter 🌱</button>
        </div>
        <div className="chapters-grid">
          {CHAPTERS.map((c,i)=>(
            <div key={i} className={`ch-card ${c.status}`}>
              <div className="ch-city-emoji">{c.emoji}</div>
              <div className={`ch-status-badge ${c.status==="founding"?"badge-founding":"badge-soon"}`}>
                <div className={`ch-dot ${c.status==="founding"?"live":"dim"}`}/>
                {c.status==="founding"?"Founding Chapter":"Coming Soon"}
              </div>
              <div className="ch-city-name">{c.city}</div>
              <p className="ch-desc">{c.desc}</p>
              <button className={`btn btn-sm ${c.status==="founding"?"btn-sun":"btn-outline-ink"}`} onClick={()=>setLead(c.city)}>
                {c.status==="founding"?"Join Surat Chapter":`Become Lead — ${c.city}`}
              </button>
            </div>
          ))}
        </div>
      </div>
      {lead && <ChapterLeadModal city={lead} onClose={()=>setLead(null)}/>}
    </section>
  );
}

// ─── START CHAPTER CTA ───────────────────────────────────────
function StartChapterCTA({ onHost }) {
  return (
    <section className="start-sec">
      <div className="start-sec-noise"/>
      <div className="start-inner">
        <div>
          <h2 className="start-h2">Bring The Offline Vibes to Your City</h2>
          <p className="start-sub">Become a Chapter Host. Organise events, build a real community, and lead the offline revolution in your city.</p>
          {[["🎯","Organise offline events in your city"],["🤝","Connect with like-minded humans"],["🌱","Build a real community — not online"],["🏆","Get full support from our core team"]].map(([ico,txt])=>(
            <div className="benefit-row" key={txt}><span className="benefit-icon">{ico}</span><span>{txt}</span></div>
          ))}
        </div>
        <div className="host-card">
          <h3>Register as a Host</h3>
          <p>Your request will be reviewed by our admin team. Once approved, we'll reach out personally to onboard you.</p>
          <button className="btn btn-sun" style={{width:"100%",justifyContent:"center"}} onClick={onHost}>Apply as Chapter Host →</button>
        </div>
      </div>
    </section>
  );
}

// ─── GALLERY ────────────────────────────────────────────────
function Gallery({ photos }) {
  const [lb,setLb]=useState(null);
  return (
    <section className="gallery-sec" id="gallery">
      <div className="sec-inner">
        <div className="sec-tag">Memories</div>
        <h2 className="sec-h2">Events in Photos</h2>
        <p className="sec-sub" style={{marginTop:8}}>Real moments from real events. No filters, no fakes.</p>
        {photos.length===0 ? (
          <div className="empty-box" style={{marginTop:48}}>
            <div className="empty-emoji">📸</div>
            <div className="empty-title">Photos Coming Soon</div>
            <div className="empty-sub">Our admin team will post event photos here after each event.</div>
          </div>
        ) : (
          <div className="photos-grid">
            {photos.map((p,i)=>(
              <div className="photo-item" key={i} onClick={()=>setLb(p)}>
                <img src={p.url} alt={p.caption||""}/>
                {p.caption && <div className="photo-cap-overlay">{p.caption}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      {lb && (
        <div className="modal-bg" onClick={()=>setLb(null)}>
          <div style={{maxWidth:800,width:"90%"}}>
            <img src={lb.url} alt="" style={{width:"100%",borderRadius:16,maxHeight:"80vh",objectFit:"contain"}}/>
            {lb.caption && <div style={{textAlign:"center",color:"var(--ink2)",marginTop:10,fontSize:13}}>{lb.caption}</div>}
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
        <div className="sec-tag">Real Stories</div>
        <h2 className="sec-h2">Moments That Actually Happened</h2>
        <div className="stories-grid">
          {STORIES.map((s,i)=>(
            <div className="story-card" key={i}>
              <div className="story-vibe-tag">{s.tag}</div>
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

// ─── CTA + FOOTER ───────────────────────────────────────────
function CTASection() {
  const [phone,setPhone]=useState(""); const [done,setDone]=useState(false);
  const submit = async () => {
    if (!phone.trim()) return;
    await fbAdd("leads",{phone,name:"—",source:"cta",date:nowDate(),time:nowTime()});
    setDone(true); setPhone("");
  };
  return (
    <section className="cta-sec">
      <div className="cta-bg-text">OFFLINE</div>
      <div className="cta-inner">
        <h2 className="cta-h2">The Next Event<br/>Is <span className="cta-sun">Filling Fast.</span></h2>
        <p className="cta-sub">Join 2,000+ people choosing real life. Early access to every event before it sells out.</p>
        {!done ? (
          <div className="cta-form">
            <input className="cta-inp" type="tel" placeholder="Your WhatsApp number" value={phone} onChange={e=>setPhone(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
            <button className="btn btn-sun" onClick={submit}>Join ✦</button>
          </div>
        ) : <p style={{fontFamily:"Unbounded,sans-serif",fontSize:18,color:"var(--sun)",letterSpacing:"-.3px",fontWeight:700}}>🌿 You're in! Watch your WhatsApp.</p>}
      </div>
    </section>
  );
}

function Footer({ onAdmin }) {
  return (
    <footer>
      <div className="footer-top">
        <div>
          <div className="footer-brand"><div className="nav-live-dot"/>The Offline Vibes</div>
          <p className="footer-p">A lifestyle movement for people choosing real life over screens. Founded in Surat, Gujarat. Built by humans, for humans.</p>
        </div>
        {[["Experiences",["Detox Camps","Café Nights","Road Trips","Premium Retreats"]],["Community",["Membership","WhatsApp Group","Chapters","Host Program"]],["Connect",["Instagram","YouTube","Contact Us","Press"]]].map(([h,links])=>(
          <div key={h}>
            <div className="footer-col-h">{h}</div>
            <div className="footer-col">{links.map(l=><a key={l} href="#">{l}</a>)}</div>
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <p className="footer-copy">© 2025 The Offline Vibes. All rights reserved.</p>
        <button className="admin-tiny" onClick={onAdmin}>⚙ Admin</button>
      </div>
    </footer>
  );
}

// ─── ADMIN LOGIN ─────────────────────────────────────────────
function AdminLogin({ onSuccess, onCancel }) {
  const [pw,setPw]=useState(""); const [err,setErr]=useState("");
  const login = () => {
    if (pw===ADMIN_PASSWORD) { sessionStorage.setItem("tov_admin","1"); onSuccess(); }
    else { setErr("Wrong password. Try again."); setPw(""); }
  };
  return (
    <div className="admin-login-wrap">
      <div className="admin-login-box">
        <div className="admin-login-icon">🔐</div>
        <h2 className="admin-login-h">Admin Access</h2>
        <p className="admin-login-sub">Enter the admin password to access the dashboard.</p>
        <input className="inp" type="password" placeholder="Enter password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} autoFocus/>
        {err && <p className="admin-login-err">{err}</p>}
        <button className="btn btn-sun" style={{width:"100%",justifyContent:"center",marginTop:16}} onClick={login}>Unlock Dashboard →</button>
        <button className="btn btn-neutral btn-sm" style={{width:"100%",justifyContent:"center",marginTop:10}} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ─────────────────────────────────────────────
function AdminPanel({ onClose }) {
  const [tab,setTab]=useState("dashboard");
  const [leads,setLeads]=useState([]);
  const [events,setEvents]=useState([]);
  const [regs,setRegs]=useState([]);
  const [hosts,setHosts]=useState([]);
  const [chLeads,setChLeads]=useState([]);
  const [photos,setPhotos]=useState([]);
  const [loading,setLoading]=useState(true);
  const [newEv,setNewEv]=useState({title:"",date:"",venue:"",price:"",spots:"",type:"",description:"",emoji:"🎉",color:""});
  const [photoUrl,setPhotoUrl]=useState(""); const [photoCap,setPhotoCap]=useState("");
  const [saving,setSaving]=useState(false); const [saveMsg,setSaveMsg]=useState("");

  const load = async () => {
    setLoading(true);
    const [l,e,r,h,cl,p] = await Promise.all([fbGet("leads"),fbGet("events"),fbGet("registrations"),fbGet("host_requests"),fbGet("chapter_leads"),fbGet("photos")]);
    setLeads(l); setEvents(e); setRegs(r); setHosts(h); setChLeads(cl); setPhotos(p);
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);

  const saveEv = async () => {
    if (!newEv.title||!newEv.date||!newEv.price) return alert("Title, date and price required");
    setSaving(true);
    await fbAdd("events",{...newEv,highlighted:true});
    setSaveMsg("✅ Event published! It's now live on the website.");
    setNewEv({title:"",date:"",venue:"",price:"",spots:"",type:"",description:"",emoji:"🎉",color:""});
    await load(); setSaving(false); setTimeout(()=>setSaveMsg(""),4000);
  };
  const delEv = async id => {
    if (!confirm("Delete this event?")) return;
    await fbDelete("events",id); await load();
  };
  const updStatus = async (col,id,status) => { await fbUpdate(col,id,{status}); await load(); };
  const addPhoto = async () => {
    if (!photoUrl.trim()) return alert("Enter a photo URL");
    await fbAdd("photos",{url:photoUrl.trim(),caption:photoCap.trim(),date:nowDate()});
    setPhotoUrl(""); setPhotoCap(""); await load();
  };
  const delPhoto = async id => { await fbDelete("photos",id); await load(); };
  const exportCSV = (data,name) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]).filter(k=>k!=="id"&&k!=="createdAt");
    const csv = [keys.join(","),...data.map(r=>keys.map(k=>`"${r[k]||""}"`).join(","))].join("\n");
    const a = document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download=`${name}.csv`; a.click();
  };
  const logout = () => { sessionStorage.removeItem("tov_admin"); onClose(); };

  const pendingHosts = hosts.filter(h=>h.status==="pending").length;
  const pendingCh = chLeads.filter(c=>c.status==="pending").length;

  const NAV = [
    ["dashboard","📊","Dashboard",0],
    ["leads","👥","Community Leads",leads.length],
    ["events","🎪","Events",0],
    ["registrations","🎫","Registrations",regs.length],
    ["hosts","🌱","Host Requests",pendingHosts],
    ["chapters","🏙️","Chapter Leads",pendingCh],
    ["photos","📸","Gallery",0],
  ];

  return (
    <div className="adm-wrap">
      <div className="adm-side">
        <div className="adm-logo-box">
          <div className="adm-logo-txt"><div className="nav-live-dot"/>Admin Panel</div>
          <div className="adm-logo-sub">The Offline Vibes</div>
        </div>
        <div style={{marginTop:14,flex:1}}>
          {NAV.map(([id,ico,lbl,badge])=>(
            <div key={id} className={`adm-link${tab===id?" on":""}`} onClick={()=>setTab(id)}>
              <span className="adm-link-ico">{ico}</span>
              {lbl}
              {badge>0 && <span className="adm-badge">{badge}</span>}
            </div>
          ))}
        </div>
        <div style={{padding:"16px 18px",borderTop:"1px solid var(--border)",display:"flex",flexDirection:"column",gap:8}}>
          <button className="btn btn-neutral btn-sm" style={{width:"100%",justifyContent:"center",borderRadius:100}} onClick={load}>↻ Refresh</button>
          <button className="btn btn-danger-soft btn-sm" style={{width:"100%",justifyContent:"center",borderRadius:100}} onClick={logout}>🚪 Logout</button>
          <button className="btn btn-neutral btn-sm" style={{width:"100%",justifyContent:"center",borderRadius:100}} onClick={onClose}>← Back to Site</button>
        </div>
      </div>

      <div className="adm-main">
        <div className="adm-topbar">
          <div className="adm-page-h">{NAV.find(n=>n[0]===tab)?.[2]||"Admin"}</div>
          <div style={{fontSize:12,color:"var(--ink3)"}}>Logged in as Admin</div>
        </div>
        {loading && <div style={{textAlign:"center",padding:80,color:"var(--ink2)",fontSize:16}}>Loading…</div>}

        {/* DASHBOARD */}
        {!loading && tab==="dashboard" && <>
          <div className="adm-stat-row">
            {[["🎪",events.length,"Events"],["🎫",regs.length,"Registrations"],["👥",leads.length,"Community Leads"],["🌱",pendingHosts+pendingCh,"Pending"]].map(([ico,n,l])=>(
              <div className="adm-stat" key={l}><div className="adm-stat-ico">{ico}</div><div className="adm-stat-n">{n}</div><div className="adm-stat-l">{l}</div></div>
            ))}
          </div>
          {/* RECENT LEADS — prominently shown */}
          <div className="adm-card">
            <div className="adm-card-h">
              Recent Community Joins
              <button className="btn btn-sm btn-dark" onClick={()=>setTab("leads")}>View All →</button>
            </div>
            {leads.slice(0,5).length===0 ? <p style={{color:"var(--ink3)"}}>No community members yet.</p> : (
              <table className="adm-tbl">
                <thead><tr><th>Name</th><th>WhatsApp</th><th>Source</th><th>Date</th><th>Contact</th></tr></thead>
                <tbody>{leads.slice(0,5).map(l=>(
                  <tr key={l.id} className={l.source==="popup"?"highlight-row":""}>
                    <td style={{fontWeight:700}}>{l.name}</td>
                    <td>{l.phone}</td>
                    <td><span className="pill pill-new">{l.source}</span></td>
                    <td style={{color:"var(--ink3)",fontSize:12}}>{l.date}</td>
                    <td><a className="contact-btn" href={`https://wa.me/91${l.phone?.replace(/\s/g,"")}`} target="_blank" rel="noreferrer">💬 WhatsApp</a></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
          <div className="adm-card">
            <div className="adm-card-h">
              Pending Requests
              <span style={{fontSize:12,color:"var(--ink3)",fontWeight:400}}>{pendingHosts+pendingCh} pending</span>
            </div>
            {pendingHosts+pendingCh===0 ? <p style={{color:"var(--ink3)"}}>No pending requests.</p> : (
              <table className="adm-tbl">
                <thead><tr><th>Name</th><th>City</th><th>WhatsApp</th><th>Type</th><th>Action</th></tr></thead>
                <tbody>
                  {hosts.filter(h=>h.status==="pending").slice(0,3).map(h=>(
                    <tr key={h.id}><td style={{fontWeight:700}}>{h.name}</td><td>{h.city}</td><td>{h.phone}</td><td><span className="pill pill-pending">Host</span></td>
                      <td><div className="act-row"><button className="btn btn-success-soft btn-sm" onClick={()=>updStatus("host_requests",h.id,"approved")}>✓ Approve</button><button className="btn btn-danger-soft btn-sm" onClick={()=>updStatus("host_requests",h.id,"rejected")}>✕ Reject</button></div></td></tr>
                  ))}
                  {chLeads.filter(c=>c.status==="pending").slice(0,3).map(c=>(
                    <tr key={c.id}><td style={{fontWeight:700}}>{c.name}</td><td>{c.city}</td><td>{c.phone}</td><td><span className="pill pill-new">Chapter</span></td>
                      <td><div className="act-row"><button className="btn btn-success-soft btn-sm" onClick={()=>updStatus("chapter_leads",c.id,"approved")}>✓ Approve</button><button className="btn btn-danger-soft btn-sm" onClick={()=>updStatus("chapter_leads",c.id,"rejected")}>✕ Reject</button></div></td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>}

        {/* COMMUNITY LEADS — FULL TABLE */}
        {!loading && tab==="leads" && (
          <div className="adm-card">
            <div className="adm-card-h">
              Community Members ({leads.length})
              <button className="btn btn-sm btn-dark" onClick={()=>exportCSV(leads,"community_leads")}>📥 Export CSV</button>
            </div>
            <p style={{fontSize:13,color:"var(--ink2)",marginBottom:20,lineHeight:1.6}}>
              These are people who joined your WhatsApp community via the popup or footer form. Click the WhatsApp button to contact them directly.
            </p>
            {leads.length===0 ? <p style={{color:"var(--ink3)"}}>No community members yet. Share your website!</p> : (
              <table className="adm-tbl">
                <thead><tr><th>#</th><th>Name</th><th>WhatsApp Number</th><th>Source</th><th>Date</th><th>Time</th><th>Contact</th></tr></thead>
                <tbody>{leads.map((l,i)=>(
                  <tr key={l.id} className={l.source==="popup"?"highlight-row":""}>
                    <td style={{color:"var(--ink3)"}}>{leads.length-i}</td>
                    <td style={{fontWeight:700,color:"var(--ink)"}}>{l.name}</td>
                    <td style={{fontFamily:"monospace",color:"var(--sun)",fontSize:14,letterSpacing:.5}}>{l.phone}</td>
                    <td><span className={`pill ${l.source==="popup"?"pill-paid":"pill-new"}`}>{l.source}</span></td>
                    <td style={{color:"var(--ink3)",fontSize:12}}>{l.date}</td>
                    <td style={{color:"var(--ink3)",fontSize:12}}>{l.time}</td>
                    <td><a className="contact-btn" href={`https://wa.me/91${l.phone?.replace(/[\s\-+]/g,"")}`} target="_blank" rel="noreferrer">💬 Chat</a></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}

        {/* EVENTS */}
        {!loading && tab==="events" && <>
          <div className="adm-card">
            <div className="adm-card-h">Create New Event</div>
            {saveMsg && <div className="msg-ok">{saveMsg}</div>}
            <div className="adm-2col">
              <div className="adm-fg"><label className="adm-lbl">Event Title *</label><input className="adm-inp" placeholder="Forest Detox Camp" value={newEv.title} onChange={e=>setNewEv(p=>({...p,title:e.target.value}))}/></div>
              <div className="adm-fg"><label className="adm-lbl">Event Type</label><input className="adm-inp" placeholder="Detox Camp / Trek / Café Night" value={newEv.type} onChange={e=>setNewEv(p=>({...p,type:e.target.value}))}/></div>
              <div className="adm-fg"><label className="adm-lbl">Date *</label><input className="adm-inp" type="date" value={newEv.date} onChange={e=>setNewEv(p=>({...p,date:e.target.value}))}/></div>
              <div className="adm-fg"><label className="adm-lbl">Venue</label><input className="adm-inp" placeholder="Surat Outskirts" value={newEv.venue} onChange={e=>setNewEv(p=>({...p,venue:e.target.value}))}/></div>
              <div className="adm-fg"><label className="adm-lbl">Price (₹) *</label><input className="adm-inp" type="number" placeholder="2500" value={newEv.price} onChange={e=>setNewEv(p=>({...p,price:e.target.value}))}/></div>
              <div className="adm-fg"><label className="adm-lbl">Spots Available</label><input className="adm-inp" type="number" placeholder="30" value={newEv.spots} onChange={e=>setNewEv(p=>({...p,spots:e.target.value}))}/></div>
              <div className="adm-fg"><label className="adm-lbl">Emoji</label><input className="adm-inp" placeholder="🎉" value={newEv.emoji} onChange={e=>setNewEv(p=>({...p,emoji:e.target.value}))}/></div>
              <div className="adm-fg"><label className="adm-lbl">Card Image URL (optional)</label><input className="adm-inp" placeholder="https://..." value={newEv.imageUrl||""} onChange={e=>setNewEv(p=>({...p,imageUrl:e.target.value}))}/></div>
            </div>
            <div className="adm-fg"><label className="adm-lbl">Description</label><textarea className="adm-ta" placeholder="Event description…" value={newEv.description} onChange={e=>setNewEv(p=>({...p,description:e.target.value}))}/></div>
            <button className="btn btn-sun" onClick={saveEv} disabled={saving}>{saving?"Publishing…":"Publish Event 🎪"}</button>
          </div>
          <div className="adm-card">
            <div className="adm-card-h">All Events <button className="btn btn-sm btn-dark" onClick={()=>exportCSV(events,"events")}>📥 CSV</button></div>
            {events.length===0 ? <p style={{color:"var(--ink3)"}}>No events yet. Create one above!</p> : (
              <table className="adm-tbl">
                <thead><tr><th>Title</th><th>Type</th><th>Date</th><th>Venue</th><th>Price</th><th>Spots</th><th>Action</th></tr></thead>
                <tbody>{events.map(ev=>(
                  <tr key={ev.id}><td style={{fontWeight:700}}>{ev.emoji} {ev.title}</td><td style={{color:"var(--ink3)"}}>{ev.type||"—"}</td><td>{ev.date}</td><td style={{color:"var(--ink3)"}}>{ev.venue||"—"}</td><td style={{color:"var(--sun)",fontWeight:700}}>₹{ev.price}</td><td>{ev.spots||"—"}</td>
                    <td><button className="btn btn-danger-soft btn-sm" onClick={()=>delEv(ev.id)}>Delete</button></td></tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </>}

        {/* REGISTRATIONS */}
        {!loading && tab==="registrations" && (
          <div className="adm-card">
            <div className="adm-card-h">Event Registrations <button className="btn btn-sm btn-dark" onClick={()=>exportCSV(regs,"registrations")}>📥 Export</button></div>
            {regs.length===0 ? <p style={{color:"var(--ink3)"}}>No registrations yet.</p> : (
              <div style={{overflowX:"auto"}}><table className="adm-tbl">
                <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>City</th><th>Event</th><th>Ticket ID</th><th>Price</th><th>Date</th><th>Status</th><th>Contact</th></tr></thead>
                <tbody>{regs.map((r,i)=>(
                  <tr key={r.id}><td style={{color:"var(--ink3)"}}>{regs.length-i}</td><td style={{fontWeight:700}}>{r.name}</td><td style={{color:"var(--ink3)",fontSize:12}}>{r.email}</td><td>{r.phone}</td><td>{r.city}</td><td style={{maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",fontSize:12}}>{r.eventTitle}</td><td style={{fontFamily:"monospace",color:"var(--sun)",fontSize:11}}>{r.ticketId}</td><td style={{color:"var(--sun)",fontWeight:700}}>₹{r.price}</td><td style={{color:"var(--ink3)",fontSize:12}}>{r.date}</td>
                  <td><span className={`pill ${r.status==="paid"?"pill-paid":"pill-pending"}`}>{r.status}</span></td>
                  <td><a className="contact-btn" href={`https://wa.me/91${r.phone?.replace(/[\s\-+]/g,"")}`} target="_blank" rel="noreferrer">💬</a></td></tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        )}

        {/* HOST REQUESTS */}
        {!loading && tab==="hosts" && (
          <div className="adm-card">
            <div className="adm-card-h">Host / Chapter Requests <button className="btn btn-sm btn-dark" onClick={()=>exportCSV(hosts,"host_requests")}>📥 Export</button></div>
            {hosts.length===0 ? <p style={{color:"var(--ink3)"}}>No host requests yet.</p> : (
              <table className="adm-tbl">
                <thead><tr><th>#</th><th>Name</th><th>City</th><th>Email</th><th>Phone</th><th>About</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{hosts.map((h,i)=>(
                  <tr key={h.id}><td style={{color:"var(--ink3)"}}>{i+1}</td><td style={{fontWeight:700}}>{h.name}</td><td>{h.city}</td><td style={{color:"var(--ink3)",fontSize:12}}>{h.email}</td><td>{h.phone}</td><td style={{color:"var(--ink3)",fontSize:12,maxWidth:140}}>{h.about||"—"}</td><td style={{color:"var(--ink3)",fontSize:12}}>{h.date}</td>
                    <td><span className={`pill ${h.status==="approved"?"pill-approved":h.status==="rejected"?"pill-rejected":"pill-pending"}`}>{h.status||"pending"}</span></td>
                    <td>{h.status==="pending"&&<div className="act-row"><button className="btn btn-success-soft btn-sm" onClick={()=>updStatus("host_requests",h.id,"approved")}>✓</button><button className="btn btn-danger-soft btn-sm" onClick={()=>updStatus("host_requests",h.id,"rejected")}>✕</button><a className="contact-btn" href={`https://wa.me/91${h.phone?.replace(/[\s\-+]/g,"")}`} target="_blank" rel="noreferrer">💬</a></div>}</td></tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}

        {/* CHAPTER LEADS */}
        {!loading && tab==="chapters" && (
          <div className="adm-card">
            <div className="adm-card-h">Chapter Lead Applications <button className="btn btn-sm btn-dark" onClick={()=>exportCSV(chLeads,"chapter_leads")}>📥 Export</button></div>
            {chLeads.length===0 ? <p style={{color:"var(--ink3)"}}>No chapter lead applications yet.</p> : (
              <table className="adm-tbl">
                <thead><tr><th>#</th><th>Name</th><th>City</th><th>Email</th><th>Phone</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{chLeads.map((c,i)=>(
                  <tr key={c.id}><td style={{color:"var(--ink3)"}}>{i+1}</td><td style={{fontWeight:700}}>{c.name}</td><td>{c.city}</td><td style={{color:"var(--ink3)",fontSize:12}}>{c.email}</td><td>{c.phone}</td><td style={{color:"var(--ink3)",fontSize:12}}>{c.date}</td>
                    <td><span className={`pill ${c.status==="approved"?"pill-approved":c.status==="rejected"?"pill-rejected":"pill-pending"}`}>{c.status||"pending"}</span></td>
                    <td>{c.status==="pending"&&<div className="act-row"><button className="btn btn-success-soft btn-sm" onClick={()=>updStatus("chapter_leads",c.id,"approved")}>✓</button><button className="btn btn-danger-soft btn-sm" onClick={()=>updStatus("chapter_leads",c.id,"rejected")}>✕</button><a className="contact-btn" href={`https://wa.me/91${c.phone?.replace(/[\s\-+]/g,"")}`} target="_blank" rel="noreferrer">💬</a></div>}</td></tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}

        {/* GALLERY */}
        {!loading && tab==="photos" && <>
          <div className="adm-card">
            <div className="adm-card-h">Add Event Photo</div>
            <div className="adm-fg"><label className="adm-lbl">Photo URL (Imgur, Google Drive public link, etc.)</label><input className="adm-inp" placeholder="https://i.imgur.com/..." value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)}/></div>
            <div className="adm-fg"><label className="adm-lbl">Caption (optional)</label><input className="adm-inp" placeholder="Forest Detox Camp — Nov 2025" value={photoCap} onChange={e=>setPhotoCap(e.target.value)}/></div>
            <button className="btn btn-sun" onClick={addPhoto}>Add to Gallery 📸</button>
          </div>
          <div className="adm-card">
            <div className="adm-card-h">Gallery ({photos.length} photos)</div>
            {photos.length===0 ? <p style={{color:"var(--ink3)"}}>No photos yet.</p> : (
              <div className="photo-grid-adm">
                {photos.map((p,i)=>(
                  <div className="photo-thumb" key={p.id||i}>
                    <img src={p.url} alt={p.caption} onError={e=>e.target.style.display="none"}/>
                    <button className="photo-del" onClick={()=>delPhoto(p.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>}
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function App() {
  const [popup,setPopup]=useState(false);
  const [showAdminLogin,setShowAdminLogin]=useState(false);
  const [showAdmin,setShowAdmin]=useState(false);
  const [host,setHost]=useState(false);
  const [events,setEvents]=useState([]);
  const [photos,setPhotos]=useState([]);
  const [registrations,setRegistrations]=useState([]);

  useEffect(()=>{
    const t = setTimeout(()=>setPopup(true), 1400);
    loadData();
    return ()=>clearTimeout(t);
  },[]);

  const loadData = async () => {
    const [ev,ph,regs] = await Promise.all([fbGet("events"),fbGet("photos"),fbGet("registrations")]);
    setEvents(ev); setPhotos(ph); setRegistrations(regs);
  };

  // Next upcoming event = first in list (newest by createdAt)
  // Filter to find ones with a future date if possible, else just take first
  const nextEvent = events.length > 0 ? events[0] : null;
  const nextEventRegs = nextEvent
    ? registrations.filter(r => r.eventId === nextEvent.id).length
    : 0;

  const handleAdminClick = () => {
    if (sessionStorage.getItem("tov_admin")==="1") setShowAdmin(true);
    else setShowAdminLogin(true);
  };

  return (
    <>
      <style>{STYLES}</style>
      <Cursor/>
      {popup && <Popup onClose={()=>setPopup(false)}/>}
      {showAdminLogin && <AdminLogin onSuccess={()=>{setShowAdminLogin(false);setShowAdmin(true);}} onCancel={()=>setShowAdminLogin(false)}/>}
      {showAdmin && <AdminPanel onClose={()=>{setShowAdmin(false);loadData();}}/>}
      {host && <HostModal onClose={()=>setHost(false)}/>}
      <Navbar onJoin={()=>setPopup(true)}/>
      <Hero onJoin={()=>setPopup(true)} nextEvent={nextEvent} registrationCount={nextEventRegs}/>
      <Marquee/>
      <EventsSection events={events}/>
      <Stats/>
      <Experiences/>
      <Chapters onHost={()=>setHost(true)}/>
      <StartChapterCTA onHost={()=>setHost(true)}/>
      <Gallery photos={photos}/>
      <Stories/>
      <FAQ/>
      <CTASection/>
      <Footer onAdmin={handleAdminClick}/>
    </>
  );
}
