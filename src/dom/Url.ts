type URLParamValueType = string | number | boolean;
/**
 *
 */
export type URLParamType = Record<string, URLParamValueType | URLParamValueType[]>;
/**
 *
 */
export type ParsedURLParamType = Record<string, string | string[]>;

/**
 *
 * @param text
 * @param delimiter
 * @param include include the delimiter in result?
 * @param fromBack search direction
 */
function sliceBy(
    text: string,
    delimiter: string,
    include = false,
    fromBack = false,
): [string, string] {
    const index = text.indexOf(delimiter);
    if (index === -1) {
        if (fromBack) {
            return ['', text];
        }
        return [text, ''];
    }

    return [
        text.slice(0, index) + (include && fromBack ? delimiter : ''),
        (include && !fromBack ? delimiter : '') + text.slice(index + delimiter.length),
    ];
}

/**
 * parsed url
 */
export interface URL {
    protocol: string;
    username: string;
    password: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    hash: string;
}

/**
 * parse the protocol, hostname, pathname, search, hash from url
 * it behaviors like the native(web browser) URL.
 * alternative solutions would be:
 * - core-js@3 contains URL, URLSearchParams polyfill: https://github.com/zloirock/core-js#url-and-urlsearchparams
 * - whatwg-url: https://github.com/jsdom/whatwg-url
 * - react-native-url-polyfill case is a bit complicated: https://github.com/charpeni/react-native-url-polyfill
 * and it's just a minimum implementation here
 * @param url
 * @param [base] base for relative url
 */
export function parseURL(url: string, base?: string): URL {
    let rest = url;
    const reProtocol = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\S\s]*)/i;
    // extract protocol
    const protocolMatch = reProtocol.exec(url);
    let protocol = protocolMatch[1]?.toLowerCase() ?? '';
    const hasSlashes = !!protocolMatch[2];
    // eslint-disable-next-line prefer-destructuring
    rest = protocolMatch[3];

    // extract hash & query
    let hash: string;
    // eslint-disable-next-line prefer-const
    [rest, hash] = sliceBy(rest, '#', true);
    let search: string;
    // eslint-disable-next-line prefer-const
    [rest, search] = sliceBy(rest, '?', true);

    // extract host & auth
    let wholeHost = '';
    if (hasSlashes) {
        [wholeHost, rest] = sliceBy(rest, '/', true);
    }
    const [auth, host] = sliceBy(wholeHost, '@', false, true);
    let [username, password] = sliceBy(auth, ':');
    let [hostname, port] = sliceBy(host, ':');

    // apply base url
    if (!protocol && !hostname && base) {
        const ref = parseURL(base);
        protocol = ref.protocol;
        username = ref.username;
        password = ref.password;
        hostname = ref.hostname;
        port = ref.port;
        if (hostname && rest && rest[0] !== '/') {
            rest = `/${rest}`;
        }
    }

    return {
        protocol,
        username,
        password,
        hostname,
        port,
        // has hostname, default to '/'
        pathname: !rest && hostname ? '/' : rest,
        search,
        hash,
    };
}

/**
 * compose parsed url result to url string
 * @param url
 */
