import {api} from './api';
export const list=()=>api('/bookings');
export const create=(payload)=>api('/bookings',{method:'POST',body:JSON.stringify(payload)});
