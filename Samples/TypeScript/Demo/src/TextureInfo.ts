/**
 * 图像信息
 */
export class TextureInfo {
  img: HTMLImageElement; // 画像，图像
  id: WebGLTexture = null; // 材质
  width = 0; // 宽
  height = 0; // 高
  usePremultply: boolean; // 是否进行premult处理
  fileName: string; // 文件名
}
