import React from "react";
import { Header, Sidebar } from "../shared";
export default function AppShell({
  children,
  page,
  navigate,
  can,
  me,
  onLogout,
  onHome,
}) {
  return (
    <div className="app">
      <Header me={me} onHome={onHome} onLogout={onLogout} />
      <div className="shell">
        <Sidebar page={page} navigate={navigate} can={can} me={me} />
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
