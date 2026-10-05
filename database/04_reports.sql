-- =====================================================================
-- Shuttle Bus System - คิวรีสำหรับรายงานที่ 1-7 ตาม requirement
-- รันแต่ละ query แยกกันได้ (เลือกเฉพาะ query ที่ต้องการแล้วกด Ctrl+Enter ใน SQL Developer)
-- ตัวแปร &year / &date_from / &date_to จะมีกล่องให้กรอกค่าตอนรัน (substitution variable)
-- หมายเหตุ: "ขึ้นรถ/ลงรถ" ในรายงานที่ 1 และ 5 นับจากผลเช็คอินที่ Success เท่านั้น
--           (ถือว่าเช็คอินสำเร็จ = ขึ้นที่จุดรับและลงที่จุดส่งตามที่จองไว้)
-- =====================================================================


-- =====================================================================
-- รายงานที่ 1: จำนวนผู้โดยสารขึ้น/ลง รายเดือน แยกตามสถานี (เลือกปี)
-- =====================================================================

-- 1a) ยอดรวมทั้งหมดรายเดือน (ขึ้น vs ลง) - นับจากการเช็คอินสำเร็จ 1 ครั้ง = ขึ้น 1 + ลง 1 เสมอ
--     แยกคิวรีขึ้น/ลงออกจากกันด้วย WITH แล้วค่อยรวมด้วยเดือน เพื่อไม่ให้ตัวเลขทั้งสองคอลัมน์เท่ากันเสมอโดยไม่ได้ตั้งใจ
WITH up_side AS (
  SELECT TO_CHAR(t.trip_date, 'MM') AS month_no, SUM(b.seats_booked) AS total_up
  FROM bookings b
  JOIN checkins c ON c.booking_id = b.booking_id AND c.status = 'Success'
  JOIN trips t    ON t.trip_id = b.trip_id
  WHERE EXTRACT(YEAR FROM t.trip_date) = &year
  GROUP BY TO_CHAR(t.trip_date, 'MM')
),
down_side AS (
  SELECT TO_CHAR(t.trip_date, 'MM') AS month_no, SUM(b.seats_booked) AS total_down
  FROM bookings b
  JOIN checkins c ON c.booking_id = b.booking_id AND c.status = 'Success'
  JOIN trips t    ON t.trip_id = b.trip_id
  WHERE EXTRACT(YEAR FROM t.trip_date) = &year
  GROUP BY TO_CHAR(t.trip_date, 'MM')
)
-- หมายเหตุ: ในระบบนี้ขึ้น = ลง เสมอเพราะ 1 booking ที่เช็คอินสำเร็จ หมายถึงเดินทางครบทั้งขึ้นและลง
-- query นี้เตรียมโครงไว้เผื่อภายหลังมีการเช็คอินแยกจุดขึ้น/จุดลงเป็นคนละเหตุการณ์
SELECT u.month_no, u.total_up, d.total_down
FROM up_side u JOIN down_side d ON d.month_no = u.month_no
ORDER BY u.month_no;

-- 1b) แยกตามสถานี (ขึ้น) รายเดือน แบบ Pivot
SELECT * FROM (
  SELECT
    s.stop_name,
    TO_CHAR(t.trip_date, 'MM') AS month_no,
    b.seats_booked
  FROM bookings b
  JOIN checkins c       ON c.booking_id = b.booking_id AND c.status = 'Success'
  JOIN trips t          ON t.trip_id = b.trip_id
  JOIN route_stops rs   ON rs.route_stop_id = b.pickup_route_stop_id
  JOIN stops s          ON s.stop_id = rs.stop_id
  WHERE EXTRACT(YEAR FROM t.trip_date) = &year
)
PIVOT (
  SUM(seats_booked)
  FOR month_no IN ('01' AS m01,'02' AS m02,'03' AS m03,'04' AS m04,'05' AS m05,'06' AS m06,
                    '07' AS m07,'08' AS m08,'09' AS m09,'10' AS m10,'11' AS m11,'12' AS m12)
)
ORDER BY stop_name;

