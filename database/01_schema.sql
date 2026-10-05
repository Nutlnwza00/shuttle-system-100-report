-- =====================================================================
-- Shuttle Bus System (MUT หนองจอก) - โครงสร้างฐานข้อมูล (Oracle / SQL Developer)
-- รันไฟล์นี้เป็นไฟล์แรก (ต้องใช้ Oracle 12c ขึ้นไป เพราะใช้ IDENTITY COLUMN)
-- วิธีรันใน SQL Developer: เปิดไฟล์ > กด F5 (Run Script) ไม่ใช่ Ctrl+Enter (Run Statement)
-- =====================================================================

-- ลบตารางเดิมก่อน (เผื่อรันซ้ำ) เรียงลำดับจากตารางลูกไปตารางแม่
BEGIN
  FOR t IN (SELECT table_name FROM user_tables WHERE table_name IN (
    'CHECKINS','BOOKINGS','BOOKING_STATUSES','TRIPS','SCHEDULES','ROUTE_STOPS',
    'ROUTES','STOPS','VEHICLES','USERS','ROLE_PERMISSIONS','PERMISSIONS','POSITIONS','DEPARTMENTS'
  )) LOOP
    EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS';
  END LOOP;
END;
/

-- =====================================================================
-- MASTER.1 / MASTER.2 : แผนก ตำแหน่ง สิทธิ์ (Dynamic RBAC) พนักงาน
-- =====================================================================

CREATE TABLE departments (
  dept_id   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dept_name VARCHAR2(100) NOT NULL UNIQUE
);

CREATE TABLE positions (
  pos_id   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pos_name VARCHAR2(100) NOT NULL UNIQUE
);

CREATE TABLE permissions (
  perm_id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  screen_key VARCHAR2(100) NOT NULL UNIQUE,
  perm_name  VARCHAR2(150) NOT NULL
);

CREATE TABLE role_permissions (
  pos_id  NUMBER NOT NULL,
  perm_id NUMBER NOT NULL,
  CONSTRAINT pk_role_permissions PRIMARY KEY (pos_id, perm_id),
  CONSTRAINT fk_rp_pos  FOREIGN KEY (pos_id)  REFERENCES positions(pos_id),
  CONSTRAINT fk_rp_perm FOREIGN KEY (perm_id) REFERENCES permissions(perm_id)
);

CREATE TABLE users (
  user_id       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username      VARCHAR2(50)  NOT NULL UNIQUE,
  password_hash VARCHAR2(255) NOT NULL,
  full_name     VARCHAR2(150) NOT NULL,
  phone         VARCHAR2(20),
  user_type     VARCHAR2(20)  DEFAULT 'student' NOT NULL
                 CHECK (user_type IN ('student','staff','employee')),
  pos_id        NUMBER,
  dept_id       NUMBER,
  status        VARCHAR2(20)  DEFAULT 'Active' NOT NULL
                 CHECK (status IN ('Active','Inactive')),
  created_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT fk_users_pos  FOREIGN KEY (pos_id)  REFERENCES positions(pos_id),
  CONSTRAINT fk_users_dept FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

-- =====================================================================
-- FRONT : รถ จุดจอด เส้นทาง รอบเวลา
-- =====================================================================

CREATE TABLE vehicles (
  vehicle_id   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plate_no     VARCHAR2(20) NOT NULL UNIQUE,
  vehicle_type VARCHAR2(50) NOT NULL,
  capacity     NUMBER NOT NULL CHECK (capacity > 0)
);

CREATE TABLE stops (
  stop_id   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stop_name VARCHAR2(150) NOT NULL UNIQUE
);

CREATE TABLE routes (
  route_id        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  route_name      VARCHAR2(150) NOT NULL,
  total_time_mins NUMBER DEFAULT 0 NOT NULL  -- อัปเดตจากผลรวม route_stops.travel_time_from_prev
);

CREATE TABLE route_stops (
  route_stop_id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  route_id               NUMBER NOT NULL,
  sequence_no             NUMBER NOT NULL,     -- ลำดับการจอด 1,2,3,...
  stop_id                 NUMBER NOT NULL,      -- จุดจอดซ้ำในเส้นทางเดียวได้ (แยกด้วย sequence_no)
  travel_time_from_prev   NUMBER DEFAULT 0 NOT NULL,  -- นาทีจากจุดก่อนหน้า (จุดแรก = 0)
  CONSTRAINT uq_route_seq UNIQUE (route_id, sequence_no),
  CONSTRAINT fk_rs_route FOREIGN KEY (route_id) REFERENCES routes(route_id),
  CONSTRAINT fk_rs_stop  FOREIGN KEY (stop_id)  REFERENCES stops(stop_id)
);

CREATE TABLE schedules (
  schedule_id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  route_id       NUMBER NOT NULL,
  round_no       NUMBER NOT NULL,
  departure_time VARCHAR2(5) NOT NULL          -- รูปแบบ 'HH24:MI' เช่น '09:30'
                 CHECK (REGEXP_LIKE(departure_time, '^([01][0-9]|2[0-3]):[0-5][0-9]$')),
  driver_id      NUMBER NOT NULL,
  vehicle_id     NUMBER NOT NULL,
  is_active      NUMBER(1) DEFAULT 1 NOT NULL CHECK (is_active IN (0,1)),
  CONSTRAINT uq_route_round UNIQUE (route_id, round_no),
  CONSTRAINT fk_sch_route   FOREIGN KEY (route_id)   REFERENCES routes(route_id),
  CONSTRAINT fk_sch_driver  FOREIGN KEY (driver_id)  REFERENCES users(user_id),
  CONSTRAINT fk_sch_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
);

CREATE TABLE trips (
  trip_id     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  schedule_id NUMBER NOT NULL,
  trip_date   DATE NOT NULL,
  status      VARCHAR2(20) DEFAULT 'scheduled' NOT NULL
               CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
  started_at  TIMESTAMP,
  closed_at   TIMESTAMP,
  CONSTRAINT uq_schedule_date UNIQUE (schedule_id, trip_date),
  CONSTRAINT fk_trip_schedule FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id)
);

