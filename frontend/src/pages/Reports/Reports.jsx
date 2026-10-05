import React from 'react';
import {reportNames} from '../../shared';
const meta={
  1:['📊','ผู้โดยสารขึ้น/ลงรายเดือน','เปรียบเทียบจำนวนผู้โดยสารขึ้นและลงรถของแต่ละสถานี รายเดือน','year'],
  2:['📈','สถิติการจองรายเดือน','จำนวนการจอง ที่นั่งที่ถูกจอง การยกเลิก Check-in สำเร็จ และ No Show','year'],
  3:['👤','พฤติกรรมของผู้ใช้','สรุปการจอง ขึ้นรถจริง ยกเลิก และ No Show ของผู้ใช้แต่ละคน','range'],
  4:['🛣️','ผู้ใช้แต่ละเส้นทางรายวัน','สรุปจำนวนผู้ใช้บริการแต่ละเส้นทาง แยกตามวันของสัปดาห์','range'],
  5:['📍','จุดจอดตามรอบเวลา','จำนวนคนขึ้นและลงในแต่ละจุดจอด เรียงตามจุดจอดและเวลาที่รถออก','range'],
  6:['🕔','งานคนขับก่อน/หลัง 17:00','สรุปการมอบหมายงานให้คนขับ แบ่งเป็นก่อนและหลัง 17:00 น.','range'],
  7:['🚌','งานตามประเภทรถ','จำนวนรอบงานที่มอบหมายให้รถแต่ละประเภทและแต่ละคัน','range']
};
export default function Reports({navigate}){return <div className="report-page"><div className="page-title"><h1>📊 รายงาน</h1><p>เลือกรายงานที่ต้องการดู (ข้อ 1-2 กรองตามปี / ข้อ 3-7 กรองตามช่วงวันที่)</p></div><div className="report-hub-grid">{Object.keys(meta).map(id=>{const [icon,title,desc,filter]=meta[id];return <button className="report-card report-hub-card" key={id} onClick={()=>navigate('report-'+id)}><div className="report-card-top"><span>รายงานที่ {id}</span><b>{icon}</b></div><h3>{title}</h3><p>{desc}</p><em>{filter==='year'?'กรองตามปี':'กรองตามช่วงวันที่'}</em><strong>เปิดรายงาน →</strong></button>})}</div></div>}
