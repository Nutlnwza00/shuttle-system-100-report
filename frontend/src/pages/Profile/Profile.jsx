import React,{useEffect,useMemo,useState} from 'react';
import * as UI from '../../shared';
const {api,useApi,reportNames,navItems,Header,Sidebar,Feature,Health,PageTitle,Panel,Stat,InfoGrid,Table,Status,ErrorBox,Loading,Denied,fmtDate,ReportChart}=UI;

function Profile({me}){const u=me.user;return <PageTitle title="👤 ข้อมูลผู้ใช้" subtitle="ข้อมูลจากตาราง USERS และสิทธิ์จาก ROLE_PERMISSIONS"><Panel><div className="profile-head"><div className="avatar">{(u.FULL_NAME||'U').slice(0,1)}</div><div><h2>{u.FULL_NAME}</h2><span className="badge">{u.POS_NAME||u.pos_name}</span></div></div><InfoGrid items={[["Username",u.USERNAME],["ชื่อ-นามสกุล",u.FULL_NAME],["เบอร์โทร",u.PHONE||'-'],["แผนก",u.DEPT_NAME||'-'],["ตำแหน่ง",u.POS_NAME||'-'],["ประเภทผู้ใช้",u.USER_TYPE],["สถานะ",u.STATUS]]}/></Panel></PageTitle>}

export default Profile;
