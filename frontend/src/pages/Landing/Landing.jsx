import React,{useEffect,useMemo,useState} from 'react';
import * as UI from '../../shared';
const {api,useApi,reportNames,navItems,Header,Sidebar,Feature,Health,PageTitle,Panel,Stat,InfoGrid,Table,Status,ErrorBox,Loading,Denied,fmtDate,ReportChart}=UI;

function Landing({onLogin}){return <div className="landing"><div className="landing-card"><span className="eyebrow">MUT · หนองจอก</span><h1>🚐 Shuttle Bus<br/><em>System</em></h1><p>ระบบรถรับส่งสำหรับนักศึกษาและเจ้าหน้าที่ จองรถ ตรวจรอบเวลา เช็คอิน และดูรายงานการใช้งานได้ในที่เดียว</p><button onClick={onLogin}>เข้าสู่ระบบ →</button><div className="feature-row"><Feature icon="📍" title="จุดรับส่งตามเส้นทาง"/><Feature icon="🎟️" title="จองพร้อม QR Code"/><Feature icon="📊" title="รายงานการใช้งาน"/></div></div></div>}

export default Landing;
