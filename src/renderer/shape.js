// src/renderer/shape.js

import { applyAttributes, createSVGElement, mount } from "./utils";

export function shape(type, context, attributes) {
  const { group } = context; // 挂载元素：从上下文对象中获取要挂载的父容器（SVG group 元素）
  const el = createSVGElement(type); // 创建对应的元素：根据传入的类型（如 'line'、'rect'）创建 SVG 元素
  applyAttributes(el, attributes); // 设置属性：给创建的 SVG 元素设置传入的属性（如 x、y、width 等）
  mount(group, el); // 挂载：把创建好的元素添加到父容器中
  return el; // 返回该元素：方便后续对元素进行二次操作
}

export function line(context, attributes) {
  return shape("line", context, attributes); // 直接创建svg的line元素 
}

// rect 创建矩形
// rect 不支持 width 和 height 是负数，下面这种情况将绘制不出来
// <rect width="-60" height="-60" x="100" y="100" /> ❌
// 为了使其支持负数的 width 和 height，我们转换成如下的形式
// <rect width="60" height="60" x="40" y="40" /> ✅
export function rect(context, attributes) {
  const { width, height, x, y } = attributes;
  return shape("rect", context, {
    ...attributes, // 保留原有的其他属性（如 fill、stroke 等）
    width: Math.abs(width), // 宽高转为绝对值（SVG 的 rect 不支持负数宽高）
    height: Math.abs(height),
    x: width > 0 ? x : x + width, // 如果宽度为负，调整 x 坐标（向左偏移）
    y: height > 0 ? y : y + height, // 如果高度为负，调整 y 坐标（向上偏移）
  });
}

export function circle(context, attributes) {
  return shape("circle", context, attributes); // 直接创建svg的circle元素
}

// text 元素是将展示内容放在标签内部，而不是作为标签的属性
// <text text='content' /> ❌
// <text>content</text> ✅
export function text(context, attributes) {
  const { text, ...rest } = attributes; // 解构出文本内容和其他属性
  const textElement = shape("text", context, rest); // 创建 'text' 元素并设置基础属性
  textElement.textContent = text; // 关键：SVG 文本内容是放在标签内部的，不是属性
  return textElement;
}

// 对 path 不熟悉的同学可以去这里学习
// https://developer.mozilla.org/zh-CN/docs/Web/SVG/Tutorial/Paths
// path 的属性 d （路径）是一个字符串，拼接起来比较麻烦，这里我们通过数组去生成
// [
//  ['M', 10, 10],
//  ['L', 100, 100],
//  ['L', 100, 10],
//  ['Z'],
// ];
// 上面的二维数组会被转换成如下的字符串
// 'M 10 10 L 100 100 L 100 10 Z'

export function path(context, attributes) {
  const { d } = attributes;
  const path = Array.isArray(d) ? d.flat().join(" ") : d;
  return shape("path", context, { ...attributes, d: path });
}
export function ring(context, attributes) {
  // 解构参数：cx/cy（圆心）、r1（内圆半径）、r2（外圆半径）、其他样式
  const { cx, cy, r1, r2, ...styles } = attributes;
  const { stroke, strokeWidth, fill } = styles;
  const defaultStrokeWidth = 1;

  // 1. 内圆描边：绘制圆环的内边界
  const innerStroke = circle(context, {
    fill: "transparent", // 填充透明
    stroke: stroke || fill, // 描边颜色（优先用 stroke，没有则用 fill）
    strokeWidth,
    cx,
    cy,
    r: r1,
  });

  // 2. 圆环主体：通过描边宽度实现圆环的填充部分
  const ring = circle(context, {
    ...styles,
    strokeWidth: r2 - r1 - (strokeWidth || defaultStrokeWidth), // 描边宽度 = 外圆-内圆-边界宽度
    stroke: fill, // 用 fill 颜色作为描边（实现圆环填充）
    fill: "transparent",
    cx,
    cy,
    r: (r1 + r2) / 2, // 圆环中心半径 = (内圆+外圆)/2
  });

  // 3. 外圆描边：绘制圆环的外边界
  const outerStroke = circle(context, {
    fill: "transparent",
    stroke: stroke || fill,
    strokeWidth,
    cx,
    cy,
    r: r2,
  });

  return [innerStroke, ring, outerStroke]; // 返回三个元素（方便后续操作）
}
