/** 是否刘海屏 */
const judgeBigScreen = (): boolean => {
    let result = false;
    const rate = window.screen.height / window.screen.width;
    const limit = window.screen.height === window.screen.availHeight ? 1.8 : 1.65;
    if (rate > limit) {
        result = true;
    }
    return result;
};

const rem2px = (n: number, base = 750): number => {
    return n * 100 * (document.documentElement.offsetWidth / base);
};

/** 获取滚动条位置 */
const getScrollTop = (): number => {
    return document.documentElement.scrollTop || document.body.scrollTop;
};

// 滚动到指定位置
const setScrollTop = (top: number, smooth = false): void => {
    if (smooth && 'scrollBehavior' in document.documentElement.style) {
        try {
            window.scrollTo({
                top,
                behavior: 'smooth',
            });
        } catch (e) {
            document.documentElement.scrollTop = top;
            document.body.scrollTop = top;
        }
    } else {
        document.documentElement.scrollTop = top;
        document.body.scrollTop = top;
    }
};

export enum SizeRatioType {
    UNDEFINED,
    /** 横向16:9 */
    HORIZONTAL,
    /** 竖向9:16 */
    VERTICAL,
}

// 根据16:9 比例换算高度 默认16:9
export const getHeightByRate = (width: number, type = SizeRatioType.HORIZONTAL) => {
    return type === SizeRatioType.HORIZONTAL ? (width * 9) / 16 : (width * 16) / 9;
};

// 根据16:9 比例换算宽度 默认16:9
export const getWidthByRate = (height: number, type = SizeRatioType.HORIZONTAL) => {
    return type === SizeRatioType.HORIZONTAL ? (height * 16) / 9 : (height * 9) / 16;
};

export const Browser = {
    judgeBigScreen,
    rem2px,
    getScrollTop,
    setScrollTop,
    getHeightByRate,
    getWidthByRate,
};
