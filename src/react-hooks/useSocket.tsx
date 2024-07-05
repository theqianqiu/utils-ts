import { RequestData, ServerType } from '../net/NetConstants';
import { NetManager } from '../net/NetManager';

/** 根据库里的SocketMgr写的hooks */
export const useSocket = () => {
    /** 注册socket消息 */
    const regCmd = (event: string | string[], cb: <T>(data?: T) => void) => {
        NetManager.inst.socketRegisterCmd(event, cb);
    };

    /** 发送socket消息 */
    const send = <T,>(event: string, data?: T) => {
        NetManager.inst.request(event, { data } as RequestData, ServerType.SOCKET);
    };

    return { send, regCmd };
};
