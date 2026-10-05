import React,{useEffect,useMemo,useState} from 'react';
import * as UI from '../../shared';
const {api,useApi,reportNames,navItems,Header,Sidebar,Feature,Health,PageTitle,Panel,Stat,InfoGrid,Table,Status,ErrorBox,Loading,Denied,fmtDate,ReportChart}=UI;

function Employees({open}){const{data,error,loading,reload}=useApi('/employees');return <PageTitle title="👥 จัดการพนักงาน" subtitle="เพิ่ม แก้ไข ปรับสถานะ และกำหนดตำแหน่งจาก Oracle"><div className="toolbar"><div>{loading?'กำลังโหลด...':`ทั้งหมด ${(data||[]).length} คน`}</div><button onClick={()=>open('add')}>＋ เพิ่มพนักงาน</button></div>{error?<ErrorBox text={error}/>:<Panel><Table headers={['Username','ชื่อ-นามสกุล','แผนก','ตำแหน่ง','สถานะ','จัดการ']}>{(data||[]).map(u=><tr key={u.USER_ID}><td>{u.USERNAME}</td><td>{u.FULL_NAME}</td><td>{u.DEPT_NAME||'-'}</td><td><span className="badge">{u.POS_NAME||'-'}</span></td><td><Status s={u.STATUS}/></td><td><button className="mini" onClick={()=>open({kind:'edit',user:u,reload})}>แก้ไข</button><button className="mini danger" onClick={async()=>{if(confirm('ยืนยันปิดการใช้งานผู้ใช้นี้?')){await api('/employees/'+u.USER_ID,{method:'DELETE'});reload()}}}>ปิดใช้งาน</button></td></tr>)}</Table></Panel>}</PageTitle>}

export default Employees;
