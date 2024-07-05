/** 列队管理器 */
export class Queue<T> {
    private list: T[] = [];
    private maxSize: number; // 容器大小

    constructor(_size?: number) {
        this.maxSize = _size || 0;
    }

    // 向队列中添加数据
    public add(data: T): boolean {
        if (!data) return false;

        // 如果传递了size参数就设置了队列的大小
        if (this.maxSize && this.list.length === this.maxSize) {
            // this.pop();
            return false;
        }
        this.list.push(data);
        return true;
    }

    // 从队列中取出数据
    public pop(): T {
        return this.list.shift();
    }

    // 清除队列的数据
    public clear(): void {
        this.list = [];
    }

    // 删除指定元素
    public remove(item: T): boolean {
        const index = this.list.indexOf(item);
        if (index > -1) {
            this.list.splice(index, 1);
            return true;
        }
        return false;
    }

    public removeAt(index: number): boolean {
        if (index < this.list.length) {
            this.list.splice(index, 1);
            return true;
        }
        return false;
    }

    // 返回队列的大小
    public get size(): number {
        return this.list.length;
    }

    // 返回队列的内容
    public get quere(): T[] {
        return this.list;
    }

    // 拷贝队列
    public clone(): Queue<T> {
        const queue = new Queue<T>(this.maxSize);
        queue.list = this.list.slice();
        return queue;
    }
}
