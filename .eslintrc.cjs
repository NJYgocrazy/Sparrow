// .eslintrc.cjs
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ["airbnb-base"],
  parserOptions: {
    ecmaVersion: 13,
    sourceType: "module",
  },
  rules: {
    "import/prefer-default-export": 0,
    "no-use-before-define": 0,
    "no-shadow": 0,
    "no-restricted-syntax": 0,
    "no-return-assign": 0,
    "no-param-reassign": 0,
    "no-sequences": 0,
    "no-loop-func": 0,
    "no-nested-ternary": 0,
    // 关闭 小驼峰命名 校验（解决 createsVGElement 的报错）
    camelcase: "off",
    // 关闭 字符串单引号 校验（如果有引号报错）
    quotes: "off",
    // 关闭 代码缩进 校验（如果有缩进报错）
    indent: "off",
    // 关闭 多余空格 校验（如果有空格报错）
    "no-multi-spaces": "off",
    "linebreak-style": "off", // 关闭换行符格式校验
    "object-curly-newline": "off",
    "eol-last": "off",
    "no-trailing-spaces": "off",
  },
};
