import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export const reportNames = {
  1: "ผู้โดยสารขึ้น/ลงรายเดือน",
  2: "สถิติการจองรายเดือน",
  3: "พฤติกรรมผู้ใช้",
  4: "ผู้ใช้แต่ละเส้นทางรายวัน",
  5: "จุดจอดตามรอบเวลา",
  6: "งานคนขับก่อน/หลัง 17:00",
  7: "งานตามประเภทรถ",
};
export const navItems = [
  ["dash", "📊", "Dashboard"],
  ["employees", "👥", "จัดการพนักงาน", "employee_mgmt"],
  ["permissions", "🔐", "จัดการสิทธิ์ตำแหน่ง", "permission_mgmt"],
  ["booking", "🎟️", "การจอง"],
  ["checkin", "✓", "Check-in", "check_in"],
  ["trips", "🚌", "เที่ยวรถ"],
  ["reports", "📈", "รายงาน"],
  ["profile", "👤", "ข้อมูลผู้ใช้", "profile"],
];

export async function api(path, opts = {}) {
  const token = localStorage.getItem("shuttle_token");
  const r = await fetch(API + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}
export const useApi = (path, deps = []) => {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const reload = () => {
    setLoading(true);
    api(path)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(reload, deps);
  return { data, error, loading, reload };
};

function Header({ me, onHome, onLogout }) {
  return (
    <header>
      <div className="brand" onClick={onHome}>
        🚐 <span>Shuttle Bus System</span>
        <small>MUT · หนองจอก</small>
      </div>
      <div className="header-right">
        <span className="online">● Oracle</span>
        <span>{me.user.FULL_NAME || me.user.full_name}</span>
        <button className="ghost-btn" onClick={onLogout}>
          ออกจากระบบ
        </button>
      </div>
    </header>
  );
}

export { Header };
function Sidebar({ page, navigate, can, me }) {
  return (
    <aside>
      <div className="side-title">MENU</div>
      {navItems.map(
        ([key, icon, label, perm]) =>
          can(perm) && (
            <button
              key={key}
              className={
                page === key ||
                (page.startsWith("report-") && key === "reports")
                  ? "side active"
                  : "side"
              }
              onClick={() => navigate(key)}
            >
              <span>{icon}</span>
              {label}
            </button>
          ),
      )}
      <div className="side-footer">
        <span className="role">
          {me.user.POS_NAME || me.user.pos_name || "User"}
        </span>
        <small>สิทธิ์จาก Oracle RBAC</small>
      </div>
    </aside>
  );
}

export { Sidebar };
function Feature({ icon, title }) {
  return (
    <div className="feature">
      <span>{icon}</span>
      <b>{title}</b>
    </div>
  );
}

export { Feature };
function Health() {
  const { data, error } = useApi("/health");
  return (
    <div className={error ? "db bad" : "db"}>
      <span>{error ? "●" : "●"}</span>
      <div>
        <b>{error ? "ไม่สามารถเชื่อมต่อ" : "Oracle Database Online"}</b>
        <small>{error || data?.time?.toString() || "กำลังตรวจสอบ..."}</small>
      </div>
    </div>
  );
}

export { Health };
function PageTitle({ title, subtitle, children }) {
  return (
    <section>
      <div className="page-title">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export { PageTitle };
function Panel({ title, children }) {
  return (
    <div className="panel">
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
}

export { Panel };
function Stat({ icon, label, value }) {
  return (
    <div className="stat">
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

export { Stat };
function InfoGrid({ items }) {
  return (
    <div className="info-grid">
      {items.map(([a, b]) => (
        <div key={a}>
          <small>{a}</small>
          <b>{b}</b>
        </div>
      ))}
    </div>
  );
}

export { InfoGrid };
function Table({ headers, children }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export { Table };
function Status({ s }) {
  return (
    <span className={"status " + String(s).toLowerCase()}>
      <i /> {s}
    </span>
  );
}

export { Status };
function ErrorBox({ text }) {
  return <div className="error">⚠ {text}</div>;
}

export { ErrorBox };
function Loading() {
  return <div className="loading">กำลังโหลด...</div>;
}

export { Loading };
function Denied() {
  return (
    <div className="denied">
      <div>🔒</div>
      <h1>ไม่มีสิทธิ์เข้าถึงหน้านี้</h1>
      <p>บัญชีของคุณไม่ได้รับ Permission สำหรับหน้าจอนี้</p>
    </div>
  );
}

export { Denied };
function fmtDate(x) {
  try {
    return new Date(x).toLocaleDateString("th-TH");
  } catch {
    return x;
  }
}

export { fmtDate };
function ReportChart({ id, rows }) {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0]);
  const numeric = keys
    .filter(
      (k) =>
        typeof rows[0][k] === "number" || !Number.isNaN(Number(rows[0][k])),
    )
    .slice(0, 3);
  if (!numeric.length) return null;
  return (
    <Panel title="กราฟ">
      <div className="chart">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={rows}>
            <XAxis dataKey={keys[0]} />
            <YAxis />
            <Tooltip />
            <Legend />
            {numeric.map((k) => (
              <Bar key={k} dataKey={k} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

export { ReportChart };
