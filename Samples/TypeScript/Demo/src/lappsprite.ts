import { gl, canvas } from './lappdelegate';

/**
 * スプライトを実装するクラス
 *
 * テクスチャＩＤ、Rectの管理
 * 管理材质的ID和Rect
 */
export class LAppSprite {
  /**
   * 构造器
   * @param x            x坐标
   * @param y            y坐标
   * @param width        宽
   * @param height       高
   * @param textureId    材质id
   */
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    textureId: WebGLTexture
  ) {
    this._rect = new Rect();
    this._rect.left = x - width * 0.5;
    this._rect.right = x + width * 0.5;
    this._rect.up = y + height * 0.5;
    this._rect.down = y - height * 0.5;
    this._texture = textureId;
    this._vertexBuffer = null;
    this._uvBuffer = null;
    this._indexBuffer = null;

    this._positionLocation = null;
    this._uvLocation = null;
    this._textureLocation = null;

    this._positionArray = null;
    this._uvArray = null;
    this._indexArray = null;

    this._firstDraw = true;
  }

  /**
   * 释放。
   */
  public release(): void {
    this._rect = null;

    gl.deleteTexture(this._texture);
    this._texture = null;

    gl.deleteBuffer(this._uvBuffer);
    this._uvBuffer = null;

    gl.deleteBuffer(this._vertexBuffer);
    this._vertexBuffer = null;

    gl.deleteBuffer(this._indexBuffer);
    this._indexBuffer = null;
  }

  /**
   * 返回材质
   */
  public getTexture(): WebGLTexture {
    return this._texture;
  }

  /**
   * 描画する。绘制
   * @param programId シェーダープログラム，阴影程序
   * @param canvas 描画するキャンパス情報，要绘制的canvas信息
   */
  public render(programId: WebGLProgram): void {
    if (this._texture == null) {
      // 载入未完成
      return;
    }

    // 初回描画時，第一次绘图时
    if (this._firstDraw) {
      // 何番目のattribute変数か取得，获得第几个attribute变量
      this._positionLocation = gl.getAttribLocation(programId, 'position');
      gl.enableVertexAttribArray(this._positionLocation);

      this._uvLocation = gl.getAttribLocation(programId, 'uv');
      gl.enableVertexAttribArray(this._uvLocation);

      // 何番目のuniform変数か取得，获得第几个uniform的变量
      this._textureLocation = gl.getUniformLocation(programId, 'texture');

      // uniform属性の登録，登录uniform属性
      gl.uniform1i(this._textureLocation, 0);

      // uvバッファ、座標初期化，uv缓冲存储器、坐标初始化
      {
        this._uvArray = new Float32Array([
          1.0,
          0.0,
          0.0,
          0.0,
          0.0,
          1.0,
          1.0,
          1.0
        ]);

        // uvバッファを作成，创建uv缓冲
        this._uvBuffer = gl.createBuffer();
      }

      // 頂点バッファ、座標初期化，顶点缓冲区、坐标初始化
      {
        const maxWidth = canvas.width;
        const maxHeight = canvas.height;

        // 頂点データ，顶点数据
        this._positionArray = new Float32Array([
          (this._rect.right - maxWidth * 0.5) / (maxWidth * 0.5),
          (this._rect.up - maxHeight * 0.5) / (maxHeight * 0.5),
          (this._rect.left - maxWidth * 0.5) / (maxWidth * 0.5),
          (this._rect.up - maxHeight * 0.5) / (maxHeight * 0.5),
          (this._rect.left - maxWidth * 0.5) / (maxWidth * 0.5),
          (this._rect.down - maxHeight * 0.5) / (maxHeight * 0.5),
          (this._rect.right - maxWidth * 0.5) / (maxWidth * 0.5),
          (this._rect.down - maxHeight * 0.5) / (maxHeight * 0.5)
        ]);

        // 頂点バッファを作成，创建顶点缓冲区
        this._vertexBuffer = gl.createBuffer();
      }

      // 頂点インデックスバッファ、初期化，顶点索引缓冲器、初始化
      {
        // インデックスデータ，索引数据
        this._indexArray = new Uint16Array([0, 1, 2, 3, 2, 0]);

        // インデックスバッファを作成，穿点索引缓冲器
        this._indexBuffer = gl.createBuffer();
      }

      this._firstDraw = false;
    }

    // UV座標登録，登陆Uv坐标
    gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._uvArray, gl.STATIC_DRAW);

    // attribute属性を登録，登陆attribute属性
    gl.vertexAttribPointer(this._uvLocation, 2, gl.FLOAT, false, 0, 0);

    // 頂点座標を登録，登陆顶点坐标
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._positionArray, gl.STATIC_DRAW);

    // attribute属性を登録，登陆attribute属性
    gl.vertexAttribPointer(this._positionLocation, 2, gl.FLOAT, false, 0, 0);

    // 頂点インデックスを作成，创建顶点索引
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indexArray, gl.DYNAMIC_DRAW);

    // モデルの描画，绘制模型
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.drawElements(
      gl.TRIANGLES,
      this._indexArray.length,
      gl.UNSIGNED_SHORT,
      0
    );
  }

  /**
   * 当たり判定，判定结果
   * @param pointX x坐标
   * @param pointY y坐标
   */
  public isHit(pointX: number, pointY: number): boolean {
    // 获得画面大小
    const { height } = canvas;

    // Y座標は変換する必要あり，Y坐标需要变换
    const y = height - pointY;

    return (
      pointX >= this._rect.left &&
      pointX <= this._rect.right &&
      y <= this._rect.up &&
      y >= this._rect.down
    );
  }

  _texture: WebGLTexture; // テクスチャ，材质
  _vertexBuffer: WebGLBuffer; // 頂点バッファ，顶点缓冲
  _uvBuffer: WebGLBuffer; // uv頂点バッファ，uv顶点缓冲
  _indexBuffer: WebGLBuffer; // 頂点インデックスバッファ，顶点索引缓冲
  _rect: Rect; // 矩形

  _positionLocation: number;
  _uvLocation: number;
  _textureLocation: WebGLUniformLocation;

  _positionArray: Float32Array;
  _uvArray: Float32Array;
  _indexArray: Uint16Array;

  _firstDraw: boolean;
}

export class Rect {
  public left: number; // 左边
  public right: number; // 右边
  public up: number; // 上边
  public down: number; // 下边
}
