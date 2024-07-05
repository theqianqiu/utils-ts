export enum ServerType {
    HTTP,
    SOCKET,
}

export enum MethodType {
    GET = 'get',
    POST = 'post',
    DELETE = 'delete',
    PUT = 'put',
}

export enum HttpContentType {
    DEFAULT = 'application/json;charset=utf-8',
    FORM = 'application/x-www-form-urlencoded',
    FORM_DATA = 'multipart/form-data',
}

export interface HttpConf {
    baseURL: string;
    /** 是否打开log 默认打开 */
    log?: boolean;
    /** 超时， 默认2000ms */
    timeout?: number;
    /** 设置到header里的授权key 默认 token */
    authKey?: string;
    withCredentials?: boolean;
    /** 接口回复的code */
    responseCode?: {
        /** 成功 默认 1 */
        success: string | number;
        /** 错误 默认 0 */
        error: string | number;
        /** token错误 默认 401 */
        authError: string | number;
    };
    /** 不需要走授权key的接口列表 为 ‘*’时表示不需要设置授权 */
    requestWithoutAuth?: string[] | string;
    /** 不做返回拦截处理的接口列表 为 ‘*’时表示所有接口都不需要做拦截处理。 返回完整response */
    responseWithoutInterceptors?: string[] | string;
    /** 是否轮询获取最新token */
    pollingToken?: {
        enable: boolean;
        api: string;
        /** 轮询间隔， 默认5分钟 */
        pollingTime?: number;
    };
}

// 请求数据类型
export enum SocketDataType {
    /** 字符串 */
    TYPE_STRING = 'string',
    /** 二进制 */
    TYPE_BINARY = 'binary',
}

export interface SocketConf {
    /** 服务器url */
    url: string;
    /** 是否打开log 默认打开 */
    log?: boolean;
    /** 传输数据格式 默认string */
    dataType?: SocketDataType;
    /** 二进制传输相关参数 */
    binaryConfig?: {
        /** 二进制消息头长度 */
        protocolHeadLen: number;
        /** 二进制数据类型 默认 arraybuffer */
        binaryType?: BinaryType;
        /** 是否小端字节序 */
        littleEndian?: boolean;
    };
    /** 接口回复的code */
    responseCode?: {
        /** 成功 默认 1 */
        success: string | number;
        /** 错误 默认 0 */
        error: string | number;
        /** token错误 默认 401 */
        authError: string | number;
    };
    /** 心跳协议名 */
    heartBeatCmd?: string;
    /** 心跳间隔时间 默认5000 */
    heartBeatTime?: number;
    /** 连接超时时间 默认3000 */
    timeoutTime?: number;
    /** 重连次数 不设置或设置-1则无限重连 */
    reconnectNum?: number;
    /** 不做返回拦截处理的接口列表, 返回完整response */
    responseWithoutInterceptors?: string[];
    /** errcode过滤的协议列表 */
    errExcludeCMDList?: string[];
}

export interface RequestData<T = unknown> {
    // 请求携带的参数
    data?: T;
    // 请求类型，仅http请求时需要
    type?: MethodType | string;
    // 请求header content-type，仅http请求时需要
    headerContentType?: HttpContentType | string;
}

export interface ServerResponse<T = unknown> {
    /** 是否成功 */
    success: boolean;
    /** 返回code */
    code?: string | number;
    /** 返回msg */
    message?: string;
    /** socket用：协议名 */
    event?: string;
    /** 接口具体数据 */
    data?: T;
}

export type ServerErrCommonHdr = (code: string | number, msg: string) => void;

export enum NetEvent {
    /** 授权错误 */
    AUTH_ERROR = 'auth_error',
    /** 连接中 */
    NET_CONNECTING = 'net_connecting',
    /** 已连接 */
    NET_CONNECTED = 'net_connected',
    /** 连接关闭 */
    NET_BEEN_CLOSED = 'net_been_closed',
}

export type ReqCmd<T> = T;

export interface INet {
    /** 配置项设置 */
    setConfig: (conf: HttpConf | SocketConf) => void;
    /** 请求 */
    request: <D>(api?: string, data?: RequestData) => Promise<D>;
    /** 服务端错误码提示 */
    onServerErr: ServerErrCommonHdr;
}
