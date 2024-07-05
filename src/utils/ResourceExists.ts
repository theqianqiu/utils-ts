import axios from 'axios';

/** 判断某个资源网络上是否存在 */
export const ResourceExists = async (resUrl: string) => {
    const res = await axios.get(resUrl);
    return res.status === 200;
};
