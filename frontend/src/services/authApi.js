import {api} from './api';
export const login=(username,password)=>api('/auth/login',{method:'POST',body:JSON.stringify({username,password})});
export const getMe=()=>api('/me');
