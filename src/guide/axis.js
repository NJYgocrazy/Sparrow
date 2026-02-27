import { identity, lastOf } from "../utils";

/**
 * 坐标轴工厂函数：接收不同坐标系的坐标轴配置组件，返回一个通用的坐标轴绘制函数
 * 核心作用：封装不同坐标系（直角/极坐标）、不同布局（转置/非转置）的坐标轴绘制逻辑，
 *          上层调用只需传参，无需关心底层坐标系的差异，实现「一次定义，多端复用」
 * @param {Object} components - 不同坐标系的坐标轴配置映射表（如axisX/axisY里的00/01/10/11配置）
 *                              键是坐标系类型标识`${是否极坐标}${是否转置}`，值是对应绘制配置（start/end/grid/ticks/label）
 * @returns {Function} 最终的坐标轴绘制函数，接收渲染器、比例尺、坐标系、配置项，完成具体绘制
 */
export function createAxis(components) {
  // 返回一个闭包函数：保留外部的components配置，同时接收绘制所需的所有参数，这是工厂函数的核心写法
  return (
    renderer, // 画布渲染器：提供画直线/文字/网格的核心方法（如rect、line、text）
    scale, // 比例尺：将数据域（domain）映射为画布坐标域（range），分序数比例尺/定量比例尺
    coordinate, // 坐标系实例：处理坐标转换（如直角坐标→极坐标），提供isPolar/isTranspose/center等方法
    {
      // 坐标轴配置项，解构赋值+默认值，提升调用灵活性
      domain, // 坐标轴的数据域：所有要展示的刻度数据（如[0,10,20]或['一月','二月']）
      label, // 坐标轴的主标题（如X轴的「时间」、Y轴的「销量」），可选
      tickCount = 10, // 定量比例尺的刻度数量：默认生成10个刻度，如线性比例尺[0,100]默认生成0,10,20...100
      formatter = identity, // 刻度文字格式化函数：默认不处理，可自定义（如数字转百分比、时间戳转日期）
      tickLength = 5, // 刻度线的长度：默认5px，控制刻度线在画布上的显示尺寸
      grid = false, // 是否绘制网格线：默认不绘制，传true则开启
      tick = true, // 是否绘制刻度线/刻度文字：默认绘制，传false则隐藏
    },
  ) => {
    // 边界判断：如果数据域为空，直接返回不绘制，避免空数据导致的绘制异常
    if (domain.length === 0) return;
    const fontSize = 10;
    // 判断是否为「序数比例尺」：序数比例尺（如分类/分带比例尺）有bandWidth方法，用于柱状图等分类场景
    // bandWidth：分带比例尺的每个分类的带宽，用于计算刻度居中偏移
    const isOrdinal = !!scale.bandWidth;
    // 判断是否为「定量比例尺」：定量比例尺（如线性/对数比例尺）有ticks方法，用于生成均匀分布的刻度
    const isQuantitative = !!scale.ticks;
    // 计算刻度的偏移量：序数比例尺下，刻度需要居中显示（偏移带宽的一半），定量比例尺无偏移（0）
    // 比如柱状图X轴，每个柱子占一个band，刻度要画在柱子正中间，所以需要offset
    const offset = isOrdinal ? scale.bandWidth() / 2 : 0;

    // 生成坐标轴最终要绘制的「刻度值数组」：区分比例尺类型做不同处理
    // 1. 定量比例尺（如线性/对数）：调用scale.ticks(tickCount)生成均匀的刻度值，适配连续数据
    // 2. 序数比例尺（如分类）：直接使用原始domain，因为分类数据无需均匀生成，按原数据展示即可
    const values = isQuantitative ? scale.ticks(tickCount) : domain;

    // 获取坐标系的中心点坐标：极坐标系需要（如雷达图/饼图的圆心），直角坐标系也会用到，统一获取
    const center = coordinate.center();
    // 生成当前坐标系的「类型标识」：拼接两个布尔值转数字的结果，和components的键（00/01/10/11）一一对应
    // coordinate.isPolar()：是否是极坐标系，返回布尔值，+号转为数字（true→1，false→0）
    // coordinate.isTranspose()：是否是转置坐标系（如X/Y轴交换），返回布尔值，+号转为数字
    // 例：直角坐标系+非转置 → 00；极坐标系+转置 →11
    const type = `${+coordinate.isPolar()}${+coordinate.isTranspose()}`;
    // 整理刻度/网格/标签的通用配置项：传给底层绘制方法，避免多次传参
    const options = { tickLength, fontSize, center, isOrdinal };

    // 从components中获取当前坐标系对应的「具体绘制配置」：按type匹配，实现不同坐标系的绘制逻辑解耦
    // Grid/ticks/Label：分别是网格线、刻度线、坐标轴标签的绘制方法
    // start/end：分别是刻度/网格线的「起始坐标计算函数」和「结束坐标计算函数」
    const {
      grid: Grid,
      ticks: Ticks,
      label: Label,
      start,
      end,
    } = components[type];

    // 核心：遍历刻度值数组，计算每个刻度的「画布实际坐标」+「格式化后的文字」，生成刻度配置数组
    const ticks = values.map((d) => {
      // 1. 调用start函数计算刻度的「原始坐标」，再通过coordinate转换为「画布实际坐标」（适配极坐标/直角坐标）
      // start(d, scale, offset)：根据数据d、比例尺、偏移量，计算刻度的原始起始点
      // coordinate(...)：坐标系坐标转换，将原始坐标映射到画布的实际像素坐标
      const [x, y] = coordinate(start(d, scale, offset));
      // 2. 对刻度值做格式化处理，得到最终要显示的文字（如1→'1%'，1672521600→'2023-01-01'）
      const text = formatter(d);
      // 3. 每个刻度返回：画布坐标(x,y) + 要显示的文字(text)
      return { x, y, text };
    });

    // 计算坐标轴「主标题的绘制位置」：单独处理，适配序数/非序数比例尺的差异
    const labelTick = (() => {
      // 非序数比例尺（定量）：直接取最后一个刻度的坐标作为标题位置（常规做法，如X轴标题在最右侧，Y轴在最顶部）
      if (!isOrdinal) return lastOf(ticks);
      // 序数比例尺（分类）：特殊处理，最后一个刻度的偏移量翻倍，避免标题和最后一个分类刻度重叠
      // 原因：序数比例尺的刻度本身有offset（带宽一半），翻倍后标题会更靠右/靠上，预留足够间距
      const value = lastOf(values); // 取最后一个分类值
      // 计算翻倍偏移后的画布坐标，作为标题位置
      const [x, y] = coordinate(start(value, scale, offset * 2));
      return { x, y }; // 只返回坐标，标题文字由上层传的label决定
    })();

    // 按需绘制：根据配置项和是否存在对应绘制方法，决定是否绘制网格、刻度、坐标轴标题
    // 短路判断：&& 保证只有配置为true，且存在对应的绘制方法时，才执行绘制，避免报错
    // 绘制网格线：传参「渲染器 + 所有刻度坐标 + 网格线结束坐标」
    if (grid && Grid) Grid(renderer, ticks, end(coordinate));
    // 绘制刻度线/刻度文字：传参「渲染器 + 所有刻度配置 + 通用配置」
    if (tick && Ticks) Ticks(renderer, ticks, options);
    // 绘制坐标轴主标题：传参「渲染器 + 标题文字 + 标题坐标 + 通用配置」
    if (label && Label) Label(renderer, label, labelTick, options);
  };
}
