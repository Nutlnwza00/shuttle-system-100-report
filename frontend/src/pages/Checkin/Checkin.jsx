import React,{useEffect,useMemo,useState} from 'react';
import * as UI from '../../shared';
const {api,useApi,reportNames,navItems,Header,Sidebar,Feature,Health,PageTitle,Panel,Stat,InfoGrid,Table,Status,ErrorBox,Loading,Denied,fmtDate,ReportChart}=UI;

function Checkin(){const[code,setCode]=useState(''),[result,setResult]=useState(null),[busy,setBusy]=useState(false);async function submit(e){e.preventDefault();setBusy(true);try{setResult(await api('/checkins',{method:'POST',body:JSON.stringify({qr_code:code,status:'Success'})}))}catch(e){setResult({error:e.message})}finally{setBusy(false)}}return <PageTitle title="✓ Check-in" subtitle="ตรวจสอบ Booking/QR และบันทึกการขึ้นรถลง Oracle"><Panel><form className="checkin-form" onSubmit={submit}><div className="scan-icon">▦</div><input value={code} onChange={e=>setCode(e.target.value)} placeholder="กรอก QR Code เช่น SH-..." autoFocus/><button disabled={busy}>{busy?'กำลังบันทึก...':'ยืนยัน Check-in'}</button></form>{result&&<div className={result.error?'error':'success'}>{result.error||'✓ Check-in สำเร็จ'}</div>}</Panel></PageTitle>}

export default Checkin;
