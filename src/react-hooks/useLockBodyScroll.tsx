import { useEffect } from 'react';

const enableBodyScroll = (): void => {
    const { top } = document.body.style;
    document.body.style.position = '';
    document.body.style.top = '';
    window.scrollTo(0, parseInt(top || `${-window.scrollY}` || '0', 10) * -1);
};

/** 关闭页面滚动 */
export const useLockBodyScroll = (enable = true): void => {
    useEffect(() => {
        // 双层弹窗时需对top做判断
        if (enable) {
            if (!document.body.style.top) {
                document.body.style.top = `-${window.scrollY}px`;
            }
            document.body.style.position = 'fixed';
        }

        return (): void => {
            enableBodyScroll();
        };
    }, [enable]);
};
