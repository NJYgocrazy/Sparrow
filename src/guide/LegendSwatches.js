// src/guide/legendSwatches.js
// 导入工具函数identity：恒等函数，输入什么返回什么，作为文字格式化的默认值
import { identity } from "../utils/helper";

/**
 * 绘制样品图例（彩色小色块+对应文字的组合图例，用于映射颜色和数据分类）
 * @param {Object} renderer - 画布渲染器（核心绘制工具），提供rect画矩形、text画文字、translate平移画布等方法
 * @param {Function} scale - 颜色比例尺，传入数据分类能返回对应的颜色值（实现数据→颜色的映射）
 * @param {Object} coordinate - 坐标系实例，此处为预留参数（保持和其他绘制函数参数规范一致，未实际使用）
 * @param {Object} options - 图例配置项（解构赋值传参，所有非必选配置都有默认值）
 * @param {number} options.x - 图例在画布上的左上角X坐标（核心定位）
 * @param {number} options.y - 图例在画布上的左上角Y坐标（核心定位）
 * @param {number} [options.width=48] - 每个图例项（色块+文字）的横向宽度，控制项之间的间距
 * @param {number} [options.marginLeft=12] - 色块和右侧文字之间的水平间距
 * @param {number} [options.swatchSize=10] - 彩色色块的大小（正方形，宽高一致）
 * @param {number} [options.fontSize=10] - 图例文字（标题+标签）的字号
 * @param {Function} [options.formatter=identity] - 文字标签格式化函数，默认不处理（输入即输出）
 * @param {Array|Object} options.domain - 图例的核心数据分类（数组/类对象），每个元素对应一个图例项
 * @param {string} [options.label] - 图例的主标题（可选），不传则不绘制
 */
export function legendSwatches(
  renderer,
  scale,
  coordinate,
  {
    x,
    y,
    width = 48,
    marginLeft = 12,
    swatchSize = 10,
    fontSize = 10,
    formatter = identity,
    domain,
    label,
  },
) {
  // 保存当前画布状态（平移、旋转、样式等），避免后续绘制操作污染画布其他内容，和结尾restore成对使用
  renderer.save();
  // 将画布的绘制原点(0,0)平移到用户指定的(x,y)，后续绘制都基于这个新原点，简化坐标计算
  renderer.translate(x, y);

  // 绘制图例主标题：如果传入了label配置，才执行绘制（可选功能）
  if (label) {
    renderer.text({
      text: label, // 标题文字内容
      x: 0,
      y: 0, // 标题位置（平移后的新原点，即图例左上角）
      fontWeight: "bold", // 标题粗体显示，突出层级
      fontSize, // 继承配置的字号
      textAnchor: "start", // 文字左对齐（基于x:0向右绘制，图例标题常规样式）
      dy: "1em", // 文字垂直偏移：向下偏移1个行高，为下方色块预留空间，避免重叠
    });
  }

  // 计算色块/文字的起始Y坐标：有标题则在标题下方2倍色块大小处（预留足够间距），无标题则从0开始
  const legendY = label ? swatchSize * 2 : 0;

  // 遍历数据分类domain，逐个绘制「色块+文字」图例项
  // Object.entries：兼容domain是数组/类对象的情况，返回[索引i, 分类名label]，实现横向排列
  for (const [i, label] of Object.entries(domain)) {
    // 1. 绘制彩色色块：通过颜色比例尺获取当前分类对应的颜色
    const color = scale(label);
    // 计算当前图例项的X坐标：项宽度 * 索引 → 实现多个图例项横向等距排列（第0个0px，第1个48px...）
    const legendX = width * i;
    renderer.rect({
      // 绘制正方形色块（swatch核心）
      x: legendX,
      y: legendY, // 色块的左上角坐标
      width: swatchSize,
      height: swatchSize, // 色块宽高（正方形）
      stroke: color, // 色块边框色：和填充色一致，实现实心色块
      fill: color, // 色块填充色：数据分类对应的颜色
    });

    // 2. 绘制色块右侧的文字标签
    // 文字X坐标：色块X + 色块宽 + 色块文字间距 → 文字在色块右侧，不重叠
    const textX = legendX + marginLeft + swatchSize;
    // 文字Y坐标：色块Y + 色块高 → 文字和色块垂直居中对齐（图例常规样式）
    const textY = legendY + swatchSize;
    renderer.text({
      text: formatter(label), // 文字内容：经过格式化函数处理（默认不处理）
      x: textX,
      y: textY, // 文字坐标
      fill: "currentColor", // 文字颜色：继承父元素，适配主题系统，不硬编码
      fontSize, // 文字字号：继承配置
    });
  }

  // 恢复画布到调用save()时的原始状态，结束图例绘制
  // 必须和save成对使用，否则后续画布绘制的原点会保持平移后的状态，导致其他图形位置偏移
  renderer.restore();
}
