import React, { useEffect, useState } from "react";
import { api, navItems, Loading, Denied } from "./shared";
import AppShell from "./layouts/AppShell";
import Modal from "./components/Modal";
import Landing from "./pages/Landing/Landing";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Profile from "./pages/Profile/Profile";
import Employees from "./pages/Employees/Employees";
import Permissions from "./pages/Permissions/Permissions";
import Booking from "./pages/Booking/Booking";
import Checkin from "./pages/Checkin/Checkin";
import Trips from "./pages/Trips/Trips";
import Reports from "./pages/Reports/Reports";
import ReportDetail from "./pages/Reports/ReportDetail";

export default function App() {
  const [page, setPage] = useState(
    localStorage.getItem("shuttle_token") ? "dash" : "web",
  );
  const [me, setMe] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (localStorage.getItem("shuttle_token"))
      api("/me")
        .then(setMe)
        .catch(() => logout());
  }, []);
  function logout() {
    localStorage.removeItem("shuttle_token");
    localStorage.removeItem("shuttle_user");
    setMe(null);
    setPage("web");
  }
  const perms = new Set(
    (me?.permissions || []).map((x) => x.SCREEN_KEY || x.screen_key),
  );
  const can = (k) => !k || perms.has(k);
  const navigate = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  function login(data) {
    localStorage.setItem("shuttle_token", data.token);
    setMe({ user: data.user, permissions: data.permissions });
    setPage("dash");
  }
  if (page === "web") return <Landing onLogin={() => navigate("login")} />;
  if (page === "login") return <Login onLogin={login} />;
  if (!me) return <Loading />;
  const content =
    page === "dash" ? (
      <Dashboard me={me} navigate={navigate} />
    ) : page === "profile" ? (
      <Profile me={me} />
    ) : page === "employees" ? (
      can("employee_mgmt") ? (
        <Employees open={setModal} />
      ) : (
        <Denied />
      )
    ) : page === "permissions" ? (
      can("permission_mgmt") ? (
        <Permissions />
      ) : (
        <Denied />
      )
    ) : page === "booking" ? (
      <Booking me={me} />
    ) : page === "checkin" ? (
      can("check_in") ? (
        <Checkin />
      ) : (
        <Denied />
      )
    ) : page === "trips" ? (
      <Trips />
    ) : page === "reports" ? (
      <Reports navigate={navigate} />
    ) : page.startsWith("report-") ? (
      <ReportDetail id={Number(page.split("-")[1])} />
    ) : (
      <Denied />
    );
  return (
    <AppShell
      page={page}
      navigate={navigate}
      can={can}
      me={me}
      onLogout={logout}
      onHome={() => navigate("dash")}
    >
      <>
        {content}
        {modal && (
          <Modal
            type={modal}
            close={() => setModal(null)}
            onSaved={() => setToast("บันทึกข้อมูลสำเร็จ")}
          />
        )}
      </>
      {toast && (
        <div className="toast" onClick={() => setToast("")}>
          ✓ {toast}
        </div>
      )}
    </AppShell>
  );
}
