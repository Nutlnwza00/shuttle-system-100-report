// =====================================================================
// Shuttle Bus System (MUT) - ชุดหน้าจอใหม่ทั้งหมด (โทนมืด) สำหรับกลุ่ม Embedded
// วิธีใช้: Figma (เบราว์เซอร์) > Plugins > Scripter > New script > วางไฟล์นี้ทั้งไฟล์ > Run
//
// สร้าง 21 เฟรม วางทางขวาสุดของหน้าปัจจุบัน (ไม่ทับของเดิม เฟรมใหม่ขึ้นต้นด้วยเลขลำดับ):
//  01 WEB  02 LOGIN  03 DASHBOARD-ADMIN  04 DASHBOARD-USER  05 PROFILE  06 ไม่มีสิทธิ์เข้าถึง
//  07-10 จัดการพนักงาน (รายการ/เพิ่ม/แก้ไข/ลบ)   11-13 จัดการสิทธิ์ Dynamic (หลัก/เพิ่มตำแหน่ง/ลบไม่ได้)
//  14 เลือกรายงาน   15-21 รายงานที่ 1-7 (ตัวกรอง + ตารางรายละเอียด + กราฟ)
// หมายเหตุ: ตัวเลขทั้งหมดเป็นข้อมูลตัวอย่างจากเอกสาร requirement
// =====================================================================