-- 1c) แยกตามสถานี (ลง) รายเดือน แบบ Pivot
SELECT * FROM (
  SELECT
    s.stop_name,
    TO_CHAR(t.trip_date, 'MM') AS month_no,
    b.seats_booked
  FROM bookings b
  JOIN checkins c       ON c.booking_id = b.booking_id AND c.status = 'Success'
  JOIN trips t          ON t.trip_id = b.trip_id
  JOIN route_stops rs   ON rs.route_stop_id = b.dropoff_route_stop_id
  JOIN stops s          ON s.stop_id = rs.stop_id
  WHERE EXTRACT(YEAR FROM t.trip_date) = &year
)
PIVOT (
  SUM(seats_booked)
  FOR month_no IN ('01' AS m01,'02' AS m02,'03' AS m03,'04' AS m04,'05' AS m05,'06' AS m06,
                    '07' AS m07,'08' AS m08,'09' AS m09,'10' AS m10,'11' AS m11,'12' AS m12)
)
ORDER BY stop_name;


-- =====================================================================
-- รายงานที่ 2: สถิติการจองรายเดือน (เลือกปี)
--   จำนวนการจอง / ที่นั่งที่ถูกจอง / ยกเลิก / Check-in สำเร็จ / No Show
-- =====================================================================
SELECT
  TO_CHAR(t.trip_date, 'MM') AS month_no,
  COUNT(*) AS booking_count,
  SUM(b.seats_booked) AS seats_booked,
  SUM(CASE WHEN bs.status_code = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_count,
  SUM(CASE WHEN c.status = 'Success' THEN 1 ELSE 0 END) AS checkin_success,
  SUM(CASE WHEN c.status = 'No Show' THEN 1 ELSE 0 END) AS no_show
FROM bookings b
JOIN trips t ON t.trip_id = b.trip_id
JOIN booking_statuses bs ON bs.status_id = b.status_id
LEFT JOIN checkins c ON c.booking_id = b.booking_id
WHERE EXTRACT(YEAR FROM t.trip_date) = &year
GROUP BY TO_CHAR(t.trip_date, 'MM')
ORDER BY month_no;


-- =====================================================================
-- รายงานที่ 3: พฤติกรรมของผู้ใช้ ในช่วงวันที่กำหนด
--   เช่น &date_from = 2025-04-12, &date_to = 2025-04-15
-- =====================================================================
SELECT
  u.full_name,
  COUNT(*) AS total_bookings,
  SUM(CASE WHEN c.status = 'Success' THEN 1 ELSE 0 END) AS checked_in,
  SUM(CASE WHEN bs.status_code = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
  SUM(CASE WHEN c.status = 'No Show' THEN 1 ELSE 0 END) AS no_show
FROM bookings b
JOIN trips t ON t.trip_id = b.trip_id
JOIN users u ON u.user_id = b.user_id
JOIN booking_statuses bs ON bs.status_id = b.status_id
LEFT JOIN checkins c ON c.booking_id = b.booking_id
WHERE t.trip_date BETWEEN TO_DATE('&date_from', 'YYYY-MM-DD') AND TO_DATE('&date_to', 'YYYY-MM-DD')
GROUP BY u.full_name
ORDER BY total_bookings DESC;


-- =====================================================================
-- รายงานที่ 4: จำนวนผู้ใช้บริการแต่ละเส้นทาง แยกตามวันของสัปดาห์ ในช่วงวันที่กำหนด
--   หากช่วงที่เลือกมีวันซ้ำกัน (เช่นจันทร์ 2 ครั้ง) ระบบรวมยอดของวันนั้นให้อัตโนมัติ (GROUP BY)
-- =====================================================================
SELECT
  TO_CHAR(t.trip_date, 'D') AS day_no,              -- 1=อาทิตย์ ... 7=เสาร์ (ขึ้นกับ NLS_TERRITORY)
  TO_CHAR(t.trip_date, 'Day', 'NLS_DATE_LANGUAGE=Thai') AS day_name,
  r.route_name,
  SUM(b.seats_booked) AS passenger_count
FROM bookings b
JOIN trips t ON t.trip_id = b.trip_id
JOIN schedules sch ON sch.schedule_id = t.schedule_id
JOIN routes r ON r.route_id = sch.route_id
JOIN booking_statuses bs ON bs.status_id = b.status_id
WHERE t.trip_date BETWEEN TO_DATE('&date_from', 'YYYY-MM-DD') AND TO_DATE('&date_to', 'YYYY-MM-DD')
  AND bs.status_code <> 'CANCELLED'
GROUP BY TO_CHAR(t.trip_date, 'D'), TO_CHAR(t.trip_date, 'Day', 'NLS_DATE_LANGUAGE=Thai'), r.route_name
ORDER BY day_no, r.route_name;


-- =====================================================================
-- รายงานที่ 5: การใช้บริการในแต่ละจุดจอดตามรอบเวลา ในช่วงวันที่กำหนด
--   เรียงตามจุดจอดและเวลาที่รถเริ่มออกในแต่ละจุด
-- =====================================================================
-- แยกตามแต่ละครั้งที่จุดจอดนั้นปรากฏในเส้นทาง (ใช้ route_stop_id/sequence_no กันสับสนกรณีจุดจอดซ้ำในเส้นทางเดียว เช่น
-- เส้นทางที่ 1 ผ่านโรงพยาบาลหนองจอก 2 ครั้ง ซึ่งตรงกับตัวอย่างตารางใน PDF)
SELECT
  s.stop_name,
  sch.departure_time,
  rs.sequence_no,
  SUM(CASE WHEN b.pickup_route_stop_id  = rs.route_stop_id AND c.status='Success' THEN b.seats_booked ELSE 0 END) AS pax_up,
  SUM(CASE WHEN b.dropoff_route_stop_id = rs.route_stop_id AND c.status='Success' THEN b.seats_booked ELSE 0 END) AS pax_down
FROM route_stops rs
JOIN stops s      ON s.stop_id = rs.stop_id
JOIN schedules sch ON sch.route_id = rs.route_id
JOIN trips t      ON t.schedule_id = sch.schedule_id
                   AND t.trip_date BETWEEN TO_DATE('&date_from', 'YYYY-MM-DD') AND TO_DATE('&date_to', 'YYYY-MM-DD')
LEFT JOIN bookings b ON (b.pickup_route_stop_id = rs.route_stop_id OR b.dropoff_route_stop_id = rs.route_stop_id)
                      AND b.trip_id = t.trip_id
LEFT JOIN checkins c ON c.booking_id = b.booking_id
GROUP BY s.stop_name, sch.departure_time, rs.sequence_no
ORDER BY s.stop_name, sch.departure_time, rs.sequence_no;


-- =====================================================================
-- รายงานที่ 6: การมอบหมายงานให้คนขับ แบ่งก่อน/หลัง 17:00 ในช่วงวันที่กำหนด
-- =====================================================================
SELECT
  u.full_name AS driver_name,
  COUNT(*) AS total_trips,
  SUM(CASE WHEN sch.departure_time < '17:00' THEN 1 ELSE 0 END) AS before_1700,
  SUM(CASE WHEN sch.departure_time >= '17:00' THEN 1 ELSE 0 END) AS after_1700
FROM trips t
JOIN schedules sch ON sch.schedule_id = t.schedule_id
JOIN users u ON u.user_id = sch.driver_id
WHERE t.trip_date BETWEEN TO_DATE('&date_from', 'YYYY-MM-DD') AND TO_DATE('&date_to', 'YYYY-MM-DD')
  AND t.status <> 'cancelled'
GROUP BY u.full_name
ORDER BY total_trips DESC;


-- =====================================================================
-- รายงานที่ 7: จำนวนรอบงานที่มอบหมายให้รถแต่ละประเภทและแต่ละคัน ในช่วงวันที่กำหนด
-- =====================================================================
SELECT
  v.vehicle_type,
  v.plate_no,
  COUNT(*) AS total_trips
FROM trips t
JOIN schedules sch ON sch.schedule_id = t.schedule_id
JOIN vehicles v ON v.vehicle_id = sch.vehicle_id
WHERE t.trip_date BETWEEN TO_DATE('&date_from', 'YYYY-MM-DD') AND TO_DATE('&date_to', 'YYYY-MM-DD')
  AND t.status <> 'cancelled'
GROUP BY v.vehicle_type, v.plate_no
ORDER BY v.vehicle_type, v.plate_no;

-- สรุปยอดรวมแยกเฉพาะตามประเภทรถ
SELECT
  v.vehicle_type,
  COUNT(*) AS total_trips
FROM trips t
JOIN schedules sch ON sch.schedule_id = t.schedule_id
JOIN vehicles v ON v.vehicle_id = sch.vehicle_id
WHERE t.trip_date BETWEEN TO_DATE('&date_from', 'YYYY-MM-DD') AND TO_DATE('&date_to', 'YYYY-MM-DD')
  AND t.status <> 'cancelled'
GROUP BY v.vehicle_type
ORDER BY v.vehicle_type;
