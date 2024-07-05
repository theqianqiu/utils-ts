import { useCallback, useEffect, useRef } from 'react';

type TimerReturnType = ReturnType<typeof setTimeout>;
type TimerIdType = string | number | undefined;

type TimerType = {
    timerOnce: (fun: () => void, delay: number) => TimerReturnType;
    timerLoop: (fun: () => void, delay: number, runCount?: number) => TimerReturnType;
    clearTimer: (timer: TimerReturnType) => void;
    clearTimerAll: () => void;
};

export const useTimer = (): TimerType => {
    const timerList = useRef<TimerIdType[]>([]);

    const delTimer = useCallback(
        (timerID: TimerIdType) => {
            if (timerID) {
                clearTimeout(Number(timerID));
                clearInterval(Number(timerID));

                const timerIndex = timerList.current.indexOf(Number(timerID));
                if (timerIndex >= 0) {
                    timerList.current.splice(timerIndex, 1);
                }
                // console.log('清除单个timer=====', timerID);
            }
        },
        [timerList],
    );

    const clearTimer = useCallback(
        (timerID: TimerIdType) => {
            delTimer(timerID);
        },
        [delTimer],
    );

    const clearTimerAll = useCallback(() => {
        while (timerList.current.length) {
            const timer = timerList.current.shift();
            if (timer) {
                clearTimeout(timer);
                clearInterval(timer);
            }
            // console.log('清除所有timer=====', timer);
        }
        timerList.current.length = 0;
    }, [timerList]);

    const timerOnce = (method: () => void, delay: number): ReturnType<typeof setTimeout> => {
        const timer = setTimeout(() => {
            method();
            clearTimer(timer);
        }, delay);

        timerList.current.push(timer);
        return timer;
    };

    const timerLoop = (
        method: () => void,
        delay: number,
        runCount?: number,
    ): ReturnType<typeof setTimeout> => {
        const timer = setInterval(() => {
            method();
            let num = runCount;
            if (num) {
                num -= 1;
                if (num <= 0) {
                    clearTimer(timer);
                }
            }
        }, delay);
        timerList.current.push(timer);
        return timer;
    };

    useEffect(() => {
        return () => {
            clearTimerAll();
        };
    }, [clearTimerAll]);

    return { timerOnce, timerLoop, clearTimer, clearTimerAll };
};
