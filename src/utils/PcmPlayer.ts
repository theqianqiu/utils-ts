interface PCMPlayerOption {
    inputCodec: 'Int8' | 'Int16' | 'Int32' | 'Float32';
    channels: number;
    sampleRate: number;
    flushTime: number;
    onStateChange?: (state: 'playing' | 'paused' | 'ended') => void;
    onEnded?: () => void;
}

/** PCM音频播放器 */
export class PcmPlayer {
    private feedDataLen = 0;
    private playEndLen = 0;
    private option: PCMPlayerOption = {} as PCMPlayerOption;
    private samples: Float32Array | undefined;
    private interval = 0;
    private convertValue = 0;
    private typedArray: any;
    private audioCtx: any;
    private gainNode: any;
    private startTime = 0;

    constructor(option: PCMPlayerOption) {
        this.init(option);
    }

    private init(option: PCMPlayerOption) {
        const defaultOption = {
            inputCodec: 'Int16', // 传入的数据是采用多少位编码，默认16位
            channels: 1, // 声道数
            sampleRate: 8000, // 采样率 单位Hz
            flushTime: 1000, // 缓存时间 单位 ms
        };

        this.option = { ...defaultOption, ...option }; // 实例最终配置参数
        this.samples = new Float32Array(); // 样本存放区域
        this.interval = window.setInterval(this.flush.bind(this), this.option.flushTime);
        this.convertValue = this.getConvertValue();
        this.typedArray = this.getTypedArray();
        this.initAudioContext();
        this.bindAudioContextEvent();
    }

    private getConvertValue() {
        // 根据传入的目标编码位数
        // 选定转换数据所需要的基本值
        const inputCodecs = {
            Int8: 128,
            Int16: 32768,
            Int32: 2147483648,
            Float32: 1,
        };
        if (!inputCodecs[this.option.inputCodec])
            throw new Error(
                'wrong codec.please input one of these codecs:Int8,Int16,Int32,Float32',
            );
        return inputCodecs[this.option.inputCodec];
    }

    private getTypedArray() {
        // 根据传入的目标编码位数
        // 完整TypedArray请看文档
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
        const typedArrays = {
            Int8: Int8Array,
            Int16: Int16Array,
            Int32: Int32Array,
            Float32: Float32Array,
        };
        if (!typedArrays[this.option.inputCodec])
            throw new Error(
                'wrong codec.please input one of these codecs:Int8,Int16,Int32,Float32',
            );
        return typedArrays[this.option.inputCodec];
    }

    private initAudioContext() {
        // 初始化音频上下文的东西
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.gainNode = this.audioCtx.createGain();
        this.gainNode.gain.value = 1;
        this.gainNode.connect(this.audioCtx.destination);
        this.startTime = this.audioCtx.currentTime;
    }

    private bindAudioContextEvent() {
        if (!this.option?.onStateChange) return;

        this.audioCtx.onstatechange = () => {
            this.option?.onStateChange?.(this.audioCtx.state);
        };
    }

    private isTypedArray(data: any) {
        // 检测输入的数据是否为 TypedArray 类型或 ArrayBuffer 类型
        return (
            (data.byteLength && data.buffer && data.buffer.constructor === ArrayBuffer) ||
            data.constructor === ArrayBuffer
        );
    }

    private isSupported(data: any) {
        // 数据类型是否支持
        // 目前支持 ArrayBuffer 或者 TypedArray
        if (!this.isTypedArray(data)) throw new Error('请传入ArrayBuffer或者任意TypedArray');
        return true;
    }

    feed(data: ArrayBuffer) {
        this.isSupported(data);

        if (!this.samples) return;

        // 获取格式化后的buffer
        const newdata = this.getFormatedValue(data);
        // 开始拷贝buffer数据
        // 新建一个Float32Array的空间
        const tmp = new Float32Array(this.samples.length + newdata.length);
        // console.log(data, this.samples, this.samples.length);
        // 复制当前的实例的buffer值（历史buff)
        // 从头（0）开始复制
        tmp.set(this.samples, 0);
        // 复制传入的新数据
        // 从历史buff位置开始
        tmp.set(newdata, this.samples.length);
        // 将新的完整buff数据赋值给samples
        // interval定时器也会从samples里面播放数据
        this.samples = tmp;
        // console.log('this.samples', this.samples);
    }

    private flush() {
        if (!this.samples) return;

        // console.log('this.samples.length: ', this.samples.length);
        if (!this.samples.length) return;
        const bufferSource = this.audioCtx.createBufferSource();

        this.feedDataLen += 1;

        // console.log('接受语音数据，缓冲并播放。。。。。。。。。', this.feedDataLen);

        const length = this.samples.length / this.option.channels;
        const audioBuffer = this.audioCtx.createBuffer(
            this.option.channels,
            length,
            this.option.sampleRate,
        );

        for (let channel = 0; channel < this.option.channels; channel += 1) {
            const audioData = audioBuffer.getChannelData(channel);
            let offset = channel;
            let decrement = 50;
            for (let i = 0; i < length; i += 1) {
                audioData[i] = this.samples[offset];
                /* fadein */
                if (i < 50) {
                    audioData[i] = (audioData[i] * i) / 50;
                }
                /* fadeout */
                if (i >= length - 51) {
                    decrement -= 1;
                    audioData[i] = (audioData[i] * decrement) / 50;
                }
                offset += this.option.channels;
            }
        }

        if (this.startTime < this.audioCtx.currentTime) {
            this.startTime = this.audioCtx.currentTime;
        }

        bufferSource.buffer = audioBuffer;
        bufferSource.connect(this.gainNode);
        bufferSource.start(this.startTime);
        this.startTime += audioBuffer.duration;
        this.samples = new Float32Array();

        if (!this.option?.onEnded) return;
        bufferSource.onended = () => {
            this.playEndLen += 1;
            // console.log('!!!!!!!!!!!! bufferSource end !!!!!!!!!!!!', playEndLen, feedDataLen);
            if (this.playEndLen === this.feedDataLen) {
                this.clearDataPlayLen();
                this.option.onEnded?.();
            }
        };
    }

    private getFormatedValue(data: any) {
        let newdata = data;
        if (data.constructor === ArrayBuffer) {
            // eslint-disable-next-line new-cap
            newdata = new this.typedArray(data);
        } else {
            // eslint-disable-next-line new-cap
            newdata = new this.typedArray(data.buffer);
        }

        const float32 = new Float32Array(newdata.length);

        for (let i = 0; i < newdata.length; i += 1) {
            // buffer 缓冲区的数据，需要是IEEE754 里32位的线性PCM，范围从-1到+1
            // 所以对数据进行除法
            // 除以对应的位数范围，得到-1到+1的数据
            // float32[i] = data[i] / 0x8000;
            float32[i] = newdata[i] / this.convertValue;
        }
        return float32;
    }

    volume(volume: number) {
        this.gainNode.gain.value = volume;
    }

    async pause() {
        await this.audioCtx.suspend();
    }

    async continue() {
        await this.audioCtx.resume();
    }

    destroy() {
        if (this.interval) window.clearInterval(this.interval);
        this.interval = 0;
        this.clearDataPlayLen();
        this.samples = undefined;
        this.audioCtx.close();
        this.audioCtx = null;
    }

    private clearDataPlayLen() {
        this.feedDataLen = 0;
        this.playEndLen = 0;
    }
}
