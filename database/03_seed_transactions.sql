-- =====================================================================
-- Shuttle Bus System - สร้างข้อมูลธุรกรรมตัวอย่างจำนวนมาก (ปี พ.ศ. 2568 = ค.ศ. 2025)
-- รันต่อจาก 02_master_data.sql
-- ใช้เวลารันประมาณ 1-5 นาที ขึ้นกับเครื่อง (สร้างประมาณ 4,300 รอบเดินรถ และ 6,000+ การจอง)
-- หากรันไม่ผ่านกลางทาง ให้ลบข้อมูลด้วยคำสั่งใน 00_reset.sql (ท้ายไฟล์นี้) แล้วรันใหม่ตั้งแต่ 01
-- =====================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;

-- ---------- 1) สร้างผู้ใช้บริการ (นักศึกษา/เจ้าหน้าที่) 300 คน สำหรับใช้สุ่มเป็นผู้จอง ----------
INSERT INTO users (username, password_hash, full_name, phone, user_type, status)
SELECT
  'user' || LPAD(LEVEL, 4, '0'),
  'CHANGE_ME_HASH',
  (CASE MOD(LEVEL,10)
     WHEN 0 THEN 'สมชาย' WHEN 1 THEN 'สมหญิง' WHEN 2 THEN 'วิชัย' WHEN 3 THEN 'มาลี'
     WHEN 4 THEN 'ประยุทธ' WHEN 5 THEN 'สุดา' WHEN 6 THEN 'อนุชา' WHEN 7 THEN 'จิราภรณ์'
     WHEN 8 THEN 'ธนากร' ELSE 'กัลยา' END) || ' ' ||
  (CASE MOD(LEVEL,7)
     WHEN 0 THEN 'ใจดี' WHEN 1 THEN 'รักเรียน' WHEN 2 THEN 'แสงทอง' WHEN 3 THEN 'ศรีสุข'
     WHEN 4 THEN 'มั่นคง' WHEN 5 THEN 'บุญมา' ELSE 'เพชรดี' END),
  '08' || LPAD(TRUNC(DBMS_RANDOM.VALUE(10000000, 99999999)), 8, '0'),
  CASE WHEN MOD(LEVEL, 5) = 0 THEN 'staff' ELSE 'student' END,
  'Active'
FROM DUAL
CONNECT BY LEVEL <= 300;

COMMIT;

-- ---------- 2) สร้างรอบเดินรถรายวัน (trips) + การจอง (bookings) + ผลเช็คอิน (checkins) ----------
-- กฎที่ใช้จำลอง:
--   - รอบเดินรถ (trip) มีโอกาส 2% ที่ถูกยกเลิกทั้งรอบ (สถานะ cancelled, ไม่มีการจอง)
--   - แต่ละรอบเดินรถที่ให้บริการจริง สุ่มจำนวนการจอง 0-3 รายการ โดยไม่เกินที่นั่งว่างของรถ (เช็คความจุจริง)
--   - การจองมีโอกาส 5% ที่ถูกยกเลิกโดยผู้จอง (สถานะ Cancelled ไม่มี checkin)
--   - การจองที่เหลือ มีโอกาส 95% เช็คอินสำเร็จ (Success, ปรับสถานะการจองเป็น Completed)
--     และ 5% ไม่มาขึ้นรถ (No Show, สถานะการจองยังเป็น Active)
DECLARE
  v_start_date DATE := DATE '2025-01-01';
  v_end_date   DATE := DATE '2025-12-31';

  v_status_active    NUMBER;
  v_status_cancelled NUMBER;
  v_status_completed NUMBER;

  TYPE t_num_tab IS TABLE OF NUMBER;
  v_user_ids  t_num_tab;
  v_stop_ids  t_num_tab;

  v_trip_id    NUMBER;
  v_booking_id NUMBER;
  v_remaining  NUMBER;
  v_seats      NUMBER;
  v_p_idx      PLS_INTEGER;
  v_d_idx      PLS_INTEGER;
  v_user_id    NUMBER;
  v_n_bookings PLS_INTEGER;
  v_created    TIMESTAMP;
  v_cancel_at  TIMESTAMP;
  v_checkin_at TIMESTAMP;
  v_dep_frac   NUMBER;   -- สัดส่วนเวลาออกรถของวัน (0 = เที่ยงคืน, 0.5 = เที่ยง)
  v_trip_stat  VARCHAR2(20);
  v_date       DATE;

  CURSOR c_schedules IS
    SELECT s.schedule_id, s.route_id, s.vehicle_id, s.driver_id, s.departure_time, v.capacity
    FROM   schedules s
    JOIN   vehicles  v ON v.vehicle_id = s.vehicle_id
    WHERE  s.is_active = 1;

