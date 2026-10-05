import {api} from './api';
export const list=()=>api('/trips');
export const create=(payload)=>api('/trips',{method:'POST',body:JSON.stringify(payload)});
