// import mammoth from 'mammoth';
import { WorkBook, read } from 'xlsx';
import { convert } from './Convert';

type SheetsType = WorkBook & { Strings: { t: string; r: string; h: string }[] };

/**
 * 解析xlsx文件
 * @param file
 * @param asList 是否以数组的形式返回
 * @returns
 */
const parseXlsx = async (file: File, asList?: boolean) => {
    const filearr = await convert.blob2ArrayBuffer(file);
    const workbook = read(filearr) as unknown as SheetsType;
    const textList = workbook?.Strings?.map?.((item) => item?.t || '') || [];

    const list = textList.filter((text) => text?.length !== 0) || [];
    return asList ? list : list.join('\n');
};

const parseTxt = (file: File, errCallback?: () => void): Promise<string> => {
    return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            // const text = event.target?.result as string;
            const text = (event.target?.result as string).replace(/\r/g, '');
            resolve(text);
        };
        reader.onerror = () => {
            console.warn('Failed to read file.');
            errCallback?.();
            resolve('');
        };
        reader.readAsText(file);
    });
};

// const parseDocx = (file: File, errCallback?: () => void): Promise<string> => {
//     return new Promise((resolve) => {
//         const reader = new FileReader();
//         reader.onload = async () => {
//             const arrayBuffer = reader.result as ArrayBuffer;

//             if (!arrayBuffer) return;
//             const input = new Uint8Array(arrayBuffer);
//             // Extract the raw text of the document. This will ignore all formatting in the document. Each paragraph is followed by two newlines.
//             const result = mammoth.extractRawText({ arrayBuffer: input });
//             result
//                 .then((res) => {
//                     // mammoth.extractRawText 会给每个段落多加两个换行符，这里再去掉
//                     const text = res.value.replace(/\n\n/g, '\n');
//                     resolve(text.slice(0, text.length - 2)); // 最后一个换行符也得干掉
//                 })
//                 .catch((err) => {
//                     console.warn('文件解析错误： ', err);
//                     errCallback?.();
//                     resolve('');
//                 });
//         };
//         reader.readAsArrayBuffer(file);
//         reader.onerror = () => {
//             console.warn('Failed to read file.');
//             errCallback?.();
//             resolve('');
//         };
//     });
// };

/** 获取文件的文本内容
 * @param file
 */
export const getFileText = async (file: File, errCallback?: () => void) => {
    if (!file) {
        console.warn('未获取到文件~');
        return '';
    }
    const fileExt = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase();

    let content = '';

    switch (fileExt) {
        case 'txt':
            content = await parseTxt(file, errCallback);
            break;
        case 'xlsx':
            content = (await parseXlsx(file)) as string;
            break;
        // case 'doc':
        // case 'docx':
        //     content = await parseDocx(file, errCallback);
        //     break;
        default:
    }

    return content || '';
};

/** 文件解析器
 * 解析doc,docx 文件 需要安装 mammoth, util, path-browserify依赖，并配置webpack中resolve配置项的fallback。 exp:
 * resolve: {
            fallback: {
                path: require.resolve('path-browserify'),
                util: require.resolve('util/'),
            }
        }
 */
export const FileParser = {
    getFileText,
    parseXlsx,
};