BEGIN
  SELECT status_id INTO v_status_active    FROM booking_statuses WHERE status_code = 'ACTIVE';
  SELECT status_id INTO v_status_cancelled FROM booking_statuses WHERE status_code = 'CANCELLED';
  SELECT status_id INTO v_status_completed FROM booking_statuses WHERE status_code = 'COMPLETED';

  SELECT user_id BULK COLLECT INTO v_user_ids
  FROM users WHERE user_type IN ('student', 'staff');

  FOR sch IN c_schedules LOOP

    SELECT route_stop_id BULK COLLECT INTO v_stop_ids
    FROM route_stops WHERE route_id = sch.route_id ORDER BY sequence_no;

    IF v_stop_ids.COUNT >= 2 THEN

      v_dep_frac := TO_NUMBER(SUBSTR(sch.departure_time, 1, 2)) / 24
                  + TO_NUMBER(SUBSTR(sch.departure_time, 4, 2)) / 1440;

      v_date := v_start_date;
      WHILE v_date <= v_end_date LOOP

        v_trip_stat := CASE WHEN DBMS_RANDOM.VALUE(0,1) < 0.02 THEN 'cancelled' ELSE 'completed' END;

        IF v_trip_stat = 'cancelled' THEN
          INSERT INTO trips (schedule_id, trip_date, status, started_at, closed_at)
          VALUES (sch.schedule_id, v_date, 'cancelled', NULL, NULL)
          RETURNING trip_id INTO v_trip_id;
        ELSE
          INSERT INTO trips (schedule_id, trip_date, status, started_at, closed_at)
          VALUES (sch.schedule_id, v_date, 'completed',
                  v_date + v_dep_frac, v_date + v_dep_frac + (45/1440))
          RETURNING trip_id INTO v_trip_id;

          v_n_bookings := TRUNC(DBMS_RANDOM.VALUE(0, 4));  -- 0..3 รายการ
          v_remaining  := sch.capacity;

          FOR i IN 1 .. v_n_bookings LOOP
            EXIT WHEN v_remaining <= 0;

            v_seats := TRUNC(DBMS_RANDOM.VALUE(1, LEAST(4, v_remaining) + 1));
            v_p_idx := TRUNC(DBMS_RANDOM.VALUE(1, v_stop_ids.COUNT));
            v_d_idx := TRUNC(DBMS_RANDOM.VALUE(v_p_idx + 1, v_stop_ids.COUNT + 1));
            v_user_id := v_user_ids(TRUNC(DBMS_RANDOM.VALUE(1, v_user_ids.COUNT + 1)));
            v_created := v_date + v_dep_frac - DBMS_RANDOM.VALUE(0.02, 3);  -- จองล่วงหน้า ~30 นาที ถึง 3 วัน

            IF DBMS_RANDOM.VALUE(0,1) < 0.05 THEN
              -- ยกเลิกการจอง
              v_cancel_at := v_created + DBMS_RANDOM.VALUE(0.01, 0.5);
              INSERT INTO bookings (trip_id, user_id, pickup_route_stop_id, dropoff_route_stop_id,
                                     seats_booked, status_id, qr_code, created_at, cancelled_at)
              VALUES (v_trip_id, v_user_id, v_stop_ids(v_p_idx), v_stop_ids(v_d_idx),
                      v_seats, v_status_cancelled, 'TEMP', v_created, v_cancel_at)
              RETURNING booking_id INTO v_booking_id;

              UPDATE bookings SET qr_code = 'QR' || TO_CHAR(v_booking_id, 'FM000000')
              WHERE booking_id = v_booking_id;
              -- ยกเลิกแล้ว ไม่หักที่นั่งว่าง (คืนที่นั่งทันที) และไม่สร้าง checkin
            ELSE
              INSERT INTO bookings (trip_id, user_id, pickup_route_stop_id, dropoff_route_stop_id,
                                     seats_booked, status_id, qr_code, created_at)
              VALUES (v_trip_id, v_user_id, v_stop_ids(v_p_idx), v_stop_ids(v_d_idx),
                      v_seats, v_status_active, 'TEMP', v_created)
              RETURNING booking_id INTO v_booking_id;

              UPDATE bookings SET qr_code = 'QR' || TO_CHAR(v_booking_id, 'FM000000')
              WHERE booking_id = v_booking_id;

              v_remaining := v_remaining - v_seats;

              IF DBMS_RANDOM.VALUE(0,1) < 0.95 THEN
                v_checkin_at := v_date + v_dep_frac + DBMS_RANDOM.VALUE(0, 0.01);
                INSERT INTO checkins (booking_id, status, checked_in_at, scanned_by)
                VALUES (v_booking_id, 'Success', v_checkin_at, sch.driver_id);
                UPDATE bookings SET status_id = v_status_completed WHERE booking_id = v_booking_id;
              ELSE
                INSERT INTO checkins (booking_id, status, checked_in_at, scanned_by)
                VALUES (v_booking_id, 'No Show', NULL, sch.driver_id);
              END IF;
            END IF;

          END LOOP; -- bookings
        END IF; -- trip not cancelled

        v_date := v_date + 1;
      END LOOP; -- date loop

      COMMIT;
      DBMS_OUTPUT.PUT_LINE('เสร็จ schedule_id=' || sch.schedule_id || ' (route_id=' || sch.route_id || ')');
    END IF; -- route มีจุดจอดอย่างน้อย 2 จุด

  END LOOP; -- schedules

  COMMIT;
  DBMS_OUTPUT.PUT_LINE('สร้างข้อมูลตัวอย่างเสร็จสมบูรณ์');
END;
/

-- ---------- 3) สรุปจำนวนแถวที่ได้ เพื่อตรวจสอบว่ามีข้อมูลเพียงพอสำหรับออกรายงาน ----------
SELECT 'trips'    AS table_name, COUNT(*) AS rows_count FROM trips
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'checkins', COUNT(*) FROM checkins
UNION ALL SELECT 'users (รวมพนักงาน+ผู้ใช้บริการ)', COUNT(*) FROM users;

-- =====================================================================
-- 00_reset.sql (วางรวมไว้ท้ายไฟล์นี้เพื่อความสะดวก) - ใช้ล้างข้อมูลธุรกรรมแล้วเริ่มสร้างใหม่
-- คัดลอกเฉพาะส่วนนี้ไปรันแยกได้หากต้องการ reset โดยไม่ต้อง DROP ตารางทั้งหมด
-- =====================================================================
-- DELETE FROM checkins;
-- DELETE FROM bookings;
-- DELETE FROM trips;
-- DELETE FROM users WHERE username LIKE 'user%';
-- COMMIT;
