import React,{useEffect,useMemo,useState} from 'react';
import * as UI from '../../shared';
const {api,useApi,reportNames,navItems,Header,Sidebar,Feature,Health,PageTitle,Panel,Stat,InfoGrid,Table,Status,ErrorBox,Loading,Denied,fmtDate,ReportChart}=UI;

function Trips(){const{data,error,loading}=useApi('/trips');return <PageTitle title="🚌 เที่ยวรถ" subtitle="ตาราง Trip / Schedule / Driver / Vehicle จาก Oracle"><Panel>{error?<ErrorBox text={error}/>:<Table headers={['Trip','วันที่','เวลา','เส้นทาง','คนขับ','รถ','สถานะ']}>{(data||[]).map(t=><tr key={t.TRIP_ID}><td>#{t.TRIP_ID}</td><td>{fmtDate(t.TRIP_DATE)}</td><td>{t.DEPARTURE_TIME}</td><td>{t.ROUTE_NAME}</td><td>{t.DRIVER_NAME}</td><td>{t.PLATE_NO}</td><td><Status s={t.STATUS}/></td></tr>)}</Table>}{loading&&<Loading/>}</Panel></PageTitle>}

export default Trips;
