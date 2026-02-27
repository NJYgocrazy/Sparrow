import { curry } from "../utils/helper";
import { reflectY, scale, translate, polar as polarT } from "./transforms";

function coordinate(transformOptions, canvasOptions) {
    const { width, height } = canvasOptions;
    const { innerRadius, outerRadius, startAngle, endAngle } = transformOptions;
    // 保证最后经过cartesian变化之后是一个圆形
    // 需要根据画布宽高去调整

    const aspect = width / height;
    const sx = aspect > 1 ? 1 / aspect : 1;
    const sy = aspect > 1 ? 1 : aspect; 

    return [

        /* 下面这部分规则的原因是 从笛卡尔坐标到极坐标有几个需要变换的点
            1. 极坐标的0度方向在笛卡尔坐标的x正方向，而极坐标的角度是逆时针增加的，所以需要做y轴翻转
            2. 极坐标的角度和半径是有范围的，需要把[0,1]区间映射到指定的[startAngle,endAngle]和[innerRadius,outerRadius]
            3. 极坐标系是以画布中心为原点的，而笛卡尔坐标系是以左上角为原点的，所以需要平移
            4. 极坐标系需要内切于画布，所以需要根据画布宽高进行缩放,并且需要移动到画布中心
         */

        // 以画布中心沿着y方向翻转
        translate(0, -0.5),
        reflectY(),
        translate(0, 0.5),

        // 调整角度和半径的范围
        scale(endAngle - startAngle, outerRadius - innerRadius),
        translate(startAngle, innerRadius),
        polarT(),

        // 改变大小内切画布
        scale(sx, sy),
        scale(0.5, 0.5),

        // 移动到画布中心
        translate(0.5, 0.5),
    ];
}

export const polar = curry(coordinate);
