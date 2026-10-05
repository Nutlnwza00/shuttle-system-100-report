import {api} from './api';
export const getReport=(id,params={})=>api(`/reports/${id}?${new URLSearchParams(params)}`);
