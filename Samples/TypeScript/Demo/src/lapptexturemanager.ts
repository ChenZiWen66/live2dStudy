import { Live2DCubismFramework as csmvector } from '@framework/type/csmvector';
import Csm_csmVector = csmvector.csmVector;
import csmVector_iterator = csmvector.iterator;
import { gl } from './lappdelegate';
import { TextureInfo } from './TextureInfo';

/**
 * 材质管理类
 * 画像読み込み、管理を行うクラス。
 * 读取和管理图像的类
 */
export class LAppTextureManager {
  /**
   * 构造器
   */
  constructor() {
    this._textures = new Csm_csmVector<TextureInfo>();
  }

  /**
   * 释放资源。
   */
  public release(): void {
    for (
      let ite: csmVector_iterator<TextureInfo> = this._textures.begin();
      ite.notEqual(this._textures.end());
      ite.preIncrement()
    ) {
      gl.deleteTexture(ite.ptr().id);
    }
    this._textures = null;
  }

  /**
   * 装入图像
   *
   * @param fileName 読み込む画像ファイルパス名，要装入的图像文件路径名称
   * @param usePremultiply Premult処理を有効にするか，是否启用Premiult处理
   * @param callback
   * @return 画像情報、読み込み失敗時はnullを返す，图像信息，读取失败时返回空
   */
  public createTextureFromPngFile(
    fileName: string,
    usePremultiply: boolean,
    callback: (textureInfo: TextureInfo) => void
  ): void {
    // search loaded texture already
    for (
      let ite: csmVector_iterator<TextureInfo> = this._textures.begin();
      ite.notEqual(this._textures.end());
      ite.preIncrement()
    ) {
      if (
        ite.ptr().fileName == fileName &&
        ite.ptr().usePremultply == usePremultiply
      ) {
        // 2回目以降はキャッシュが使用される(待ち時間なし)
        // 第二次以后使用缓存（无等待时间）
        // WebKitでは同じImageのonloadを再度呼ぶには再インスタンスが必要
        //在WebKit中，要再次调用相同Image的onload，需要再次实例
        // 詳細：https://stackoverflow.com/a/5024181
        ite.ptr().img = new Image();
        ite.ptr().img.onload = (): void => callback(ite.ptr());
        ite.ptr().img.src = fileName;
        return;
      }
    }

    // 触发数据加载
    const img = new Image();
    img.onload = (): void => {
      // テクスチャオブジェクトの作成
      //创建材质对象
      const tex: WebGLTexture = gl.createTexture();

      // テクスチャを選択
      //选择材质
      gl.bindTexture(gl.TEXTURE_2D, tex);

      // テクスチャにピクセルを書き込む
      //在材质中写入像素
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      // 进行Premiult处理
      if (usePremultiply) {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
      }

      // テクスチャにピクセルを書き込む
      //在材质中写入像素
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

      // ミップマップを生成
      //生成映射
      gl.generateMipmap(gl.TEXTURE_2D);

      // テクスチャをバインド
      //绑定材质
      gl.bindTexture(gl.TEXTURE_2D, null);

      const textureInfo: TextureInfo = new TextureInfo();
      if (textureInfo != null) {
        textureInfo.fileName = fileName;
        textureInfo.width = img.width;
        textureInfo.height = img.height;
        textureInfo.id = tex;
        textureInfo.img = img;
        textureInfo.usePremultply = usePremultiply;
        this._textures.pushBack(textureInfo);
      }

      callback(textureInfo);
    };
    img.src = fileName;
  }

  /**
   * 画像の解放
   * 释放材质
   *
   * 配列に存在する画像全てを解放する。
   * 释放数组中所有图像
   */
  public releaseTextures(): void {
    for (let i = 0; i < this._textures.getSize(); i++) {
      this._textures.set(i, null);
    }

    this._textures.clear();
  }

  /**
   * 画像の解放
   * 释放材质
   *
   * 指定したテクスチャの画像を解放する。
   * 释放指定材质的图像
   * @param texture 解放するテクスチャ，要释放的材质
   */
  public releaseTextureByTexture(texture: WebGLTexture): void {
    for (let i = 0; i < this._textures.getSize(); i++) {
      if (this._textures.at(i).id != texture) {
        continue;
      }

      this._textures.set(i, null);
      this._textures.remove(i);
      break;
    }
  }

  /**
   * 画像の解放，释放材质
   *
   * 指定した名前の画像を解放する。
   * 释放指定名称的图像
   * @param fileName 解放する画像ファイルパス名，要释放的图像文件路径名
   */
  public releaseTextureByFilePath(fileName: string): void {
    for (let i = 0; i < this._textures.getSize(); i++) {
      if (this._textures.at(i).fileName == fileName) {
        this._textures.set(i, null);
        this._textures.remove(i);
        break;
      }
    }
  }

  _textures: Csm_csmVector<TextureInfo>;
}
