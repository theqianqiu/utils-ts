import { ObjectUtils } from './ObjectUtils';

type StorageDB = {
    getItem: (key: string) => string;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
};

/**
 * 本地缓存，基于 localStorage 实现，支持基本类型和对象类型。
 * 数据存储在$cache对象中
 */
export class LocalStorage {
    static readonly inst = new LocalStorage('$cache');

    private _data: Record<string, unknown>;
    readonly mainKey: string;
    private _db: StorageDB;

    constructor(mainKey: string, db?: StorageDB) {
        this.mainKey = mainKey;
        this._db = db || localStorage;
        this.initialize();
    }

    private initialize() {
        try {
            const strData = this._db.getItem(this.mainKey);
            this._data = strData ? JSON.parse(strData) : {};
        } catch (e) {
            this._data = {};
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private invalidate(now?: boolean) {
        this._db.setItem(this.mainKey, JSON.stringify(this._data));
    }

    getBool(key: string) {
        return ObjectUtils.toInt(this._data[key]) === 1;
    }

    setBool(key: string, v: boolean, now?: boolean) {
        const numV = v ? 1 : 0;
        if (numV === this._data[key]) return;
        this._data[key] = numV;
        this.invalidate(now);
    }

    getStr(key: string): string {
        return (this._data[key] ?? '') as string;
    }

    setStr(key: string, value: string, now?: boolean) {
        if (this._data[key] === value) return;
        this._data[key] = value;
        this.invalidate(now);
    }

    getNum(key: string) {
        return ObjectUtils.toFloat(this._data[key]);
    }

    setNum(key: string, value: number, now?: boolean) {
        const formatValue = ObjectUtils.toFloat(value);
        if (this._data[key] === formatValue) return;
        this._data[key] = formatValue;
        this.invalidate(now);
    }

    getObj(key: string) {
        return this._data[key];
    }

    setObj(key: string, obj: unknown, now?: boolean) {
        this._data[key] = obj;
        if (!obj) {
            delete this._data[key];
        }
        this.invalidate(now);
    }

    clearItem(key: string) {
        this._data[key] = null;
        delete this._data[key];
        this.invalidate();
    }

    clearAll() {
        this._data = {};
        this._db.removeItem(this.mainKey);
    }
}
