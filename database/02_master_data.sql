-- =====================================================================
-- Shuttle Bus System - ข้อมูลตั้งต้น (Master Data)
-- รันต่อจาก 01_schema.sql
-- =====================================================================

-- ---------- แผนก ----------
INSERT INTO departments (dept_name) VALUES ('ฝ่ายเดินรถ');
INSERT INTO departments (dept_name) VALUES ('ฝ่ายควบคุมการเดินรถ');
INSERT INTO departments (dept_name) VALUES ('ฝ่ายเทคโนโลยีสารสนเทศ');
INSERT INTO departments (dept_name) VALUES ('ฝ่ายบริหารทั่วไป');

-- ---------- ตำแหน่ง ----------
INSERT INTO positions (pos_name) VALUES ('Admin');
INSERT INTO positions (pos_name) VALUES ('Dispatcher');
INSERT INTO positions (pos_name) VALUES ('Driver');

-- ---------- สิทธิ์ / หน้าจอ (ต้องตรงกับ screen_key ที่ใช้ในโปรแกรมจริง) ----------
INSERT INTO permissions (screen_key, perm_name) VALUES ('check_in',         'เช็คอิน');
INSERT INTO permissions (screen_key, perm_name) VALUES ('profile',          'ข้อมูลผู้ใช้');
INSERT INTO permissions (screen_key, perm_name) VALUES ('report_1',         'รายงานที่ 1 ผู้โดยสารขึ้น/ลงรายเดือน');
INSERT INTO permissions (screen_key, perm_name) VALUES ('report_2',         'รายงานที่ 2 สถิติการจอง');
INSERT INTO permissions (screen_key, perm_name) VALUES ('report_3',         'รายงานที่ 3 พฤติกรรมผู้ใช้');
INSERT INTO permissions (screen_key, perm_name) VALUES ('report_4',         'รายงานที่ 4 ผู้ใช้แต่ละเส้นทางรายวัน');
INSERT INTO permissions (screen_key, perm_name) VALUES ('report_5',         'รายงานที่ 5 จุดจอดตามรอบเวลา');
INSERT INTO permissions (screen_key, perm_name) VALUES ('report_6',         'รายงานที่ 6 งานคนขับก่อน/หลัง 17:00');
INSERT INTO permissions (screen_key, perm_name) VALUES ('report_7',         'รายงานที่ 7 งานตามประเภทรถ');
INSERT INTO permissions (screen_key, perm_name) VALUES ('employee_mgmt',    'จัดการพนักงาน');
INSERT INTO permissions (screen_key, perm_name) VALUES ('permission_mgmt',  'จัดการสิทธิ์ผู้ใช้');

-- ---------- สิทธิ์ของแต่ละตำแหน่ง (Dynamic RBAC) ----------
-- Admin เข้าได้ทุกหน้าจอ
INSERT INTO role_permissions (pos_id, perm_id)
SELECT (SELECT pos_id FROM positions WHERE pos_name = 'Admin'), perm_id FROM permissions;

-- Dispatcher: เช็คอิน, ข้อมูลผู้ใช้, รายงานที่ 1-6
INSERT INTO role_permissions (pos_id, perm_id)
SELECT (SELECT pos_id FROM positions WHERE pos_name = 'Dispatcher'), perm_id
FROM permissions WHERE screen_key IN ('check_in','profile','report_1','report_2','report_3','report_4','report_5','report_6');

-- Driver: เช็คอิน, ข้อมูลผู้ใช้
INSERT INTO role_permissions (pos_id, perm_id)
SELECT (SELECT pos_id FROM positions WHERE pos_name = 'Driver'), perm_id
FROM permissions WHERE screen_key IN ('check_in','profile');

