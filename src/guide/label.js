// 当 axis 在左边，且方向向上
export function labelLeftUp(renderer, label, tick, { fontSize }) {
  const { x, y } = tick;
  renderer.text({
    text: `↑ ${label}`,
    x,
    y,
    fontSize,
    textAnchor: "end",
    dy: "-1em",
    class: "label",
  });
}

// 当 axis 在左边，且方向向下
export function labelLeftDown(renderer, label, tick, { fontSize }) {
  const { x, y } = tick;
  renderer.text({
    text: `↓ ${label}`,
    x,
    y,
    fontSize,
    textAnchor: "end",
    dy: "2em",
    class: "label",
  });
}

// 当 axis 在底部，且方向向右
export function labelBottomRight(
  renderer,
  label,
  tick,
  { fontSize, tickLength },
) {
  const { x, y } = tick;
  const ty = y + tickLength;
  renderer.text({
    text: `${label} →`,
    x,
    y: ty,
    fontSize,
    textAnchor: "end",
    dy: "2em",
    class: "label",
  });
}

// 当 axis 在顶部，且方向向右
export function labelTopRight(renderer, label, tick, { fontSize, tickLength }) {
  const { x, y } = tick;
  const ty = y - tickLength;
  renderer.text({
    text: `${label} →`,
    x,
    y: ty,
    fontSize,
    textAnchor: "end",
    dy: "-1.2em",
    class: "label",
  });
}
