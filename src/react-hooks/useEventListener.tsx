import { useEffect } from 'react';
import { catchEvent, removeEvent } from '../utils/WindowEvent';

/** 自定义事件侦听 */
export const useEventListener = (eventName: string, handler: (e?: any) => void) => {
    useEffect(() => {
        catchEvent(eventName, handler);
        return () => {
            removeEvent(eventName, handler);
        };
    }, [eventName, handler]);
};
