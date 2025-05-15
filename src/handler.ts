import { ResponseType } from '@/api/http';
export interface Handler {
    handle: (data: any) => Promise<ResponseType>;
    [key: string]: any;
}