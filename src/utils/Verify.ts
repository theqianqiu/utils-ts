/**
 * 判断是否为手机号
 */
const isPhone = (value: string) => {
    return /^(?:(?:\+|00)86)?1(?:(?:3[\d])|(?:4[5-79])|(?:5[0-35-9])|(?:6[5-7])|(?:7[0-8])|(?:8[\d])|(?:9[1589]))\d{8}$/.test(
        value,
    );
};

/**
 * 邮箱验证
 * @param value
 * @returns
 */
const isEmail = (value: string) => {
    return /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(value);
};

/**
 * 密码验证  大写字母，小写字母，数字，特殊符号 任意3项密码;
 * @param value
 * @param minlen 最少字符数
 * @returns
 */
const isPassword = (value: string | number, minlen = 8) => {
    if (`${value}`?.length < minlen) return false;

    return /^(?![a-zA-Z]+$)(?![A-Z0-9]+$)(?![A-Z\W_!@#$%^&*`~()-+=]+$)(?![a-z0-9]+$)(?![a-z\W_!@#$%^&*`~()-+=]+$)(?![0-9\W_!@#$%^&*`~()-+=]+$)[a-zA-Z0-9\W_!@#$%^&*`~()-+=]/.test(
        `${value}`,
    );
};

/**
 * 检查字符串是否包含中文
 */
const isIncludeChinese = (value: string): boolean => {
    return /^(?:[\u3400-\u4DB5\u4E00-\u9FEA\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0])+$/.test(
        `${value}`,
    );
};

/**
 * 密码验证  大写字母，小写字母，数字，特殊符号 任意其中一项组合;
 * @param value
 * @param minlen 最少字符数
 * @returns
 */
const isSimplePassword = (value: string, minlen = 8) => {
    if (value?.length < minlen) return false;

    return !isIncludeChinese(value);
};

/**
 * 验证码验证 (纯数字)
 * @param value
 * @param minlen
 * @returns
 */
const isVerification = (value: string | number, minlen = 6) => {
    if (`${value}`?.length < minlen) return false;
    return /^\d+$/.test(`${value}`);
};

export const Verify = {
    isPhone,
    isEmail,
    isPassword,
    isSimplePassword,
    isVerification,
    isIncludeChinese,
};
