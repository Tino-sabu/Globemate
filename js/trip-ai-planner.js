// ============ AI TRIP PLANNER — fully self-contained (JS-only styles) ============
(function () {
  'use strict';

  const INR = 84; // 1 USD → INR

  /* ──────────────────────────────────────────
     INJECT SCOPED STYLES  (lives only in JS)
  ────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('tap-styles')) return;
    const style = document.createElement('style');
    style.id = 'tap-styles';
    style.textContent = `
    /* === PAGE WRAPPER === */
    #trip-ai-planner-root {
      font-family: 'Inter', -apple-system, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      min-height: 100vh;
      height: 100vh;
      overflow-y: auto;
      padding-bottom: 60px;
    }

    /* === HERO === */
    .tap-page-hero {
      text-align: center;
      padding: 52px 20px 36px;
      position: relative;
      overflow: hidden;
    }
    .tap-page-hero::before {
      content: '';
      position: absolute;
      top: 0; left: 50%;
      transform: translateX(-50%);
      width: 700px; height: 260px;
      background: radial-gradient(ellipse at 50% 0%, rgba(139,92,246,.22) 0%, transparent 70%);
      pointer-events: none;
    }
    .tap-hero-badge {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 6px 18px; border-radius: 100px;
      background: linear-gradient(135deg,rgba(139,92,246,.13),rgba(59,130,246,.13));
      border: 1px solid rgba(139,92,246,.3);
      font-size: .78rem; font-weight: 700; color: #7c3aed;
      margin-bottom: 18px; letter-spacing: .04em;
    }
    .tap-hero-title {
      font-size: 2.6rem; font-weight: 800; color: #0f172a;
      font-family: 'Playfair Display', serif;
      margin-bottom: 10px; line-height: 1.15;
    }
    .tap-hero-title span {
      background: linear-gradient(135deg, #7c3aed, #3b82f6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .tap-hero-sub {
      color: #64748b; font-size: .97rem; max-width: 540px; margin: 0 auto;
    }

    /* === TRIP BAR === */
    .tap-bar {
      display: flex; flex-wrap: wrap; gap: 0;
      background: #fff; border: 1px solid #e2e8f0;
      border-radius: 16px; padding: 14px 24px;
      margin: 0 auto 28px; max-width: 1100px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
    }
    .tap-bar-item {
      display: flex; align-items: center; gap: 10px; flex: 1; min-width: 130px;
    }
    .tap-bar-icon {
      width: 36px; height: 36px; border-radius: 50%;
      background: #eff6ff; color: #3b82f6;
      display: flex; align-items: center; justify-content: center;
      font-size: .88rem; flex-shrink: 0;
    }
    .tap-bar-label { display: block; font-size: .68rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
    .tap-bar-val { display: block; font-size: .88rem; font-weight: 700; color: #0f172a; }
    .tap-bar-sep { width: 1px; height: 38px; background: #e2e8f0; margin: 0 14px; flex-shrink: 0; }

    /* === LAYOUT === */
    .tap-layout {
      display: grid; grid-template-columns: 400px 1fr;
      gap: 24px; max-width: 1100px; margin: 0 auto;
      padding: 0 20px;
    }

    /* === CHAT CARD === */
    .tap-chat-card {
      background: #fff; border: 1px solid #e2e8f0;
      border-radius: 18px; box-shadow: 0 4px 16px rgba(0,0,0,.07);
      display: flex; flex-direction: column;
      overflow: hidden; position: sticky; top: 78px;
      max-height: calc(100vh - 120px);
    }
    .tap-chat-top {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 18px;
      background: linear-gradient(135deg, #1e1b4b, #2e1065);
    }
    .tap-ai-ball {
      width: 44px; height: 44px; border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed, #3b82f6);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 1.1rem; flex-shrink: 0;
      box-shadow: 0 0 0 4px rgba(139,92,246,.25);
      animation: tapBeat 2.2s infinite;
    }
    @keyframes tapBeat {
      0%,100% { box-shadow: 0 0 0 4px rgba(139,92,246,.25); }
      50% { box-shadow: 0 0 0 9px rgba(139,92,246,.06); }
    }
    .tap-chat-meta h3 { font-size: .95rem; font-weight: 700; color: #fff; margin-bottom: 2px; }
    .tap-chat-meta span { font-size: .72rem; color: #86efac; display: flex; align-items: center; gap: 5px; }
    .tap-chat-meta span::before { content: '●'; font-size: .55rem; }
    .tap-restart {
      margin-left: auto; display: flex; align-items: center; gap: 5px;
      padding: 6px 12px; border-radius: 8px;
      background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
      color: #fff; font-size: .78rem; cursor: pointer; font-family: inherit;
      transition: background .2s;
    }
    .tap-restart:hover { background: rgba(255,255,255,.22); }

    /* messages */
    .tap-msgs {
      flex: 1; overflow-y: auto; padding: 18px 14px;
      display: flex; flex-direction: column; gap: 12px;
      min-height: 260px; max-height: 380px;
    }
    .tap-msg { display: flex; gap: 9px; align-items: flex-end; opacity: 0; transform: translateY(7px); transition: opacity .28s, transform .28s; }
    .tap-msg.show { opacity: 1; transform: none; }
    .tap-msg-ai { flex-direction: row; }
    .tap-msg-user { flex-direction: row-reverse; }
    .tap-av {
      width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: .78rem;
    }
    .tap-av-ai { background: linear-gradient(135deg,#7c3aed,#3b82f6); color: #fff; }
    .tap-av-user { background: #e2e8f0; color: #64748b; }
    .tap-bubble {
      max-width: 270px; padding: 10px 14px; border-radius: 16px 16px 16px 4px;
      font-size: .86rem; line-height: 1.55; background: #f1f5f9;
      border: 1px solid #e2e8f0; color: #0f172a;
    }
    .tap-bubble-user {
      background: linear-gradient(135deg,#7c3aed,#3b82f6) !important;
      color: #fff !important; border: none !important;
      border-radius: 16px 16px 4px 16px !important;
    }
    /* typing dots */
    .tap-typing-wrap { display: flex; gap: 5px; align-items: center; padding: 4px 2px; }
    .tap-dot { width: 7px; height: 7px; background: #94a3b8; border-radius: 50%; animation: tapDot 1.3s infinite; }
    .tap-dot:nth-child(2) { animation-delay: .2s; }
    .tap-dot:nth-child(3) { animation-delay: .4s; }
    @keyframes tapDot { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

    /* chips */
    .tap-chips-area { padding: 8px 14px 6px; border-top: 1px solid #f1f5f9; background: #f8fafc; }
    .tap-chips-inner { display: flex; flex-wrap: wrap; gap: 7px; }
    .tap-chip {
      padding: 6px 13px; border-radius: 100px;
      border: 1.5px solid #cbd5e1; background: #fff;
      color: #334155; font-size: .8rem; font-weight: 500;
      cursor: pointer; transition: all .2s; font-family: inherit;
    }
    .tap-chip:hover { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }
    .tap-chip.on { border-color: #7c3aed; color: #7c3aed; background: rgba(124,58,237,.08); }
    .tap-chip-ok {
      border-color: #7c3aed !important; color: #fff !important;
      background: linear-gradient(135deg,#7c3aed,#3b82f6) !important;
    }

    /* input row */
    .tap-input-row { padding: 10px 14px; border-top: 1px solid #e2e8f0; display: flex; gap: 8px; }
    .tap-txt {
      flex: 1; padding: 10px 13px; border-radius: 10px;
      border: 1.5px solid #cbd5e1; font-size: .87rem;
      color: #0f172a; background: #f8fafc; outline: none; font-family: inherit;
      transition: border-color .2s;
    }
    .tap-txt:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
    .tap-send {
      width: 40px; height: 40px; border-radius: 10px;
      background: linear-gradient(135deg,#7c3aed,#3b82f6); border: none;
      color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
      font-size: .9rem; transition: transform .15s;
    }
    .tap-send:hover { transform: scale(1.07); }

    /* === RIGHT COLUMN === */
    .tap-right { display: flex; flex-direction: column; gap: 20px; }

    /* progress card */
    .tap-prog-card {
      background: #fff; border: 1px solid #e2e8f0;
      border-radius: 16px; padding: 20px 22px;
      box-shadow: 0 1px 4px rgba(0,0,0,.05);
    }
    .tap-prog-head { font-weight: 700; color: #0f172a; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; font-size: .92rem; }
    .tap-prog-head i { color: #3b82f6; }
    .tap-prog-row { display: grid; grid-template-columns: 12px 1fr auto; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid #f1f5f9; }
    .tap-prog-row:last-child { border-bottom: none; }
    .tap-prog-dot { width: 10px; height: 10px; border-radius: 50%; background: #cbd5e1; transition: background .3s, box-shadow .3s; }
    .tap-prog-dot.done { background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,.4); }
    .tap-prog-lbl { font-size: .84rem; color: #64748b; }
    .tap-prog-val { font-size: .8rem; font-weight: 700; color: #0f172a; text-align: right; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* === COUNTDOWN === */
    .tap-countdown-card {
      background: linear-gradient(135deg,#1e1b4b,#2e1065);
      border-radius: 18px; padding: 36px 28px;
      text-align: center; color: #fff;
      box-shadow: 0 8px 32px rgba(139,92,246,.25);
    }
    .tap-cd-ring {
      width: 110px; height: 110px; margin: 0 auto 20px;
      position: relative; display: flex; align-items: center; justify-content: center;
    }
    .tap-cd-ring svg { position: absolute; top: 0; left: 0; transform: rotate(-90deg); }
    .tap-cd-ring circle { fill: none; stroke-width: 6; }
    .tap-cd-bg { stroke: rgba(255,255,255,.12); }
    .tap-cd-fill {
      stroke: url(#tapGrad);
      stroke-linecap: round;
      stroke-dasharray: 283;
      stroke-dashoffset: 0;
      transition: stroke-dashoffset 1s linear;
    }
    .tap-cd-num { font-size: 2.5rem; font-weight: 800; color: #fff; position: relative; z-index: 1; }
    .tap-cd-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
    .tap-cd-sub { font-size: .82rem; color: rgba(255,255,255,.6); }
    .tap-cd-steps { margin-top: 20px; display: flex; flex-direction: column; gap: 8px; text-align: left; }
    .tap-cd-step { display: flex; align-items: center; gap: 10px; font-size: .82rem; color: rgba(255,255,255,.5); }
    .tap-cd-step.lit { color: rgba(255,255,255,.9); }
    .tap-cd-step.lit .tap-cd-step-dot { background: #7c3aed; box-shadow: 0 0 8px rgba(124,58,237,.6); }
    .tap-cd-step-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.2); flex-shrink: 0; transition: all .4s; }

    /* === ITINERARY CARD === */
    .tap-itin-card {
      background: #fff; border: 1px solid #e2e8f0;
      border-radius: 18px; overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,.07);
    }
    .tap-itin-head {
      display: flex; align-items: center; gap: 14px;
      padding: 20px 24px; border-bottom: 1px solid #e2e8f0;
      background: linear-gradient(135deg,#f8fafc,#eff6ff);
    }
    .tap-itin-icon {
      width: 50px; height: 50px; border-radius: 14px;
      background: linear-gradient(135deg,#7c3aed,#3b82f6);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 1.3rem; flex-shrink: 0;
    }
    .tap-itin-head h3 { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-bottom: 3px; }
    .tap-itin-head p { font-size: .78rem; color: #64748b; }
    .tap-itin-btns { margin-left: auto; display: flex; gap: 8px; }
    .tap-btn-sm {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: 9px;
      border: 1.5px solid #cbd5e1; background: #fff;
      color: #64748b; font-size: .8rem; font-weight: 600;
      cursor: pointer; transition: all .2s; font-family: inherit;
    }
    .tap-btn-sm:hover { border-color: #3b82f6; color: #3b82f6; }
    .tap-btn-save {
      background: linear-gradient(135deg,#7c3aed,#3b82f6) !important;
      border-color: transparent !important; color: #fff !important;
    }
    .tap-btn-save:hover { opacity: .88; transform: scale(1.03); }
    .tap-itin-body { padding: 24px; }

    /* overview rows */
    .tap-overview {
      display: grid; grid-template-columns: repeat(auto-fill,minmax(140px,1fr)); gap: 12px;
      background: linear-gradient(135deg,#0f172a,#1e1b4b);
      border-radius: 14px; padding: 20px; margin-bottom: 22px;
    }
    .tap-ov-item { display: flex; align-items: center; gap: 9px; }
    .tap-ov-item i { font-size: 1.1rem; color: rgba(139,92,246,.8); }
    .tap-ov-item small { display: block; font-size: .65rem; color: rgba(255,255,255,.45); text-transform: uppercase; letter-spacing: .06em; }
    .tap-ov-item strong { display: block; font-size: .86rem; font-weight: 700; color: #fff; }

    /* quick-info pills */
    .tap-pills { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 22px; }
    .tap-pill {
      display: flex; align-items: center; gap: 6px;
      padding: 5px 12px; border-radius: 100px;
      background: rgba(59,130,246,.07); border: 1px solid rgba(59,130,246,.2);
      color: #2563eb; font-size: .76rem; font-weight: 600;
    }

    /* section labels */
    .tap-sec-label {
      display: flex; align-items: center; gap: 8px;
      font-weight: 800; font-size: .92rem; color: #0f172a;
      padding-bottom: 10px; border-bottom: 2px solid #f1f5f9;
      margin: 26px 0 14px;
    }
    .tap-sec-label i { color: #7c3aed; }

    /* budget grid */
    .tap-budget-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(170px,1fr)); gap: 10px; margin-bottom: 6px; }
    .tap-b-item {
      display: flex; align-items: center; gap: 11px;
      padding: 12px 13px; border-radius: 12px;
      border: 1px solid #e2e8f0; background: #f8fafc;
    }
    .tap-b-icon {
      width: 36px; height: 36px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: .88rem; flex-shrink: 0;
    }
    .tap-b-cat { display: block; font-size: .72rem; color: #64748b; }
    .tap-b-amt { display: block; font-size: .95rem; font-weight: 800; color: #0f172a; }
    .tap-b-total {
      grid-column: 1/-1; display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-radius: 12px;
      background: linear-gradient(135deg,#7c3aed,#3b82f6); color: #fff;
      font-size: .92rem; font-weight: 700;
    }
    .tap-b-total strong { font-size: 1.25rem; }

    /* day cards */
    .tap-days { display: flex; flex-direction: column; gap: 16px; }
    .tap-day {
      border: 1px solid #e2e8f0; border-radius: 14px;
      overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.04);
    }
    .tap-day-hdr {
      display: flex; align-items: center; gap: 12px;
      padding: 13px 17px; background: linear-gradient(135deg,#f8fafc,#eff6ff);
      border-bottom: 1px solid #e2e8f0;
    }
    .tap-day-num {
      padding: 4px 11px; border-radius: 100px;
      background: linear-gradient(135deg,#7c3aed,#3b82f6);
      color: #fff; font-size: .74rem; font-weight: 800; flex-shrink: 0;
    }
    .tap-day-ti { font-weight: 700; color: #0f172a; flex: 1; font-size: .9rem; }
    .tap-day-dt { font-size: .76rem; color: #94a3b8; }
    .tap-day-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 9px; }
    .tap-slot { display: flex; gap: 12px; }
    .tap-slot-tag {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 9px; border-radius: 6px; font-size: .72rem; font-weight: 700;
      flex-shrink: 0; width: 96px;
    }
    .morning { background: rgba(245,158,11,.1); color: #b45309; }
    .afternoon { background: rgba(59,130,246,.1); color: #1d4ed8; }
    .evening { background: rgba(139,92,246,.1); color: #7c3aed; }
    .tap-slot-act { font-size: .875rem; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
    .tap-slot-det { font-size: .82rem; color: #64748b; margin-bottom: 2px; }
    .tap-slot-tip { font-size: .78rem; color: #3b82f6; display: flex; align-items: flex-start; gap: 4px; }
    .tap-day-stay {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 15px; background: rgba(59,130,246,.04);
      border-top: 1px solid #f1f5f9; font-size: .8rem; color: #64748b;
    }
    .tap-day-stay i { color: #3b82f6; }
    .tap-day-stay strong { color: #0f172a; }
    .tap-day-stay-price { margin-left: auto; color: #10b981; font-weight: 700; }

    /* food/highlights/packing */
    .tap-food-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(130px,1fr)); gap: 9px; }
    .tap-food-item {
      display: flex; align-items: center; gap: 7px;
      padding: 9px 11px; border-radius: 10px;
      background: rgba(245,158,11,.06); border: 1px solid rgba(245,158,11,.18);
      font-size: .8rem; font-weight: 600; color: #0f172a;
    }
    .tap-food-item i { color: #f59e0b; }
    .tap-hl-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
    .tap-hl-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 5px 13px; border-radius: 100px;
      background: rgba(124,58,237,.06); border: 1px solid rgba(124,58,237,.2);
      font-size: .8rem; font-weight: 600; color: #0f172a;
    }
    .tap-hl-n {
      width: 18px; height: 18px; border-radius: 50%;
      background: #7c3aed; color: #fff;
      font-size: .62rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .tap-pack-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(195px,1fr)); gap: 7px; }
    .tap-pack-item {
      display: flex; align-items: center; gap: 7px;
      padding: 8px 11px; border-radius: 9px;
      background: rgba(16,185,129,.05); border: 1px solid rgba(16,185,129,.18);
      font-size: .8rem; color: #0f172a;
    }
    .tap-pack-item i { color: #10b981; font-size: .78rem; }
    .tap-tips-ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .tap-tips-ul li {
      display: flex; align-items: flex-start; gap: 9px;
      padding: 9px 13px; border-radius: 9px;
      background: #f8fafc; border: 1px solid #e2e8f0;
      font-size: .86rem; color: #0f172a;
    }
    .tap-tips-ul li i { color: #f59e0b; margin-top: 2px; flex-shrink: 0; }

    /* back bar */
    .tap-back-bar { display: flex; justify-content: center; align-items: center; gap: 10px; flex-wrap: wrap; padding: 26px 20px 0; }
    .tap-back-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 22px; border-radius: 10px;
      background: #fff; border: 1.5px solid #cbd5e1;
      color: #64748b; font-size: .88rem; font-weight: 700;
      cursor: pointer; transition: all .2s; font-family: inherit;
    }
    .tap-back-btn:hover { border-color: #3b82f6; color: #3b82f6; }

    /* saved-trip-item hook */
    .saved-trip-item { cursor: pointer; }
    .saved-trip-item:hover { background: #eff6ff !important; border-color: #3b82f6 !important; }
    .tap-plan-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px; border-radius: 100px;
      background: linear-gradient(135deg,rgba(139,92,246,.13),rgba(59,130,246,.13));
      border: 1px solid rgba(139,92,246,.28);
      font-size: .68rem; font-weight: 700; color: #6d28d9; margin-left: 6px;
    }

    /* slot items (multiple activities per time slot) */
    .tap-slot-items { display: flex; flex-direction: column; gap: 5px; flex: 1; }
    .tap-slot-item {
      display: flex; align-items: flex-start; gap: 8px;
      font-size: .84rem; color: #0f172a; line-height: 1.5;
      padding: 4px 0;
    }
    .tap-slot-item i {
      color: #7c3aed; font-size: .65rem; margin-top: 5px; flex-shrink: 0;
    }

    /* day options (alternative plans) */
    .tap-day-options {
      padding: 16px 18px;
      display: flex; flex-direction: column; gap: 14px;
    }
    .tap-option {
      border: 1.5px solid #e2e8f0; border-radius: 12px;
      overflow: hidden; background: #f8fafc;
      transition: border-color .2s;
    }
    .tap-option:hover { border-color: #7c3aed; }
    .tap-option-header {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px;
      background: linear-gradient(135deg, rgba(124,58,237,.06), rgba(59,130,246,.06));
      border-bottom: 1px solid #e2e8f0;
      font-weight: 700; font-size: .9rem; color: #1e1b4b;
    }
    .tap-option-emoji { font-size: 1.2rem; }
    .tap-option-label { font-weight: 700; }
    .tap-option-items {
      padding: 12px 16px;
      display: flex; flex-direction: column; gap: 6px;
    }
    .tap-option-divider {
      display: flex; align-items: center; justify-content: center;
      gap: 12px; color: #94a3b8; font-size: .82rem; font-weight: 700;
      padding: 2px 0;
    }
    .tap-option-divider::before,
    .tap-option-divider::after {
      content: ''; flex: 1; height: 1px; background: #e2e8f0;
    }

    /* departure-specific travel tips */
    .tap-route-card {
      background: linear-gradient(135deg, #eff6ff, #f0fdf4);
      border: 1.5px solid #bfdbfe;
      border-radius: 14px; padding: 20px 22px;
      margin-bottom: 14px;
    }
    .tap-route-title {
      display: flex; align-items: center; gap: 8px;
      font-weight: 800; font-size: .95rem; color: #1e40af;
      margin-bottom: 14px;
    }
    .tap-route-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 10px;
    }
    .tap-route-item {
      display: flex; align-items: flex-start; gap: 9px;
      padding: 10px 13px; border-radius: 10px;
      background: #fff; border: 1px solid #e2e8f0;
      font-size: .84rem; color: #0f172a;
    }
    .tap-route-item i { color: #3b82f6; margin-top: 2px; flex-shrink: 0; }
    .tap-route-item strong { color: #1e1b4b; }

    /* responsive */
    @media (max-width: 900px) {
      .tap-layout { grid-template-columns: 1fr; }
      .tap-chat-card { position: static; max-height: 520px; }
      .tap-hero-title { font-size: 1.85rem; }
    }
    @media (max-width: 580px) {
      .tap-bar-sep { display: none; }
      .tap-bar { gap: 12px; }
      .tap-budget-grid { grid-template-columns: 1fr 1fr; }
      .tap-slot { flex-direction: column; gap: 5px; }
      .tap-slot-tag { width: auto; }
      .tap-itin-btns { flex-wrap: wrap; }
      .tap-route-grid { grid-template-columns: 1fr; }
    }
    `;
    document.head.appendChild(style);
  }

  /* ──────────────────────────────────────────
     KNOWLEDGE BASE
  ────────────────────────────────────────── */
  const DB = {
    france: {
      currency:'EUR (Euro)', visa:'Schengen Visa', language:'French',
      tz:'CET (UTC+1)', plug:'Type C/E', sos:'112',
      best:'April–June & Sep–Oct',
      places:['Eiffel Tower','Louvre Museum','Palace of Versailles','Mont Saint-Michel','French Riviera','Provence Lavender Fields','Bordeaux Wine Country','Chamonix Alps','Loire Valley Châteaux'],
      food:['Croissants & Baguettes','Coq au Vin','Crêpes','French Onion Soup','Ratatouille','Crème Brûlée','Bouillabaisse','Foie Gras'],
    },
    usa: {
      currency:'USD', visa:'ESTA / B1-B2 Visa', language:'English',
      tz:'EST/CST/PST (multiple)', plug:'Type A/B', sos:'911',
      best:'April–June & Sep–Nov',
      places:['Statue of Liberty','Grand Canyon','Yellowstone','Times Square','Golden Gate Bridge','Walt Disney World','Las Vegas Strip','Niagara Falls'],
      food:['BBQ Ribs','Clam Chowder','Deep-dish Pizza','Lobster Rolls','Philly Cheesesteak','Tex-Mex','Buffalo Wings','Key Lime Pie'],
    },
    japan: {
      currency:'JPY (Yen)', visa:'Visa-free (most passports)', language:'Japanese',
      tz:'JST (UTC+9)', plug:'Type A/B', sos:'110 / 119',
      best:'Mar–May & Oct–Dec',
      places:['Mount Fuji','Fushimi Inari Shrine','Hiroshima Memorial','Arashiyama Bamboo Forest','Tokyo Skytree','Nara Deer Park','Osaka Castle','Kyoto Temples'],
      food:['Sushi & Sashimi','Ramen','Tempura','Takoyaki','Wagyu Beef','Matcha Sweets','Yakitori','Onigiri'],
    },
    italy: {
      currency:'EUR (Euro)', visa:'Schengen Visa', language:'Italian',
      tz:'CET (UTC+1)', plug:'Type C/F', sos:'112',
      best:'April–June & Sep–Oct',
      places:['Colosseum','Venice Canals','Amalfi Coast','Tuscany Hills','Vatican Museums','Pompeii Ruins','Cinque Terre','Lake Como'],
      food:['Neapolitan Pizza','Pasta Carbonara','Gelato','Risotto','Tiramisu','Bruschetta','Osso Buco','Cannoli'],
    },
    thailand: {
      currency:'THB (Thai Baht)', visa:'Visa-on-Arrival / e-Visa', language:'Thai',
      tz:'ICT (UTC+7)', plug:'Type A/B/C', sos:'191',
      best:'November–February',
      places:['Grand Palace','Phi Phi Islands','Chiang Mai Temples','Floating Markets','Elephant Sanctuary','Muay Thai Show','Pai Canyon','Railay Beach'],
      food:['Pad Thai','Tom Yum','Som Tum','Massaman Curry','Mango Sticky Rice','Green Curry','Khao Pad','Larb'],
    },
    uk: {
      currency:'GBP', visa:'UK Standard Visitor Visa', language:'English',
      tz:'GMT / BST (UTC+0/+1)', plug:'Type G', sos:'999',
      best:'May–September',
      places:['Big Ben & Parliament','Tower of London','Buckingham Palace','Stonehenge','Edinburgh Castle','Lake District','Oxford University','Cotswolds Villages'],
      food:['Fish & Chips','Full English Breakfast','Shepherd\'s Pie','Afternoon Tea','Sticky Toffee Pudding','Cornish Pasty','Haggis','Sunday Roast'],
    },
    germany: {
      currency:'EUR (Euro)', visa:'Schengen Visa', language:'German',
      tz:'CET (UTC+1)', plug:'Type C/F', sos:'112',
      best:'May–September',
      places:['Neuschwanstein Castle','Brandenburg Gate','Cologne Cathedral','Black Forest','Romantic Road','Oktoberfest Grounds','Heidelberg Old Town','Rhine Valley'],
      food:['Bratwurst','Pretzels','Schnitzel','Sauerkraut','Black Forest Cake','Currywurst','Strudel','Weisswurst'],
    },
    singapore: {
      currency:'SGD', visa:'Visa-free (most passports)', language:'English / Malay / Tamil / Mandarin',
      tz:'SGT (UTC+8)', plug:'Type G', sos:'999',
      best:'February–April',
      places:['Marina Bay Sands','Gardens by the Bay','Sentosa Island','Universal Studios','Merlion Park','Chinatown','Little India','Clarke Quay'],
      food:['Hainanese Chicken Rice','Laksa','Chilli Crab','Char Kway Teow','Nasi Lemak','Satay','Kaya Toast','Durian'],
    },
    uae: {
      currency:'AED', visa:'Visa-on-Arrival (many passports)', language:'Arabic / English',
      tz:'GST (UTC+4)', plug:'Type G', sos:'999',
      best:'October–April',
      places:['Burj Khalifa','Dubai Mall','Sheikh Zayed Mosque','Palm Jumeirah','Desert Safari','Burj Al Arab','Old Dubai Souks','Ferrari World Abu Dhabi'],
      food:['Shawarma','Hummus & Flatbread','Lamb Machboos','Al Harees','Luqaimat','Camel Milk Chocolate','Kunafa','Mixed Grill'],
    },
    default: {
      currency:'Local currency', visa:'Check your embassy', language:'Local language',
      tz:'Local timezone', plug:'Universal adapter recommended', sos:'112',
      best:'Check seasonal guides',
      places:['Historic Landmarks','Local Markets','Cultural Centres','National Parks','Waterfronts','Museums','Hill Stations','Nature Reserves'],
      food:['Local Street Food','Traditional Dishes','Regional Specialties','Fresh Market Produce','Popular Desserts'],
    }
  };

  /* ──────────────────────────────────────────
     DETAILED DAY-BY-DAY ITINERARIES
  ────────────────────────────────────────── */
  const DETAILED_DAYS = {
    france: [
      {
        title: 'Arrival in Paris (Iconic Landmarks)',
        emoji: '🌅',
        slots: [
          { period: 'afternoon', emoji: '🌅', label: 'Afternoon', items: ['Check into hotel & freshen up', 'Visit the Eiffel Tower — go up for panoramic views', 'Walk around Trocadéro Gardens for the classic photo spot'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Seine River Cruise — see illuminated Paris from the water', 'Dinner near the Latin Quarter (try: ratatouille, French onion soup, crème brûlée)'] }
        ],
        stay: true
      },
      {
        title: 'Art, History & Romance',
        emoji: '🖼️',
        slots: [
          { period: 'morning', emoji: '🎨', label: 'Morning', items: ['Explore the Louvre Museum (book timed-entry ticket)', 'See the Mona Lisa, Venus de Milo & Winged Victory', 'Stroll through the Tuileries Garden'] },
          { period: 'afternoon', emoji: '🌆', label: 'Afternoon', items: ['Walk through the Montmartre neighbourhood', 'Visit Sacré-Cœur Basilica — stunning city views from the steps', 'Enjoy café hopping & watch street artists at Place du Tertre'] }
        ],
        stay: true
      },
      {
        title: 'Royal Day Trip',
        emoji: '👑',
        options: [
          { label: 'Option A: Palace of Versailles', emoji: '🏰', items: ['Take the RER C train to Versailles (~40 min)', 'Explore the Hall of Mirrors & Royal Apartments', 'Wander the stunning Royal Gardens', 'Rent a bike or golf cart to explore the Grand Trianon'] },
          { label: 'Option B: Disneyland Paris', emoji: '🎢', items: ['Take the RER A to Marne-la-Vallée (~45 min)', 'Perfect if traveling with family or kids', 'Enjoy rides, parades & character meet-and-greets', 'Stay for the evening fireworks spectacular'] }
        ],
        stay: true
      },
      {
        title: 'Scenic France (Choose One Region)',
        emoji: '🌊',
        options: [
          { label: 'Option 1: French Riviera', emoji: '🏖️', items: ['Take a TGV train or fly to Nice (~1 hr flight)', 'Day trip to glamorous Monaco — visit the Casino area', 'Visit the hilltop village of Èze — breathtaking Mediterranean views', 'Enjoy fresh seafood along the Promenade des Anglais'] },
          { label: 'Option 2: Loire Valley', emoji: '🌿', items: ['Drive or take a tour to the Loire Valley (~2 hrs from Paris)', 'Visit the iconic Château de Chambord', 'Wine tasting at a local vineyard (Vouvray, Sancerre)', 'Scenic cycling routes through rolling countryside'] }
        ],
        stay: true
      },
      {
        title: 'Culture, Shopping & Farewell',
        emoji: '🛍️',
        slots: [
          { period: 'morning', emoji: '🏛️', label: 'Morning', items: ['Visit Notre-Dame Cathedral (exterior & Île de la Cité)', 'Walk along the charming streets of Le Marais', 'Browse vintage shops & art galleries'] },
          { period: 'afternoon', emoji: '🛍️', label: 'Afternoon', items: ['Shop at Galeries Lafayette — don\'t miss the rooftop view', 'Pick up souvenirs along Rue de Rivoli', 'Relax at a classic Parisian café before departure'] }
        ],
        stay: false
      }
    ],
    usa: [
      {
        title: 'Arrival in the USA — City Vibes',
        emoji: '🗽',
        slots: [
          { period: 'afternoon', emoji: '🌅', label: 'Afternoon', items: ['Arrive & check into your hotel', 'Explore the neighbourhood on foot', 'Grab a classic American burger or deli sandwich'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Walk through Times Square or your city centre', 'Enjoy a rooftop dinner with skyline views'] }
        ],
        stay: true
      },
      {
        title: 'Iconic Landmarks & Sightseeing',
        emoji: '🏙️',
        slots: [
          { period: 'morning', emoji: '🌅', label: 'Morning', items: ['Visit the Statue of Liberty & Ellis Island (book ferry in advance)', 'Walk across the Brooklyn Bridge for skyline photos', 'Coffee at a classic NYC coffee shop'] },
          { period: 'afternoon', emoji: '☀️', label: 'Afternoon', items: ['Explore Central Park — rent a bike or rowboat', 'Visit the Metropolitan Museum of Art', 'Stroll down Fifth Avenue'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Broadway show (book tickets online for best deals)', 'Dinner in Little Italy or Chinatown'] }
        ],
        stay: true
      },
      {
        title: 'Culture, History & Neighborhoods',
        emoji: '🎭',
        slots: [
          { period: 'morning', emoji: '🎨', label: 'Morning', items: ['Visit the 9/11 Memorial & Museum', 'Walk through Wall Street & Financial District', 'See the Charging Bull statue'] },
          { period: 'afternoon', emoji: '🌆', label: 'Afternoon', items: ['Explore Greenwich Village & SoHo', 'Browse boutique shops & street art', 'Try New York-style pizza at a legendary pizzeria'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Visit Top of the Rock or Empire State Building at sunset', 'Dinner at a Michelin-recommended restaurant'] }
        ],
        stay: true
      },
      {
        title: 'Day Trip Adventure',
        emoji: '🚗',
        options: [
          { label: 'Option A: Washington D.C.', emoji: '🏛️', items: ['Take Amtrak or drive to D.C. (~3.5 hrs)', 'Visit the Lincoln Memorial & National Mall', 'Explore the Smithsonian Museums (free entry!)', 'See the White House & Capitol Building'] },
          { label: 'Option B: Niagara Falls', emoji: '🌊', items: ['Fly or drive to Niagara Falls', 'Take the Maid of the Mist boat ride', 'Walk along the observation decks', 'Enjoy a scenic dinner overlooking the falls'] }
        ],
        stay: true
      },
      {
        title: 'Shopping, Food & Departure',
        emoji: '🛍️',
        slots: [
          { period: 'morning', emoji: '🛍️', label: 'Morning', items: ['Last-minute shopping at outlet stores or local markets', 'Pick up souvenirs & American snacks', 'Enjoy a farewell brunch'] },
          { period: 'afternoon', emoji: '✈️', label: 'Afternoon', items: ['Check out of hotel', 'Head to the airport — allow 3+ hours for international flights', 'Safe travels home! ✈️'] }
        ],
        stay: false
      }
    ],
    japan: [
      {
        title: 'Arrival in Tokyo — Neon & Tradition',
        emoji: '🗼',
        slots: [
          { period: 'afternoon', emoji: '🌅', label: 'Afternoon', items: ['Arrive at Narita/Haneda — get a Suica/Pasmo card', 'Check into hotel & freshen up', 'Explore Shinjuku — neon lights & vibrant energy'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Dinner at a ramen or sushi restaurant in Shibuya', 'Walk through the famous Shibuya Crossing', 'Visit a Japanese convenience store (konbini) for unique snacks'] }
        ],
        stay: true
      },
      {
        title: 'Traditional Tokyo & Temples',
        emoji: '⛩️',
        slots: [
          { period: 'morning', emoji: '🌅', label: 'Morning', items: ['Visit Meiji Shrine — peaceful forest walk in the city', 'Stroll through Harajuku & Takeshita Street', 'Try a Japanese crêpe or matcha treat'] },
          { period: 'afternoon', emoji: '☀️', label: 'Afternoon', items: ['Explore Asakusa & Senso-ji Temple', 'Walk along Nakamise Shopping Street for souvenirs', 'Take a water bus along the Sumida River'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Visit Tokyo Skytree for panoramic night views', 'Dinner at an izakaya (Japanese pub) — try yakitori & tempura'] }
        ],
        stay: true
      },
      {
        title: 'Day Trip — Mount Fuji & Lakes',
        emoji: '🗻',
        options: [
          { label: 'Option A: Mt Fuji & Hakone', emoji: '🏔️', items: ['Take the bullet train (Shinkansen) to Odawara (~35 min)', 'Visit Hakone Open-Air Museum', 'Take a pirate ship cruise on Lake Ashi', 'See Mount Fuji from Owakudani volcanic valley'] },
          { label: 'Option B: Nikko Temples', emoji: '⛩️', items: ['Take a train to Nikko (~2 hrs from Tokyo)', 'Visit the ornate Toshogu Shrine (UNESCO site)', 'Explore Kegon Falls & Lake Chuzenji', 'Enjoy local yuba (tofu skin) cuisine'] }
        ],
        stay: true
      },
      {
        title: 'Kyoto — Temples, Geishas & Gardens',
        emoji: '🎎',
        slots: [
          { period: 'morning', emoji: '🌅', label: 'Morning', items: ['Bullet train to Kyoto (~2.5 hrs)', 'Visit Fushimi Inari Shrine — walk through 10,000 torii gates', 'Try matcha & dango at a tea house nearby'] },
          { period: 'afternoon', emoji: '🎋', label: 'Afternoon', items: ['Walk through Arashiyama Bamboo Forest', 'Visit Tenryu-ji Temple & its stunning garden', 'Cross the Togetsukyo Bridge'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Stroll through the Gion district — spot a geisha', 'Dinner at a traditional kaiseki restaurant', 'Take the bullet train back to Tokyo'] }
        ],
        stay: true
      },
      {
        title: 'Akihabara, Shopping & Departure',
        emoji: '🎮',
        slots: [
          { period: 'morning', emoji: '🎮', label: 'Morning', items: ['Explore Akihabara — anime, manga & electronics paradise', 'Visit a themed café (cat café, maid café, etc.)', 'Pick up unique Japanese souvenirs & Kit-Kat flavours'] },
          { period: 'afternoon', emoji: '✈️', label: 'Afternoon', items: ['Final sushi lunch at Tsukiji Outer Market', 'Head to the airport — sayonara, Japan! 🇯🇵', 'Safe travels home! ✈️'] }
        ],
        stay: false
      }
    ],
    italy: [
      {
        title: 'Arrival in Rome — Eternal City',
        emoji: '🏛️',
        slots: [
          { period: 'afternoon', emoji: '🌅', label: 'Afternoon', items: ['Arrive in Rome & check into hotel', 'Toss a coin in the Trevi Fountain for good luck', 'Walk to the Spanish Steps & Piazza di Spagna'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Dinner in Trastevere — the heart of Roman dining', 'Try authentic cacio e pepe, supplì & gelato', 'Evening passeggiata (stroll) through cobblestone streets'] }
        ],
        stay: true
      },
      {
        title: 'Ancient Rome & Vatican City',
        emoji: '⚔️',
        slots: [
          { period: 'morning', emoji: '🏟️', label: 'Morning', items: ['Visit the Colosseum & Roman Forum (book skip-the-line ticket)', 'Walk along the Palatine Hill for city views', 'See the Arch of Constantine'] },
          { period: 'afternoon', emoji: '⛪', label: 'Afternoon', items: ['Explore Vatican Museums & the Sistine Chapel', 'Visit St. Peter\'s Basilica — climb to the dome for views', 'Walk through Castel Sant\'Angelo'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Dinner near Piazza Navona', 'Try Roman-style pizza al taglio & tiramisu'] }
        ],
        stay: true
      },
      {
        title: 'Day Trip — Florence or Pompeii',
        emoji: '🎨',
        options: [
          { label: 'Option A: Florence (Firenze)', emoji: '🌻', items: ['High-speed train to Florence (~1.5 hrs)', 'Visit the Uffizi Gallery — see Botticelli\'s Birth of Venus', 'Marvel at the Duomo & climb Brunelleschi\'s dome', 'Cross the Ponte Vecchio & enjoy a Florentine steak'] },
          { label: 'Option B: Pompeii & Amalfi Coast', emoji: '🌋', items: ['Train to Naples, then Pompeii (~2.5 hrs total)', 'Explore the ancient ruins frozen in time by Vesuvius', 'Continue to the Amalfi Coast for stunning coastal views', 'Try limoncello & fresh seafood in Positano'] }
        ],
        stay: true
      },
      {
        title: 'Venice — Canals & Romance',
        emoji: '🚣',
        slots: [
          { period: 'morning', emoji: '🌅', label: 'Morning', items: ['Train to Venice (~3.5 hrs from Rome)', 'Gondola ride through the Grand Canal', 'Visit St. Mark\'s Basilica & the Doge\'s Palace'] },
          { period: 'afternoon', emoji: '☀️', label: 'Afternoon', items: ['Get lost in Venice\'s charming narrow streets', 'Visit Rialto Bridge & browse local markets', 'Try cicchetti (Venetian tapas) & prosecco'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Watch sunset from Ponte dell\'Accademia', 'Dinner at a canal-side restaurant', 'Train back to Rome'] }
        ],
        stay: true
      },
      {
        title: 'Last Bites of Italy & Departure',
        emoji: '🍕',
        slots: [
          { period: 'morning', emoji: '☕', label: 'Morning', items: ['Enjoy a classic Italian breakfast — espresso & cornetto', 'Last-minute shopping for leather goods & souvenirs', 'Visit any remaining must-see spots'] },
          { period: 'afternoon', emoji: '✈️', label: 'Afternoon', items: ['Hotel check-out & head to Fiumicino Airport', 'Arrivederci, Italia! Safe travels home! 🇮🇹'] }
        ],
        stay: false
      }
    ],
    thailand: [
      {
        title: 'Arrival in Bangkok — City of Angels',
        emoji: '🌅',
        slots: [
          { period: 'afternoon', emoji: '🌅', label: 'Afternoon', items: ['Arrive at Suvarnabhumi Airport & get a SIM card', 'Check into hotel & freshen up', 'Visit Khao San Road for backpacker vibes & street food'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Dinner at a rooftop bar overlooking the skyline', 'Try pad Thai, mango sticky rice & Thai iced tea', 'Explore the vibrant night markets'] }
        ],
        stay: true
      },
      {
        title: 'Grand Palace, Temples & Culture',
        emoji: '🏯',
        slots: [
          { period: 'morning', emoji: '🌅', label: 'Morning', items: ['Visit the Grand Palace & Wat Phra Kaew (Temple of the Emerald Buddha)', 'Explore nearby Wat Pho — home of the giant Reclining Buddha', 'Dress modestly — shoulders & knees must be covered'] },
          { period: 'afternoon', emoji: '🛶', label: 'Afternoon', items: ['Long-tail boat ride through Bangkok\'s canals (klongs)', 'Visit Wat Arun (Temple of Dawn) across the river', 'Explore Chinatown & try street food at Yaowarat Road'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Visit Asiatique The Riverfront night market', 'Enjoy a traditional Thai cultural performance', 'Try tom yum soup & green curry at a local restaurant'] }
        ],
        stay: true
      },
      {
        title: 'Floating Markets & Day Trip',
        emoji: '🛶',
        options: [
          { label: 'Option A: Floating Markets', emoji: '🛶', items: ['Early morning trip to Damnoen Saduak Floating Market', 'Sample fresh tropical fruits & coconut pancakes from boats', 'Visit the Railway Market (Maeklong) — trains pass through!', 'Return to Bangkok for an evening Thai massage'] },
          { label: 'Option B: Ayutthaya Ancient City', emoji: '🏛️', items: ['Day trip to Ayutthaya (~1.5 hrs from Bangkok)', 'Explore ancient temple ruins (UNESCO World Heritage Site)', 'See the famous Buddha head entwined in tree roots', 'Enjoy a river cruise back to Bangkok'] }
        ],
        stay: true
      },
      {
        title: 'Beach Paradise — Islands',
        emoji: '🏝️',
        options: [
          { label: 'Option 1: Phi Phi Islands', emoji: '🏖️', items: ['Fly to Phuket or Krabi (~1.5 hrs)', 'Speedboat to Phi Phi Islands — crystal-clear waters', 'Snorkelling, kayaking & Maya Bay visit', 'Beach BBQ dinner under the stars'] },
          { label: 'Option 2: Chiang Mai (Mountains)', emoji: '🐘', items: ['Fly to Chiang Mai (~1.5 hrs from Bangkok)', 'Visit an ethical elephant sanctuary', 'Explore Doi Suthep temple on the mountain', 'Night Bazaar shopping & local khao soi noodle soup'] }
        ],
        stay: true
      },
      {
        title: 'Last Adventures & Departure',
        emoji: '🛍️',
        slots: [
          { period: 'morning', emoji: '🛍️', label: 'Morning', items: ['Visit Chatuchak Weekend Market (15,000+ stalls!)', 'Pick up Thai silk, handicrafts & spices as souvenirs', 'Enjoy a final Thai massage'] },
          { period: 'afternoon', emoji: '✈️', label: 'Afternoon', items: ['Last street food feast — satay, pad see ew & mango sticky rice', 'Head to the airport — khob khun kha, Thailand! 🇹🇭', 'Safe travels home! ✈️'] }
        ],
        stay: false
      }
    ],
    uk: [
      {
        title: 'Arrival in London — Royal Welcome',
        emoji: '🇬🇧',
        slots: [
          { period: 'afternoon', emoji: '🌅', label: 'Afternoon', items: ['Arrive at Heathrow — get an Oyster card for the Tube', 'Check into hotel & freshen up', 'Walk along the South Bank — see the London Eye'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Classic fish & chips dinner by the Thames', 'See Big Ben & the Houses of Parliament illuminated', 'Walk across Westminster Bridge for night photos'] }
        ],
        stay: true
      },
      {
        title: 'Royal London & Museums',
        emoji: '👑',
        slots: [
          { period: 'morning', emoji: '🌅', label: 'Morning', items: ['Watch the Changing of the Guard at Buckingham Palace', 'Walk through St. James\'s Park & Green Park', 'Visit the Tower of London — see the Crown Jewels'] },
          { period: 'afternoon', emoji: '🏛️', label: 'Afternoon', items: ['Explore the British Museum (free entry!)', 'Walk through Covent Garden for street performers', 'Afternoon tea at a classic London tearoom'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['West End theatre show (book in advance)', 'Dinner in Soho — try a Sunday roast or shepherd\'s pie'] }
        ],
        stay: true
      },
      {
        title: 'Day Trip — Castles & Countryside',
        emoji: '🏰',
        options: [
          { label: 'Option A: Stonehenge & Bath', emoji: '🪨', items: ['Day trip to Stonehenge (~2 hrs from London)', 'Marvel at the ancient stone circle (5,000 years old!)', 'Continue to Bath — visit the Roman Baths', 'Enjoy a cream tea in the charming city centre'] },
          { label: 'Option B: Oxford & Cotswolds', emoji: '📚', items: ['Train to Oxford (~1 hr from London)', 'Walk through the ancient university colleges', 'Visit the Bodleian Library & Radcliffe Camera', 'Explore honey-stone Cotswolds villages nearby'] }
        ],
        stay: true
      },
      {
        title: 'East London, Markets & Culture',
        emoji: '🎨',
        slots: [
          { period: 'morning', emoji: '🛍️', label: 'Morning', items: ['Explore Borough Market — foodie paradise', 'Walk across Tower Bridge for Thames views', 'Visit the Tate Modern gallery (free entry)'] },
          { period: 'afternoon', emoji: '🎨', label: 'Afternoon', items: ['Explore Camden Town & Camden Market', 'Browse vintage shops & street art in Shoreditch', 'Visit the Harry Potter Platform 9¾ at King\'s Cross'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Cruise along Regent\'s Canal', 'Dinner at a traditional British pub', 'Walk through Piccadilly Circus at night'] }
        ],
        stay: true
      },
      {
        title: 'Shopping, Parks & Farewell',
        emoji: '🛍️',
        slots: [
          { period: 'morning', emoji: '🛍️', label: 'Morning', items: ['Shopping on Oxford Street & Regent Street', 'Visit Harrods in Knightsbridge', 'Relax in Hyde Park'] },
          { period: 'afternoon', emoji: '✈️', label: 'Afternoon', items: ['Last photo stops & souvenir shopping', 'Head to the airport — cheerio, London! 🇬🇧', 'Safe travels home! ✈️'] }
        ],
        stay: false
      }
    ],
    germany: [
      {
        title: 'Arrival in Berlin — History & Vibes',
        emoji: '🇩🇪',
        slots: [
          { period: 'afternoon', emoji: '🌅', label: 'Afternoon', items: ['Arrive in Berlin & check into hotel', 'Visit the Brandenburg Gate — iconic symbol of Germany', 'Walk along Unter den Linden boulevard'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Dinner at a traditional German beer hall', 'Try bratwurst, pretzels & a cold German lager', 'Explore the vibrant Kreuzberg neighbourhood'] }
        ],
        stay: true
      },
      {
        title: 'Berlin Wall, Museums & Culture',
        emoji: '🧱',
        slots: [
          { period: 'morning', emoji: '🌅', label: 'Morning', items: ['Visit the East Side Gallery — longest surviving section of the Berlin Wall', 'Explore the Topography of Terror museum', 'See Checkpoint Charlie'] },
          { period: 'afternoon', emoji: '🏛️', label: 'Afternoon', items: ['Museum Island — visit the Pergamon Museum', 'Walk through the Berlin Cathedral', 'Coffee & cake at a Berlin café (try Bienenstich)'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Visit the Reichstag building — book the glass dome tour', 'Dinner in Prenzlauer Berg neighbourhood', 'Experience Berlin\'s famous nightlife scene'] }
        ],
        stay: true
      },
      {
        title: 'Bavarian Adventure',
        emoji: '🏔️',
        options: [
          { label: 'Option A: Neuschwanstein Castle', emoji: '🏰', items: ['Fly or train to Munich (~4 hrs)', 'Day trip to Neuschwanstein Castle — the fairytale castle', 'Hike up to Marienbrücke bridge for the best views', 'Return to Munich for a Bavarian dinner'] },
          { label: 'Option B: Munich City Day', emoji: '🍺', items: ['Train to Munich & explore Marienplatz', 'Watch the Glockenspiel clock performance', 'Visit the famous Hofbräuhaus beer hall', 'Tour the English Garden — one of the world\'s largest urban parks'] }
        ],
        stay: true
      },
      {
        title: 'Rhine Valley & Romance',
        emoji: '🏞️',
        slots: [
          { period: 'morning', emoji: '🚂', label: 'Morning', items: ['Train to the Rhine Valley region', 'Rhine River cruise past medieval castles & vineyards', 'Visit the Lorelei Rock viewpoint'] },
          { period: 'afternoon', emoji: '🍷', label: 'Afternoon', items: ['Wine tasting at a Riesling vineyard', 'Explore the charming town of Bacharach or Rüdesheim', 'Try local schnitzel & Black Forest cake'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Return to Berlin or your base city', 'Farewell dinner at a cosy German restaurant'] }
        ],
        stay: true
      },
      {
        title: 'Last Day & Departure',
        emoji: '🛍️',
        slots: [
          { period: 'morning', emoji: '🛍️', label: 'Morning', items: ['Visit KaDeWe department store for souvenirs', 'Last currywurst from a street stall', 'Final photo walk through the city'] },
          { period: 'afternoon', emoji: '✈️', label: 'Afternoon', items: ['Check out & head to the airport', 'Auf Wiedersehen, Deutschland! 🇩🇪', 'Safe travels home! ✈️'] }
        ],
        stay: false
      }
    ],
    singapore: [
      {
        title: 'Arrival in the Lion City',
        emoji: '🦁',
        slots: [
          { period: 'afternoon', emoji: '🌅', label: 'Afternoon', items: ['Arrive at Changi Airport (one of the world\'s best!)', 'Check into hotel & freshen up', 'Walk around Marina Bay — see the Merlion statue'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Gardens by the Bay — Supertree Grove light show (free!)', 'Dinner at a hawker centre — try Hainanese chicken rice & laksa', 'Walk along the Marina Bay Sands promenade'] }
        ],
        stay: true
      },
      {
        title: 'Cultural Quarters & Cuisine',
        emoji: '🏮',
        slots: [
          { period: 'morning', emoji: '🌅', label: 'Morning', items: ['Explore Chinatown — visit the Buddha Tooth Relic Temple', 'Walk through colourful Haji Lane in Kampong Glam', 'Try kaya toast & kopi at a traditional coffee shop'] },
          { period: 'afternoon', emoji: '🎨', label: 'Afternoon', items: ['Visit Little India — Sri Veeramakaliamman Temple', 'Browse Mustafa Centre for bargain shopping', 'Try roti prata & fish head curry'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Clarke Quay riverside dining & nightlife', 'Singapore Sling cocktail at Raffles Hotel Long Bar', 'Night Safari at Singapore Zoo (unique experience!)'] }
        ],
        stay: true
      },
      {
        title: 'Thrills & Entertainment',
        emoji: '🎢',
        options: [
          { label: 'Option A: Sentosa Island', emoji: '🏝️', items: ['Universal Studios Singapore — rides & shows all day', 'Visit S.E.A. Aquarium — one of the world\'s largest', 'Relax at Palawan Beach', 'Wings of Time evening show on the beach'] },
          { label: 'Option B: Nature & Wildlife', emoji: '🌿', items: ['Singapore Zoo — world-famous open-concept zoo', 'River Wonders — giant panda exhibit', 'MacRitchie Treetop Walk through the rainforest canopy', 'Botanical Gardens — UNESCO World Heritage Site'] }
        ],
        stay: true
      },
      {
        title: 'Shopping, Views & Hidden Gems',
        emoji: '🛍️',
        slots: [
          { period: 'morning', emoji: '🛍️', label: 'Morning', items: ['Shop on Orchard Road — Singapore\'s shopping paradise', 'Visit ION Orchard & Design Orchard for local brands'] },
          { period: 'afternoon', emoji: '🌆', label: 'Afternoon', items: ['Marina Bay Sands SkyPark observation deck', 'Visit ArtScience Museum for immersive exhibitions', 'Try chilli crab at a waterfront restaurant'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Spectra light & water show at Marina Bay (free!)', 'Rooftop cocktails at CÉ LA VI', 'Night walk along the Helix Bridge'] }
        ],
        stay: true
      },
      {
        title: 'Final Flavours & Departure',
        emoji: '✈️',
        slots: [
          { period: 'morning', emoji: '☕', label: 'Morning', items: ['Final hawker centre breakfast — nasi lemak & teh tarik', 'Pick up souvenirs at Changi Airport\'s Jewel mall', 'Slide down the Rain Vortex waterfall at Jewel!'] },
          { period: 'afternoon', emoji: '✈️', label: 'Afternoon', items: ['Head to the airport — xie xie, Singapore! 🇸🇬', 'Safe travels home! ✈️'] }
        ],
        stay: false
      }
    ],
    uae: [
      {
        title: 'Arrival in Dubai — City of Gold',
        emoji: '🌇',
        slots: [
          { period: 'afternoon', emoji: '🌅', label: 'Afternoon', items: ['Arrive in Dubai & check into hotel', 'Visit Dubai Mall — the world\'s largest shopping mall', 'See the Dubai Aquarium & Underwater Zoo inside the mall'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Watch the Dubai Fountain show (every 30 mins, free!)', 'Visit Burj Khalifa observation deck At The Top (book online)', 'Dinner with views of the illuminated skyline'] }
        ],
        stay: true
      },
      {
        title: 'Old Dubai, Souks & Culture',
        emoji: '🕌',
        slots: [
          { period: 'morning', emoji: '🌅', label: 'Morning', items: ['Visit Al Fahidi Historical District — old Dubai charm', 'Take an abra (water taxi) across Dubai Creek', 'Explore the Gold Souk & Spice Souk in Deira'] },
          { period: 'afternoon', emoji: '🕌', label: 'Afternoon', items: ['Visit Jumeirah Mosque (one of few open to non-Muslims)', 'Walk along Jumeirah Beach with Burj Al Arab views', 'Try authentic shawarma & Arabic coffee'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Desert Safari — dune bashing, camel ride & BBQ dinner', 'Watch a belly dance performance under the stars', 'Try Arabic sweets — luqaimat & kunafa'] }
        ],
        stay: true
      },
      {
        title: 'Abu Dhabi Day Trip',
        emoji: '🕌',
        options: [
          { label: 'Option A: Sheikh Zayed Mosque & Culture', emoji: '🕌', items: ['Drive to Abu Dhabi (~1.5 hrs)', 'Visit the stunning Sheikh Zayed Grand Mosque', 'Explore the Louvre Abu Dhabi — a masterpiece of architecture', 'Walk along the Corniche waterfront promenade'] },
          { label: 'Option B: Theme Park Adventure', emoji: '🎢', items: ['Visit Ferrari World — ride the world\'s fastest roller coaster', 'Explore Yas Waterworld — perfect for families', 'Warner Bros World — indoor theme park', 'Dinner on Yas Island'] }
        ],
        stay: true
      },
      {
        title: 'Luxury, Beaches & Adventure',
        emoji: '🏝️',
        slots: [
          { period: 'morning', emoji: '🏖️', label: 'Morning', items: ['Visit Palm Jumeirah — take the monorail', 'Explore Atlantis, The Palm — Aquaventure Waterpark', 'Relax on the beach with Burj Al Arab views'] },
          { period: 'afternoon', emoji: '🛍️', label: 'Afternoon', items: ['Visit Mall of the Emirates — ski at Ski Dubai (indoor!)', 'Browse the Global Village (seasonal)', 'Try Emirati machboos & lamb ouzi'] },
          { period: 'evening', emoji: '🌙', label: 'Evening', items: ['Dubai Marina walk & dinner at a waterfront restaurant', 'Take a dhow cruise along the Marina', 'Enjoy the JBR Beach Walk nightlife'] }
        ],
        stay: true
      },
      {
        title: 'Last Souvenirs & Departure',
        emoji: '🛍️',
        slots: [
          { period: 'morning', emoji: '🛍️', label: 'Morning', items: ['Last-minute shopping for gold, perfumes & dates', 'Visit a local café for a final Arabic coffee & kunafa', 'Take farewell photos'] },
          { period: 'afternoon', emoji: '✈️', label: 'Afternoon', items: ['Check out & head to Dubai International Airport', 'Ma\'a salama, Dubai! 🇦🇪', 'Safe travels home! ✈️'] }
        ],
        stay: false
      }
    ]
  };

  function getFacts(name) {
    if (!name) return DB.default;
    const k = name.toLowerCase().trim();
    for (const key of Object.keys(DB)) {
      if (k.includes(key) || key.includes(k)) return DB[key];
    }
    return DB.default;
  }

  function getDetailedDays(name) {
    if (!name) return null;
    const k = name.toLowerCase().trim();
    for (const key of Object.keys(DETAILED_DAYS)) {
      if (k.includes(key) || key.includes(k)) return DETAILED_DAYS[key];
    }
    return null;
  }

  /* ──────────────────────────────────────────
     BUDGET  (INR)
  ────────────────────────────────────────── */
  const inr = n => `₹${(n * INR).toLocaleString('en-IN')}`;

  function parseBudgetINR(str) {
    // accept any numeric string like "50000" or "₹50,000" or "50k"
    if (!str) return null;
    const s = str.toString().toLowerCase().replace(/[₹,\s]/g, '');
    const k = s.endsWith('k') ? parseFloat(s) * 1000 : parseFloat(s);
    return isNaN(k) ? null : k;
  }

  function getTier(budgetStr, accommodation = '') {
    // Check budget string first
    const b = (budgetStr || '').toLowerCase();
    if (b.includes('luxury') || b.includes('premium') || b.includes('5 star')) return 'luxury';
    if (b.includes('budget') || b.includes('backpack') || b.includes('hostel') || b.includes('low') || b.includes('cheap')) return 'budget';
    
    // Check accommodation if budget not provided
    const accom = (accommodation || '').toLowerCase();
    if (accom.includes('luxury') || accom.includes('5-star')) return 'luxury';
    if (accom.includes('budget') || accom.includes('hostel') || accom.includes('dorm')) return 'budget';
    
    // Default to mid-range
    return 'mid';
  }

  // USD base amounts → converted to INR on display
  const DAILY = {
    luxury: { food: 120, act: 150, local: 60 },
    mid:    { food: 50,  act: 60,  local: 25 },
    budget: { food: 20,  act: 20,  local: 10 }
  };
  const ACCOM_RATE = { luxury: 350, mid: 120, budget: 40 };
  const FLIGHT_BASE = { flight: 600, train: 120, bus: 50, ship: 200 };
  const TIER_MULT   = { luxury: 2.5, mid: 1, budget: 0.65 };

  function buildAccom(str, tier) {
    const s = (str || '').toLowerCase();
    if (s.includes('hostel') || s.includes('dorm'))         return { name: 'Hostel / Dorm',           rate: 25 };
    if (s.includes('airbnb') || s.includes('apartment'))    return { name: 'Airbnb / Apartment',       rate: 90 };
    if (s.includes('luxury') || s.includes('5 star'))       return { name: '5-Star Luxury Hotel',      rate: 350 };
    if (s.includes('budget'))                               return { name: 'Budget Hotel / Guesthouse', rate: 40 };
    return { name: tier === 'luxury' ? '5-Star Luxury Hotel' : tier === 'budget' ? 'Budget Hotel' : '3–4 Star Hotel',
             rate: ACCOM_RATE[tier] || 120 };
  }

  function buildBudget(tier, days, pax, mode, accom, budgetInput) {
    const d = DAILY[tier] || DAILY.mid;
    const flight  = Math.round((FLIGHT_BASE[mode] || 400) * (TIER_MULT[tier] || 1)) * pax;  // multiply by pax
    const hotel   = accom.rate * days * pax;          // per person per night × days × pax
    const food    = d.food * days * pax;
    const act     = d.act  * days * pax;
    const local   = d.local* days * pax;
    const misc    = Math.round((flight + hotel + food + act) * 0.08);
    const total   = flight + hotel + food + act + local + misc;

    // If user typed a specific INR budget, use that as the reported total
    const userAmt = parseBudgetINR(budgetInput);
    const reportedTotal = userAmt !== null ? userAmt : total * INR;

    return {
      items: [
        { label:'Transport',        usd: flight, icon:'plane',        color:'#3b82f6' },
        { label:'Accommodation',    usd: hotel,        icon:'bed',          color:'#8b5cf6' },
        { label:'Food & Dining',    usd: food,         icon:'utensils',     color:'#f59e0b' },
        { label:'Activities & Entry',usd:act,          icon:'ticket-alt',   color:'#10b981' },
        { label:'Local Transport',  usd: local,        icon:'taxi',         color:'#06b6d4' },
        { label:'Miscellaneous',    usd: misc,         icon:'shopping-bag', color:'#ec4899' },
      ],
      totalINR: reportedTotal,
      nightlyINR: accom.rate * INR
    };
  }

  /* ──────────────────────────────────────────
     ITINERARY GENERATOR
  ────────────────────────────────────────── */
  function generateItinerary(trip, prefs) {
    const facts    = getFacts(trip.destination);
    const days     = prefs.duration || 5;
    const dest     = trip.destination || 'your destination';
    const pax      = prefs.travelers || trip.passengers || 1;
    const tier     = getTier(prefs.budget, prefs.accommodation);
    const accom    = buildAccom(prefs.accommodation, tier);
    const budget   = buildBudget(tier, days, pax, trip.travelMode, accom, prefs.budget);
    const places   = [...facts.places];
    const food     = [...facts.food];
    const purpose  = prefs.purpose || 'tourism';
    const isHoney  = /honeymoon|romance/i.test(purpose);
    const isBiz    = /business|work/i.test(purpose);
    const interestsList = Array.isArray(prefs.interests) ? prefs.interests : (prefs.interests || '').split(',').map(s => s.trim()).filter(Boolean);
    const isAdv    = /adventure|outdoor/i.test(purpose) || interestsList.some(i => /adventure|outdoor/i.test(i));

    let out = '';

    // ── Overview ──
    out += `<div class="tap-overview">`;
    [
      ['globe-europe', 'Destination',   dest],
      ['moon',         'Duration',      `${days} Day${days>1?'s':''}`],
      ['wallet',       'Budget',        `₹${Math.round(budget.totalINR).toLocaleString('en-IN')}`],
      ['bed',          'Accommodation', accom.name],
      ['language',     'Language',      facts.language],
      ['coins',        'Currency',      facts.currency],
    ].forEach(([ic, lbl, val]) => out += `
      <div class="tap-ov-item">
        <i class="fas fa-${ic}"></i>
        <div><small>${lbl}</small><strong>${val}</strong></div>
      </div>`);
    out += `</div>`;

    // ── Pill row ──
    out += `<div class="tap-pills">
      <div class="tap-pill"><i class="fas fa-plug"></i> Plug: ${facts.plug}</div>
      <div class="tap-pill"><i class="fas fa-phone-alt"></i> SOS: ${facts.sos}</div>
      <div class="tap-pill"><i class="fas fa-clock"></i> ${facts.tz}</div>
      <div class="tap-pill"><i class="fas fa-id-card"></i> ${facts.visa}</div>
    </div>`;

    // ── Budget breakdown ──
    out += `<div class="tap-sec-label"><i class="fas fa-chart-pie"></i> Estimated Budget (in Rupees)</div>
    <div class="tap-budget-grid">`;
    budget.items.forEach(b => {
      out += `<div class="tap-b-item">
        <div class="tap-b-icon" style="background:${b.color}1a;color:${b.color}"><i class="fas fa-${b.icon}"></i></div>
        <div>
          <span class="tap-b-cat">${b.label}</span>
          <span class="tap-b-amt">₹${Math.round(b.usd * INR).toLocaleString('en-IN')}</span>
        </div>
      </div>`;
    });
    out += `<div class="tap-b-total">
      <span>Total Estimated Budget (${pax} pax, ${days} days)</span>
      <strong>₹${Math.round(budget.totalINR).toLocaleString('en-IN')}</strong>
    </div></div>`;

    // ── Day plans ──
    out += `<div class="tap-sec-label"><i class="fas fa-map-signs"></i> Day-by-Day Itinerary</div>
    <div class="tap-days">`;

    const dayPlans = makeDayPlans(dest, days, facts, prefs, purpose, tier, accom, isHoney, isBiz, isAdv);
    dayPlans.forEach((day, i) => {
      let dateStr = '';
      if (trip.tripDate) {
        const d = new Date(trip.tripDate);
        d.setDate(d.getDate() + i);
        dateStr = d.toLocaleDateString('en-IN', { weekday:'short', month:'short', day:'numeric' });
      }
      out += `<div class="tap-day">
        <div class="tap-day-hdr">
          <div class="tap-day-num">Day ${i+1}</div>
          <div class="tap-day-ti">${day.emoji ? day.emoji + ' ' : ''}${day.title}</div>
          ${dateStr ? `<div class="tap-day-dt">${dateStr}</div>` : ''}
        </div>`;

      // Render time-of-day slots (morning/afternoon/evening with multiple activities)
      if (day.slots && day.slots.length) {
        out += `<div class="tap-day-body">`;
        day.slots.forEach(slot => {
          const pc = slot.period || 'morning';
          out += `<div class="tap-slot">
            <div class="tap-slot-tag ${pc}"><i class="fas fa-${pc==='morning'?'sun':pc==='afternoon'?'cloud-sun':'moon'}"></i> ${slot.emoji || ''} ${slot.label || pc.charAt(0).toUpperCase()+pc.slice(1)}</div>
            <div class="tap-slot-items">`;
          slot.items.forEach(item => {
            out += `<div class="tap-slot-item"><i class="fas fa-chevron-right"></i> ${item}</div>`;
          });
          out += `</div></div>`;
        });
        out += `</div>`;
      }

      // Render option-based days (alternative plans)
      if (day.options && day.options.length) {
        out += `<div class="tap-day-options">`;
        day.options.forEach((opt, oi) => {
          if (oi > 0) out += `<div class="tap-option-divider">OR</div>`;
          out += `<div class="tap-option">
            <div class="tap-option-header">${opt.emoji ? '<span class="tap-option-emoji">' + opt.emoji + '</span>' : ''}<span class="tap-option-label">${opt.label}</span></div>
            <div class="tap-option-items">`;
          opt.items.forEach(item => {
            out += `<div class="tap-slot-item"><i class="fas fa-chevron-right"></i> ${item}</div>`;
          });
          out += `</div></div>`;
        });
        out += `</div>`;
      }

      if (day.stay) {
        out += `<div class="tap-day-stay">
          <i class="fas fa-bed"></i>
          <span>Stay: <strong>${accom.name}</strong></span>
          <span class="tap-day-stay-price">₹${budget.nightlyINR.toLocaleString('en-IN')}/night</span>
        </div>`;
      }
      out += `</div>`;
    });
    out += `</div>`;

    // ── Food ──
    out += `<div class="tap-sec-label"><i class="fas fa-utensils"></i> Local Food to Try</div>
    <div class="tap-food-grid">`;
    food.slice(0,8).forEach(dish => {
      out += `<div class="tap-food-item"><i class="fas fa-drumstick-bite"></i>${dish}</div>`;
    });
    out += `</div>`;

    // ── Highlights ──
    out += `<div class="tap-sec-label"><i class="fas fa-star"></i> Must-Visit Attractions</div>
    <div class="tap-hl-wrap">`;
    facts.places.forEach((h, i) => {
      out += `<div class="tap-hl-chip"><span class="tap-hl-n">${i+1}</span>${h}</div>`;
    });
    out += `</div>`;

    // ── Packing ──
    const pack = getPacking(purpose, facts);
    out += `<div class="tap-sec-label"><i class="fas fa-suitcase-rolling"></i> Packing Essentials</div>
    <div class="tap-pack-grid">`;
    pack.forEach(p => out += `<div class="tap-pack-item"><i class="fas fa-check-circle"></i>${p}</div>`);
    out += `</div>`;

    // ── Departure-Specific Travel Tips ──
    const depCity = (trip.departureCity || '').trim();
    if (depCity) {
      const routeTips = getDepartureTips(depCity, dest, facts, trip.travelMode);
      out += `<div class="tap-sec-label"><i class="fas fa-plane-departure"></i> ✈️ Travel Tips (From ${depCity})</div>
      <div class="tap-route-card">
        <div class="tap-route-title"><i class="fas fa-route"></i> Since you're in ${depCity}:</div>
        <div class="tap-route-grid">`;
      routeTips.forEach(tip => {
        out += `<div class="tap-route-item"><i class="fas fa-${tip.icon}"></i><div><strong>${tip.label}:</strong> ${tip.value}</div></div>`;
      });
      out += `</div></div>`;
    }

    // ── Tips ──
    out += `<div class="tap-sec-label"><i class="fas fa-info-circle"></i> AI Travel Tips</div>
    <ul class="tap-tips-ul">
      <li><i class="fas fa-bolt"></i> Best time to visit <strong>${dest}</strong>: ${facts.best}</li>
      <li><i class="fas fa-bolt"></i> Book ${accom.name} at least 3–4 weeks in advance for best rates.</li>
      <li><i class="fas fa-bolt"></i> Download offline maps (Google Maps / Maps.me) before departure.</li>
      <li><i class="fas fa-bolt"></i> Keep digital + printed copies of passport and visa.</li>
      <li><i class="fas fa-bolt"></i> Carry some <strong>${facts.currency}</strong> cash for local markets &amp; taxis.</li>
      <li><i class="fas fa-bolt"></i> Emergency helpline in ${dest}: <strong>${facts.sos}</strong></li>
      <li><i class="fas fa-bolt"></i> Always purchase travel insurance — it's essential, not optional.</li>
      <li><i class="fas fa-bolt"></i> Buy attraction tickets (museums, monuments) online in advance to skip queues.</li>
      <li><i class="fas fa-bolt"></i> Use public transport passes for cost-effective city travel.</li>
      ${prefs.dietary && prefs.dietary !== 'None' ? `<li><i class="fas fa-bolt"></i> Carry a dietary card translated to <strong>${facts.language}</strong> for <strong>${prefs.dietary}</strong> needs.</li>` : ''}
    </ul>`;

    return out;
  }

  /* ── Day plan builder helper ── */
  function makeDayPlans(dest, days, facts, prefs, purpose, tier, accom, isHoney, isBiz, isAdv) {
    const detailed = getDetailedDays(dest);

    if (detailed && detailed.length > 0) {
      return buildFromDetailed(detailed, dest, days, facts, prefs, purpose, tier, accom, isHoney, isBiz, isAdv);
    }
    return buildGenericPlan(dest, days, facts, prefs, purpose, tier, accom, isHoney, isBiz, isAdv);
  }

  function buildFromDetailed(detailed, dest, days, facts, prefs, purpose, tier, accom, isHoney, isBiz, isAdv) {
    const plans = [];

    // Day 1: always the arrival template
    plans.push({ ...detailed[0], stay: detailed[0].stay !== false });

    // Middle days: pick from detailed templates (indices 1 to n-2)
    const middleTemplates = detailed.slice(1, detailed.length - 1);
    const middleDaysNeeded = Math.max(0, days - 2);
    const places = [...facts.places];
    const food   = [...facts.food];

    for (let i = 0; i < middleDaysNeeded; i++) {
      if (i < middleTemplates.length) {
        plans.push({ ...middleTemplates[i], stay: middleTemplates[i].stay !== false });
      } else {
        // Generate extra days from facts data for longer trips
        const pi = (i - middleTemplates.length) * 2;
        const p1 = places[pi % places.length] || `${dest} Attraction`;
        const p2 = places[(pi + 1) % places.length] || `Local Exploration`;
        const meal = food[i % food.length] || 'local cuisine';
        const themes = ['Hidden Gems & Local Life', 'Nature & Scenic Exploration', 'Cultural Immersion', 'Leisure & Relaxation'];
        const emojis = ['🗺️', '🌿', '🎭', '☀️'];
        const idx = (i - middleTemplates.length) % themes.length;

        plans.push({
          title: themes[idx], emoji: emojis[idx],
          slots: [
            { period: 'morning', emoji: '🌅', label: 'Morning', items: [
              `Visit ${p1}`, 'Explore the surrounding area & take photos',
              isHoney ? 'Leisurely couples breakfast at a scenic spot' : isBiz ? 'Morning meetings or networking' : 'Grab breakfast at a beloved local café'
            ]},
            { period: 'afternoon', emoji: '☀️', label: 'Afternoon', items: [
              `Head to ${p2}`, `Lunch at a local spot — try ${meal}`,
              'Browse local markets & pick up souvenirs'
            ]},
            { period: 'evening', emoji: '🌙', label: 'Evening', items: [
              isHoney ? 'Romantic dinner at a rooftop restaurant' : isAdv ? 'Night excursion or adventure activity' : 'Enjoy local nightlife or a cultural performance',
              'Return to hotel & rest for the next day'
            ]}
          ],
          stay: true
        });
      }
    }

    // Last day: departure
    if (days > 1) {
      const lastTmpl = detailed[detailed.length - 1];
      if (days <= detailed.length && lastTmpl) {
        plans.push({ ...lastTmpl, stay: false });
      } else {
        plans.push({
          title: 'Final Memories & Departure', emoji: '✈️',
          slots: [
            { period: 'morning', emoji: '🌅', label: 'Morning', items: [
              'Enjoy a final breakfast at your favourite café',
              'Last-minute souvenir shopping',
              'Take final photos & soak in the atmosphere'
            ]},
            { period: 'afternoon', emoji: '✈️', label: 'Afternoon', items: [
              'Hotel check-out & head to the airport / station',
              'Allow at least 3 hours for international flights',
              'Journey home — safe travels! ✈️'
            ]}
          ],
          stay: false
        });
      }
    }

    return plans.slice(0, days);
  }

  function buildGenericPlan(dest, days, facts, prefs, purpose, tier, accom, isHoney, isBiz, isAdv) {
    const places = [...facts.places];
    const food   = [...facts.food];
    const plans  = [];

    // Day 1 — Arrival
    plans.push({
      title: `Arrival & First Impressions of ${dest}`, emoji: '🌅',
      slots: [
        { period: 'afternoon', emoji: '🌅', label: 'Afternoon', items: [
          `Arrive in ${dest} & check into ${accom.name}`,
          'Exchange some local currency at the airport',
          'Explore the nearby streets & get oriented'
        ]},
        { period: 'evening', emoji: '🌙', label: 'Evening', items: [
          `Welcome dinner — try ${food[0] || 'local cuisine'}`,
          'Take a relaxed evening walk around the neighbourhood',
          'Ask hotel staff for hidden local dining gems'
        ]}
      ],
      stay: true
    });

    const themeTitles = ['Major Landmarks & History', 'Food, Markets & Local Life', 'Day Trip & Scenic Beauty', 'Adventure & Outdoor Exploration', 'Culture, Arts & Museums', 'Shopping & Relaxation', 'Hidden Gems & Neighbourhood Walks'];
    const themeEmojis = ['🏛️', '🍜', '🌄', '🏔️', '🎭', '🛍️', '🗺️'];

    for (let d = 2; d <= Math.max(days - 1, 2); d++) {
      const p1 = places.shift() || `${dest} Landmark`;
      const p2 = places.shift() || `${dest} Attraction`;
      const meal = food.shift() || 'local cuisine';
      const ti = (d - 2) % themeTitles.length;
      const title = isBiz && d === 2 ? 'Business Meetings & City Centre' :
                    isHoney && d === 2 ? 'Romance, Fine Dining & Scenic Views' :
                    themeTitles[ti];

      plans.push({
        title, emoji: themeEmojis[ti],
        slots: [
          { period: 'morning', emoji: '🌅', label: 'Morning', items: [
            `Visit ${p1}`, 'Start early to beat the crowds',
            isBiz ? 'Attend morning meetings' : isHoney ? 'Explore together at a relaxed pace' : 'Hire a local guide for deeper insight',
            'Pre-book tickets online to skip queues'
          ]},
          { period: 'afternoon', emoji: '☀️', label: 'Afternoon', items: [
            `Explore ${p2}`, `Lunch — try ${meal} at a well-rated local spot`,
            'Browse local markets & artisan shops',
            ...(tier === 'budget' ? ['💡 Tip: Street food stalls offer great value & taste'] : [])
          ]},
          { period: 'evening', emoji: '🌙', label: 'Evening', items: [
            isHoney ? 'Rooftop or candlelight dinner with views' : isBiz ? 'Business networking event or free evening' : isAdv ? 'Night excursion or cultural show' : 'Local nightlife or cultural performance',
            'Soak in the local atmosphere & people-watch'
          ]}
        ],
        stay: true
      });
    }

    // Last day
    if (days > 1) {
      plans.push({
        title: 'Final Memories & Departure', emoji: '✈️',
        slots: [
          { period: 'morning', emoji: '🌅', label: 'Morning', items: [
            'Enjoy a last meal at a favourite café',
            'Pick up souvenirs & gifts for loved ones',
            'Take final photos of the city'
          ]},
          { period: 'afternoon', emoji: '✈️', label: 'Afternoon', items: [
            'Hotel check-out & head to the airport / station',
            'Allow at least 3 hours for international flights',
            'Board your transport — safe travels! ✈️'
          ]}
        ],
        stay: false
      });
    }

    return plans.slice(0, days);
  }

  function getPacking(purpose, facts) {
    return [
      'Passport & Visa documents', 'Travel insurance certificate',
      `Power adapter (${facts.plug})`, 'Local currency + backup card',
      'Medications & first-aid kit', 'Comfortable walking shoes',
      'Weather-appropriate clothing', 'Sunscreen & insect repellent',
      'Reusable water bottle', 'Offline map downloaded',
      ...(/business/i.test(purpose) ? ['Business attire & cards','Laptop & charger'] : []),
      ...(/honeymoon|romance/i.test(purpose) ? ['Special occasion outfit','Camera for memories'] : []),
    ];
  }

  /* ── Departure-specific travel tips ── */
  function getDepartureTips(depCity, dest, facts, mode) {
    const dep = depCity.toLowerCase();
    const tips = [];

    // Determine likely hub/route based on Indian cities
    const indianCities = {
      'mumbai': { hub: 'Mumbai (BOM)', routes: ['Mumbai → Dubai/Doha → ', 'Mumbai direct → '] },
      'delhi': { hub: 'Delhi (DEL)', routes: ['Delhi → Dubai/Abu Dhabi → ', 'Delhi direct → '] },
      'bangalore': { hub: 'Bangalore (BLR)', routes: ['Bangalore → Singapore/Dubai → ', 'Bangalore direct → '] },
      'bengaluru': { hub: 'Bangalore (BLR)', routes: ['Bangalore → Singapore/Dubai → ', 'Bangalore direct → '] },
      'chennai': { hub: 'Chennai (MAA)', routes: ['Chennai → Singapore/Kuala Lumpur → ', 'Chennai → Dubai → '] },
      'hyderabad': { hub: 'Hyderabad (HYD)', routes: ['Hyderabad → Dubai/Doha → ', 'Hyderabad direct → '] },
      'kolkata': { hub: 'Kolkata (CCU)', routes: ['Kolkata → Bangkok/Singapore → ', 'Kolkata → Dubai → '] },
      'kochi': { hub: 'Kochi (COK)', routes: ['Kochi → Dubai/Doha → ', 'Kochi → Abu Dhabi → '] },
      'calicut': { hub: 'Calicut (CCJ)', routes: ['Calicut → Dubai/Doha → ', 'Calicut → Abu Dhabi → '] },
      'kozhikode': { hub: 'Calicut (CCJ)', routes: ['Calicut → Dubai/Doha → ', 'Calicut → Abu Dhabi → '] },
      'trivandrum': { hub: 'Trivandrum (TRV)', routes: ['Trivandrum → Dubai/Colombo → ', 'Trivandrum → Abu Dhabi → '] },
      'goa': { hub: 'Goa (GOI)', routes: ['Goa → Mumbai/Dubai → ', 'Goa → Doha → '] },
      'pune': { hub: 'Pune (PNQ)', routes: ['Pune → Dubai → ', 'Pune → Mumbai → '] },
      'ahmedabad': { hub: 'Ahmedabad (AMD)', routes: ['Ahmedabad → Dubai/Doha → ', 'Ahmedabad → Mumbai → '] },
      'jaipur': { hub: 'Jaipur (JAI)', routes: ['Jaipur → Dubai → ', 'Jaipur → Delhi → '] },
      'lucknow': { hub: 'Lucknow (LKO)', routes: ['Lucknow → Dubai/Doha → ', 'Lucknow → Delhi → '] },
    };

    // Find matching city
    let cityData = null;
    for (const [key, val] of Object.entries(indianCities)) {
      if (dep.includes(key) || key.includes(dep)) { cityData = val; break; }
    }

    if (cityData) {
      tips.push({ icon: 'route', label: 'Best route', value: `${cityData.routes[0]}${dest}` });
    } else {
      tips.push({ icon: 'route', label: 'Best route', value: `${depCity} → nearest hub → ${dest}` });
    }

    tips.push({ icon: 'calendar-alt', label: 'Ideal months', value: facts.best });
    tips.push({ icon: 'ticket-alt', label: 'Pro tip', value: `Buy attraction tickets online in advance to skip long queues` });

    // Mode-specific tip
    if (mode === 'flight' || !mode) {
      tips.push({ icon: 'plane', label: 'Flight tip', value: 'Book 6–8 weeks early for best fares. Use Skyscanner or Google Flights.' });
    } else if (mode === 'train') {
      tips.push({ icon: 'train', label: 'Train tip', value: 'Get a rail pass if available (e.g., Eurail, JR Pass) for savings.' });
    }

    // Visa tip
    tips.push({ icon: 'id-card', label: 'Visa', value: `${facts.visa} — apply well in advance` });

    // Currency
    tips.push({ icon: 'coins', label: 'Currency', value: `${facts.currency} — carry some cash + international debit/credit card` });

    // Local transport
    const transportTips = {
      france: 'Use Paris Metro pass (Navigo) — very efficient & cost-effective!',
      japan: 'Get a Suica/Pasmo IC card for trains & convenience stores.',
      uk: 'Get an Oyster card or use contactless for the London Tube.',
      italy: 'Book Trenitalia/Italo trains in advance for intercity travel.',
      germany: 'Get a Deutschland-Ticket for unlimited regional train travel.',
      thailand: 'Use BTS Skytrain & MRT in Bangkok. Grab/Bolt for taxis.',
      singapore: 'Get an EZ-Link card for MRT & buses — very easy to use.',
      uae: 'Get a Nol card for Dubai Metro. Taxis are affordable too.',
      usa: 'Get a MetroCard (NYC) or use ride-sharing apps (Uber/Lyft).',
    };
    const tKey = Object.keys(transportTips).find(k => dest.toLowerCase().includes(k));
    if (tKey) {
      tips.push({ icon: 'subway', label: 'Local transport', value: transportTips[tKey] });
    }

    return tips;
  }

  /* ──────────────────────────────────────────
     CONVERSATION STEPS
  ────────────────────────────────────────── */
  const STEPS = [
    {
      id: 'welcome',
      ai: (t) => `👋 Hello! I'm <strong>GlobeMate AI</strong> — your personal travel planning assistant.\n\nI can see you're planning a trip to <strong>${t.destination || 'your destination'}</strong>${t.tripDate ? ` on <strong>${new Date(t.tripDate).toLocaleDateString('en-IN',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</strong>` : ''}.\n\nI'll craft a <strong>detailed day-by-day itinerary</strong> with an INR budget breakdown for your trip. Let's begin! 🌍\n\n<strong>What is the main purpose of this trip?</strong>`,
      chips: ['Tourism & Sightseeing','Business / Work','Honeymoon & Romance','Family Holiday','Adventure & Outdoors','Medical / Wellness'],
      key: 'purpose', multi: false, free: true
    },
    {
      id: 'duration',
      ai: (t,p) => `Great — a <strong>${p.purpose}</strong> trip! 🎉\n\n<strong>How many days will you spend in ${t.destination || 'the destination'}?</strong>`,
      chips: ['3 Days','5 Days','7 Days','10 Days','14 Days','21+ Days'],
      key: 'duration', multi: false, free: true,
      parse: ans => { const n = parseInt(ans); return isNaN(n) ? 5 : n; }
    },
    {
      id: 'accommodation',
      ai: (t,p) => `Perfect — <strong>${p.duration} days</strong> in ${t.destination}!\n\n<strong>Preferred type of accommodation?</strong>`,
      chips: ['Luxury 5-Star Hotel','3–4 Star Hotel','Budget Hotel / Guesthouse','Hostel / Dormitory','Airbnb / Apartment','No preference'],
      key: 'accommodation', multi: false, free: true
    },
    {
      id: 'travelers',
      ai: (_t,p) => `Staying at a <strong>${p.accommodation}</strong>! 🛎️\n\n<strong>How many travelers are going on this trip?</strong>`,
      chips: ['1 Person','2 People','3 People','4 People','5+ People'],
      key: 'travelers', multi: false, free: true,
      parse: ans => { 
        const n = parseInt(ans);
        if (ans.includes('5')) return 5;
        return isNaN(n) ? 1 : n;
      }
    },
    {
      id: 'interests',
      ai: (_t,p) => `Perfect — <strong>${p.travelers} traveler${p.travelers>1?'s':''}</strong> travelling together!\n\n<strong>What are your main interests?</strong> (Select all that apply, then click ✓ Confirm)`,
      chips: ['History & Culture','Food & Cuisine','Adventure & Hiking','Shopping','Nightlife','Nature & Wildlife','Photography','Relaxation & Spa'],
      key: 'interests', multi: true, free: true
    },
    {
      id: 'dietary',
      ai: (_t,p) => `Interests noted: <strong>${Array.isArray(p.interests)?p.interests.join(', '):p.interests}</strong>.\n\nAlmost done! Any <strong>dietary requirements or special needs</strong>?`,
      chips: ['None','Vegetarian','Vegan','Halal','Kosher','Gluten-free','Nut allergy'],
      key: 'dietary', multi: false, free: true
    },
    {
      id: 'generate',
      ai: (_t,p) => `All set! 🎯 Generating your personalised <strong>${p.duration}-day itinerary</strong> with full ₹ budget breakdown…\n\n⏳ This takes about 20 seconds while I research the best plan for you.`,
      chips: [], key: null, multi: false, free: false
    }
  ];

  function calcDays(s, e) {
    const d = new Date(e) - new Date(s);
    return Math.max(1, Math.round(d / 86400000));
  }

  // Map destination to packing destination type
  function getPackingDestinationType(destination) {
    const dest = (destination || '').toLowerCase();
    const maps = {
      beach: ['maldives', 'bali', 'mauritius', 'seychelles', 'fiji', 'thailand', 'caribbean', 'goa', 'andaman', 'lakshadweep'],
      city: ['paris', 'london', 'new york', 'tokyo', 'dubai', 'singapore', 'mumbai', 'delhi', 'bangalore', 'new orleans', 'los angeles', 'san francisco', 'chicago', 'berlin', 'rome', 'barcelona', 'amsterdam'],
      mountain: ['switzerland', 'nepal', 'bhutan', 'himalayas', 'alps', 'himachal', 'uttarakhand', 'darjeeling', 'sikkim', 'manali', 'shimla', 'kashmir'],
      winter: ['scandinavia', 'norway', 'iceland', 'canada', 'alaska', 'siberia', 'lapland', 'finland', 'sweden', 'japan skiing', 'korea'],
      adventure: ['south africa', 'national parks', 'costa rica', 'peru', 'amazon', 'explorer', 'safari', 'hiking', 'trekking', 'yosemite', 'yellowstone'],
    };
    
    for (const [type, locations] of Object.entries(maps)) {
      if (locations.some(loc => dest.includes(loc) || loc.includes(dest))) {
        return type;
      }
    }
    
    // Default based on keywords
    if (dest.includes('beach') || dest.includes('island') || dest.includes('tropical')) return 'beach';
    if (dest.includes('mountain') || dest.includes('hill') || dest.includes('trek') || dest.includes('hiking')) return 'mountain';
    if (dest.includes('cold') || dest.includes('winter') || dest.includes('snow')) return 'winter';
    if (dest.includes('adventure') || dest.includes('safari') || dest.includes('outdoor')) return 'adventure';
    if (dest.includes('city') || dest.includes('urban')) return 'city';
    
    return 'city'; // default
  }

  /* ──────────────────────────────────────────
     MODULE
  ────────────────────────────────────────── */
  const TripAIPlanner = {
    trip: {},
    prefs: {},
    step: 0,
    chosen: [],
    generatedHTML: '',
    pendingViewedItinerary: null,
    cdTimer: null,
    followUpMode: false,

    init() {
      injectStyles();

      const root = document.getElementById('trip-ai-planner-root');
      if (!root) return;

      this.pendingViewedItinerary = (typeof GlobeMateStore !== 'undefined')
        ? GlobeMateStore.consumeViewedItinerary()
        : null;

      if (this.pendingViewedItinerary?.trip) {
        this.trip = this.pendingViewedItinerary.trip;
      } else {
        const id = (typeof GlobeMateStore !== 'undefined')
          ? GlobeMateStore.getCurrentTripId()
          : parseInt(localStorage.getItem('globemate_ai_trip_id'), 10);
        const trips = (typeof GlobeMateStore !== 'undefined')
          ? GlobeMateStore.getTrips()
          : JSON.parse(localStorage.getItem('globemateTrips') || '[]');
        this.trip = trips.find(t => t.id === id) || trips[trips.length - 1] || {};
      }

      root.innerHTML = this.buildHTML();
      this.bindAll();

      if (this.pendingViewedItinerary?.html) {
        this.restoreSavedItinerary(this.pendingViewedItinerary);
      } else {
        this.reset();
      }
    },

    buildHTML() {
      const t = this.trip;
      const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{weekday:'short',month:'short',day:'numeric',year:'numeric'}) : '—';
      const modeIcon = m => m==='flight'?'plane':m==='train'?'train':m==='ship'?'ship':'bus';

      return `
<!-- Hero -->
<div class="tap-page-hero">
  <div class="tap-hero-badge"><i class="fas fa-robot"></i> GlobeMate AI Planner</div>
  <h2 class="tap-hero-title">Your <span>Smart Itinerary</span></h2>
  <p class="tap-hero-sub">Answer a few quick questions and our AI will build a complete day-by-day travel plan with INR budget — ready in 20 seconds.</p>
</div>

<!-- Trip bar -->
<div class="tap-bar" style="max-width:1160px;margin:0 auto 28px;padding:14px 24px;">
  <div class="tap-bar-item">
    <div class="tap-bar-icon"><i class="fas fa-map-marker-alt"></i></div>
    <div><span class="tap-bar-label">Destination</span><span class="tap-bar-val">${t.destination||'—'}</span></div>
  </div>
  <div class="tap-bar-sep"></div>
  <div class="tap-bar-item">
    <div class="tap-bar-icon"><i class="fas fa-calendar-alt"></i></div>
    <div><span class="tap-bar-label">Travel Date</span><span class="tap-bar-val">${fmtDate(t.tripDate)}</span></div>
  </div>
  <div class="tap-bar-sep"></div>
  <div class="tap-bar-item">
    <div class="tap-bar-icon"><i class="fas fa-map-pin"></i></div>
    <div><span class="tap-bar-label">Departing From</span><span class="tap-bar-val">${t.departureCity||'—'}</span></div>
  </div>
  <div class="tap-bar-sep"></div>
  <div class="tap-bar-item">
    <div class="tap-bar-icon"><i class="fas fa-${modeIcon(t.travelMode)}"></i></div>
    <div><span class="tap-bar-label">Travel Mode</span><span class="tap-bar-val">${t.travelMode?t.travelMode.charAt(0).toUpperCase()+t.travelMode.slice(1):'—'}</span></div>
  </div>
  <div class="tap-bar-sep"></div>
  <div class="tap-bar-item">
    <div class="tap-bar-icon"><i class="fas fa-users"></i></div>
    <div><span class="tap-bar-label">Passengers</span><span class="tap-bar-val">${t.passengers||'—'} Passenger${(t.passengers||1)>1?'s':''}</span></div>
  </div>
</div>

<!-- Main layout -->
<div class="tap-layout" style="max-width:1160px;margin:0 auto;padding:0 20px;">

  <!-- Chat column -->
  <div>
    <div class="tap-chat-card">
      <div class="tap-chat-top">
        <div class="tap-ai-ball"><i class="fas fa-robot"></i></div>
        <div class="tap-chat-meta">
          <h3>GlobeMate AI</h3>
          <span>Online & Ready</span>
        </div>
        <button class="tap-restart" id="tapRestart"><i class="fas fa-redo"></i> Restart</button>
      </div>
      <div class="tap-msgs" id="tapMsgs"></div>
      <div class="tap-chips-area" id="tapChipsArea" style="display:none">
        <div class="tap-chips-inner" id="tapChips"></div>
      </div>
      <div class="tap-input-row" id="tapInputRow" style="display:none">
        <input class="tap-txt" id="tapTxt" placeholder="Type your answer…" autocomplete="off">
        <button class="tap-send" id="tapSend"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
  </div>

  <!-- Right column -->
  <div class="tap-right" id="tapRight">

    <!-- Progress -->
    <div class="tap-prog-card">
      <div class="tap-prog-head"><i class="fas fa-tasks"></i> Planning Progress</div>
      <div id="tapProgRows">
        ${[['purpose','Purpose of Travel'],['duration','Trip Duration'],['accommodation','Accommodation'],['travelers','No. of Travelers'],['interests','Interests'],['dietary','Dietary / Special']].map(([k,l])=>`
        <div class="tap-prog-row" data-key="${k}">
          <div class="tap-prog-dot" id="dot-${k}"></div>
          <span class="tap-prog-lbl">${l}</span>
          <span class="tap-prog-val" id="val-${k}">—</span>
        </div>`).join('')}
      </div>
    </div>

    <!-- Countdown (hidden by default) -->
    <div class="tap-countdown-card" id="tapCountdown" style="display:none">
      <div class="tap-cd-title"><i class="fas fa-cogs"></i> Building Your Itinerary</div>
      <div class="tap-cd-ring">
        <svg viewBox="0 0 100 100" width="110" height="110">
          <defs>
            <linearGradient id="tapGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#7c3aed"/>
              <stop offset="100%" style="stop-color:#3b82f6"/>
            </linearGradient>
          </defs>
          <circle class="tap-cd-bg" cx="50" cy="50" r="45"/>
          <circle class="tap-cd-fill" id="tapCdArc" cx="50" cy="50" r="45"/>
        </svg>
        <div class="tap-cd-num" id="tapCdNum">20</div>
      </div>
      <p class="tap-cd-sub">Our AI is researching the best routes, stays & experiences for you</p>
      <div class="tap-cd-steps" id="tapCdSteps">
        <div class="tap-cd-step" data-idx="0"><div class="tap-cd-step-dot"></div><span>Analysing your destination & preferences…</span></div>
        <div class="tap-cd-step" data-idx="1"><div class="tap-cd-step-dot"></div><span>Mapping top attractions & hidden gems…</span></div>
        <div class="tap-cd-step" data-idx="2"><div class="tap-cd-step-dot"></div><span>Estimating INR budget breakdown…</span></div>
        <div class="tap-cd-step" data-idx="3"><div class="tap-cd-step-dot"></div><span>Crafting day-by-day schedule…</span></div>
        <div class="tap-cd-step" data-idx="4"><div class="tap-cd-step-dot"></div><span>Writing local food & packing guide…</span></div>
        <div class="tap-cd-step" data-idx="5"><div class="tap-cd-step-dot"></div><span>Finalising tips & recommendations…</span></div>
      </div>
    </div>

    <!-- Itinerary output (hidden initially) -->
    <div class="tap-itin-card" id="tapItinCard" style="display:none">
      <div class="tap-itin-head">
        <div class="tap-itin-icon"><i class="fas fa-map-signs"></i></div>
        <div>
          <h3 id="tapItinTitle">Your Travel Itinerary</h3>
          <p id="tapItinSub">Generated by GlobeMate AI</p>
        </div>
        <div class="tap-itin-btns">
          <button class="tap-btn-sm tap-btn-save" id="tapSaveBtn"><i class="fas fa-save"></i> Save</button>
          <button class="tap-btn-sm" id="tapPrintBtn"><i class="fas fa-print"></i> Print</button>
          <button class="tap-btn-sm" id="tapShareBtn"><i class="fas fa-share-alt"></i> Share</button>
        </div>
      </div>
      <div class="tap-itin-body" id="tapItinBody"></div>
    </div>

  </div>
</div>

<!-- Navigation Bar -->
<div class="tap-back-bar" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding:26px 20px 0;">
  <button class="tap-back-btn" data-tab="trip-planner"><i class="fas fa-arrow-left"></i> Back to Trip Planner</button>
  <button class="tap-packing-btn" id="tapPackingBtn" style="padding:10px 16px;border-radius:8px;border:1.5px solid #7c3aed;background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff;font-size:.88rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:inherit;transition:all .2s;">
    <i class="fas fa-suitcase-rolling"></i> Go to Packing
  </button>
</div>`;
    },

    bindAll() {
      document.getElementById('tapRestart')?.addEventListener('click', () => this.reset());
      document.getElementById('tapSend')?.addEventListener('click', () => this.handleInput());
      document.getElementById('tapTxt')?.addEventListener('keypress', e => { if (e.key==='Enter') this.handleInput(); });
      document.getElementById('tapSaveBtn')?.addEventListener('click', () => this.saveItinerary());
      document.getElementById('tapPrintBtn')?.addEventListener('click', () => this.printItinerary());
      document.getElementById('tapShareBtn')?.addEventListener('click', () => this.shareItinerary());
      document.getElementById('tapPackingBtn')?.addEventListener('click', () => this.goToPacking());
    },

    goToPacking() {
      // Validate that itinerary has been generated
      if (!this.prefs.duration || !this.trip.destination) {
        if (typeof showToast === 'function') {
          showToast('Please complete the itinerary first!', 'warning');
        }
        return;
      }

      // Store packing parameters from AI conversation
      const packingData = {
        destType: getPackingDestinationType(this.trip.destination),
        duration: this.prefs.duration || 7,
        travelers: this.prefs.travelers || 1,
        destination: this.trip.destination
      };
      localStorage.setItem('globemate_packing_prefill', JSON.stringify(packingData));
      
      // Navigate to packing page
      if (typeof PageLoader !== 'undefined') {
        PageLoader.loadPage('packing');
      } else {
        // Fallback navigation
        const packingSection = document.getElementById('packing');
        if (packingSection) {
          packingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },

    reset() {
      clearInterval(this.cdTimer);
      this.prefs  = {};
      this.step   = 0;
      this.chosen = [];
      this.generatedHTML = '';
      this.followUpMode = false;

      document.getElementById('tapMsgs').innerHTML = '';
      document.getElementById('tapCountdown').style.display = 'none';
      document.getElementById('tapItinCard').style.display  = 'none';

      ['purpose','duration','accommodation','travelers','interests','dietary'].forEach(k => {
        const v = document.getElementById(`val-${k}`);
        const d = document.getElementById(`dot-${k}`);
        if (v) v.textContent = '—';
        if (d) d.classList.remove('done');
      });

      this.runStep(0);
    },

    restoreSavedItinerary(savedItinerary) {
      clearInterval(this.cdTimer);
      this.prefs = savedItinerary?.prefs || {};
      this.generatedHTML = savedItinerary?.html || '';

      const messages = document.getElementById('tapMsgs');
      const countdown = document.getElementById('tapCountdown');
      const chipsArea = document.getElementById('tapChipsArea');
      const inputRow = document.getElementById('tapInputRow');
      const body = document.getElementById('tapItinBody');
      const card = document.getElementById('tapItinCard');
      const title = document.getElementById('tapItinTitle');
      const sub = document.getElementById('tapItinSub');

      if (messages) messages.innerHTML = '';
      if (countdown) countdown.style.display = 'none';
      if (chipsArea) chipsArea.style.display = 'none';
      if (inputRow) {
        inputRow.style.display = 'flex';
        const txt = document.getElementById('tapTxt');
        if (txt) txt.placeholder = 'Ask anything about your itinerary...';
      }

      ['purpose','duration','accommodation','travelers','interests','dietary'].forEach((key) => {
        const valueEl = document.getElementById(`val-${key}`);
        const dotEl = document.getElementById(`dot-${key}`);
        const value = this.prefs[key];
        if (valueEl) {
          valueEl.textContent = Array.isArray(value) ? value.join(', ') : (value || '—');
        }
        if (dotEl && value) dotEl.classList.add('done');
      });

      if (title) title.textContent = `${this.prefs.duration || 5}-Day ${this.trip.destination || 'Trip'} Itinerary`;
      if (sub) sub.textContent = `Personalised for ${this.prefs.purpose || 'your trip'} · GlobeMate AI`;
      if (body) body.innerHTML = this.generatedHTML;
      if (card) card.style.display = this.generatedHTML ? 'block' : 'none';
      this.followUpMode = Boolean(this.generatedHTML);

      this.addMsg('ai', `✅ Loaded your saved itinerary for <strong>${this.trip.destination || 'your destination'}</strong>. Click <strong>Restart</strong> if you want to regenerate it.`);
      this.addMsg('ai', 'You can also ask follow-up questions about this trip plan and destination.');
    },

    runStep(idx) {
      const s = STEPS[idx];
      if (!s) return;
      this.showTyping();
      setTimeout(() => {
        this.hideTyping();
        this.addMsg('ai', s.ai(this.trip, this.prefs));
        this.renderChips(s);
        const ir = document.getElementById('tapInputRow');
        if (ir) ir.style.display = s.free ? 'flex' : 'none';
        if (s.id === 'generate') setTimeout(() => this.startCountdown(), 800);
      }, 700);
    },

    renderChips(s) {
      const area = document.getElementById('tapChipsArea');
      const box  = document.getElementById('tapChips');
      if (!box || !area) return;
      this.chosen = [];
      box.innerHTML = '';
      if (!s.chips || !s.chips.length) { area.style.display = 'none'; return; }
      area.style.display = 'block';

      s.chips.forEach(label => {
        const btn = document.createElement('button');
        btn.className = 'tap-chip';
        btn.textContent = label;
        btn.addEventListener('click', () => {
          if (s.multi) {
            btn.classList.toggle('on');
            if (btn.classList.contains('on')) this.chosen.push(label);
            else this.chosen = this.chosen.filter(x => x !== label);
          } else {
            this.processAnswer(s, label);
          }
        });
        box.appendChild(btn);
      });

      if (s.multi) {
        const ok = document.createElement('button');
        ok.className = 'tap-chip tap-chip-ok';
        ok.innerHTML = '<i class="fas fa-check"></i> Confirm';
        ok.addEventListener('click', () => {
          const ans = this.chosen.length ? this.chosen.join(', ') : 'No preference';
          this.processAnswer(s, ans);
        });
        box.appendChild(ok);
      }
    },

    async handleInput() {
      const txt = document.getElementById('tapTxt');
      if (!txt || !txt.value.trim()) return;
      const s = STEPS[this.step];
      const val = txt.value.trim();
      txt.value = '';

      if (!s && this.followUpMode) {
        await this.handleFollowUpQuestion(val);
        return;
      }

      if (!s) return;
      this.processAnswer(s, val);
    },

    escapeHtml(text) {
      return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    getGroqKey() {
      return (window.GROQ_API_KEY || '').trim();
    },

    parseGroqText(data) {
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === 'string' && content.trim()) return content.trim();
      return null;
    },

    async askGroqFollowUp(question) {
      const groqKey = this.getGroqKey();
      if (!groqKey) return null;

      const context = {
        trip: {
          destination: this.trip.destination || '',
          tripDate: this.trip.tripDate || '',
          departureCity: this.trip.departureCity || '',
          travelMode: this.trip.travelMode || '',
          passengers: this.trip.passengers || ''
        },
        preferences: this.prefs || {}
      };

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are GlobeMate AI itinerary assistant. Answer trip follow-up questions clearly and practically. Keep replies under 120 words.' },
            { role: 'user', content: `Trip context: ${JSON.stringify(context)}` },
            { role: 'user', content: question }
          ],
          temperature: 0.4,
          max_tokens: 260
        })
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Groq request failed: ${response.status} ${detail}`);
      }

      const data = await response.json();
      return this.parseGroqText(data);
    },

    async handleFollowUpQuestion(question) {
      this.addMsg('user', question);
      this.showTyping();

      try {
        const answer = await this.askGroqFollowUp(question);
        this.hideTyping();
        if (answer) {
          this.addMsg('ai', this.escapeHtml(answer));
          return;
        }
      } catch (error) {
        this.hideTyping();
        console.warn('Trip follow-up Groq request failed:', error);
        this.addMsg('ai', `I could not reach Groq right now (${this.escapeHtml(error.message || 'request failed')}). Try again in a moment.`);
        return;
      }

      this.hideTyping();
      this.addMsg('ai', 'Groq key is not configured for follow-up Q&A. Please set window.GROQ_API_KEY in your local config.');
    },

    processAnswer(s, answer) {
      document.getElementById('tapChipsArea').style.display = 'none';
      this.addMsg('user', answer);
      const parsed = s.parse ? s.parse(answer) : answer;
      if (s.key) {
        this.prefs[s.key] = parsed;
        this.updateProg(s.key, Array.isArray(parsed) ? parsed.join(', ') : String(parsed));
      }
      this.step++;
      if (this.step < STEPS.length) this.runStep(this.step);
    },

    updateProg(key, val) {
      const v = document.getElementById(`val-${key}`);
      const d = document.getElementById(`dot-${key}`);
      if (v) v.textContent = val.length > 28 ? val.slice(0,26)+'…' : val;
      if (d) d.classList.add('done');
    },

    /* ── Countdown (20 seconds) ── */
    startCountdown() {
      const cd = document.getElementById('tapCountdown');
      if (cd) cd.style.display = 'block';
      let secs = 20;
      const arc = document.getElementById('tapCdArc');
      const num = document.getElementById('tapCdNum');
      const circumference = 283;
      const cdStepEls = document.querySelectorAll('.tap-cd-step');
      const stepTimes = [18, 15, 12, 8, 4, 1]; // seconds remaining when each step lights up

      if (arc) arc.style.strokeDashoffset = '0';

      this.cdTimer = setInterval(() => {
        secs--;
        if (num) num.textContent = Math.max(secs, 0);
        if (arc) arc.style.strokeDashoffset = String(circumference - (circumference * ((20 - secs) / 20)));

        // light up steps
        stepTimes.forEach((threshold, i) => {
          if (secs <= threshold && cdStepEls[i]) cdStepEls[i].classList.add('lit');
        });

        if (secs <= 0) {
          clearInterval(this.cdTimer);
          if (cd) cd.style.display = 'none';
          this.showItinerary();
        }
      }, 1000);
    },

    showItinerary() {
      try {
        const html    = generateItinerary(this.trip, this.prefs);
        this.generatedHTML = html;

        const card    = document.getElementById('tapItinCard');
        const body    = document.getElementById('tapItinBody');
        const title   = document.getElementById('tapItinTitle');
        const sub     = document.getElementById('tapItinSub');

        if (title) title.textContent = `${this.prefs.duration||5}-Day ${this.trip.destination||'Trip'} Itinerary`;
        if (sub)   sub.textContent   = `Personalised for ${this.prefs.purpose||'your trip'} · GlobeMate AI`;
        if (body)  body.innerHTML    = html;
        if (card)  card.style.display = 'block';
        this.followUpMode = true;

        const inputRow = document.getElementById('tapInputRow');
        const input = document.getElementById('tapTxt');
        if (inputRow) inputRow.style.display = 'flex';
        if (input) input.placeholder = 'Ask follow-up questions about this itinerary...';
        const chipsArea = document.getElementById('tapChipsArea');
        if (chipsArea) chipsArea.style.display = 'none';

        card.scrollIntoView({ behavior: 'smooth', block: 'start' });

        this.addMsg('ai', `✅ Your <strong>${this.prefs.duration||5}-day ${this.trip.destination||''} itinerary</strong> is ready with a full ₹ budget breakdown! 🎉\n\nScroll down to explore it. Use <strong>Save</strong> to store it, <strong>Print</strong> for a PDF, or <strong>Restart</strong> to adjust anything.`);
        this.addMsg('ai', 'Ask me anything else about your plan, transport, costs, or local tips.');
      } catch (err) {
        console.error('GlobeMate AI — itinerary generation error:', err);
        this.addMsg('ai', `⚠️ Oops! Something went wrong while generating your itinerary. Please click <strong>Restart</strong> and try again.`);
      }
    },

    /* ── Save ── */
    saveItinerary() {
      const entry = {
        id: Date.now(),
        destination: this.trip.destination || 'Unknown',
        date: new Date().toISOString(),
        prefs: this.prefs,
        trip: this.trip,
        html: this.generatedHTML
      };

      if (typeof GlobeMateStore !== 'undefined') {
        GlobeMateStore.saveItinerary(entry);
      } else {
        const saved = JSON.parse(localStorage.getItem('globemate_saved_itineraries') || '[]');
        saved.unshift(entry);
        localStorage.setItem('globemate_saved_itineraries', JSON.stringify(saved));
      }

      const btn = document.getElementById('tapSaveBtn');
      if (btn) {
        btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
        btn.style.borderColor = 'transparent';
        setTimeout(() => {
          btn.innerHTML = '<i class="fas fa-save"></i> Save';
          btn.style.background = '';
          btn.style.borderColor = '';
        }, 2500);
      }
      if (typeof showToast === 'function') showToast(`Itinerary saved — ${this.trip.destination}!`, 'success');
    },

    /* ── Print ── */
    printItinerary() {
      const body = document.getElementById('tapItinBody');
      if (!body) return;
      const w = window.open('', '_blank');
      w.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>${this.trip.destination||'Trip'} Itinerary — GlobeMate</title>
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
<style>
  body{font-family:'Inter',sans-serif;padding:28px;color:#0f172a;line-height:1.6;font-size:14px}
  h1{color:#7c3aed;margin-bottom:4px} .meta{color:#64748b;font-size:12px;margin-bottom:20px}
  .tap-overview{background:#1e1b4b;color:#fff;border-radius:10px;padding:16px;display:flex;flex-wrap:wrap;gap:14px;margin-bottom:16px}
  .tap-ov-item i{color:rgba(139,92,246,.8);margin-right:6px}
  .tap-ov-item small{font-size:10px;text-transform:uppercase;color:rgba(255,255,255,.45);display:block}
  .tap-ov-item strong{color:#fff;font-size:13px}
  .tap-pills{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
  .tap-pill{background:rgba(59,130,246,.07);border:1px solid rgba(59,130,246,.2);color:#2563eb;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:600}
  .tap-sec-label{font-weight:800;font-size:13px;border-bottom:2px solid #f1f5f9;padding-bottom:6px;margin:18px 0 10px;display:flex;align-items:center;gap:6px}
  .tap-sec-label i{color:#7c3aed}
  .tap-budget-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:6px}
  .tap-b-item{display:flex;align-items:center;gap:8px;padding:8px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc}
  .tap-b-icon{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:.8rem}
  .tap-b-cat{font-size:10px;color:#64748b;display:block} .tap-b-amt{font-size:13px;font-weight:800;display:block}
  .tap-b-total{grid-column:1/-1;background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff;padding:10px 14px;border-radius:8px;display:flex;justify-content:space-between}
  .tap-b-total strong{font-size:1.1rem}
  .tap-day{border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:12px}
  .tap-day-hdr{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
  .tap-day-num{background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:800}
  .tap-day-ti{font-weight:700;font-size:13px}
  .tap-day-body{padding:10px 14px}
  .tap-slot{display:flex;gap:10px;margin-bottom:7px;padding:7px;border-radius:7px;background:#f8fafc}
  .tap-slot-tag{font-size:10px;font-weight:700;padding:3px 8px;border-radius:5px;flex-shrink:0;width:80px}
  .morning{background:rgba(245,158,11,.1);color:#b45309} .afternoon{background:rgba(59,130,246,.1);color:#1d4ed8} .evening{background:rgba(139,92,246,.1);color:#7c3aed}
  .tap-slot-act{font-size:12px;font-weight:700;margin:0 0 2px} .tap-slot-det{font-size:11px;color:#64748b;margin:0}
  .tap-food-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
  .tap-food-item{display:flex;align-items:center;gap:6px;padding:7px;border-radius:8px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.18);font-size:11px;font-weight:600}
  .tap-hl-wrap{display:flex;flex-wrap:wrap;gap:6px}
  .tap-hl-chip{display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:100px;background:rgba(124,58,237,.06);border:1px solid rgba(124,58,237,.2);font-size:11px;font-weight:600}
  .tap-hl-n{width:15px;height:15px;border-radius:50%;background:#7c3aed;color:#fff;font-size:9px;display:flex;align-items:center;justify-content:center;font-weight:800}
  .tap-pack-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
  .tap-pack-item{display:flex;align-items:center;gap:6px;padding:6px 9px;border-radius:7px;background:rgba(16,185,129,.05);border:1px solid rgba(16,185,129,.18);font-size:11px}
  .tap-pack-item i{color:#10b981}
  .tap-tips-ul{list-style:none;padding:0;display:flex;flex-direction:column;gap:6px}
  .tap-tips-ul li{display:flex;align-items:flex-start;gap:8px;padding:7px 10px;border-radius:7px;background:#f8fafc;border:1px solid #e2e8f0;font-size:11px}
  .tap-tips-ul li i{color:#f59e0b;margin-top:1px}
  .tap-slot-items{display:flex;flex-direction:column;gap:4px}
  .tap-slot-item{display:flex;align-items:flex-start;gap:6px;font-size:11px;color:#0f172a;padding:2px 0}
  .tap-slot-item i{color:#7c3aed;font-size:9px;margin-top:3px}
  .tap-day-options{padding:12px 14px;display:flex;flex-direction:column;gap:10px}
  .tap-option{border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#f8fafc}
  .tap-option-header{display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(124,58,237,.05);border-bottom:1px solid #e2e8f0;font-weight:700;font-size:11px;color:#1e1b4b}
  .tap-option-emoji{font-size:14px}
  .tap-option-items{padding:8px 12px;display:flex;flex-direction:column;gap:4px}
  .tap-option-divider{text-align:center;font-size:10px;font-weight:700;color:#94a3b8;padding:2px 0}
  .tap-route-card{background:linear-gradient(135deg,#eff6ff,#f0fdf4);border:1px solid #bfdbfe;border-radius:10px;padding:14px 16px;margin-bottom:10px}
  .tap-route-title{font-weight:700;font-size:12px;color:#1e40af;margin-bottom:10px;display:flex;align-items:center;gap:6px}
  .tap-route-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}
  .tap-route-item{display:flex;align-items:flex-start;gap:7px;padding:7px 10px;border-radius:7px;background:#fff;border:1px solid #e2e8f0;font-size:10px}
  .tap-route-item i{color:#3b82f6;margin-top:1px}
  @media print{body{padding:0 8px}}
</style>
</head><body>
<h1>🌍 ${this.trip.destination||'Trip'} — Travel Itinerary</h1>
<div class="meta">Generated by GlobeMate AI &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-IN')} &nbsp;·&nbsp; Purpose: ${this.prefs.purpose||'—'} &nbsp;·&nbsp; Duration: ${this.prefs.duration||5} Days &nbsp;·&nbsp; Budget: ${this.prefs.budget||'—'}</div>
${body.innerHTML}
</body></html>`);
      w.document.close();
      setTimeout(() => w.print(), 600);
    },

    /* ── Share ── */
    shareItinerary() {
      const text = `My ${this.prefs.duration||5}-day ${this.trip.destination||'trip'} itinerary — planned with GlobeMate AI! 🌍✈️ Budget: ${this.prefs.budget||'—'}`;
      if (navigator.share) {
        navigator.share({ title: 'My GlobeMate Itinerary', text }).catch(()=>{});
      } else {
        navigator.clipboard?.writeText(text).then(() => {
          if (typeof showToast === 'function') showToast('Itinerary summary copied!', 'success');
        });
      }
    },

    /* ── Messages helpers ── */
    addMsg(role, text) {
      const msgs = document.getElementById('tapMsgs');
      if (!msgs) return;
      const div = document.createElement('div');
      div.className = `tap-msg tap-msg-${role}`;
      const html = text.replace(/\n/g,'<br>');
      if (role === 'ai') {
        div.innerHTML = `<div class="tap-av tap-av-ai"><i class="fas fa-robot"></i></div>
          <div class="tap-bubble">${html}</div>`;
      } else {
        const safe = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        div.innerHTML = `<div class="tap-bubble tap-bubble-user">${safe}</div>
          <div class="tap-av tap-av-user"><i class="fas fa-user"></i></div>`;
      }
      msgs.appendChild(div);
      requestAnimationFrame(() => div.classList.add('show'));
      msgs.scrollTop = msgs.scrollHeight;
    },

    showTyping() {
      const msgs = document.getElementById('tapMsgs');
      if (!msgs) return;
      const d = document.createElement('div');
      d.className = 'tap-msg tap-msg-ai'; d.id = 'tapTyping';
      d.innerHTML = `<div class="tap-av tap-av-ai"><i class="fas fa-robot"></i></div>
        <div class="tap-bubble"><div class="tap-typing-wrap">
          <span class="tap-dot"></span><span class="tap-dot"></span><span class="tap-dot"></span>
        </div></div>`;
      msgs.appendChild(d);
      requestAnimationFrame(() => d.classList.add('show'));
      msgs.scrollTop = msgs.scrollHeight;
    },

    hideTyping() {
      document.getElementById('tapTyping')?.remove();
    },

    cleanup() {
      clearInterval(this.cdTimer);
      const style = document.getElementById('tap-styles');
      if (style) style.remove();
    }
  };

  window.TripAIPlanner = TripAIPlanner;

  if (typeof PageLoader !== 'undefined') {
    PageLoader.registerModule('trip-ai-planner', TripAIPlanner);
  }
})();
