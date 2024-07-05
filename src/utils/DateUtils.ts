/**
 * 秒数转换成 时：分钟：秒
 * @param formart 间隔符， 例 ":" | "-" | 时分秒
 */
const formatSecond = (time: number | string, formart?: string) => {
    const counttime = Number(time);
    const h = `${Math.floor(counttime / 3600)}`.padStart(2, '0');
    const m = `${Math.floor((counttime - Number(h || 0) * 3600) / 60)}`.padStart(2, '0');
    const s = `${counttime - Number(h || 0) * 3600 - Number(m || 0) * 60}`.padStart(2, '0');

    if (formart === ':' || formart === '-') return `${h}${formart}${m}${formart}${s}`;
    if (formart === '时分秒') {
        return `${h || ''}${h ? '时' : ''}${m || ''}${m ? '分' : ''}${s.slice(1)}秒`;
    }
    return `${h}:${m}:${s}`;
};

export const DateUtils = { formatSecond };
