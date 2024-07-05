import { useLayoutEffect, useRef, MutableRefObject } from 'react';

/**
 * 判断组件是否挂载
 */
export function useIsMounted(): MutableRefObject<boolean> {
    const isMountedRef = useRef(false);

    useLayoutEffect(() => {
        isMountedRef.current = true;

        return (): void => {
            isMountedRef.current = false;
        };
    });

    return isMountedRef;
}
