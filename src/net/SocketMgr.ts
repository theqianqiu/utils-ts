/* eslint-disable no-console */
import { ObjectUtils } from '../utils/ObjectUtils';
import { Queue } from '../utils/Queue';
import { Singleton } from '../utils/Singleton';
import { emitEvent } from '../utils/WindowEvent';
import {
    INet,
    NetEvent,
    ReqCmd,
    RequestData,
    ServerResponse,
    SocketConf,
    SocketDataType,
} from './NetConstants';

enum SocketState {
    // 连接超时
    TIME_OUT = -3,
    // 服务器关闭连接（超时or连接地址错误）
    SERVER_CLOSED = -2,
    // 连接io错误
    IO_ERROR = -1,
    // 未连接
    UN_CONNECT = 0,
    // 连接中
    CONNECTING = 1,
    // 已连接
    CONNECTED = 2,
    // 重新连接
    RE_CONNECTED = 3,
}

enum BinaryType {
    TYPE_BLOB = 'blob',
    TYPE_ARRAY_BUFFER = 'arraybuffer',
}

export type CbHandler = <T>(data?: T) => void;

type ReqData = { event: string; data?: unknown }; // RequestData<unknown> & Partial<{ api: string }>;
export class SocketMgr implements INet {
    private config = {} as SocketConf;
    private socket: WebSocket | undefined;
    // 当前scoket状态
    private state: number;
    // 最后的请求时间
    private lastRequestTime = 0;
    // 当前重连次数
    private reconnetNum = 0;
    // 是否在重连中
    private reconnecting = false;
    // 所有请求列表
    private cmdHandlerDic: Map<ReqCmd<string>, CbHandler> = new Map();
    // 发送消息列队
    private reqQueue: Queue<ReqData>;
    // 是否消息发送中
    private sending = false;
    // 收到的消息列队
    private respQueue: Queue<string | ArrayBuffer>;
    // 是否在解析消息
    private parsing = false;
    private hbTimerId = 0;
    private reconnetTimerId = 0;
    // 是否手动关闭socket
    private manualClose = false;

    private successCode: string | number = 0;
    private errCode: string | number = 0;
    private authErrCode: string | number = 0;

    static get inst() {
        return Singleton.get(SocketMgr);
    }

    constructor() {
        this.state = SocketState.UN_CONNECT;
        this.reqQueue = new Queue();
        this.respQueue = new Queue();
        this.sending = false;
        this.parsing = false;
        this.manualClose = false;
    }

    setConfig(conf: SocketConf) {
        this.config = conf;
        console.log('[socket] setConfig: ', conf);
        if (!conf?.dataType) this.config.dataType = SocketDataType.TYPE_STRING;
    }