-- =====================================================================
-- BOOKING : การจอง + Check-in
-- =====================================================================

CREATE TABLE booking_statuses (
  status_id   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  status_code VARCHAR2(20) NOT NULL UNIQUE,
  status_name VARCHAR2(50) NOT NULL
);

CREATE TABLE bookings (
  booking_id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  trip_id                NUMBER NOT NULL,
  user_id                NUMBER NOT NULL,
  pickup_route_stop_id   NUMBER NOT NULL,
  dropoff_route_stop_id  NUMBER NOT NULL,
  seats_booked           NUMBER DEFAULT 1 NOT NULL CHECK (seats_booked BETWEEN 1 AND 4),
  status_id              NUMBER NOT NULL,
  qr_code                VARCHAR2(100) NOT NULL UNIQUE,
  created_at             TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  cancelled_at           TIMESTAMP,
  CONSTRAINT fk_bk_trip     FOREIGN KEY (trip_id)   REFERENCES trips(trip_id),
  CONSTRAINT fk_bk_user     FOREIGN KEY (user_id)   REFERENCES users(user_id),
  CONSTRAINT fk_bk_pickup   FOREIGN KEY (pickup_route_stop_id)  REFERENCES route_stops(route_stop_id),
  CONSTRAINT fk_bk_dropoff  FOREIGN KEY (dropoff_route_stop_id) REFERENCES route_stops(route_stop_id),
  CONSTRAINT fk_bk_status   FOREIGN KEY (status_id) REFERENCES booking_statuses(status_id)
);

CREATE TABLE checkins (
  checkin_id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id    NUMBER NOT NULL UNIQUE,
  status        VARCHAR2(20) NOT NULL CHECK (status IN ('Success','No Show')),
  checked_in_at TIMESTAMP,                      -- NULL เมื่อเป็น No Show
  scanned_by    NUMBER,                         -- คนขับที่สแกน (users.user_id) NULL ได้
  CONSTRAINT fk_ck_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
  CONSTRAINT fk_ck_driver  FOREIGN KEY (scanned_by) REFERENCES users(user_id)
);

-- =====================================================================
-- Index เพิ่มเติมสำหรับคอลัมน์ที่ใช้กรอง/join บ่อย (FK ไม่สร้าง index ให้อัตโนมัติใน Oracle)
-- =====================================================================
CREATE INDEX ix_users_pos          ON users(pos_id);
CREATE INDEX ix_users_dept         ON users(dept_id);
CREATE INDEX ix_route_stops_route  ON route_stops(route_id);
CREATE INDEX ix_schedules_route    ON schedules(route_id);
CREATE INDEX ix_schedules_driver   ON schedules(driver_id);
CREATE INDEX ix_schedules_vehicle  ON schedules(vehicle_id);
CREATE INDEX ix_trips_schedule     ON trips(schedule_id);
CREATE INDEX ix_trips_date         ON trips(trip_date);
CREATE INDEX ix_bookings_trip      ON bookings(trip_id);
CREATE INDEX ix_bookings_user      ON bookings(user_id);
CREATE INDEX ix_bookings_status    ON bookings(status_id);
CREATE INDEX ix_bookings_pickup    ON bookings(pickup_route_stop_id);
CREATE INDEX ix_bookings_dropoff   ON bookings(dropoff_route_stop_id);

COMMIT;