-- ---------- พนักงาน (ใช้ Login เข้าระบบ) รหัสผ่านตัวอย่างเป็น placeholder เท่านั้น ----------
-- ต้องแทนที่ password_hash ด้วยค่าที่เข้ารหัสจริงตอนเชื่อมกับโปรแกรม (ห้ามเก็บรหัสผ่านแบบข้อความเปล่า)
INSERT INTO users (username, password_hash, full_name, phone, user_type, pos_id, dept_id, status) VALUES
  ('admin_a', 'CHANGE_ME_HASH', 'อรุณี ระบบดี', '080-000-0001', 'employee',
   (SELECT pos_id FROM positions WHERE pos_name='Admin'), (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายเทคโนโลยีสารสนเทศ'), 'Active');
INSERT INTO users (username, password_hash, full_name, phone, user_type, pos_id, dept_id, status) VALUES
  ('somnak_k', 'CHANGE_ME_HASH', 'สมนึก กล้าหาญ', '080-000-0002', 'employee',
   (SELECT pos_id FROM positions WHERE pos_name='Dispatcher'), (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายควบคุมการเดินรถ'), 'Active');
INSERT INTO users (username, password_hash, full_name, phone, user_type, pos_id, dept_id, status) VALUES
  ('somchai_s', 'CHANGE_ME_HASH', 'สมชาย ใจดี', '081-234-5678', 'employee',
   (SELECT pos_id FROM positions WHERE pos_name='Driver'), (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายเดินรถ'), 'Active');
INSERT INTO users (username, password_hash, full_name, phone, user_type, pos_id, dept_id, status) VALUES
  ('somai_r', 'CHANGE_ME_HASH', 'สมหมาย ใจรัก', '081-234-5679', 'employee',
   (SELECT pos_id FROM positions WHERE pos_name='Driver'), (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายเดินรถ'), 'Active');
INSERT INTO users (username, password_hash, full_name, phone, user_type, pos_id, dept_id, status) VALUES
  ('somkhuan_j', 'CHANGE_ME_HASH', 'สมควร ใจงาม', '081-234-5680', 'employee',
   (SELECT pos_id FROM positions WHERE pos_name='Driver'), (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายเดินรถ'), 'Active');
INSERT INTO users (username, password_hash, full_name, phone, user_type, pos_id, dept_id, status) VALUES
  ('areerat_s', 'CHANGE_ME_HASH', 'อารีรัตน์ ศรีสุข', '081-234-5681', 'employee',
   (SELECT pos_id FROM positions WHERE pos_name='Driver'), (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายเดินรถ'), 'Active');
INSERT INTO users (username, password_hash, full_name, phone, user_type, pos_id, dept_id, status) VALUES
  ('worapon_t', 'CHANGE_ME_HASH', 'วรพล เทพทอง', '081-234-5682', 'employee',
   (SELECT pos_id FROM positions WHERE pos_name='Driver'), (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายเดินรถ'), 'Active');
INSERT INTO users (username, password_hash, full_name, phone, user_type, pos_id, dept_id, status) VALUES
  ('nanthana_j', 'CHANGE_ME_HASH', 'นันทนา ใจตรง', '081-234-5683', 'employee',
   (SELECT pos_id FROM positions WHERE pos_name='Driver'), (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายเดินรถ'), 'Active');
-- คนขับสำรอง 1 คน สถานะ Inactive (ไว้ทดสอบหน้าจัดการพนักงาน)
INSERT INTO users (username, password_hash, full_name, phone, user_type, pos_id, dept_id, status) VALUES
  ('nongyao_p', 'CHANGE_ME_HASH', 'นงเยาว์ ปานทอง', '081-234-5684', 'employee',
   (SELECT pos_id FROM positions WHERE pos_name='Driver'), (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายเดินรถ'), 'Inactive');

-- ---------- รถ ----------
INSERT INTO vehicles (plate_no, vehicle_type, capacity) VALUES ('สย 2591', 'รถตู้ 9 ที่นั่ง', 9);
INSERT INTO vehicles (plate_no, vehicle_type, capacity) VALUES ('สย 2599', 'รถตู้ 9 ที่นั่ง', 9);
INSERT INTO vehicles (plate_no, vehicle_type, capacity) VALUES ('ชย 7788', 'รถตู้ 9 ที่นั่ง', 9);
INSERT INTO vehicles (plate_no, vehicle_type, capacity) VALUES ('บก 1130', 'รถบัส 20 ที่นั่ง', 20);
INSERT INTO vehicles (plate_no, vehicle_type, capacity) VALUES ('กข 4455', 'รถบัส 20 ที่นั่ง', 20);
INSERT INTO vehicles (plate_no, vehicle_type, capacity) VALUES ('นน 5566', 'รถมินิบัส 15 ที่นั่ง', 15);
INSERT INTO vehicles (plate_no, vehicle_type, capacity) VALUES ('นม 8899', 'รถมินิบัส 15 ที่นั่ง', 15);

-- ---------- จุดจอด ----------
INSERT INTO stops (stop_name) VALUES ('มหาวิทยาลัยเทคโนโลยีมหานคร');
INSERT INTO stops (stop_name) VALUES ('โลตัส หนองจอก');
INSERT INTO stops (stop_name) VALUES ('โรงพยาบาลหนองจอก');
INSERT INTO stops (stop_name) VALUES ('Big C หนองจอก');
INSERT INTO stops (stop_name) VALUES ('สวนสาธารณะหนองจอก');
INSERT INTO stops (stop_name) VALUES ('ร้านส้มตำป้านาง');

-- ---------- เส้นทาง (ตามตัวอย่างใน requirement) ----------
INSERT INTO routes (route_name, total_time_mins) VALUES ('เส้นทางที่ 1', 0);
INSERT INTO routes (route_name, total_time_mins) VALUES ('เส้นทางที่ 2', 0);
INSERT INTO routes (route_name, total_time_mins) VALUES ('เส้นทางที่ 3', 0);

-- เส้นทางที่ 1 : ม.เทคโนโลยีมหานคร -> โลตัส -> รพ. -> Big C -> รพ. -> โลตัส -> ม.เทคโนโลยีมหานคร (รวมตามเอกสาร 30 นาที)
INSERT INTO route_stops (route_id, sequence_no, stop_id, travel_time_from_prev)
SELECT (SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 1'), 1, stop_id, 0 FROM stops WHERE stop_name='มหาวิทยาลัยเทคโนโลยีมหานคร';
INSERT INTO route_stops (route_id, sequence_no, stop_id, travel_time_from_prev)
SELECT (SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 1'), 2, stop_id, 5 FROM stops WHERE stop_name='โลตัส หนองจอก';
INSERT INTO route_stops (route_id, sequence_no, stop_id, travel_time_from_prev)
SELECT (SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 1'), 3, stop_id, 3 FROM stops WHERE stop_name='โรงพยาบาลหนองจอก';
INSERT INTO route_stops (route_id, sequence_no, stop_id, travel_time_from_prev)
SELECT (SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 1'), 4, stop_id, 6 FROM stops WHERE stop_name='Big C หนองจอก';
INSERT INTO route_stops (route_id, sequence_no, stop_id, travel_time_from_prev)
SELECT (SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 1'), 5, stop_id, 3 FROM stops WHERE stop_name='โรงพยาบาลหนองจอก';
INSERT INTO route_stops (route_id, sequence_no, stop_id, travel_time_from_prev)
SELECT (SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 1'), 6, stop_id, 3 FROM stops WHERE stop_name='โลตัส หนองจอก';
INSERT INTO route_stops (route_id, sequence_no, stop_id, travel_time_from_prev)
SELECT (SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 1'), 7, stop_id, 10 FROM stops WHERE stop_name='มหาวิทยาลัยเทคโนโลยีมหานคร';

-- เส้นทางที่ 2 : ม.เทคโนโลยีมหานคร -> โลตัส -> สวนสาธารณะ -> ร้านส้มตำป้านาง (รวมตามเอกสาร 13 นาที)
INSERT INTO route_stops (route_id, sequence_no, stop_id, travel_time_from_prev)
SELECT (SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 2'), 1, stop_id, 0 FROM stops WHERE stop_name='มหาวิทยาลัยเทคโนโลยีมหานคร';
INSERT INTO route_stops (route_id, sequence_no, stop_id, travel_time_from_prev)
SELECT (SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 2'), 2, stop_id, 5 FROM stops WHERE stop_name='โลตัส หนองจอก';
INSERT INTO route_stops (route_id, sequence_no, stop_id, travel_time_from_prev)
SELECT (SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 2'), 3, stop_id, 3 FROM stops WHERE stop_name='สวนสาธารณะหนองจอก';
INSERT INTO route_stops (route_id, sequence_no, stop_id, travel_time_from_prev)
SELECT (SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 2'), 4, stop_id, 5 FROM stops WHERE stop_name='ร้านส้มตำป้านาง';

-- เส้นทางที่ 3 : Big C -> โลตัส -> สวนสาธารณะ -> ร้านส้มตำป้านาง -> ม.เทคโนโลยีมหานคร
-- หมายเหตุ: เอกสาร requirement เขียนหัวข้อว่า "รวม 12 นาที" แต่ผลรวมเวลาที่ระบุไว้จริง (5+3+5+2) = 15 นาที
-- สคริปต์นี้คำนวณ total_time_mins จากผลรวม travel_time_from_prev จริง (15) ไม่ใช้เลข 12 ที่คลาดเคลื่อนในเอกสาร
-- ควรแจ้งอาจารย์/ตรวจสอบเอกสารต้นฉบับอีกครั้ง
INSERT INTO route_stops (route_id, sequence_no, stop_id, travel_time_from_prev)
SELECT (SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 3'), 1, stop_id, 0 FROM stops WHERE stop_name='Big C หนองจอก';
INSERT INTO route_stops (route_id, sequence_no, stop_id, travel_time_from_prev)
SELECT (SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 3'), 2, stop_id, 5 FROM stops WHERE stop_name='โลตัส หนองจอก';
INSERT INTO route_stops (route_id, sequence_no, stop_id, travel_time_from_prev)
SELECT (SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 3'), 3, stop_id, 3 FROM stops WHERE stop_name='สวนสาธารณะหนองจอก';
INSERT INTO route_stops (route_id, sequence_no, stop_id, travel_time_from_prev)
SELECT (SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 3'), 4, stop_id, 5 FROM stops WHERE stop_name='ร้านส้มตำป้านาง';
INSERT INTO route_stops (route_id, sequence_no, stop_id, travel_time_from_prev)
SELECT (SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 3'), 5, stop_id, 2 FROM stops WHERE stop_name='มหาวิทยาลัยเทคโนโลยีมหานคร';

-- อัปเดตเวลารวมของแต่ละเส้นทางจากผลรวมจริงของ route_stops
UPDATE routes r
SET total_time_mins = (
  SELECT NVL(SUM(rs.travel_time_from_prev), 0) FROM route_stops rs WHERE rs.route_id = r.route_id
);

-- ---------- รอบเวลาเดินรถ + คนขับ + รถ (ตามตัวอย่างใน requirement) ----------
-- เส้นทางที่ 1
INSERT INTO schedules (route_id, round_no, departure_time, driver_id, vehicle_id) VALUES
  ((SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 1'), 1, '09:30',
   (SELECT user_id FROM users WHERE username='somchai_s'), (SELECT vehicle_id FROM vehicles WHERE plate_no='สย 2591'));
INSERT INTO schedules (route_id, round_no, departure_time, driver_id, vehicle_id) VALUES
  ((SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 1'), 2, '11:00',
   (SELECT user_id FROM users WHERE username='somai_r'), (SELECT vehicle_id FROM vehicles WHERE plate_no='สย 2591'));
INSERT INTO schedules (route_id, round_no, departure_time, driver_id, vehicle_id) VALUES
  ((SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 1'), 3, '13:00',
   (SELECT user_id FROM users WHERE username='somchai_s'), (SELECT vehicle_id FROM vehicles WHERE plate_no='บก 1130'));
INSERT INTO schedules (route_id, round_no, departure_time, driver_id, vehicle_id) VALUES
  ((SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 1'), 4, '15:00',
   (SELECT user_id FROM users WHERE username='somchai_s'), (SELECT vehicle_id FROM vehicles WHERE plate_no='บก 1130'));

-- เส้นทางที่ 2
INSERT INTO schedules (route_id, round_no, departure_time, driver_id, vehicle_id) VALUES
  ((SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 2'), 1, '09:30',
   (SELECT user_id FROM users WHERE username='somkhuan_j'), (SELECT vehicle_id FROM vehicles WHERE plate_no='สย 2599'));
INSERT INTO schedules (route_id, round_no, departure_time, driver_id, vehicle_id) VALUES
  ((SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 2'), 2, '11:00',
   (SELECT user_id FROM users WHERE username='somkhuan_j'), (SELECT vehicle_id FROM vehicles WHERE plate_no='สย 2599'));
INSERT INTO schedules (route_id, round_no, departure_time, driver_id, vehicle_id) VALUES
  ((SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 2'), 3, '13:00',
   (SELECT user_id FROM users WHERE username='somai_r'), (SELECT vehicle_id FROM vehicles WHERE plate_no='สย 2599'));
INSERT INTO schedules (route_id, round_no, departure_time, driver_id, vehicle_id) VALUES
  ((SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 2'), 4, '15:00',
   (SELECT user_id FROM users WHERE username='somai_r'), (SELECT vehicle_id FROM vehicles WHERE plate_no='สย 2599'));

-- เส้นทางที่ 3 (ไม่มีตัวอย่างในเอกสาร ผมกำหนดให้ครบด้วยคนขับ/รถที่เหลือ เพื่อให้ข้อมูลครบสำหรับทำรายงาน)
INSERT INTO schedules (route_id, round_no, departure_time, driver_id, vehicle_id) VALUES
  ((SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 3'), 1, '09:45',
   (SELECT user_id FROM users WHERE username='areerat_s'), (SELECT vehicle_id FROM vehicles WHERE plate_no='ชย 7788'));
INSERT INTO schedules (route_id, round_no, departure_time, driver_id, vehicle_id) VALUES
  ((SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 3'), 2, '11:15',
   (SELECT user_id FROM users WHERE username='worapon_t'), (SELECT vehicle_id FROM vehicles WHERE plate_no='กข 4455'));
INSERT INTO schedules (route_id, round_no, departure_time, driver_id, vehicle_id) VALUES
  ((SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 3'), 3, '13:15',
   (SELECT user_id FROM users WHERE username='nanthana_j'), (SELECT vehicle_id FROM vehicles WHERE plate_no='นน 5566'));
INSERT INTO schedules (route_id, round_no, departure_time, driver_id, vehicle_id) VALUES
  ((SELECT route_id FROM routes WHERE route_name='เส้นทางที่ 3'), 4, '15:15',
   (SELECT user_id FROM users WHERE username='areerat_s'), (SELECT vehicle_id FROM vehicles WHERE plate_no='นม 8899'));

-- ---------- สถานะการจอง ----------
INSERT INTO booking_statuses (status_code, status_name) VALUES ('ACTIVE', 'Active');
INSERT INTO booking_statuses (status_code, status_name) VALUES ('CANCELLED', 'Cancelled');
INSERT INTO booking_statuses (status_code, status_name) VALUES ('COMPLETED', 'Completed');

COMMIT;
