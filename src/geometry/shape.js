import { line as pathLine, area as pathArea, sector as pathSector } from "./d";
import { contour, ring } from "./primitive";
import { dist, sub, equal } from "../utils";

// 绘制不同坐标系下面的圆
// 绘制圆的函数和渲染器里面绘制圆的区别在于
// 这里需要考虑坐标系
export function circle(renderer, coordinate, { cx, cy, r, ...styles }) {
  // 对圆心进行坐标系变换
  const [px, py] = coordinate([cx, cy]);
  return renderer.circle({ cx: px, cy: py, r, ...styles });
}

/**
 * 文本渲染函数：在指定坐标系上创建带旋转效果的 SVG 文本元素，且不污染渲染引擎全局状态
 * @param {Renderer} renderer 渲染引擎：提供创建元素、状态管理、坐标变换等核心能力
 * @param {Function} coordinate 坐标系转换函数：将数据坐标转换为画布实际坐标（屏蔽不同坐标系差异）
 * @param {Object} config 文本配置对象（包含位置、旋转、内容、样式）
 * @param {number} config.x 文本锚点的原始数据横坐标
 * @param {number} config.y 文本锚点的原始数据纵坐标
 * @param {number} config.rotate 文本旋转角度（通常为弧度制，如需角度需转换：弧度 = 角度 × Math.PI / 180）
 * @param {string} config.text 要渲染的文本内容
 * @param {Object} config.styles 剩余的文本样式（如字体大小、颜色、字体家族等）
 * @returns {SVGElement} 创建完成的 SVG 文本元素
 */
export function text(renderer, coordinate, { x, y, rotate, text, ...styles }) {
  // 1. 坐标转换：将原始数据坐标 [x, y] 转为画布上的实际像素坐标 [px, py]
  // 屏蔽直角坐标系、极坐标系等差异，得到统一的画布可识别坐标
  const [px, py] = coordinate([x, y]);

  // 2. 保存渲染引擎当前全局状态（关键）
  // 将当前的坐标原点、旋转角度、缩放比例等状态存入状态栈，后续局部操作不污染全局
  renderer.save();

  // 3. 坐标平移：将渲染引擎的当前坐标原点（默认画布左上角 (0,0)）移动到文本锚点 (px, py)
  // 为后续「围绕文本自身锚点旋转」做准备，若不平移，旋转会围绕画布左上角进行
  renderer.translate(px, py);

  // 4. 执行文本旋转：围绕当前平移后的坐标原点（即文本锚点 (px, py)）旋转指定角度
  // 旋转操作仅对本次文本创建生效，后续会恢复全局状态
  renderer.rotate(rotate);

  // 5. 创建 SVG 文本元素
  // 因为已平移坐标原点，这里的 (0, 0) 等价于画布上的 (px, py)
  // 合并文本内容、位置、样式，调用渲染引擎的 text 方法创建实际元素
  const textElement = renderer.text({
    text, // 文本内容
    x: 0, // 平移后的相对横坐标
    y: 0, // 平移后的相对纵坐标
    ...styles, // 展开传入的文本样式（如 fontSize、fill 等）
  });

  // 6. 恢复渲染引擎之前的全局状态（关键）
  // 从状态栈中取出保存的原始状态，还原坐标原点、旋转角度等，避免影响后续其他元素的渲染
  renderer.restore();

  // 7. 返回创建完成的文本元素，供上层调用者（如图表）添加到画布中
  return textElement;
}

export function link(renderer, coordinate, { x1, y1, x2, y2, ...styles }) {
  const [p0, p1] = [
    [x1, y1],
    [x2, y2],
  ].map(coordinate);
  return renderer.link({
    x1: p0[0],
    y1: p0[1],
    x2: p1[0],
    y2: p1[1],
    ...styles,
  });
}

export function line(renderer, coordinate, { X, Y, I: I0, ...styles }) {
  const I = coordinate.isPolar() ? [...I0, I0[0]] : I0;
  const points = I.map((i) => coordinate([X[i], Y[i]]));
  const d = pathLine(points);
  return renderer.path({ d, ...styles });
}

export function area(
  renderer,
  coordinate,
  { X1, Y1, X2, Y2, I: I0, ...styles },
) {
  // 连接首尾
  const I = coordinate.isPolar() ? [...I0, I0[0]] : I0;

  // 将点按照顺时针方向排列
  const points = [
    ...I.map((i) => [X1[i], Y1[i]]),
    ...I.map((i) => [X2[i], Y2[i]]).reverse(),
  ].map(coordinate);

  // 如果是在极坐标系下，绘制等高线
  if (coordinate.isPolar()) {
    return contour(renderer, { points, ...styles });
  }

  // 否者直接绘制区域
  return renderer.path({ d: pathArea(points), ...styles });
}

export function rect(renderer, coordinate, { x1, y1, x2, y2, ...styles }) {
  const v0 = [x1, y1];
  const v1 = [x2, y1];
  const v2 = [x2, y2];
  const v3 = [x1, y2];

  // 如果坐标系转置了，改变顶点的顺序
  const vs = coordinate.isTranspose() ? [v3, v0, v1, v2] : [v0, v1, v2, v3];
  const ps = vs.map(coordinate);
  const [p0, p1, p2, p3] = ps;

  // 笛卡尔坐标系绘制矩形
  if (!coordinate.isPolar()) {
    const [width, height] = sub(p2, p0);
    const [x, y] = p0;
    return renderer.rect({ x, y, width, height, ...styles });
  }

  // 获得圆心的位置
  const center = coordinate.center();
  const [cx, cy] = center;

  // 如果角度小于360度
  // 判断的方法是顶点是否重合
  // 绘制扇形
  if (!(equal(p0, p1) && equal(p2, p3))) {
    return renderer.path({ d: pathSector([center, ...ps]), ...styles });
  }

  // 如果角度等于360度，绘制圆环
  const r1 = dist(center, p2); // 内半径
  const r2 = dist(center, p0); // 外半径
  return ring(renderer, { cx, cy, r1, r2, ...styles });
}

export function path(renderer, coordinate, attributes) {
  return renderer.path(attributes);
}