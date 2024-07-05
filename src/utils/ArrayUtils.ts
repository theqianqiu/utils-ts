/** 数组去重 */
const removeDuplicates = <T>(arr: T[]) => {
    return [...new Set(arr)];
};

/** 获取数组重复的单个元素项，返回一个数组,  例： [2,3,3,5,5] -> [3, 5] */
const getDuplicateElList = <T>(arr: T[]) => {
    const tmp = [];
    arr.concat().sort((a, b) => {
        if (a === b && tmp.indexOf(a) === -1) tmp.push(a);
        return 0;
    });
    return tmp;
};

export const ArrayUtils = { removeDuplicates, getDuplicateElList };
