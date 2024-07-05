/**
 * 获取设备类型
 * @return "Mobile" | "Desktop"
 */
const detectDeviceType = () => {
    return /Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
};

/**
 * 是否是移动端
 */
const isMobile = () => {
    return detectDeviceType() === 'Mobile';
};

/**
 * 是否是桌面端
 */
const isDesktop = () => {
    return detectDeviceType() === 'Desktop';
};

/**
 * 是否是安卓系统
 */
const isAndroid = () => {
    return isMobile() && /Android/i.test(navigator.userAgent);
};

/**
 * 是否是ios系统
 */
const isIOS = () => {
    return isMobile() && !isAndroid();
};

/**
 * 是否是微信环境
 */
const isWechat = () => {
    return /MicroMessenger\//i.test(navigator.userAgent);
};

/**
 * 是否是QQ环境
 */
const isQQ = () => {
    return /QQ\//i.test(navigator.userAgent);
};

/**
 * 是否是微信小程序环境
 */
const isWeixinMini = () => {
    return /miniProgram/i.test(navigator.userAgent);
};

/**
 * 是否是windows环境
 */
const isWin = () => {
    return /Windows/i.test(navigator.userAgent);
};

export const Device = {
    isMobile,
    isDesktop,
    isAndroid,
    isIOS,
    isWeixinMini,
    isWechat,
    isQQ,
    isWin,
};
