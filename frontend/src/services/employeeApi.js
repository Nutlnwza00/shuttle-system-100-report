import {api} from './api';
export const list=()=>api('/employees');
export const create=(payload)=>api('/employees',{method:'POST',body:JSON.stringify(payload)});
