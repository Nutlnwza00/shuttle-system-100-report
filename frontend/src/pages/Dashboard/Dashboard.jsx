import React,{useEffect,useMemo,useState} from 'react';
import * as UI from '../../shared';
const {api,useApi,reportNames,navItems,Header,Sidebar,Feature,Health,PageTitle,Panel,Stat,InfoGrid,Table,Status,ErrorBox,Loading,Denied,fmtDate,ReportChart}=UI;

function Dashboard({me,navigate}){const{data,error,loading}=useApi('/dashboard');return <PageTitle title={`สวัสดีคุณ ${me.user.FULL_NAME||me.user.full_name}`} subtitle="ภาพรวมระบบรถรับส่งแบบ Real-time จาก Oracle"><div className="role-banner"><span>สถานะการใช้งาน</span><b>{me.user.POS_NAME||me.user.pos_name}</b><small>· Dynamic RBAC</small></div>{error&&<ErrorBox text={error}/>}<div className="stats">{[['👥','พนักงาน Active',data?.activeUsers],['🎟️','การจองทั้งหมด',data?.bookings],['🚌','เที่ยวรถวันนี้',data?.todayTrips],['✓','Check-in วันนี้',data?.todayCheckins]].map(x=><Stat key={x[1]} icon={x[0]} label={x[1]} value={loading?'—':x[2]??0}/>)}</div><div className="dash-grid"><Panel title="เมนูระบบ"><div className="quick-grid">{[['booking','🎟️','การจอง'],['checkin','✓','Check-in'],['trips','🚌','เที่ยวรถ'],['reports','📈','รายงาน'],['profile','👤','ข้อมูลผู้ใช้']].map(x=><button className="quick" key={x[0]} onClick={()=>navigate(x[0])}><span>{x[1]}</span><b>{x[2]}</b></button>)}</div></Panel><Panel title="สถานะฐานข้อมูล"><Health/></Panel></div></PageTitle>}

export default Dashboard;
