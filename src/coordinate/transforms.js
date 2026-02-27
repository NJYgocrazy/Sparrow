function transform(type, transformer) {
  transformer.type = () => type;
  return transformer;
}

export function translate(x = 0, y = 0) {
  return transform("translate", ([px, py]) => [px + x, py + y]);
}

export function scale(sx = 1, sy = 1) {
  return transform("scale", ([px, py]) => [px * sx, py * sy]);
}

export function reflect() {
  return transform("reflect", scale(-1, -1));
}

export function reflectX() {
  return transform("reflectX", scale(-1, 1));
}

export function reflectY() {
  return transform("reflectY", scale(1, -1));
}

// 转置 沿着y=x轴对称
export function transpose() {
  return transform("transpose", ([px, py]) => [py, px]);
}

export function polar() {
  // 这里我们把点的第一个维度作为 theta
  // 第二个维度作为 radius
  return transform("polar", ([theta, radius]) => {
    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);
    return [x, y];
  });
}