export function stringifyURL(url: Partial<URL>): string {
    return `${url.protocol ? `${url.protocol}//` : ''}${url.username ?? ''}${
        url.password ? `:${url.password}` : ''
    }${url.username || url.password ? '@' : ''}${url.hostname ?? ''}${
        url.port ? `:${url.port}` : ''
    }${
        // eslint-disable-next-line no-nested-ternary
        url.pathname && url.pathname !== '/'
            ? url.pathname[0] === '/' || !url.hostname
                ? url.pathname
                : `/${url.pathname}`
            : (url.search || url.hash) && url.hostname
            ? '/'
            : ''
    }${url.search ?? ''}${url.hash ?? ''}`;
}

/**
 * get the domain name from host name
 * www.51shihuimiao.com => 51shihuimiao.com
 * @param host
 * @param levels default 2 levels, e.g. xxx.com, xxx.org
 */
export function getDomainName(hostname: string, levels = 2): string {
    const segments = hostname.split('.');
    if (levels < segments.length) {
        return segments.slice(segments.length - levels).join('.');
    }
    return hostname;
}

/**
 * encode url params
 * @param params
 * @param prefix - '#' or '?' char for params prefix
 */
export function encodeURLParams(params: URLParamType, prefix = ''): string {
    if (!params) {
        return '';
    }
    const encoded = Object.entries(params)
        .map((entry) => {
            const [key, value] = entry;
            if (value === undefined) {
                return '';
            }
            const encodedKey = encodeURIComponent(key);
            if (!Array.isArray(value)) {
                return `${encodedKey}=${encodeURIComponent(value)}`;
            }
            return value.map((v) => `${encodedKey}=${encodeURIComponent(v)}`).join('&');
        })
        .filter((entry) => !!entry)
        .join('&');
    if (!encoded) {
        return '';
    }
    return `${prefix}${encoded}`;
}

function mergeURLParamsImpl<T>(
    base: Record<string, T | T[]>,
    toBeMerged: [string, T | T[]][],
): Record<string, T | T[]> {
    const merged = { ...base };
    return toBeMerged.reduce((res, [key, value]) => {
        if (value === undefined) {
            return res;
        }
        const valueInRes = res[key];
        if (valueInRes === undefined) {
            res[key] = value;
            return res;
        }

        if (!Array.isArray(valueInRes)) {
            res[key] = [valueInRes];
        }

        res[key] = (res[key] as T[]).concat(value);
        return res;
    }, merged);
}

/**
 * merge url params together
 * @param params1
 * @param params2
 */
export function mergeURLParams(params1: URLParamType, params2: URLParamType): URLParamType {
    if (!params1) {
        return params2;
    }
    if (!params2) {
        return params1;
    }
    return mergeURLParamsImpl(params1, Object.entries(params2));
}

/**
 * decode url params
 * @param encoded
 */
export function decodeURLParams(encoded: string): ParsedURLParamType {
    if (!encoded) {
        return {};
    }
    return mergeURLParamsImpl(
        {},
        (encoded[0] === '?' || encoded[0] === '#' ? encoded.slice(1) : encoded)
            .split('&')
            .map((entry) => {
                const [key, value] = entry.split('=');
                return [decodeURIComponent(key), decodeURIComponent(value)] as [string, string];
            })
            .filter(([key]) => key),
    );
}

function updateURLParams(
    url: string,
    params: URLParamType,
    type: 'search' | 'hash',
    delimiter: '?' | '#',
    merger: (params1: URLParamType, params2: URLParamType) => URLParamType,
): string {
    if (!params) {
        return url;
    }
    const parsed = parseURL(url);
    const existParams = decodeURLParams(parsed[type]);
    parsed[type] = encodeURLParams(merger(existParams, params), delimiter);
    return stringifyURL(parsed);
}

/**
 * append params to url as url search params, it uses key=v1&key=v2 for { [key]: [v1, v2] } case
 * @param url base url
 * @param params params to append
 */
export function appendURLParams(url: string, params: URLParamType): string {
    return updateURLParams(url, params, 'search', '?', mergeURLParams);
}

/**
 * append params to url as url hash params
 * newly added hash params will be merged together with existing params
 * @param url
 * @param params
 */
export function appendURLHashParams(url: string, params: URLParamType): string {
    return updateURLParams(url, params, 'hash', '#', mergeURLParams);
}

/**
 * set search params value to url, it overrides existing params
 * @param url
 * @param params
 */
export function setURLParams(url: string, params: URLParamType): string {
    return updateURLParams(url, params, 'search', '?', Object.assign);
}

/**
 * set hash params value to url hash, it overrides existing hash
 * @param url
 * @param params
 */
export function setURLHashParams(url: string, params: URLParamType): string {
    return updateURLParams(url, params, 'hash', '#', Object.assign);
}

/**
 * parse the search params to JSON from given url
 * @param url string
 * @returns JSON structure that is string key and string value
 * @example
 *
 * const url = `https://www.51shihuimiao.com?x=1&y=2&direct=${encodeURIComponent('https://www.51shihuimiao.com?z=3')}`
 *
 * parse(url)
 * // => { x:'1', y:'2', direct:'https://www.51shihuimiao.com?z=3' }
 */
export function parseURLParams(url: string): ParsedURLParamType {
    const { search } = parseURL(url);
    return decodeURLParams(search);
}

/**
 * parse the hash - using the url params schema - to JSON from given url
 * @param url
 */
export function parseURLHashParams(url: string): ParsedURLParamType {
    const { hash } = parseURL(url);
    return decodeURLParams(hash);
}

function toSingle(value: string | string[]): string {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}

function toArray(value: string | string[]): string[] {
    if (value === undefined) {
        return [];
    }
    if (Array.isArray(value)) {
        return value;
    }
    return [value];
}

/**
 * 从url中获取指定的参数值
 * @param url
 * @param name param name
 * @returns
 */
export function getURLParam(url: string, name: string): string {
    return toSingle(parseURLParams(url)[name]);
}

/**
 * get all search params of given name in array
 * @param url
 * @param name param name
 * @returns
 */
export function getAllURLParams(url: string, name: string): string[] {
    return toArray(parseURLParams(url)[name]);
}

/**
 * get single hash param
 * @param url
 * @param name
 * @returns
 */
export function getURLHashParam(url: string, name: string): string {
    return toSingle(parseURLHashParams(url)[name]);
}

/**
 * get all hash params from given name in array
 * @param url
 * @param name
 * @returns
 */
export function getAllURLHashParams(url: string, name: string): string[] {
    return toArray(parseURLHashParams(url)[name]);
}

function removeAfterChar(str: string, char: string): string {
    if (!str) {
        return str;
    }
    const index = str.indexOf(char);
    return index === -1 ? str : str.substring(0, index);
}

/**
 * remove params from url, including hash
 * @param url
 * @returns
 */
export function removeURLParams(url: string): string {
    return removeAfterChar(url, '?');
}

/**
 * remove hash from url
 * @param url
 * @returns
 */
export function removeURLHashParams(url: string): string {
    return removeAfterChar(url, '#');
}
