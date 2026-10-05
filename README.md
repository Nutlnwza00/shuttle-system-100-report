# Shuttle Bus System — React + Node.js + Oracle

เวอร์ชันนี้ยึด Oracle schema/query ของโปรเจกต์เดิม (`01_schema.sql`–`04_reports.sql`) และใช้ React เป็น Frontend, Express เป็น REST API, Oracle เป็น Database

## 1) Oracle
ใช้ฐานข้อมูลเดิมของคุณ ไม่ต้องสร้าง schema ใหม่ถ้ารันครบแล้ว

> `DBT69013` เป็น Oracle database account ไม่ใช่ application user

## 2) Backend
```bash
cd backend
npm install
cp .env.example .env
# แก้ ORACLE_PASSWORD และ ORACLE_CONNECT_STRING ให้ตรงเครื่อง Oracle
npm start
```

ตัวอย่าง `.env`:
```env
PORT=3000
ORACLE_USER=DBT69013
ORACLE_PASSWORD=YOUR_ORACLE_PASSWORD
ORACLE_CONNECT_STRING=localhost:1521/XEPDB1
JWT_SECRET=สร้างค่า random ยาว ๆ
CORS_ORIGIN=http://localhost:5173
```

### ตั้ง password สำหรับ user ในระบบ
`users.password_hash` ใน SQL เดิมเป็น `CHANGE_ME_HASH` จึงต้องตั้งรหัสผ่านครั้งแรกด้วย bcrypt:
```bash
npm run set-password -- admin_a 123456
npm run set-password -- somnak_k 123456
npm run set-password -- somchai_s 123456
```
อย่าใช้รหัสตัวอย่างนี้ใน production

## 3) Frontend
```bash
cd frontend
npm install
npm run dev
```
เปิด `http://localhost:5173`

ถ้า Backend ไม่ได้อยู่ localhost:3000 ให้สร้าง `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

## 4) สิ่งที่เชื่อม Oracle จริง
- Login + bcrypt + JWT
- Dynamic RBAC จาก `permissions` / `role_permissions`
- Users CRUD (soft delete เป็น Inactive)
- เพิ่ม/แก้ไขพนักงาน
- เพิ่มตำแหน่ง + กำหนด permission
- Dashboard metrics
- Trips / Schedules
- Booking + QR code
- Check-in
- Reports 1–7 โดยใช้ query ตาม requirement เดิมและ bind parameters

## 5) หมายเหตุ Oracle
Backend ใช้ `oracledb` ซึ่งเครื่องที่รัน Node.js ต้องเข้าถึง Oracle Listener ได้ และอาจต้องติดตั้ง Oracle Client ตามโหมดที่ระบบ/OS รองรับ

## 6) Figma source
`database/shuttle-all-screens.js` คือไฟล์ Figma Plugin ต้นฉบับ 21 screens ที่ใช้เป็น visual/requirement reference


## Frontend structure
React UI is split by page under `frontend/src/pages/`, shared UI under `components/` and `layouts/`, and API access under `services/`.
