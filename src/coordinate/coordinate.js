import { compose } from "../utils/helper";

export function createCoordinate({
    x, y, width, height,
    transforms: coordinates = [],
}) {
    // coordinate 是坐标系变化函数 是已经接受了transformOptions的柯里化函数 还需要我们传入canvasOptions
    // 它们返回一个由基本变换构成的数组，所以在复合之前需要用flat把数组拍平
    const transforms = coordinates.map((coordinate) => coordinate({
        x, y, width, height,
    })).flat(); // 拍平
    const output = compose(...transforms); // 复合
    // 某些场景需要获得坐标系的种类信息
    const types = transforms.map((d) => d.type()); 
    // 判断是否是极坐标系
    output.isPolar = () => types.indexOf('polar') !== -1;

    // 判断是否转置
    // 只有是奇数个transpose的时候才是转置(如果偶数次数的转置就抵消了)
    // 这里使用的异或 只有当a和b值不同的时候才为true，否则为false
    // eslint-disable-next-line no-bitwise
    output.isTranspose = () => types.reduce(((is, type) => is ^ (type === 'transpose')), false);

    // 获得坐标系画布的中心
    output.center = () => [x + width / 2, y + height / 2];

    return output;
}