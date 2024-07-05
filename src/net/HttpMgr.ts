/* eslint-disable no-console */
import axios, {
    AxiosInstance,
    AxiosRequestHeaders,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios';
import { LocalCache } from '../utils/LocalCache';
import { Singleton } from '../utils/Singleton';
import { emitEvent } from '../utils/WindowEvent';
import { HttpConf, HttpContentType, INet, MethodType, NetEvent, RequestData } from './NetConstants';

const formDataTypes = [HttpContentType.FORM, HttpContentType.FORM_DATA];

export class HttpMgr implements INet {
    private reqInst: AxiosInstance | undefined;
    private config = {} as HttpConf;
    private successCode: string | number = 0;
    private errCode: string | number = 0;
    private authErrCode: string | number = 0;
    private authKey = '';
    private inAuthErr = false;

    static get inst() {
        return Singleton.get(HttpMgr);
    }

    /** axios 请求初始化配置 */
    setConfig(conf: HttpConf) {
        console.log('[http] setConfig: ', conf);

        this.config = conf;
        this.successCode = this.config?.responseCode?.success ?? 1;
        this.errCode = this.config?.responseCode?.error ?? 0;
        this.authErrCode = this.config?.responseCode?.authError || 401;
        this.authKey = this.config?.authKey ?? 'token';

        if (this.reqInst) return;

        this.reqInst = axios.create({
            baseURL: this.config.baseURL ?? '',
            timeout: this.config?.timeout ?? 2000,
            headers: { 'Content-Type': HttpContentType.DEFAULT },
            withCredentials: conf?.withCredentials ?? true,
        });

        this.reqInst.interceptors.request.use(this.onRequestInterceptor.bind(this));
        this.reqInst.interceptors.response.use(this.onReponseInterceptor.bind(this));
    }

    /** 请求
     * api 请求地址
     * d  请求参数
     */
    request<T, D = any>(api: string, d?: RequestData<T>): Promise<D> {
        if (!this.reqInst) {
            if (!this.config) {
                console.log('[http] 未设置config, 将使用默认配置');
            }
            this.setConfig(
                this.config ?? {
                    baseURL: '',
                    timeout: 2000,
                },
            );
        }

        const { type, headerContentType, data } = d as RequestData;

        if (
            type === MethodType.GET &&
            formDataTypes.includes(headerContentType as HttpContentType)
        ) {
            console.warn(
                `[http] 接口${api}请求类型为 ${type}， content-type为 ${headerContentType}， 请确认~`,
            );
        }

        const method = type ?? MethodType.GET;
        const reqdata = method === MethodType.GET ? 'params' : 'data';

        return new Promise<any>((resolve) => {
            if (
                type === MethodType.POST &&
                formDataTypes.includes(headerContentType as HttpContentType)
            ) {
                this?.reqInst
                    ?.postForm?.(api, data, {
                        headers: { 'Content-Type': headerContentType },
                    })
                    .then((res) => resolve(res ?? ''))
                    .catch((err) => {
                        console.warn('[http err] ', err);
                        // rej(err);
                    });
            } else {
                this?.reqInst?.({
                    url: api,
                    method,
                    [reqdata]: data ?? '',
                })
                    .then((res) => resolve(res ?? ''))
                    .catch((err) => {
                        console.warn('[http err] ', err);
                        // rej(err);
                    });
            }
        });
    }

    onServerErr(code: string | number, msg: string) {
        console.log('[http global err] ', code, msg);
    }

    // 请求拦截
    private onRequestInterceptor(cf: InternalAxiosRequestConfig<unknown>) {
        // console.log('处理请求拦截===', cf);
        this.setAuthInHeaders(cf.headers, this.apiNeedAuth(cf?.url || '') ?? true, this.authKey);
        return cf;
    }

    // 响应拦截
    private onReponseInterceptor(res: AxiosResponse) {
        // console.log('处理响应拦截===', res);
        if (!res?.config) return res;

        // blob文件类型直接返回
        if (res.config.responseType === 'blob') return res;

        const { code, data, message } = res.data;
        const api = res.config?.url || '';

        // 自动保存授权信息
        if (data?.token && this.apiNeedAuth(api)) {
            LocalCache.setItem(this.authKey, data.token);
            // 更新token的接口里，有更新到token, 抛出事件
            if (api === this.config?.pollingToken?.api && this.config?.pollingToken?.enable) {
                emitEvent('update_token');
            }
        }

        // 所有接口都不做拦截
        if (
            typeof this.config?.responseWithoutInterceptors === 'string' &&
            this.config?.responseWithoutInterceptors === '*'
        ) {
            return data;
        }

        // 不做拦截处理的接口, 返回完整response
        if (
            typeof this.config?.responseWithoutInterceptors !== 'string' &&
            this.config?.responseWithoutInterceptors?.some((url) => api.includes(url))
        ) {
            return res.data;
        }

        switch (code) {
            case this.successCode:
                return data;
            case this.authErrCode: // 授权出错, 跳转login页
                // 重复出现授权错误，reject消息，授权出错后续逻辑不做重复执行
                if (this.inAuthErr) return Promise.reject(data);

                LocalCache.delItem(this.authKey);
                emitEvent(NetEvent.AUTH_ERROR);
                this.onServerErr?.(code, '登录状态过期，请重新登陆');
                // this.onRelogin();
                break;
            case this.errCode: // 错误code
                this.onServerErr?.(code, message);
                // console.log(`http server reponse errCode==== code:${code}, msg: ${message}`);
                return Promise.reject(message);
            default:
                return Promise.reject(data);
        }

        // 是否授权错误
        this.inAuthErr = code === this.authErrCode;

        // 开启轮询更新token
        if (this.config?.pollingToken?.enable) {
            this.pollingToken(
                this.config?.pollingToken?.api || '',
                this.config?.pollingToken?.pollingTime,
            );
        }

        return res;
    }

    private pollingToken(url: string, pollingTime?: number) {
        // api没有或没有token时，不调用
        if (!url && !LocalCache.getItem(this.config.authKey)) return;

        this.reqInst.get(url);
        setInterval(() => {
            if (!url && !LocalCache.getItem(this.config.authKey)) return;
            this.reqInst.get(url);
        }, pollingTime || 300000);
    }

    private setAuthInHeaders(headers: AxiosRequestHeaders, needAuth: boolean, authKey: string) {
        // 不需要添加授权
        if (
            typeof this.config?.requestWithoutAuth === 'string' &&
            this.config?.requestWithoutAuth === '*'
        )
            return headers;

        headers.Authorization = needAuth ? LocalCache.getItem(authKey) ?? '' : '';
        return headers;
    }

    private apiNeedAuth(api: string) {
        if (typeof this.config?.requestWithoutAuth === 'string') return false;
        return !this.config?.requestWithoutAuth?.some((url) => api.includes(url));
    }
}
