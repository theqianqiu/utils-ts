type SingletonConstructor<T> = { new (): T } & { _$inst?: T };

const get = <T>(Cls: SingletonConstructor<T>): T => {
    let inst: T;
    if (Object.prototype.hasOwnProperty.call(Cls, '_$inst')) {
        inst = Cls._$inst;
    }
    if (!inst) {
        inst = new Cls();
        Object.defineProperty(Cls, '_$inst', {
            value: inst,
        });
    }
    return inst;
};

const has = <T>(cls: SingletonConstructor<T>): T => {
    if (Object.prototype.hasOwnProperty.call(cls, '_$inst')) {
        return cls._$inst;
    }
    return null;
};

const instMap: Record<string, unknown> = {};
const registerInst = (name: string, inst: unknown) => {
    if (instMap[name]) {
        throw new Error('重复注册实例');
    }
    instMap[name] = inst;
};

const getRegistedInst = (name: string) => {
    return instMap[name];
};

/** 单例管理 */
export const Singleton = {
    get,
    has,
    registerInst,
    getRegistedInst,
};
