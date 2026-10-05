import React, { useState } from "react";
import { api, useApi } from "../shared";
function Modal({ type, close, onSaved }) {
  const isEdit = type?.kind === "edit";
  const user = isEdit ? type.user : null;
  const [form, setForm] = useState({
    username: user?.USERNAME || "",
    password: "",
    full_name: user?.FULL_NAME || "",
    phone: user?.PHONE || "",
    user_type: user?.USER_TYPE || "employee",
    pos_id: user?.POS_ID || "",
    dept_id: user?.DEPT_ID || "",
    status: user?.STATUS || "Active",
  });
  const { data } = useApi("/lookups");
  async function save(e) {
    e.preventDefault();
    try {
      if (isEdit)
        await api("/employees/" + user.USER_ID, {
          method: "PUT",
          body: JSON.stringify(form),
        });
      else
        await api("/employees", { method: "POST", body: JSON.stringify(form) });
      close();
      type?.reload?.();
      onSaved();
    } catch (e) {
      alert(e.message);
    }
  }
  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-head">
          <h2>{isEdit ? "✏️ แก้ไขพนักงาน" : "➕ เพิ่มพนักงาน"}</h2>
          <button className="icon-btn" onClick={close}>
            ×
          </button>
        </div>
        <form className="form-grid" onSubmit={save}>
          {!isEdit && (
            <label>
              Username
              <input
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </label>
          )}
          <label>
            ชื่อ-นามสกุล
            <input
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </label>
          <label>
            เบอร์โทร
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            {isEdit ? "รหัสผ่านใหม่" : "รหัสผ่าน"}
            <input
              type="password"
              required={!isEdit}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <label>
            แผนก
            <select
              required
              value={form.dept_id}
              onChange={(e) => setForm({ ...form, dept_id: e.target.value })}
            >
              <option value="">เลือก</option>
              {(data?.departments || []).map((x) => (
                <option key={x.DEPT_ID} value={x.DEPT_ID}>
                  {x.DEPT_NAME}
                </option>
              ))}
            </select>
          </label>
          <label>
            ตำแหน่ง
            <select
              required
              value={form.pos_id}
              onChange={(e) => setForm({ ...form, pos_id: e.target.value })}
            >
              <option value="">เลือก</option>
              {(data?.positions || []).map((x) => (
                <option key={x.POS_ID} value={x.POS_ID}>
                  {x.POS_NAME}
                </option>
              ))}
            </select>
          </label>
          <label>
            สถานะ
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={close}>
              ยกเลิก
            </button>
            <button>บันทึก</button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default Modal;