    /** ws是否已连接上 */
    get isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN && this.state === SocketState.CONNECTED;
    }

    /** 开启ws连接
     * @param force 是否强制重连
     * @param url 连接url，没有设置则取config中的url
     */
    connect(force?: boolean, url?: string) {
        if (url) this.config.url = url;
        if (typeof WebSocket === 'undefined') {
            console.log('您的浏览器不支持WebSocket');
            return;
        }

        if (this.manualClose) return;
        if (!force && this.isConnected) return;
        if (!force && this.state !== SocketState.UN_CONNECT) return;

        this.disposeSocket();

        const conneturl = url || this.config.url;
        this.socket = new WebSocket(conneturl);
        if (this.config.dataType === SocketDataType.TYPE_BINARY) {
            this.socket.binaryType =
                this.config?.binaryConfig?.binaryType || BinaryType.TYPE_ARRAY_BUFFER;
        }
        console.log(`[socket connect] ${conneturl}`);

        this.registerEvents(true);
        this.updateState(SocketState.CONNECTING);
        // this.tagRequestTime();
    }

    close() {
        this.disposeSocket();
        this.manualClose = true;
    }

    private onConnected() {
        console.log('[socket connect] ！！！！！！ connected ！！！！！！ ');

        this.clearReconnetTimer();
        this.clearHeartBeatTimer();
        this.reconnecting = false;
        this.reconnetNum = 0;
        this.updateState(SocketState.CONNECTED);

        // 连接成功，检测是否还有未发送出去的消息
        this.onSendNextMsg();
        // 发送心跳
        this.heartBeat();
    }

    // 发起重连
    private reconnect() {
        if (this.reconnecting || this.reconnetTimerId) return;

        this.clearHeartBeatTimer();
        this.clearReconnetTimer();

        // 设置了最大重连次数
        if (
            Number(this.config?.reconnectNum) > 0 &&
            this.reconnetNum >= Number(this.config?.reconnectNum)
        ) {
            console.log(`[socket reconnect] 超过最大重连次数，取消重连`);
            this.close();
            return;
        }

        this.reconnetTimerId = window.setInterval(() => {
            this.reconnecting = true;
            this.reconnetNum += 1;
            this.connect();
            console.log('[socket reconnect] 开始重连，重连次数 ===', this.reconnetNum);
        }, 2000);
    }

    /**
     * 注册协议回调
     * @param cmd 协议名
     */
    regCMDHandler(cmd: ReqCmd<string> | ReqCmd<string>[], handler: CbHandler) {
        if (typeof cmd !== 'string') {
            cmd.forEach((c) => {
                this.cmdHandlerDic.set(c, handler);
            });
        } else this.cmdHandlerDic.set(cmd, handler);
    }

    request<D>(api?: string, data?: RequestData): Promise<D> {
        const sendd = { event: api, data: data?.data };
        console.log('[socket send] ', sendd);
        return new Promise<any>((resolve) => {
            this.reqQueue.add(sendd);
            if (!this.isConnected) {
                console.warn(`[scoket send error] socket not connected`);
                return;
            }
            this.onSendNextMsg();
            resolve(true);
        });
    }

    private onSendNextMsg() {
        if (!this.socket) return;
        if (this.sending) return;
        if (!this.reqQueue.size) return;

        const sendMsg = this.reqQueue.pop();
        if (!sendMsg) return;

        this.sending = true;

        // string格式传输数据
        if (this.config.dataType === SocketDataType.TYPE_STRING) {
            this.socket.send(JSON.stringify(sendMsg));
        } else {
            // 二进制传输

            // 设置协议名
            const cmdName = sendMsg.event;
            const cmdNameBuffer = this.stringToArrayBuffer(cmdName);
            // 设置消息体信息
            const msg = sendMsg?.data || '';
            const msgcontent = typeof msg === 'string' ? msg : JSON.stringify(msg);
            const bodyBuffer = this.stringToArrayBuffer(msgcontent);
            // 设置头信息
            const headerBuffer = new ArrayBuffer(
                Number(this.config?.binaryConfig?.protocolHeadLen),
            );
            const headerView = new DataView(headerBuffer, 0);
            const totalLen =
                Number(this.config?.binaryConfig?.protocolHeadLen) +
                cmdNameBuffer.byteLength +
                bodyBuffer.byteLength;
            headerView.setInt32(0, totalLen, this.config.binaryConfig?.littleEndian); // 设置包总长度,  4 字节。
            headerView.setInt16(4, 4, this.config?.binaryConfig?.littleEndian); // 设置目标服务器类型， 2 字节.
            headerView.setInt16(
                6,
                cmdNameBuffer.byteLength,
                this.config?.binaryConfig?.littleEndian,
            ); // 设置协议名长度 2 字节.
            const finalBuffer = this.mergeArrayBuffer(headerBuffer, cmdNameBuffer, bodyBuffer);
            this.socket.send(finalBuffer);
        }

        // console.log('[socket send] ', sendMsg);

        // this.tagRequestTime();
        this.sending = false;
        this.onSendNextMsg();
    }

    /** 收到消息 */
    private onMessage(e: MessageEvent) {
        this.lastRequestTime = 0;
        // this.clearHeartBeatTimer();

        const msg = e.data;

        if (this.config.dataType === SocketDataType.TYPE_BINARY && msg instanceof ArrayBuffer) {
            const msgLen = msg.byteLength;
            // 数据总长度低于协议头长度，此条消息无效
            if (msgLen <= (this.config?.binaryConfig?.protocolHeadLen || 4)) {
                console.warn('[socket msg err] byteLen not math ');
                return;
            }
        }
        this.respQueue.add(msg);
        this.onParseNextMsg();
    }

    private onParseNextMsg() {
        if (this.parsing) return;
        if (!this.respQueue.size) {
            this.parsing = false;
            return;
        }

        const msg = this.respQueue.pop();
        if (!msg) return;

        this.parsing = true;

        const stringTypeMsg = this.config.dataType === SocketDataType.TYPE_STRING;
        const body = ObjectUtils.parseJSON(msg as string);

        const bodyContent = (body?.body ?? body) as ServerResponse;

        let cmd = stringTypeMsg ? bodyContent?.event || '' : ''; // 消息名
        const msgData = stringTypeMsg ? bodyContent?.data || '' : '';
        const hasError = bodyContent?.success === false;
        const errmsg = stringTypeMsg ? bodyContent?.message || '' : '';
        const errcode = stringTypeMsg ? bodyContent?.code || '' : '';
        console.log('[socket receive] ', ObjectUtils.parseJSON(msg as string));

        // 二进制数据处理
        if (!stringTypeMsg) {
            // 下面开始读取数据，按照服务器传递过来的数据，按照顺序读取
            // 消息头信息解析
            const netMsg = msg as ArrayBuffer;
            const msgByte = new DataView(netMsg);
            const cmdNameLen = msgByte.getInt16(6);
            // 消息体信息解析
            const cmdNameEndOffset =
                Number(this.config?.binaryConfig?.protocolHeadLen) + cmdNameLen;
            cmd = this.arrayBufferToString(
                netMsg.slice(Number(this.config?.binaryConfig?.protocolHeadLen), cmdNameEndOffset),
            );
        }

        const cb = this.cmdHandlerDic.get(cmd);

        // 不做统一处理的协议,返回完整response数据
        if (this.config?.responseWithoutInterceptors?.includes(cmd)) {
            cb?.(bodyContent);
        } else {
            // 错误处理
            // eslint-disable-next-line no-lonely-if
            if (hasError) this.onServerErr(errcode, errmsg);
            // 处理回调
            else cb?.(msgData || '');
            // if (hasError) {
            //     if (!this.config?.errExcludeCMDList?.includes(cmd))
            //         this.onServerErr(errcode, errmsg);
            //     else cb?.(bodyContent);
            // } else {
            //     // 处理回调
            //     cb?.(msgData || '');
            // }
        }

        this.parsing = false;
        this.onParseNextMsg();
    }

    onServerErr(code: string | number, msg: string) {
        console.log('[socket codeErr] ', code, msg);
    }

    /** 发送心跳 */
    private heartBeat() {
        if (!this.config?.heartBeatCmd) return;
        console.log('[socket heartBeat] ', this.config?.heartBeatCmd);

        this.hbTimerId = window.setInterval(() => {
            this?.socket?.send(this.config?.heartBeatCmd || '');
        }, this.config?.heartBeatTime || 5000);
    }

    private updateState(state: SocketState) {
        this.state = state;

        switch (state) {
            case SocketState.CONNECTED:
                emitEvent(NetEvent.NET_CONNECTED);
                break;
            case SocketState.RE_CONNECTED:
            case SocketState.TIME_OUT:
                emitEvent(NetEvent.NET_CONNECTING);
                break;
            default:
        }
    }

    protected onClose() {
        console.log('[socket close] is closed by manual: ', this.manualClose);
        this.reconnecting = false;
        if (this.manualClose) {
            this.destroy();
        }
        this.updateState(SocketState.UN_CONNECT);
    }

    protected onIOError(e: Event) {
        console.warn('[socket onIOError] ', e);
        this.updateState(SocketState.IO_ERROR);
        this.clearHeartBeatTimer();
        this.clearReconnetTimer();
        this.reconnecting = false;
        this.reconnect();
    }

    private disposeSocket() {
        this.socket?.close();
        this.socket = undefined;
        this.parsing = false;
        this.sending = false;
        this.manualClose = false;
        this.reconnecting = false;
        this.registerEvents(false);
        this.clearHeartBeatTimer();
        this.clearReconnetTimer();
    }

    private registerEvents(isRegister: boolean) {
        if (!this.socket) return;

        if (isRegister) {
            this.socket.onopen = this.onConnected.bind(this);
            this.socket.onmessage = this.onMessage.bind(this);
            this.socket.onclose = this.onClose.bind(this);
            this.socket.onerror = this.onIOError.bind(this);
        } else {
            this.socket.removeEventListener('open', this.onConnected);
            this.socket.removeEventListener('message', this.onMessage);
            this.socket.removeEventListener('close', this.onClose);
            this.socket.removeEventListener('error', this.onIOError);
        }
    }

    /**
     * 将字符串转换为基于 Int8Array 的 ArrayBuffer.
     *
     * @param {string} content
     * @returns {ArrayBuffer}
     */
    private stringToArrayBuffer(content: string): ArrayBuffer {
        return new TextEncoder().encode(content);
    }

    /**
     * 将Int8Array的 ArrayBuffer 转换为字符串
     *
     * @param {ArrayBuffer}
     * @returns {string}
     */
    private arrayBufferToString(buffer: ArrayBuffer): string {
        return new TextDecoder().decode(buffer);
    }

    /**
     * 合并多个 ArrayBuffer 至同一个 ArrayBuffer 中.
     *
     * @param {...ArrayBuffer[]} arrayBuffers
     * @returns {ArrayBuffer}
     */
    private mergeArrayBuffer(...arrayBuffers: ArrayBuffer[]): ArrayBuffer {
        let totalLength = 0;
        arrayBuffers.forEach((item) => {
            totalLength += item.byteLength;
        });

        const result = new Int8Array(totalLength);
        let offset = 0;
        arrayBuffers.forEach((item) => {
            result.set(new Int8Array(item), offset);
            offset += item.byteLength;
        });

        return result.buffer;
    }

    private destroy() {
        this.disposeSocket();
        this.reqQueue.clear();
        this.respQueue.clear();
    }

    private clearHeartBeatTimer() {
        if (this.hbTimerId) {
            window.clearInterval(this.hbTimerId);
            this.hbTimerId = 0;
        }
    }

    private clearReconnetTimer() {
        if (this.reconnetTimerId) {
            window.clearInterval(this.reconnetTimerId);
            this.reconnetTimerId = 0;
        }
    }

    private now() {
        return new Date().getTime();
    }
}
