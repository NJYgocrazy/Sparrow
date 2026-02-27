import { group } from "../utils";

// 统计函数处理的数据不是原始表格的数据 而是一个和每个通道绑定的对象
// 堆叠函数即把x属性相同的数据的y属性 的值堆叠起来 修改了y的值 并且产生了一个新的y1通道的值
export function createStackY() {
    return ({ index, values }) => {
        const { x: X, y: Y } = values;

        // 根据x通道值进行分组
        const series = X ? Array.from(group(index, (i) => X[i]).values()) : [index];

        // 生成两个新通道的值
        const newY = new Array(index.length);
        const newY1 = new Array(index.length);

        // 对每个分组的y进行累加
        for (const I of series) {
            for (let py = 0, i = 0; i < I.length; py = newY[I[i]], i += 1) {
                const index = I[i];
                newY1[index] = py;
                newY[index] = py + Y[index];
            }
        }
        return {
            index,
            // 返回修改后的y通道的值，并且新增一个y1通道
            values: { ...values, y: newY, y1: newY1 },
        };
    };
}