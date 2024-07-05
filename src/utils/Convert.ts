/** 图片base64 url 转换 File */
const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    const mime = arr?.[0]?.match(/:(.*?);/)?.[1];
    const bstr = atob(arr[arr.length - 1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    // eslint-disable-next-line no-plusplus
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

/** File转换 base64 url  */
const blobToBase64 = (blob: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            resolve(e?.target?.result as string);
        };
        fileReader.readAsDataURL(blob);
        fileReader.onerror = () => {
            reject(new Error('文件流异常'));
        };
    });
};

/** File转换 ArrayBuffer  */
const blob2ArrayBuffer = (blob: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            resolve(e?.target?.result as string);
        };
        fileReader.readAsArrayBuffer(blob);
        fileReader.onerror = () => {
            reject(new Error('文件流异常 '));
        };
    });
};

export const convert = { dataURLtoFile, blobToBase64, blob2ArrayBuffer };
