// src/renderer/transform.js

import { applyTransform, createSVGElement, mount } from "./utils";

export function transform(type, context, ...params) {
  // type 是希望的变换种类：scale，translate，rotate 等
  const { group } = context;
  applyTransform(group, `${type}(${params.join(", ")})`);
}

// src/renderer/transform.js

export function translate(context, tx, ty) {
  transform("translate", context, tx, ty);
}

export function rotate(context, theta) {
  transform("rotate", context, theta);
}

export function scale(context, sx, sy) {
  transform("scale", context, sx, sy);
}

// 创建一个新的 <g> 分组，并让后续的所有图形 / 变换操作都基于这个新分组。
export function save(context) {
  const { group } = context; // 获取当前的父分组
  const newGroup = createSVGElement("g"); // 创建一个新的 SVG 分组（<g> 元素）
  mount(group, newGroup); // 把新分组挂载到当前分组下
  context.group = newGroup; // 将上下文的 `group` 切换为这个新分组
}

// 把上下文的 group 切回 save 之前的原始分组。
export function restore(context) {
  const { group } = context; // 获取当前的（save 创建的）新分组
  const { parentNode } = group; // 获取这个新分组的父节点（即 save 前的旧分组） 
  context.group = parentNode; // 将上下文的 `group` 切回旧分组
}