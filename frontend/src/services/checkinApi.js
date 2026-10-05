import {api} from './api';
export const list=()=>api('/checkins');
export const create=(payload)=>api('/checkins',{method:'POST',body:JSON.stringify(payload)});
