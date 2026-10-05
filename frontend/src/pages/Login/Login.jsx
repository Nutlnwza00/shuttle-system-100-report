import React,{useEffect,useMemo,useState} from 'react';
import * as UI from '../../shared';
const {api,useApi,reportNames,navItems,Header,Sidebar,Feature,Health,PageTitle,Panel,Stat,InfoGrid,Table,Status,ErrorBox,Loading,Denied,fmtDate,ReportChart}=UI;

function Login({onLogin}){const[u,setU]=useState('admin_a'),[p,setP]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);async function submit(e){e.preventDefault();setBusy(true);setError('');try{onLogin(await api('/auth/login',{method:'POST',body:JSON.stringify({username:u,password:p})}))}catch(e){setError(e.message)}finally{setBusy(false)}}return <div className="login-page"><form className="login-card" onSubmit={submit}><div className="logo">🚐</div><h1>Shuttle Bus</h1><p>เข้าสู่ระบบจัดการรถรับส่ง</p>{error&&<div className="error">{error}</div>}<label>ชื่อผู้ใช้<input value={u} onChange={e=>setU(e.target.value)} autoComplete="username"/></label><label>รหัสผ่าน<input type="password" value={p} onChange={e=>setP(e.target.value)} autoComplete="current-password"/></label><button disabled={busy}>{busy?'กำลังตรวจสอบ...':'เข้าสู่ระบบ'}</button><small>บัญชีและสิทธิ์ตรวจสอบจาก Oracle Database</small></form></div>}

export default Login;