(async () => {
  try {
    // ---------- โหลดฟอนต์ ----------
    let FAM = 'Prompt';
    const STY = ['Regular', 'Medium', 'SemiBold', 'Bold'];
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    try {
      for (const s of STY) await figma.loadFontAsync({ family: FAM, style: s });
    } catch (e) {
      FAM = 'Inter';
      for (const s of STY) await figma.loadFontAsync({ family: FAM, style: s });
      figma.notify('ไม่พบฟอนต์ Prompt จึงใช้ Inter แทน');
    }

    // ---------- สี / เอฟเฟกต์ ----------
    const hex = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
    const col = (h) => { const c = hex(h); c.a = 1; return c; };
    const P = (h, o) => ({ type: 'SOLID', color: hex(h), opacity: o === undefined ? 1 : o });
    const SHADOW = [
      { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 8 }, radius: 10, spread: 0, visible: true, blendMode: 'NORMAL' },
      { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 20 }, radius: 25, spread: 0, visible: true, blendMode: 'NORMAL' },
    ];
    const BG = { type: 'GRADIENT_LINEAR', gradientTransform: [[0.5, 0.5, 0], [-0.25, 0.25, 0.5]], gradientStops: [{ position: 0, color: col('#111827') }, { position: 0.5, color: col('#1f2937') }, { position: 1, color: col('#374151') }] };
    const NAVG = { type: 'GRADIENT_LINEAR', gradientTransform: [[1, 0, 0], [0, 0.5, 0.25]], gradientStops: [{ position: 0, color: col('#1f2937') }, { position: 1, color: col('#374151') }] };
    const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const sum = (a) => a.reduce((x, y) => x + y, 0);

    // ---------- helper พื้นฐาน ----------
    function T(s, size, style, color) {
      const t = figma.createText();
      t.fontName = { family: FAM, style: style };
      t.characters = String(s);
      t.fontSize = size;
      t.fills = [P(color)];
      return t;
    }
    function AL(dir, o) {
      o = o || {};
      const f = figma.createFrame();
      f.name = o.name || 'Frame';
      f.layoutMode = dir;
      f.primaryAxisSizingMode = 'AUTO';
      f.counterAxisSizingMode = 'AUTO';
      f.itemSpacing = o.gap || 0;
      f.fills = [];
      f.clipsContent = false;
      const px = o.px !== undefined ? o.px : (o.pad || 0);
      const py = o.py !== undefined ? o.py : (o.pad || 0);
      f.paddingLeft = px; f.paddingRight = px; f.paddingTop = py; f.paddingBottom = py;
      if (o.main) f.primaryAxisAlignItems = o.main;
      if (o.cross) f.counterAxisAlignItems = o.cross;
      return f;
    }
    // ความกว้างคงที่ ความสูงยืดตามเนื้อหา
    function fixW(f, w) {
      f.resize(w, 100);
      if (f.layoutMode === 'VERTICAL') { f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'FIXED'; }
      else { f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'AUTO'; }
    }
    function fillW(parent, child) { parent.appendChild(child); child.layoutSizingHorizontal = 'FILL'; return child; }
    function card(dir, o) {
      o = o || {};
      const f = AL(dir, { name: o.name || 'Card', gap: o.gap === undefined ? 16 : o.gap, pad: o.pad === undefined ? 24 : o.pad });
      f.fills = [P('#0f172a', o.solid ? 1 : 0.8)];
      f.strokes = [P(o.solid ? '#475569' : '#334155')];
      f.strokeWeight = 1; f.strokeAlign = 'INSIDE';
      f.cornerRadius = o.r || 12;
      f.effects = SHADOW;
      return f;
    }
    function divider(parent) {
      const d = figma.createRectangle();
      d.name = 'Divider'; d.resize(10, 1); d.fills = [P('#334155')];
      parent.appendChild(d); d.layoutSizingHorizontal = 'FILL';
      return d;
    }
    function badge(txt, c, tc) {
      const b = AL('HORIZONTAL', { name: 'Badge', px: 10, py: 3, cross: 'CENTER' });
      b.fills = [P(c, 0.1)]; b.strokes = [P(c)]; b.strokeWeight = 1; b.cornerRadius = 9999;
      b.appendChild(T(txt, 12, 'SemiBold', tc));
      return b;
    }
    // kind: primary | ghost | danger | dangerGhost | tint
    function btn(label, kind, small) {
      const b = AL('HORIZONTAL', { name: 'Button / ' + kind, gap: 8, px: small ? 14 : 24, py: small ? 6 : 10, main: 'CENTER', cross: 'CENTER' });
      b.cornerRadius = 8;
      let tc = '#ffffff';
      if (kind === 'primary') { b.fills = [P('#4f46e5')]; b.effects = [SHADOW[0]]; }
      else if (kind === 'danger') { b.fills = [P('#dc2626')]; b.effects = [SHADOW[0]]; }
      else if (kind === 'ghost') { b.strokes = [P('#475569')]; b.strokeWeight = 1.5; b.strokeAlign = 'INSIDE'; tc = '#cbd5e1'; }
      else if (kind === 'dangerGhost') { b.fills = [P('#ef4444', 0.1)]; b.strokes = [P('#ef4444')]; b.strokeWeight = 1; b.strokeAlign = 'INSIDE'; tc = '#f87171'; }
      else if (kind === 'tint') { b.fills = [P('#6366f1', 0.1)]; b.strokes = [P('#6366f1')]; b.strokeWeight = 1; b.strokeAlign = 'INSIDE'; tc = '#818cf8'; }
      b.appendChild(T(label, small ? 13 : 15, 'SemiBold', tc));
      return b;
    }
    function field(label, value, o) {
      o = o || {};
      const f = AL('VERTICAL', { name: 'Field / ' + label, gap: 8 });
      f.appendChild(T(label, 14, 'Medium', '#cbd5e1'));
      const inp = AL('HORIZONTAL', { name: 'Input', px: 14, py: 10, main: 'SPACE_BETWEEN', cross: 'CENTER' });
      inp.fills = [P('#ffffff')]; inp.cornerRadius = 8;
      inp.appendChild(T(value, 16, 'Regular', o.placeholder ? '#9ca3af' : '#111827'));
      if (o.icon) inp.appendChild(T(o.icon, 14, 'Regular', '#6b7280'));
      f.appendChild(inp); inp.layoutSizingHorizontal = 'FILL';
      if (o.hint) f.appendChild(T(o.hint, 12, 'Regular', '#9ca3af'));
      return f;
    }
    function toggle(on, label) {
      const r = AL('HORIZONTAL', { name: 'Status Toggle', gap: 10, cross: 'CENTER' });
      const tr = figma.createFrame();
      tr.name = 'Toggle'; tr.resize(44, 24); tr.cornerRadius = 12; tr.fills = [P(on ? '#10b981' : '#475569')]; tr.clipsContent = false;
      const k = figma.createEllipse();
      k.resize(18, 18); k.fills = [P('#ffffff')]; tr.appendChild(k); k.x = on ? 23 : 3; k.y = 3;
      r.appendChild(tr);
      r.appendChild(T(label, 14, 'Medium', on ? '#34d399' : '#9ca3af'));
      return r;
    }
    function checkbox(on) {
      const b = figma.createFrame();
      b.name = on ? 'Checkbox / checked' : 'Checkbox / unchecked';
      b.resize(22, 22); b.cornerRadius = 6; b.clipsContent = false;
      if (on) {
        b.fills = [P('#4f46e5')];
        const t = T('✓', 14, 'Bold', '#ffffff');
        b.appendChild(t); t.x = Math.round((22 - t.width) / 2); t.y = Math.round((22 - t.height) / 2);
      } else {
        b.fills = [P('#1e293b')]; b.strokes = [P('#64748b')]; b.strokeWeight = 1.5; b.strokeAlign = 'INSIDE';
      }
      return b;
    }

    // ตาราง: cols [{label,w(0=ยืด),align,color,style,size}] rows: array หรือ {total:true,cells:[...]}
    function table(cols, rows, name, o) {
      o = o || {};
      const gap = o.gap === undefined ? 16 : o.gap;
      const fs = o.size || 14;
      const t = AL('VERTICAL', { name: name || 'Table' });
      t.strokes = [P('#334155')]; t.strokeWeight = 1; t.strokeAlign = 'INSIDE'; t.cornerRadius = 8; t.clipsContent = true;
      const mk = (items, head, isTotal) => {
        const r = AL('HORIZONTAL', { name: head ? 'Table Header' : (isTotal ? 'Table Total' : 'Table Row'), gap: gap, px: 16, py: head ? 12 : (o.py || 10), cross: 'CENTER' });
        if (head) r.fills = [P('#1e293b', 0.8)];
        else if (isTotal) r.fills = [P('#6366f1', 0.1)];
        t.appendChild(r); r.layoutSizingHorizontal = 'FILL';
        items.forEach((it, i) => {
          const c = cols[i];
          const cell = AL('HORIZONTAL', { name: 'Cell', cross: 'CENTER', main: c.align === 'center' ? 'CENTER' : (c.align === 'right' ? 'MAX' : 'MIN') });
          const node = (typeof it === 'string' || typeof it === 'number')
            ? T(it, head ? 12 : (c.size || fs), head ? 'Bold' : (isTotal ? 'Bold' : (c.style || 'Regular')), head ? '#cbd5e1' : (isTotal ? '#ffffff' : (c.color || '#cbd5e1')))
            : it;
          cell.appendChild(node);
          r.appendChild(cell);
          if (c.w) { cell.resize(c.w, cell.height); cell.primaryAxisSizingMode = 'FIXED'; cell.counterAxisSizingMode = 'AUTO'; }
          else cell.layoutSizingHorizontal = 'FILL';
        });
      };
      mk(cols.map((c) => c.label), true, false);
      rows.forEach((row, idx) => {
        if (Array.isArray(row)) mk(row, false, false); else mk(row.cells, false, !!row.total);
        if (idx < rows.length - 1) divider(t);
      });
      return t;
    }

    // ---------- โครงหน้า ----------
    function newScreen(name) {
      const root = figma.createFrame();
      root.name = name; root.resize(1440, 900); root.fills = [BG]; root.clipsContent = true;
      const page = figma.createFrame();
      page.name = 'Page'; page.layoutMode = 'VERTICAL'; page.resize(1440, 100);
      page.primaryAxisSizingMode = 'AUTO'; page.counterAxisSizingMode = 'FIXED';
      page.itemSpacing = 0; page.fills = []; page.clipsContent = false;
      root.appendChild(page); page.x = 0; page.y = 0;
      return { root: root, page: page };
    }
    function buildNav(page, user, publicNav) {
      const nav = AL('HORIZONTAL', { name: 'Navigation', px: 24, py: 16, main: 'SPACE_BETWEEN', cross: 'CENTER' });
      nav.fills = [NAVG];
      nav.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 4 }, radius: 6, spread: 0, visible: true, blendMode: 'NORMAL' }];
      fillW(page, nav);
      nav.appendChild(T('🚐 Shuttle Bus System', 20, 'Bold', '#ffffff'));
      const r = AL('HORIZONTAL', { name: 'Nav Right', gap: 24, cross: 'CENTER' });
      if (publicNav) {
        r.appendChild(T('เข้าสู่ระบบ', 14, 'Regular', '#ffffff'));
      } else {
        r.appendChild(T('สวัสดีคุณ ' + user, 14, 'Regular', '#9ca3af'));
        r.appendChild(T('← กลับหน้าหลัก', 14, 'Regular', '#cbd5e1'));
        r.appendChild(T('ออกจากระบบ', 14, 'Regular', '#ffffff'));
      }
      nav.appendChild(r);
      return nav;
    }
    function buildContent(page, o) {
      o = o || {};
      const c = AL('VERTICAL', { name: 'Content', gap: 24, px: 120, py: 32, cross: o.cross });
      c.paddingBottom = 48;
      fillW(page, c);
      return c;
    }
    function pageHeader(content, title, sub, rightNode) {
      const h = AL('HORIZONTAL', { name: 'Page Header', main: 'SPACE_BETWEEN', cross: 'CENTER' });
      fillW(content, h);
      const l = AL('VERTICAL', { name: 'Titles', gap: 4 });
      l.appendChild(T(title, 24, 'Bold', '#ffffff'));
      l.appendChild(T(sub, 14, 'Regular', '#9ca3af'));
      h.appendChild(l);
      if (rightNode) h.appendChild(rightNode);
      return h;
    }
    function withModal(root, page, modal) {
      let H = Math.max(900, Math.ceil(page.height));
      const my = Math.max(32, Math.round((H - modal.height) / 2));
      if (my + modal.height + 32 > H) H = my + modal.height + 32;
      root.resize(1440, H);
      const ov = figma.createRectangle();
      ov.name = 'Overlay'; ov.resize(1440, H); ov.fills = [P('#000000', 0.6)];
      root.appendChild(ov); ov.x = 0; ov.y = 0;
      root.appendChild(modal);
      modal.x = Math.round((1440 - modal.width) / 2); modal.y = my;
    }
    function finishPlain(root, page) { root.resize(1440, Math.max(900, Math.ceil(page.height))); }

    // =================================================================
    // ข้อมูลตัวอย่าง
    // =================================================================
    const EMP = [
      ['somchai_s', 'สมชาย ใจดี', 'ฝ่ายเดินรถ', 'Driver', true],
      ['somnak_k', 'สมนึก กล้าหาญ', 'ฝ่ายควบคุมการเดินรถ', 'Dispatcher', true],
      ['nongyao_p', 'นงเยาว์ ปานทอง', 'ฝ่ายเดินรถ', 'Driver', false],
      ['admin_a', 'อรุณี ระบบดี', 'ฝ่ายเทคโนโลยีสารสนเทศ', 'Admin', true],
    ];
    const SCREENS = [
      ['เช็คอิน', 'check_in'], ['ข้อมูลผู้ใช้', 'profile'],
      ['รายงานที่ 1 ผู้โดยสารขึ้น/ลงรายเดือน', 'report_1'], ['รายงานที่ 2 สถิติการจอง', 'report_2'],
      ['รายงานที่ 3 พฤติกรรมผู้ใช้', 'report_3'], ['รายงานที่ 4 ผู้ใช้แต่ละเส้นทางรายวัน', 'report_4'],
      ['รายงานที่ 5 จุดจอดตามรอบเวลา', 'report_5'], ['รายงานที่ 6 งานคนขับก่อน/หลัง 17:00', 'report_6'],
      ['รายงานที่ 7 งานตามประเภทรถ', 'report_7'], ['จัดการพนักงาน', 'employee_mgmt'], ['จัดการสิทธิ์ผู้ใช้', 'permission_mgmt'],
    ];
    const ALL_KEYS = SCREENS.map((s) => s[1]);
    const POS = [
      { name: 'Admin', perms: ALL_KEYS },
      { name: 'Dispatcher', perms: ['check_in', 'profile', 'report_1', 'report_2', 'report_3', 'report_4', 'report_5', 'report_6'] },
      { name: 'Driver', perms: ['check_in', 'profile'] },
    ];
    const memberCount = (pos) => EMP.filter((e) => e[3] === pos).length;

    const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    // ยอดรวมต่อเดือนตามเอกสาร (รายงานที่ 1) - ตัวเลขแยกสถานีคำนวณให้รวมตรงกับยอดนี้
    const UP_TOT = [425, 467, 487, 420, 525, 547, 590, 640, 621, 667, 695, 745];
    const DN_TOT = [428, 451, 487, 409, 521, 536, 572, 626, 606, 658, 680, 733];
    const STATIONS = ['ม.เทคโนโลยีมหานคร', 'โลตัส หนองจอก', 'รพ.หนองจอก', 'Big C หนองจอก', 'สวนสาธารณะ', 'ร้านส้มตำป้านาง'];
    const ST_COL = ['#6366f1', '#38bdf8', '#34d399', '#fbbf24', '#f87171', '#c084fc'];
    const SHARE = [0.28, 0.21, 0.185, 0.155, 0.105];
    function splitTotals(tot) {
      const res = STATIONS.map(() => []);
      tot.forEach((tv, m) => {
        let used = 0;
        for (let s = 0; s < 5; s++) { const v = Math.round(tv * SHARE[s] * (1 + 0.06 * Math.sin((m + 1) * (s + 2)))); res[s][m] = v; used += v; }
        res[5][m] = tv - used;
      });
      return res;
    }
    const UP_ST = splitTotals(UP_TOT);
    const DN_ST = splitTotals(DN_TOT);

    const R2 = { book: [320, 300, 340, 280, 360, 370, 400, 420, 390, 410, 430, 450], seats: [950, 880, 1020, 810, 1050, 1080, 1200, 1250, 1150, 1220, 1280, 1350], cancel: [20, 18, 25, 15, 28, 30, 35, 32, 27, 30, 33, 40], checkin: [910, 850, 970, 780, 1000, 1020, 1140, 1190, 1100, 1160, 1220, 1280], noshow: [40, 30, 50, 30, 50, 60, 60, 60, 50, 60, 60, 70] };
    const R3 = [['สมชาย ใจดี', 12, 11, 1, 0], ['สมหมาย ใจรัก', 10, 9, 0, 1], ['สมควร ใจงาม', 8, 7, 0, 1], ['อารีรัตน์ ศรีสุข', 6, 5, 1, 0], ['วรพล เทพทอง', 5, 4, 1, 0]];
    const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
    const R4 = [[120, 90, 75], [110, 85, 80], [130, 95, 85], [115, 92, 88], [140, 105, 95], [80, 60, 50], [70, 55, 45]];
    const R5 = [
      ['มหาวิทยาลัยเทคโนโลยีมหานคร', '09:30', 120, 0], ['มหาวิทยาลัยเทคโนโลยีมหานคร', '11:00', 110, 0], ['มหาวิทยาลัยเทคโนโลยีมหานคร', '13:00', 130, 0], ['มหาวิทยาลัยเทคโนโลยีมหานคร', '15:00', 140, 0],
      ['โลตัส หนองจอก', '09:45', 95, 88], ['โลตัส หนองจอก', '11:15', 85, 92], ['โลตัส หนองจอก', '13:15', 100, 110], ['โลตัส หนองจอก', '15:15', 110, 120],
      ['รพ.หนองจอก', '09:55', 70, 65], ['รพ.หนองจอก', '11:25', 60, 75], ['รพ.หนองจอก', '13:25', 80, 90], ['รพ.หนองจอก', '15:25', 90, 100],
    ];
    const R6 = [['สมชาย ใจดี', 18, 7], ['สมหมาย ใจรัก', 15, 5], ['สมควร ใจงาม', 12, 6], ['อารีรัตน์ ศรีสุข', 10, 5], ['วรพล เทพทอง', 8, 4], ['นันทนา ใจตรง', 7, 3]];
    const R7 = [
      { type: 'รถตู้ 9 ที่นั่ง', color: '#6366f1', cars: [['สย 2591', 28], ['สย 2599', 25], ['ชย 7788', 10]] },
      { type: 'รถบัส 20 ที่นั่ง', color: '#34d399', cars: [['บก 1130', 22], ['กข 4455', 15]] },
      { type: 'รถมินิบัส 15 ที่นั่ง', color: '#fbbf24', cars: [['นน 5566', 12], ['นม 8899', 8]] },
    ];

    // =================================================================
    // กราฟ
    // =================================================================
    function niceScale(v) {
      let step = 1;
      outer: for (let k = 0; k < 7; k++) {
        for (const b of [1, 2, 5]) { const s = b * Math.pow(10, k); if (Math.ceil(v / s) <= 5) { step = s; break outer; } }
      }
      const n = Math.max(2, Math.ceil(v / step));
      const ticks = [];
      for (let i = 0; i <= n; i++) ticks.push(i * step);
      return { max: step * n, ticks: ticks };
    }
    // o: labels, series[{name,color,vals,colors?}], plotW, H, barW, lblSize
    function barChart(o) {
      const n = o.labels.length;
      const colW = o.plotW / n;
      let mv = 1;
      o.series.forEach((s) => s.vals.forEach((v) => { if (v > mv) mv = v; }));
      const sc = niceScale(mv);
      const wrap = AL('HORIZONTAL', { name: 'Bar Chart', gap: 10 });
      const yax = AL('VERTICAL', { name: 'Y Axis', main: 'SPACE_BETWEEN', cross: 'MAX' });
      sc.ticks.slice().reverse().forEach((t) => yax.appendChild(T(fmt(t), 11, 'Regular', '#9ca3af')));
      wrap.appendChild(yax);
      yax.resize(44, o.H);
      const colm = AL('VERTICAL', { name: 'Plot Column', gap: 8 });
      wrap.appendChild(colm);
      const plot = figma.createFrame();
      plot.name = 'Plot'; plot.fills = []; plot.clipsContent = false; plot.resize(o.plotW, o.H);
      colm.appendChild(plot);
      const nT = sc.ticks.length;
      for (let i = 0; i < nT; i++) {
        const g = figma.createRectangle();
        g.name = 'Gridline'; g.resize(o.plotW, 1); g.fills = [P(i === nT - 1 ? '#64748b' : '#334155')];
        plot.appendChild(g); g.x = 0; g.y = Math.round(i * (o.H - 1) / (nT - 1));
      }
      const bars = AL('HORIZONTAL', { name: 'Bars' });
      bars.resize(o.plotW, o.H);
      plot.appendChild(bars); bars.x = 0; bars.y = 0;
      o.labels.forEach((lb, i) => {
        const g = AL('HORIZONTAL', { name: 'Group ' + lb, gap: o.barGap === undefined ? 3 : o.barGap, main: 'CENTER', cross: 'MAX' });
        g.resize(colW, o.H);
        bars.appendChild(g);
        o.series.forEach((s) => {
          const r = figma.createRectangle();
          r.name = s.name;
          r.resize(o.barW, Math.max(2, Math.round(s.vals[i] / sc.max * o.H)));
          r.fills = [P(s.colors ? s.colors[i] : s.color)];
          r.topLeftRadius = 3; r.topRightRadius = 3;
          g.appendChild(r);
        });
      });
      const xl = AL('HORIZONTAL', { name: 'X Labels' });
      colm.appendChild(xl);
      o.labels.forEach((lb) => {
        const c = AL('HORIZONTAL', { name: 'Label', main: 'CENTER' });
        c.appendChild(T(lb, o.lblSize || 11, 'Regular', '#9ca3af'));
        xl.appendChild(c);
        fixW(c, colW);
      });
      return wrap;
    }
    function legend(items) {
      const lg = AL('HORIZONTAL', { name: 'Legend', gap: 16, cross: 'CENTER' });
      items.forEach((it) => {
        const row = AL('HORIZONTAL', { name: 'Legend Item', gap: 6, cross: 'CENTER' });
        const d = figma.createRectangle();
        d.resize(10, 10); d.cornerRadius = 3; d.fills = [P(it[1])];
        row.appendChild(d); row.appendChild(T(it[0], 12, 'Medium', '#cbd5e1'));
        lg.appendChild(row);
      });
      return lg;
    }
    // การ์ดกราฟ ความกว้างคงที่ w  (พื้นที่กราฟ = w - 48 - 54)
    function chartCard(title, sub, legendItems, w, build) {
      const c = card('VERTICAL', { name: 'Chart / ' + title, gap: 20 });
      fixW(c, w);
      const h = AL('HORIZONTAL', { name: 'Chart Header', main: 'SPACE_BETWEEN', cross: 'CENTER', gap: 16 });
      fillW(c, h);
      const tt = AL('VERTICAL', { name: 'Titles', gap: 2 });
      tt.appendChild(T(title, 18, 'SemiBold', '#ffffff'));
      tt.appendChild(T(sub, 13, 'Regular', '#9ca3af'));
      h.appendChild(tt);
      if (legendItems) h.appendChild(legend(legendItems));
      c.appendChild(build(w - 48 - 54));
      return c;
    }
    function tableCard(title, sub, w, tbl) {
      const c = card('VERTICAL', { name: 'Table Card / ' + title, gap: 16 });
      fixW(c, w);
      const tt = AL('VERTICAL', { name: 'Titles', gap: 2 });
      tt.appendChild(T(title, 18, 'SemiBold', '#ffffff'));
      if (sub) tt.appendChild(T(sub, 13, 'Regular', '#9ca3af'));
      c.appendChild(tt);
      fillW(c, tbl);
      return c;
    }
    function donut(S, segs, c1, c2) {
      const f = figma.createFrame();
      f.name = 'Donut'; f.fills = []; f.clipsContent = false; f.resize(S, S);
      const tot = sum(segs.map((s) => s.v));
      let a = -Math.PI / 2;
      segs.forEach((s) => {
        const sweep = s.v / tot * 2 * Math.PI;
        const e = figma.createEllipse();
        e.name = s.name; e.resize(S, S); e.fills = [P(s.color)];
        e.arcData = { startingAngle: a + 0.02, endingAngle: a + sweep - 0.02, innerRadius: 0.62 };
        f.appendChild(e); e.x = 0; e.y = 0;
        a += sweep;
      });
      const cb = AL('VERTICAL', { name: 'Center', cross: 'CENTER' });
      cb.appendChild(T(c1, 28, 'Bold', '#ffffff'));
      cb.appendChild(T(c2, 12, 'Medium', '#9ca3af'));
      f.appendChild(cb); cb.x = Math.round((S - cb.width) / 2); cb.y = Math.round((S - cb.height) / 2);
      return f;
    }
    // ช่องแท่งข้อมูลในตาราง (ความกว้างแท่งคงที่)
    function barCell(v, max, color, trackW) {
      const c = AL('HORIZONTAL', { name: 'Data Bar', gap: 12, cross: 'CENTER' });
      const tr = figma.createFrame();
      tr.name = 'Track'; tr.resize(trackW, 10); tr.cornerRadius = 999; tr.fills = [P('#1e293b')]; tr.clipsContent = true;
      const f = figma.createRectangle();
      f.name = 'Fill'; f.resize(Math.max(0.01, Math.round(v / max * trackW)), 10); f.fills = [P(color)];
      tr.appendChild(f); f.x = 0; f.y = 0;
      c.appendChild(tr);
      const n = AL('HORIZONTAL', { name: 'Value', main: 'MAX' });
      n.appendChild(T(v, 14, 'Medium', v === 0 ? '#64748b' : '#ffffff'));
      c.appendChild(n); fixW(n, 40);
      return c;
    }

    // =================================================================
    // หน้าแรก / Login / Dashboard / Profile / ไม่มีสิทธิ์
    // =================================================================
    function webPage(page) {
      buildNav(page, '', true);
      const c = buildContent(page, { cross: 'CENTER' });
      c.paddingTop = 96; c.itemSpacing = 20;
      c.appendChild(badge('MUT · หนองจอก', '#6366f1', '#818cf8'));
      c.appendChild(T('🚐 Shuttle Bus System', 48, 'Bold', '#ffffff'));
      const d = T('ระบบรถรับส่งสำหรับนักศึกษาและเจ้าหน้าที่ มหาวิทยาลัยเทคโนโลยีมหานคร ในละแวกหนองจอก จองรถ ตรวจรอบเวลา และดูรายงานการใช้งานได้ในที่เดียว', 16, 'Regular', '#cbd5e1');
      d.textAlignHorizontal = 'CENTER'; d.textAutoResize = 'HEIGHT';
      c.appendChild(d); d.resize(620, d.height);
      const b = AL('HORIZONTAL', { name: 'Buttons', gap: 12 });
      b.appendChild(btn('เข้าสู่ระบบ', 'primary')); b.appendChild(btn('สมัครสมาชิก', 'ghost'));
      c.appendChild(b);
      const row = AL('HORIZONTAL', { name: 'Features', gap: 20 });
      c.appendChild(row);
      [['📍', 'จุดรับส่งตามเส้นทาง', 'เลือกจุดขึ้น-ลงและดูรอบเวลาเดินรถ'], ['🎟️', 'จองพร้อม QR Code', 'จองที่นั่งล่วงหน้าและเช็คอินขึ้นรถ'], ['📊', 'รายงานการใช้งาน', 'สถิติผู้โดยสารและการจองรายเดือน']].forEach((f) => {
        const k = card('VERTICAL', { name: 'Feature', gap: 6, pad: 20 });
        fixW(k, 300);
        k.appendChild(T(f[0], 28, 'Regular', '#ffffff'));
        k.appendChild(T(f[1], 16, 'SemiBold', '#ffffff'));
        const t = T(f[2], 13, 'Regular', '#9ca3af');
        t.textAutoResize = 'HEIGHT';
        fillW(k, t);
        row.appendChild(k);
      });
    }
    function loginPage(page) {
      const c = buildContent(page, { cross: 'CENTER' });
      c.paddingTop = 180;
      const k = card('VERTICAL', { name: 'Login Card', gap: 16, pad: 32, solid: true, r: 12 });
      fixW(k, 420);
      c.appendChild(k);
      const t = T('🚐 Shuttle Bus Login', 24, 'Bold', '#ffffff');
      t.textAlignHorizontal = 'CENTER'; t.textAutoResize = 'HEIGHT';
      fillW(k, t);
      fillW(k, field('ชื่อผู้ใช้', 'กรอกชื่อผู้ใช้', { placeholder: true }));
      fillW(k, field('รหัสผ่าน', '••••••••', { placeholder: true }));
      const b = btn('เข้าสู่ระบบ', 'primary');
      k.appendChild(b); b.layoutSizingHorizontal = 'FILL';
      const f = T('© 2026 Shuttle Bus System | MUT 🚍', 13, 'Regular', '#9ca3af');
      f.textAlignHorizontal = 'CENTER'; f.textAutoResize = 'HEIGHT';
      fillW(k, f);
    }
    function dashboardPage(page, user, posName, items, hint) {
      buildNav(page, user);
      const c = buildContent(page);
      c.paddingLeft = 200; c.paddingRight = 200;
      const g = AL('VERTICAL', { name: 'Greeting', gap: 4 });
      g.appendChild(T('สวัสดีคุณ ' + user, 24, 'Bold', '#ffffff'));
      const st = AL('HORIZONTAL', { name: 'Status', gap: 8, cross: 'CENTER' });
      st.appendChild(T('สถานะ:', 14, 'Regular', '#9ca3af'));
      st.appendChild(badge(posName, '#6366f1', '#818cf8'));
      g.appendChild(st);
      c.appendChild(g);
      for (let i = 0; i < items.length; i += 3) {
        const row = AL('HORIZONTAL', { name: 'Menu Row', gap: 20 });
        c.appendChild(row);
        items.slice(i, i + 3).forEach((it) => {
          const k = AL('VERTICAL', { name: 'Menu Card / ' + it[1], gap: 8, py: 24, px: 16, cross: 'CENTER', main: 'CENTER' });
          k.fills = [P('#4f46e5')]; k.cornerRadius = 8; k.effects = SHADOW;
          fixW(k, 260);
          k.appendChild(T(it[0], 32, 'Regular', '#ffffff'));
          k.appendChild(T(it[1], 16, 'SemiBold', '#ffffff'));
          row.appendChild(k);
        });
      }
      if (hint) c.appendChild(T(hint, 13, 'Regular', '#9ca3af'));
    }
    function profilePage(page) {
      buildNav(page, 'Somchai_S');
      const c = buildContent(page, { cross: 'CENTER' });
      pageHeader(c, '👤 ข้อมูลผู้ใช้', 'ข้อมูลบัญชีของคุณในระบบ', null);
      const k = card('VERTICAL', { name: 'Profile Card', gap: 20, pad: 32, solid: true, r: 16 });
      fixW(k, 640);
      c.appendChild(k);
      const h = AL('HORIZONTAL', { name: 'Profile Header', gap: 16, cross: 'CENTER' });
      k.appendChild(h);
      const av = figma.createFrame();
      av.name = 'Avatar'; av.resize(72, 72); av.cornerRadius = 36; av.fills = [P('#4f46e5')]; av.clipsContent = false;
      const ini = T('S', 32, 'Bold', '#ffffff');
      av.appendChild(ini); ini.x = Math.round((72 - ini.width) / 2); ini.y = Math.round((72 - ini.height) / 2);
      h.appendChild(av);
      const nm = AL('VERTICAL', { name: 'Name', gap: 4 });
      nm.appendChild(T('สมชาย ใจดี', 22, 'Bold', '#ffffff'));
      nm.appendChild(badge('Admin', '#6366f1', '#818cf8'));
      h.appendChild(nm);
      divider(k);
      [['ชื่อผู้ใช้', 'Somchai_S'], ['ชื่อ-นามสกุล', 'สมชาย ใจดี'], ['เบอร์โทร', '081-234-5678'], ['แผนก', 'ฝ่ายเทคโนโลยีสารสนเทศ'], ['ตำแหน่ง', 'Admin']].forEach((r) => {
        const row = AL('HORIZONTAL', { name: 'Info Row', main: 'SPACE_BETWEEN', cross: 'CENTER' });
        fillW(k, row);
        row.appendChild(T(r[0], 14, 'Regular', '#9ca3af'));
        row.appendChild(T(r[1], 16, 'Medium', '#ffffff'));
      });
      const sr = AL('HORIZONTAL', { name: 'Info Row', main: 'SPACE_BETWEEN', cross: 'CENTER' });
      fillW(k, sr);
      sr.appendChild(T('สถานะ', 14, 'Regular', '#9ca3af'));
      sr.appendChild(badge('✓ Active', '#10b981', '#34d399'));
      divider(k);
      const b = AL('HORIZONTAL', { name: 'Buttons', gap: 12 });
      b.appendChild(btn('แก้ไขข้อมูล', 'primary')); b.appendChild(btn('เปลี่ยนรหัสผ่าน', 'ghost'));
      k.appendChild(b);
    }
    function accessDeniedPage(page) {
      buildNav(page, 'Somchai_S');
      const content = buildContent(page, { cross: 'CENTER' });
      content.paddingTop = 96;
      const c = card('VERTICAL', { name: 'Access Denied Card', gap: 16, pad: 40, solid: true, r: 16 });
      fixW(c, 560); c.counterAxisAlignItems = 'CENTER';
      content.appendChild(c);
      const ic = AL('HORIZONTAL', { name: 'Icon', px: 22, py: 16, main: 'CENTER', cross: 'CENTER' });
      ic.fills = [P('#ef4444', 0.12)]; ic.strokes = [P('#ef4444')]; ic.strokeWeight = 1; ic.cornerRadius = 9999;
      ic.appendChild(T('🔒', 36, 'Regular', '#ffffff'));
      c.appendChild(ic);
      const t = T('ไม่มีสิทธิ์เข้าถึงหน้านี้', 24, 'Bold', '#ffffff');
      t.textAlignHorizontal = 'CENTER'; t.textAutoResize = 'HEIGHT'; fillW(c, t);
      const m = T('บัญชี somchai_s (ตำแหน่ง: Driver) ไม่ได้รับสิทธิ์ใช้งานหน้า "จัดการพนักงาน" หากต้องการใช้งาน กรุณาติดต่อผู้ดูแลระบบ', 14, 'Regular', '#cbd5e1');
      m.textAlignHorizontal = 'CENTER'; m.textAutoResize = 'HEIGHT'; fillW(c, m);
      c.appendChild(badge('รหัสหน้าจอ: employee_mgmt', '#94a3b8', '#cbd5e1'));
      const g = AL('HORIZONTAL', { name: 'Buttons', gap: 12 });
      g.appendChild(btn('← กลับหน้าหลัก', 'primary')); g.appendChild(btn('ออกจากระบบ', 'ghost'));
      c.appendChild(g);
    }

    // =================================================================
    // MASTER.1 พนักงาน
    // =================================================================
    function employeeListPage(page) {
      buildNav(page, 'Somchai_S');
      const content = buildContent(page);
      pageHeader(content, '👥 จัดการพนักงาน', 'เพิ่ม แก้ไข ลบพนักงาน พร้อมระบุแผนกและตำแหน่ง (ทั้งหมด ' + EMP.length + ' คน)', btn('+ เพิ่มพนักงาน', 'primary'));
      const c = card('VERTICAL', { name: 'Employee Table Card', gap: 0, pad: 16 });
      fillW(content, c);
      const cols = [
        { label: 'ชื่อผู้ใช้', w: 150, style: 'Medium', color: '#ffffff' }, { label: 'ชื่อ-นามสกุล', w: 0, color: '#ffffff' },
        { label: 'แผนก', w: 210 }, { label: 'ตำแหน่ง', w: 120 }, { label: 'สถานะ', w: 120 }, { label: 'การจัดการ', w: 150 },
      ];
      const rows = EMP.map((e) => [
        e[0], e[1], e[2], e[3],
        e[4] ? badge('✓ Active', '#10b981', '#34d399') : badge('✕ Inactive', '#ef4444', '#f87171'),
        (function () { const g = AL('HORIZONTAL', { name: 'Actions', gap: 8 }); g.appendChild(btn('แก้ไข', 'tint', true)); g.appendChild(btn('ลบ', 'dangerGhost', true)); return g; })(),
      ]);
      fillW(c, table(cols, rows, 'Employee Table'));
    }
    function formModal(mode) {
      const edit = mode === 'edit';
      const m = card('VERTICAL', { name: 'Modal / ' + (edit ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงาน'), gap: 20, pad: 28, solid: true, r: 16 });
      fixW(m, 600);
      const h = AL('HORIZONTAL', { name: 'Modal Header', main: 'SPACE_BETWEEN', cross: 'CENTER' });
      fillW(m, h);
      const tl = AL('VERTICAL', { name: 'Titles', gap: 2 });
      tl.appendChild(T(edit ? '✏️ แก้ไขข้อมูลพนักงาน' : '➕ เพิ่มพนักงานใหม่', 20, 'SemiBold', '#ffffff'));
      tl.appendChild(T(edit ? 'แก้ไขข้อมูล แผนก ตำแหน่ง และสถานะ' : 'กรอกข้อมูลและกำหนดแผนก/ตำแหน่ง', 13, 'Regular', '#9ca3af'));
      h.appendChild(tl); h.appendChild(T('✕', 18, 'Regular', '#9ca3af'));
      divider(m);
      const two = (a, b) => { const r = AL('HORIZONTAL', { name: 'Row', gap: 16 }); fillW(m, r); fillW(r, a); fillW(r, b); };
      if (edit) {
        two(field('ชื่อผู้ใช้ (Username)', 'somchai_s'), field('ชื่อ-นามสกุล', 'สมชาย ใจดี'));
        two(field('เบอร์โทร', '081-234-5678'), field('รหัสผ่านใหม่', '••••••••', { placeholder: true, hint: 'เว้นว่างไว้หากไม่ต้องการเปลี่ยน' }));
        two(field('แผนก', 'ฝ่ายเดินรถ', { icon: '▾' }), field('ตำแหน่ง', 'Driver', { icon: '▾' }));
      } else {
        two(field('ชื่อผู้ใช้ (Username)', 'เช่น somchai_s', { placeholder: true }), field('ชื่อ-นามสกุล', 'กรอกชื่อ-นามสกุล', { placeholder: true }));
        two(field('เบอร์โทร', '08x-xxx-xxxx', { placeholder: true }), field('รหัสผ่าน', '••••••••', { placeholder: true, hint: 'อย่างน้อย 8 ตัวอักษร' }));
        two(field('แผนก', 'เลือกแผนก', { icon: '▾', placeholder: true }), field('ตำแหน่ง', 'เลือกตำแหน่ง', { icon: '▾', placeholder: true }));
      }
      m.appendChild(toggle(true, 'สถานะ: Active (ใช้งานได้)'));
      divider(m);
      const f = AL('HORIZONTAL', { name: 'Modal Footer', main: edit ? 'SPACE_BETWEEN' : 'MAX', cross: 'CENTER' });
      fillW(m, f);
      if (edit) f.appendChild(btn('🗑 ลบพนักงาน', 'dangerGhost'));
      const g = AL('HORIZONTAL', { name: 'Buttons', gap: 12 });
      g.appendChild(btn('ยกเลิก', 'ghost')); g.appendChild(btn(edit ? 'บันทึกการแก้ไข' : 'บันทึก', 'primary'));
      f.appendChild(g);
      return m;
    }
    function confirmModal(o) {
      const m = card('VERTICAL', { name: 'Modal / ' + o.name, gap: 16, pad: 32, solid: true, r: 16 });
      fixW(m, 460); m.counterAxisAlignItems = 'CENTER';
      const ic = AL('HORIZONTAL', { name: 'Icon', px: 16, py: 12, main: 'CENTER', cross: 'CENTER' });
      ic.fills = [P(o.tint, 0.12)]; ic.strokes = [P(o.tint)]; ic.strokeWeight = 1; ic.cornerRadius = 9999;
      ic.appendChild(T(o.icon, 28, 'Regular', '#ffffff'));
      m.appendChild(ic);
      const t = T(o.title, 20, 'SemiBold', '#ffffff'); t.textAlignHorizontal = 'CENTER'; t.textAutoResize = 'HEIGHT'; fillW(m, t);
      const msg = T(o.msg, 14, 'Regular', '#cbd5e1'); msg.textAlignHorizontal = 'CENTER'; msg.textAutoResize = 'HEIGHT'; fillW(m, msg);
      const g = AL('HORIZONTAL', { name: 'Buttons', gap: 12 });
      o.buttons.forEach((b) => g.appendChild(b));
      m.appendChild(g);
      return m;
    }

    // =================================================================
    // MASTER.2 สิทธิ์ Dynamic
    // =================================================================
    function permissionPage(page, sel) {
      buildNav(page, 'Somchai_S');
      const content = buildContent(page);
      pageHeader(content, '🔐 จัดการสิทธิ์ผู้ใช้ (Dynamic)', 'กำหนดว่าแต่ละตำแหน่งเข้าหน้าจอไหนได้ เพิ่ม/แก้ไข/ลบตำแหน่งและสิทธิ์ได้ตลอดเวลา', null);
      const row = AL('HORIZONTAL', { name: 'Permission Layout', gap: 24, cross: 'MIN' });
      fillW(content, row);
      const left = card('VERTICAL', { name: 'Positions Card', gap: 12, pad: 20 });
      fixW(left, 340); row.appendChild(left);
      const lh = AL('HORIZONTAL', { name: 'Header', main: 'SPACE_BETWEEN', cross: 'CENTER' });
      fillW(left, lh);
      lh.appendChild(T('ตำแหน่ง', 18, 'SemiBold', '#ffffff')); lh.appendChild(badge(POS.length + ' ตำแหน่ง', '#6366f1', '#818cf8'));
      POS.forEach((p, i) => {
        const isSel = i === sel;
        const it = AL('HORIZONTAL', { name: 'Position Item', gap: 8, px: 14, py: 12, main: 'SPACE_BETWEEN', cross: 'CENTER' });
        it.cornerRadius = 8; it.fills = [P('#6366f1', isSel ? 0.15 : 0.0)]; it.strokes = [P(isSel ? '#6366f1' : '#334155')]; it.strokeWeight = 1; it.strokeAlign = 'INSIDE';
        fillW(left, it);
        const tx = AL('VERTICAL', { name: 'Text' });
        tx.appendChild(T(p.name, 15, 'SemiBold', '#ffffff'));
        tx.appendChild(T(p.perms.length + ' สิทธิ์ · ' + memberCount(p.name) + ' คน', 12, 'Regular', '#9ca3af'));
        it.appendChild(tx);
        const ac = AL('HORIZONTAL', { name: 'Item Actions', gap: 10, cross: 'CENTER' });
        ac.appendChild(T('✏️', 14, 'Regular', '#ffffff')); ac.appendChild(T('🗑', 14, 'Regular', '#ffffff'));
        it.appendChild(ac);
      });
      const add = btn('+ เพิ่มตำแหน่ง', 'ghost');
      left.appendChild(add); add.layoutSizingHorizontal = 'FILL';
      const right = card('VERTICAL', { name: 'Permissions Card', gap: 20, pad: 24 });
      fillW(row, right);
      const rh = AL('HORIZONTAL', { name: 'Header', main: 'SPACE_BETWEEN', cross: 'CENTER' });
      fillW(right, rh);
      const rt = AL('VERTICAL', { name: 'Titles', gap: 4 });
      rt.appendChild(badge('ตำแหน่งที่เลือก', '#6366f1', '#818cf8'));
      rt.appendChild(T('สิทธิ์ของตำแหน่ง ' + POS[sel].name, 20, 'SemiBold', '#ffffff'));
      rt.appendChild(T('ติ๊กหน้าจอที่ตำแหน่งนี้เข้าใช้ได้ การเปลี่ยนแปลงใช้กับพนักงานทุกคนที่มีตำแหน่งนี้', 13, 'Regular', '#9ca3af'));
      rh.appendChild(rt);
      const rb = AL('HORIZONTAL', { name: 'Buttons', gap: 12 });
      rb.appendChild(btn('เลือกทั้งหมด', 'ghost')); rb.appendChild(btn('💾 บันทึกสิทธิ์', 'primary'));
      rh.appendChild(rb);
      const cols = [{ label: '', w: 40, align: 'center' }, { label: 'หน้าจอ', w: 0, style: 'Medium', color: '#ffffff' }, { label: 'รหัสหน้าจอ (screen_key)', w: 220, color: '#9ca3af' }];
      const rows = SCREENS.map((s) => [checkbox(POS[sel].perms.indexOf(s[1]) >= 0), s[0], s[1]]);
      fillW(right, table(cols, rows, 'Permission Table'));
    }
    function addPositionModal() {
      const m = card('VERTICAL', { name: 'Modal / เพิ่มตำแหน่ง', gap: 20, pad: 28, solid: true, r: 16 });
      fixW(m, 480);
      const h = AL('HORIZONTAL', { name: 'Modal Header', main: 'SPACE_BETWEEN', cross: 'CENTER' });
      fillW(m, h);
      h.appendChild(T('➕ เพิ่มตำแหน่งใหม่', 20, 'SemiBold', '#ffffff')); h.appendChild(T('✕', 18, 'Regular', '#9ca3af'));
      divider(m);
      fillW(m, field('ชื่อตำแหน่ง', 'เช่น Manager', { placeholder: true, hint: 'หลังบันทึก เลือกตำแหน่งนี้แล้วติ๊กสิทธิ์รายหน้าจอในตาราง' }));
      divider(m);
      const f = AL('HORIZONTAL', { name: 'Modal Footer', gap: 12, main: 'MAX' });
      fillW(m, f);
      f.appendChild(btn('ยกเลิก', 'ghost')); f.appendChild(btn('บันทึก', 'primary'));
      return m;
    }

    // =================================================================
    // รายงาน
    // =================================================================
    const REPORTS = [
      { n: 1, e: '📊', t: 'ผู้โดยสารขึ้น/ลงรายเดือน', d: 'เปรียบเทียบจำนวนผู้โดยสารขึ้นและลงรถของแต่ละสถานี รายเดือน', f: 'year' },
      { n: 2, e: '📈', t: 'สถิติการจองรายเดือน', d: 'จำนวนการจอง ที่นั่งที่ถูกจอง การยกเลิก Check-in สำเร็จ และ No Show', f: 'year' },
      { n: 3, e: '👤', t: 'พฤติกรรมของผู้ใช้', d: 'สรุปการจอง ขึ้นรถจริง ยกเลิก และ No Show ของผู้ใช้แต่ละคน', f: 'range' },
      { n: 4, e: '🛣️', t: 'ผู้ใช้แต่ละเส้นทางรายวัน', d: 'สรุปจำนวนผู้ใช้บริการแต่ละเส้นทาง แยกตามวันของสัปดาห์', f: 'range' },
      { n: 5, e: '📍', t: 'จุดจอดตามรอบเวลา', d: 'จำนวนคนขึ้นและลงในแต่ละจุดจอด เรียงตามจุดจอดและเวลาที่รถออก', f: 'range' },
      { n: 6, e: '🕔', t: 'งานคนขับก่อน/หลัง 17:00', d: 'สรุปการมอบหมายงานให้คนขับ แบ่งเป็นก่อนและหลัง 17:00 น.', f: 'range' },
      { n: 7, e: '🚌', t: 'งานตามประเภทรถ', d: 'จำนวนรอบงานที่มอบหมายให้รถแต่ละประเภทและแต่ละคัน', f: 'range' },
    ];
    function reportsHubPage(page) {
      buildNav(page, 'Somchai_S');
      const c = buildContent(page);
      pageHeader(c, '📊 รายงาน', 'เลือกรายงานที่ต้องการดู (ข้อ 1-2 กรองตามปี / ข้อ 3-7 กรองตามช่วงวันที่)', null);
      for (let i = 0; i < REPORTS.length; i += 3) {
        const row = AL('HORIZONTAL', { name: 'Report Row', gap: 24 });
        fillW(c, row);
        REPORTS.slice(i, i + 3).forEach((r) => {
          const k = card('VERTICAL', { name: 'Report Card ' + r.n, gap: 12, pad: 24 });
          fixW(k, 384);
          const top = AL('HORIZONTAL', { name: 'Top', main: 'SPACE_BETWEEN', cross: 'CENTER' });
          fillW(k, top);
          top.appendChild(badge('รายงานที่ ' + r.n, '#6366f1', '#818cf8')); top.appendChild(T(r.e, 28, 'Regular', '#ffffff'));
          k.appendChild(T(r.t, 18, 'SemiBold', '#ffffff'));
          const d = T(r.d, 13, 'Regular', '#9ca3af'); d.textAutoResize = 'HEIGHT'; fillW(k, d);
          k.appendChild(badge(r.f === 'year' ? 'กรองตามปี' : 'กรองตามช่วงวันที่', '#94a3b8', '#cbd5e1'));
          k.appendChild(T('เปิดรายงาน →', 14, 'SemiBold', '#818cf8'));
          row.appendChild(k);
        });
      }
    }
    function reportShell(name, r, rangeA, rangeB) {
      const s = newScreen(name);
      buildNav(s.page, 'Somchai_S');
      const c = buildContent(s.page);
      pageHeader(c, r.e + ' รายงานที่ ' + r.n + ': ' + r.t, r.d, btn('← เลือกรายงาน', 'ghost'));
      const f = card('HORIZONTAL', { name: 'ReportFilter', gap: 16, pad: 20 });
      f.counterAxisAlignItems = 'MAX';
      fillW(c, f);
      if (r.f === 'year') { const y = field('ปี (พ.ศ.)', '2568', { icon: '▾' }); f.appendChild(y); fixW(y, 260); }
      else {
        const a = field('วันที่เริ่ม', rangeA, { icon: '📅' }); f.appendChild(a); fixW(a, 260);
        const b = field('วันที่สิ้นสุด', rangeB, { icon: '📅' }); f.appendChild(b); fixW(b, 260);
      }
      f.appendChild(btn('🔍 ดูรายงาน', 'primary'));
      return { root: s.root, page: s.page, content: c };
    }
    const SUB = { year: 'ปี 2568', };
    const full = 1200, half = 588;

    function report1() {
      const r = REPORTS[0];
      const s = reportShell('15 REPORT 1 / ผู้โดยสารขึ้น-ลงรายเดือน', r);
      const mkChart = (title, data) => chartCard(title, 'ปี 2568 · แยกตามสถานี', STATIONS.map((n, i) => [n, ST_COL[i]]), full, (pw) =>
        barChart({ labels: MONTHS, series: STATIONS.map((n, i) => ({ name: n, color: ST_COL[i], vals: data[i] })), plotW: pw, H: 220, barW: 11, barGap: 2 }));
      fillW(s.content, mkChart('จำนวนผู้โดยสาร ขึ้น รายเดือน ปี 2568 (ทุกสถานี)', UP_ST));
      fillW(s.content, mkChart('จำนวนผู้โดยสาร ลง รายเดือน ปี 2568 (ทุกสถานี)', DN_ST));
      const cols = [{ label: 'สถานี', w: 150, style: 'Medium', color: '#ffffff', size: 13 }]
        .concat(MONTHS.map((m) => ({ label: m, w: 58, align: 'center', size: 13 })))
        .concat([{ label: 'รวมปี', w: 70, align: 'center', size: 13 }]);
      const mkRows = (data, tot) => data.map((row, i) => [STATIONS[i]].concat(row.map(fmt)).concat([fmt(sum(row))]))
        .concat([{ total: true, cells: ['รวมต่อเดือน'].concat(tot.map(fmt)).concat([fmt(sum(tot))]) }]);
      const big = card('VERTICAL', { name: 'Table Card / รายละเอียด', gap: 16 });
      fillW(s.content, big);
      const tt = AL('VERTICAL', { name: 'Titles', gap: 2 });
      tt.appendChild(T('ตารางรายละเอียด แยกตามสถานีและเดือน', 18, 'SemiBold', '#ffffff'));
      tt.appendChild(T('ข้อมูลตัวอย่าง (ยอดรวมต่อเดือนตรงกับเอกสาร requirement)', 13, 'Regular', '#9ca3af'));
      big.appendChild(tt);
      big.appendChild(badge('ผู้โดยสารขึ้น', '#6366f1', '#818cf8'));
      fillW(big, table(cols, mkRows(UP_ST, UP_TOT), 'Table ขึ้น', { gap: 6, size: 13 }));
      big.appendChild(badge('ผู้โดยสารลง', '#38bdf8', '#7dd3fc'));
      fillW(big, table(cols, mkRows(DN_ST, DN_TOT), 'Table ลง', { gap: 6, size: 13 }));
      finishPlain(s.root, s.page);
      return s.root;
    }
    function report2() {
      const r = REPORTS[1];
      const s = reportShell('16 REPORT 2 / สถิติการจองรายเดือน', r);
      fillW(s.content, chartCard('ปี 2568 · Check-in / ยกเลิก / No Show', 'เปรียบเทียบรายเดือน (Clustered)', [['Check-in สำเร็จ', '#34d399'], ['การยกเลิก', '#f87171'], ['No Show', '#fbbf24']], full, (pw) =>
        barChart({ labels: MONTHS, series: [{ name: 'Check-in', color: '#34d399', vals: R2.checkin }, { name: 'ยกเลิก', color: '#f87171', vals: R2.cancel }, { name: 'No Show', color: '#fbbf24', vals: R2.noshow }], plotW: pw, H: 240, barW: 22, barGap: 3, lblSize: 12 })));
      const cols = [{ label: 'เดือน', w: 110, style: 'Medium', color: '#ffffff' }, { label: 'จำนวนการจอง', w: 0, align: 'center' }, { label: 'จำนวนที่นั่งที่ถูกจอง', w: 0, align: 'center' }, { label: 'การยกเลิก', w: 0, align: 'center' }, { label: 'Check-in สำเร็จ', w: 0, align: 'center' }, { label: 'No Show', w: 0, align: 'center' }];
      const rows = MONTHS.map((m, i) => [m, fmt(R2.book[i]), fmt(R2.seats[i]), fmt(R2.cancel[i]), fmt(R2.checkin[i]), fmt(R2.noshow[i])])
        .concat([{ total: true, cells: ['รวมทั้งปี', fmt(sum(R2.book)), fmt(sum(R2.seats)), fmt(sum(R2.cancel)), fmt(sum(R2.checkin)), fmt(sum(R2.noshow))] }]);
      fillW(s.content, tableCard('รายละเอียดสถิติการจอง ปี 2568', null, full, table(cols, rows, 'Booking Stats Table')));
      finishPlain(s.root, s.page);
      return s.root;
    }
    function report3() {
      const r = REPORTS[2];
      const s = reportShell('17 REPORT 3 / พฤติกรรมผู้ใช้', r, '12/04/2568', '15/04/2568');
      const cols = [{ label: 'ผู้ใช้', w: 0, style: 'Medium', color: '#ffffff' }, { label: 'การจองทั้งหมด', w: 0, align: 'center' }, { label: 'ขึ้นรถจริง', w: 0, align: 'center' }, { label: 'ยกเลิก', w: 0, align: 'center' }, { label: 'No Show', w: 0, align: 'center' }];
      const rows = R3.map((u) => [u[0], u[1], u[2], u[3], u[4]])
        .concat([{ total: true, cells: ['รวมทั้งหมด', sum(R3.map((u) => u[1])), sum(R3.map((u) => u[2])), sum(R3.map((u) => u[3])), sum(R3.map((u) => u[4]))] }]);
      fillW(s.content, tableCard('รายงานพฤติกรรมของผู้ใช้ 12 เม.ย. 2568 - 15 เม.ย. 2568', null, full, table(cols, rows, 'User Behavior Table')));
      const row = AL('HORIZONTAL', { name: 'Charts Row', gap: 24 });
      fillW(s.content, row);
      row.appendChild(chartCard('พฤติกรรมผู้ใช้', '12 - 15 เมษายน 2568', [['การจองทั้งหมด', '#6366f1'], ['ขึ้นรถจริง', '#34d399'], ['ยกเลิก', '#f87171'], ['No Show', '#fbbf24']], 756, (pw) =>
        barChart({ labels: R3.map((u) => u[0]), series: [{ name: 'การจองทั้งหมด', color: '#6366f1', vals: R3.map((u) => u[1]) }, { name: 'ขึ้นรถจริง', color: '#34d399', vals: R3.map((u) => u[2]) }, { name: 'ยกเลิก', color: '#f87171', vals: R3.map((u) => u[3]) }, { name: 'No Show', color: '#fbbf24', vals: R3.map((u) => u[4]) }], plotW: pw, H: 240, barW: 20, barGap: 3, lblSize: 12 })));
      const dc = card('VERTICAL', { name: 'Chart / สัดส่วนรวม', gap: 20 });
      fixW(dc, 420); dc.counterAxisAlignItems = 'CENTER';
      row.appendChild(dc);
      const dt = AL('VERTICAL', { name: 'Titles', gap: 2 });
      dt.appendChild(T('สัดส่วนรวม ผู้ใช้ทุกคน', 18, 'SemiBold', '#ffffff'));
      dt.appendChild(T('12 - 15 เมษายน 2568', 13, 'Regular', '#9ca3af'));
      dc.appendChild(dt); dt.layoutAlign = 'STRETCH';
      const segs = [{ name: 'ขึ้นรถจริง', v: 36, color: '#34d399' }, { name: 'ยกเลิก', v: 3, color: '#f87171' }, { name: 'No Show', v: 2, color: '#fbbf24' }];
      dc.appendChild(donut(180, segs, '41', 'การจอง'));
      const lg = AL('VERTICAL', { name: 'Legend', gap: 8 });
      dc.appendChild(lg); lg.layoutSizingHorizontal = 'FILL';
      segs.forEach((g) => {
        const rw = AL('HORIZONTAL', { name: 'Legend Row', main: 'SPACE_BETWEEN', cross: 'CENTER' });
        fillW(lg, rw);
        const l = AL('HORIZONTAL', { name: 'Left', gap: 8, cross: 'CENTER' });
        const d = figma.createEllipse(); d.resize(10, 10); d.fills = [P(g.color)];
        l.appendChild(d); l.appendChild(T(g.name, 13, 'Medium', '#cbd5e1'));
        rw.appendChild(l); rw.appendChild(T(g.v + ' (' + (g.v / 41 * 100).toFixed(1) + '%)', 13, 'SemiBold', '#ffffff'));
      });
      finishPlain(s.root, s.page);
      return s.root;
    }
    function report4() {
      const r = REPORTS[3];
      const s = reportShell('18 REPORT 4 / ผู้ใช้แต่ละเส้นทางรายวัน', r, '01/09/2568', '07/09/2568');
      fillW(s.content, chartCard('จำนวนผู้ใช้บริการแยกตามเส้นทาง', '1 - 7 กันยายน 2568', [['เส้นทาง 1', '#6366f1'], ['เส้นทาง 2', '#34d399'], ['เส้นทาง 3', '#fbbf24']], full, (pw) =>
        barChart({ labels: DAYS, series: [1, 2, 3].map((n, i) => ({ name: 'เส้นทาง ' + n, color: ['#6366f1', '#34d399', '#fbbf24'][i], vals: R4.map((d) => d[i]) })), plotW: pw, H: 240, barW: 30, barGap: 4, lblSize: 12 })));
      const cols = [{ label: 'วัน', w: 130, style: 'Medium', color: '#ffffff' }, { label: 'เส้นทาง 1', w: 0, align: 'center' }, { label: 'เส้นทาง 2', w: 0, align: 'center' }, { label: 'เส้นทาง 3', w: 0, align: 'center' }, { label: 'รวมทั้งวัน', w: 0, align: 'center', style: 'SemiBold', color: '#ffffff' }];
      const rows = DAYS.map((d, i) => [d, R4[i][0], R4[i][1], R4[i][2], sum(R4[i])])
        .concat([{ total: true, cells: ['รวมสัปดาห์', sum(R4.map((d) => d[0])), sum(R4.map((d) => d[1])), sum(R4.map((d) => d[2])), sum(R4.map((d) => sum(d)))] }]);
      fillW(s.content, tableCard('จำนวนผู้ใช้บริการในแต่ละวัน 1 - 7 กันยายน 2568', 'ถ้าช่วงที่เลือกมีวันเดียวกันหลายครั้ง ระบบรวมยอดของวันนั้นมาแสดง', full, table(cols, rows, 'Daily Route Table')));
      finishPlain(s.root, s.page);
      return s.root;
    }
    function report5() {
      const r = REPORTS[4];
      const s = reportShell('19 REPORT 5 / จุดจอดตามรอบเวลา', r, '01/09/2568', '09/09/2568');
      const cols = [{ label: 'จุดจอด', w: 260, style: 'Medium', color: '#ffffff' }, { label: 'เวลา', w: 80 }, { label: 'จำนวนขึ้น', w: 0 }, { label: 'จำนวนลง', w: 0 }];
      const rows = R5.map((x) => [x[0], x[1], barCell(x[2], 140, '#6366f1', 260), barCell(x[3], 140, '#38bdf8', 260)])
        .concat([{ total: true, cells: ['รวมทั้งหมด', '', String(sum(R5.map((x) => x[2]))), String(sum(R5.map((x) => x[3])))] }]);
      const c = tableCard('การใช้บริการในแต่ละจุดจอดตามรอบเวลา 1 - 9 กันยายน 2568', 'เรียงตามจุดจอดและเวลาที่รถเริ่มออกในแต่ละจุด', full, table(cols, rows, 'Stop Usage Table'));
      fillW(s.content, c);
      finishPlain(s.root, s.page);
      return s.root;
    }
    function report6() {
      const r = REPORTS[5];
      const s = reportShell('20 REPORT 6 / งานคนขับก่อน-หลัง 17:00', r, '01/04/2568', '30/04/2568');
      const row = AL('HORIZONTAL', { name: 'Row', gap: 24 });
      fillW(s.content, row);
      row.appendChild(chartCard('จำนวนรอบงานที่ได้รับ', '1 - 30 เมษายน 2568 (ก่อน/หลัง 17:00)', [['ก่อน 17:00', '#6366f1'], ['หลัง 17:00', '#fbbf24']], half, (pw) =>
        barChart({ labels: R6.map((d) => d[0].split(' ')[0]), series: [{ name: 'ก่อน 17:00', color: '#6366f1', vals: R6.map((d) => d[1]) }, { name: 'หลัง 17:00', color: '#fbbf24', vals: R6.map((d) => d[2]) }], plotW: pw, H: 240, barW: 20, barGap: 3, lblSize: 12 })));
      const cols = [{ label: 'คนขับ', w: 0, style: 'Medium', color: '#ffffff' }, { label: 'รวมรอบ', w: 70, align: 'center', style: 'SemiBold', color: '#ffffff' }, { label: 'ก่อน 17:00', w: 80, align: 'center' }, { label: 'หลัง 17:00', w: 80, align: 'center' }];
      const rows = R6.map((d) => [d[0], d[1] + d[2], d[1], d[2]])
        .concat([{ total: true, cells: ['รวมทั้งหมด', sum(R6.map((d) => d[1] + d[2])), sum(R6.map((d) => d[1])), sum(R6.map((d) => d[2]))] }]);
      row.appendChild(tableCard('รายงานการแบ่งงาน 1 - 30 เม.ย. 2568', null, half, table(cols, rows, 'Driver Shift Table', { gap: 8 })));
      finishPlain(s.root, s.page);
      return s.root;
    }
    function report7() {
      const r = REPORTS[6];
      const s = reportShell('21 REPORT 7 / งานตามประเภทรถ', r, '01/04/2568', '30/04/2568');
      const row = AL('HORIZONTAL', { name: 'Row', gap: 24 });
      fillW(s.content, row);
      const cars = [];
      R7.forEach((g) => g.cars.forEach((c) => cars.push({ plate: c[0], v: c[1], color: g.color })));
      row.appendChild(chartCard('จำนวนรอบงานแยกตามคัน', '1 - 30 เมษายน 2568', R7.map((g) => [g.type, g.color]), half, (pw) =>
        barChart({ labels: cars.map((c) => c.plate), series: [{ name: 'รอบ', color: '#6366f1', colors: cars.map((c) => c.color), vals: cars.map((c) => c.v) }], plotW: pw, H: 240, barW: 30, lblSize: 11 })));
      const cols = [{ label: 'ประเภทรถ', w: 0, style: 'Medium', color: '#ffffff' }, { label: 'รถ (ทะเบียน)', w: 110 }, { label: 'จำนวนรอบ', w: 80, align: 'center' }];
      const rows = [];
      R7.forEach((g) => {
        g.cars.forEach((c) => rows.push([g.type, c[0], c[1]]));
        rows.push({ total: true, cells: ['รวม' + g.type, '', sum(g.cars.map((c) => c[1]))] });
      });
      rows.push({ total: true, cells: ['รวมทั้งหมด', '', sum(cars.map((c) => c.v))] });
      row.appendChild(tableCard('จำนวนการมอบหมายงานให้รถแต่ละประเภท', '1 - 30 เมษายน 2568', half, table(cols, rows, 'Vehicle Assignment Table', { gap: 8, py: 8 })));
      finishPlain(s.root, s.page);
      return s.root;
    }

    // =================================================================
    // สร้างทุกเฟรม
    // =================================================================
    const F = {};
    (function () { const s = newScreen('01 WEB'); webPage(s.page); finishPlain(s.root, s.page); F.WEB = s.root; })();
    (function () { const s = newScreen('02 LOGIN'); loginPage(s.page); finishPlain(s.root, s.page); F.LOGIN = s.root; })();
    (function () {
      const s = newScreen('03 DASHBOARD-ADMIN');
      dashboardPage(s.page, 'Somchai_S', 'Admin', [['✅', 'เช็คอิน'], ['👤', 'ข้อมูลผู้ใช้'], ['📊', 'รายงาน'], ['🔐', 'จัดการสิทธิ์ผู้ใช้'], ['👥', 'จัดการพนักงาน']], null);
      finishPlain(s.root, s.page); F.DA = s.root;
    })();
    (function () {
      const s = newScreen('04 DASHBOARD-USER (Dispatcher)');
      dashboardPage(s.page, 'Somnak_K', 'Dispatcher', [['✅', 'เช็คอิน'], ['👤', 'ข้อมูลผู้ใช้'], ['📊', 'รายงาน']], '🔒 เมนูอื่นถูกซ่อนตามสิทธิ์ของตำแหน่ง Dispatcher (กำหนดได้ในหน้าจัดการสิทธิ์)');
      finishPlain(s.root, s.page); F.DU = s.root;
    })();
    (function () { const s = newScreen('05 PROFILE'); profilePage(s.page); finishPlain(s.root, s.page); F.PROFILE = s.root; })();
    (function () { const s = newScreen('06 MASTER3 / ไม่มีสิทธิ์เข้าถึง'); accessDeniedPage(s.page); finishPlain(s.root, s.page); F.DENIED = s.root; })();
    (function () { const s = newScreen('07 MASTER1 / รายการพนักงาน'); employeeListPage(s.page); finishPlain(s.root, s.page); F.E1 = s.root; })();
    (function () { const s = newScreen('08 MASTER1 / เพิ่มพนักงาน'); employeeListPage(s.page); withModal(s.root, s.page, formModal('add')); F.E2 = s.root; })();
    (function () { const s = newScreen('09 MASTER1 / แก้ไขพนักงาน'); employeeListPage(s.page); withModal(s.root, s.page, formModal('edit')); F.E3 = s.root; })();
    (function () {
      const s = newScreen('10 MASTER1 / ยืนยันลบพนักงาน'); employeeListPage(s.page);
      withModal(s.root, s.page, confirmModal({ name: 'ยืนยันลบพนักงาน', icon: '⚠️', tint: '#ef4444', title: 'ยืนยันการลบพนักงาน', msg: 'คุณต้องการลบ somchai_s (สมชาย ใจดี) ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้', buttons: [btn('ยกเลิก', 'ghost'), btn('ลบพนักงาน', 'danger')] }));
      F.E4 = s.root;
    })();
    (function () { const s = newScreen('11 MASTER2 / จัดการสิทธิ์ตำแหน่ง'); permissionPage(s.page, 1); finishPlain(s.root, s.page); F.P1 = s.root; })();
    (function () { const s = newScreen('12 MASTER2 / เพิ่มตำแหน่ง'); permissionPage(s.page, 1); withModal(s.root, s.page, addPositionModal()); F.P2 = s.root; })();
    (function () {
      const s = newScreen('13 MASTER2 / ลบตำแหน่งไม่ได้'); permissionPage(s.page, 2);
      withModal(s.root, s.page, confirmModal({ name: 'ลบตำแหน่งไม่ได้', icon: '🚫', tint: '#f59e0b', title: 'ลบตำแหน่ง Driver ไม่ได้', msg: 'ยังมีพนักงานใช้ตำแหน่งนี้อยู่ ' + memberCount('Driver') + ' คน กรุณาย้ายพนักงานไปตำแหน่งอื่นก่อนลบ', buttons: [btn('รับทราบ', 'primary')] }));
      F.P3 = s.root;
    })();
    (function () { const s = newScreen('14 REPORTS / เลือกรายงาน'); reportsHubPage(s.page); finishPlain(s.root, s.page); F.HUB = s.root; })();
    F.R1 = report1(); F.R2 = report2(); F.R3 = report3(); F.R4 = report4(); F.R5 = report5(); F.R6 = report6(); F.R7 = report7();

    // ---------- วางเฟรมทางขวาสุดของหน้า (แถวละกลุ่ม) ----------
    const ROWS = [['WEB', 'LOGIN', 'DA', 'DU'], ['PROFILE', 'DENIED'], ['E1', 'E2', 'E3', 'E4'], ['P1', 'P2', 'P3'], ['HUB', 'R1', 'R2'], ['R3', 'R4', 'R5'], ['R6', 'R7']];
    const created = [];
    ROWS.forEach((r) => r.forEach((k) => created.push(F[k])));
    const existing = figma.currentPage.children.filter((n) => created.indexOf(n) < 0);
    let maxR = 0;
    let minY = 0;
    existing.forEach((n, i) => { maxR = Math.max(maxR, n.x + n.width); minY = i === 0 ? n.y : Math.min(minY, n.y); });
    const startX = existing.length ? maxR + 300 : 0;
    let y = existing.length ? minY : 0;
    const GAP = 200;
    ROWS.forEach((r) => {
      let rowH = 0;
      r.forEach((k, j) => { const f = F[k]; f.x = startX + j * (1440 + GAP); f.y = y; rowH = Math.max(rowH, f.height); });
      y += rowH + GAP;
    });

    figma.currentPage.selection = created;
    figma.viewport.scrollAndZoomIntoView(created);
    figma.notify('สร้างหน้าจอทั้งหมด ' + created.length + ' เฟรมเรียบร้อย ✅');
  } catch (e) {
    console.error(e);
    figma.notify('เกิดข้อผิดพลาด: ' + (e && e.message ? e.message : e), { error: true });
  }
})();
