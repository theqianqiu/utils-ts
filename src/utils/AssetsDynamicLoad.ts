const allAssets: Map<string, string> = new Map();

/**
 * 打印所有资源
 */
export const consoleCaches = () => {
    console.log('all assets: ', allAssets);
};

/**
 * 预加载图片(需项目使用webpack打包才可用)
 * @param r webpack 的 require.context
 *
 * e.g.  assetsPreLoad((require as any).context('./assets', true, /\.png|.jpg|.jpeg$/));
 * @param prefix 资源前缀(多个模块使用，可能造成key重复，所以可能需要前缀)
 */
export const assetsPreLoad = (r: unknown, prefix?: string) => {
    const rstuff = r as any;
    rstuff.keys().forEach((key: string) => {
        const cacheKey = key.split('/').pop();
        allAssets.set(`${prefix ?? ''}${cacheKey}`, rstuff(key));
    });

    consoleCaches();
};

/**
 * 获取本地资源url地址
 * @param names 资源名（需带上相对路径）
 * @returns
 */
export const getAssets = <T>(names: T): T => {
    const getAsset = (name: T) => {
        return allAssets.get(name as unknown as string);
    };
    if (names instanceof Array) {
        return names.map((name) => getAsset(name)) as T;
    }
    return getAsset(names as T) as T;
};
