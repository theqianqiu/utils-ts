import { useRef, useEffect } from 'react';

interface UseLongPress {
    (targetNode: HTMLDivElement | null, onLongPress: () => void): void;
}
/** 长按 */
export const useLongPress: UseLongPress = (targetNode, onLongPress) => {
    const onLongPressRef = useRef(onLongPress);
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout>>();

    const onTouchStart = (): void => {
        longPressTimerRef.current = setTimeout(() => {
            onLongPressRef.current();
        }, 800);
    };

    const clearTimer = (): void => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };

    useEffect(() => {
        onLongPressRef.current = onLongPress;
    }, [onLongPress]);

    useEffect(() => {
        if (!targetNode) return undefined;
        targetNode.addEventListener('touchstart', onTouchStart);
        return (): void => {
            targetNode.removeEventListener?.('touchstart', onTouchStart);
        };
    }, [targetNode]);

    useEffect(() => {
        if (!targetNode) return undefined;
        targetNode.addEventListener('touchmove', clearTimer);
        return (): void => {
            targetNode.removeEventListener?.('touchmove', clearTimer);
        };
    }, [targetNode]);

    useEffect(() => {
        if (!targetNode) return undefined;
        targetNode.addEventListener('touchend', clearTimer);
        return (): void => {
            targetNode.removeEventListener?.('touchend', clearTimer);
        };
    }, [targetNode]);
};
