// 每一个通道都是一个对象 它拥有的属性：
// name： 通道的名称
// optional： values里面是否需要该属性对应的值，默认为 true
// scale： 需要使用的比例尺
// ...rest： 其他属性

// 通道是数据到图形属性的映射关系 例如 x 通道将数据映射到图形的 x 坐标上
export function createChannel({
    name, optional = true, ...rest
}) {
    return { name, optional, ...rest };
}

// 对于一个标准的几何元素来说 都具有以下的通道
export function createChannels(options = {}) {
    return {
      x: createChannel({ name: "x", optional: false }), // x 坐标
      y: createChannel({ name: "y", optional: false }), // y 坐标
      stroke: createChannel({ name: "stroke" }), // 边框颜色
      fill: createChannel({ name: "fill" }), // 填充颜色
      ...options,
    };
}