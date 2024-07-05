/**
 * 首字母大写
 */
const upperFirst = (str: string): string => {
    return str.replace(/(\w)/, ($1) => $1.toLocaleUpperCase());
};

/**
 * 获取字符串的字节长度
 */
const byteSize = (str: string): number => {
    return new Blob([str]).size;
};

/**
 * 移除字符串中的html标签
 */
const removeHTML = (str: string): string => {
    return str.replace(/<[^>]+>/g, '').replace(/&[\s\S]+?;/g, '');
};

/**
 * 字符串替换
 * 使用指定的掩码字符替换start~length之间的所有字符
 * @example
 * mask('123456') // => '******'
 * @example
 * 设置开始位置
 * mask('123456', 2) // => '12****'
 * @example
 * 设置长度
 * mask('123456', 2, 3) // => '12***6'
 * @example
 * 修改掩码字符
 * mask('123456', 2, 3, '.') // => '12...6'
 */
const mask = (str: string, start = 0, length?: number, mask = '*'): string => {
    const val = length || length === 0 ? str.slice(start, length + start) : str.slice(start);
    return str.replace(val, mask.padEnd(val.length, mask));
};

/**
 *  指定位置插入字符串
 * @param origin
 * @param index
 * @param insert
 * @returns
 */
const insertStr = (origin: string, index: number, insert: string) => {
    if (index <= -1) return origin;
    return origin.substring(0, index) + insert + origin.substring(index);
};

/** 将16进制颜色转换成rbga
 * @param hex
 * @param alpha 默认1
 */
const hexToRgba = (hex: string, alpha?: number) => {
    // 去掉十六进制颜色值中的 "#" 符号
    const hexstr = hex.replace('#', '');

    // 将十六进制值分割成红、绿、蓝三部分
    const red = parseInt(hexstr.substring(0, 2), 16);
    const green = parseInt(hexstr.substring(2, 4), 16);
    const blue = parseInt(hexstr.substring(4, 6), 16);

    return `rgba(${red}, ${green}, ${blue}, ${alpha ?? 1})`;
};

export const StringUtils = {
    upperFirst,
    byteSize,
    removeHTML,
    mask,
    insertStr,
    hexToRgba,
};
