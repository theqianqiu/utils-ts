/** 发送事件 */
export const emitEvent = (evtName: string, params?: any) => {
    if (params) {
        window.dispatchEvent(new CustomEvent(evtName, { detail: params }));
    } else {
        window.dispatchEvent(new Event(evtName));
    }
};

/** 监听事件 */
export const catchEvent = (evtName: string, handler: (e: any) => void) => {
    window.addEventListener(evtName, handler);
};

/** 移除事件 */
export const removeEvent = (evtName: string, handler: (e: any) => void) => {
    window.removeEventListener(evtName, handler);
};
