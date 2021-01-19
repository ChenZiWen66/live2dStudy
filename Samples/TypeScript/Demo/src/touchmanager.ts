export class TouchManager {
  /**
   * 构造器
   */
  constructor() {
    this._startX = 0.0;
    this._startY = 0.0;
    this._lastX = 0.0;
    this._lastY = 0.0;
    this._lastX1 = 0.0;
    this._lastY1 = 0.0;
    this._lastX2 = 0.0;
    this._lastY2 = 0.0;
    this._lastTouchDistance = 0.0;
    this._deltaX = 0.0;
    this._deltaY = 0.0;
    this._scale = 1.0;
    this._touchSingle = false;
    this._flipAvailable = false;
  }

  public getCenterX(): number {
    return this._lastX;
  }

  public getCenterY(): number {
    return this._lastY;
  }

  public getDeltaX(): number {
    return this._deltaX;
  }

  public getDeltaY(): number {
    return this._deltaY;
  }

  public getStartX(): number {
    return this._startX;
  }

  public getStartY(): number {
    return this._startY;
  }

  public getScale(): number {
    return this._scale;
  }

  public getX(): number {
    return this._lastX;
  }

  public getY(): number {
    return this._lastY;
  }

  public getX1(): number {
    return this._lastX1;
  }

  public getY1(): number {
    return this._lastY1;
  }

  public getX2(): number {
    return this._lastX2;
  }

  public getY2(): number {
    return this._lastY2;
  }

  public isSingleTouch(): boolean {
    return this._touchSingle;
  }

  public isFlickAvailable(): boolean {
    return this._flipAvailable;
  }

  public disableFlick(): void {
    this._flipAvailable = false;
  }

  /**
   * 开始触摸时的事件
   * @param deviceX 触摸画面的x值
   * @param deviceY 触摸画面的y值
   */
  public touchesBegan(deviceX: number, deviceY: number): void {
    this._lastX = deviceX;
    this._lastY = deviceY;
    this._startX = deviceX;
    this._startY = deviceY;
    this._lastTouchDistance = -1.0;
    this._flipAvailable = true;
    this._touchSingle = true;
  }

  /**
   * 拖拽事件
   * @param deviceX 触摸画面的X值
   * @param deviceY 触摸画面的y值
   */
  public touchesMoved(deviceX: number, deviceY: number): void {
    this._lastX = deviceX;
    this._lastY = deviceY;
    this._lastTouchDistance = -1.0;
    this._touchSingle = true;
  }

  /**
   * フリックの距離測定，褶边的距离测量
   * @return フリック距離，褶边距离
   */
  public getFlickDistance(): number {
    return this.calculateDistance(
      this._startX,
      this._startY,
      this._lastX,
      this._lastY
    );
  }

  /**
   * 求点1到点2的距离
   *
   * @param x1 点1的x値
   * @param y1 点1的y値
   * @param x2 点2的x値
   * @param y2 点2的y値
   */
  public calculateDistance(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
  }

  /**
   * ２つ目の値から、移動量を求める。根据第二个值计算移动量
   * 違う方向の場合は移動量０。同じ方向の場合は、絶対値が小さい方の値を参照する。
   *不同方向的移动量为0。在相同方向的情况下，参照绝对值较小的值。
   * @param v1 第一个移动量
   * @param v2 第二个移动量
   *
   * @return 小さい方の移動量，小移动量
   */
  public calculateMovingAmount(v1: number, v2: number): number {
    if (v1 > 0.0 != v2 > 0.0) {
      return 0.0;
    }

    const sign: number = v1 > 0.0 ? 1.0 : -1.0;
    const absoluteValue1 = Math.abs(v1);
    const absoluteValue2 = Math.abs(v2);
    return (
      sign * (absoluteValue1 < absoluteValue2 ? absoluteValue1 : absoluteValue2)
    );
  }

  _startY: number; // 开始触摸时的x值
  _startX: number; // 开始触摸时的y值
  _lastX: number; // シングルタッチ時のxの値，单触时的X值
  _lastY: number; // シングルタッチ時のyの値，单触时的y值
  _lastX1: number; // ダブルタッチ時の一つ目のxの値,双触时第一个x的值
  _lastY1: number; // ダブルタッチ時の一つ目のyの値，双触时第一个y值
  _lastX2: number; // ダブルタッチ時の二つ目のxの値，双触时第二个x的值
  _lastY2: number; // ダブルタッチ時の二つ目のyの値,双触时第二个y值
  _lastTouchDistance: number; // 用2根以上触摸时手指的距离
  _deltaX: number; // 前回の値から今回の値へのxの移動距離。从上次的值到这次的值的x的移动距离
  _deltaY: number; // 前回の値から今回の値へのyの移動距離。从上次的值到这次的值的y的移动距离
  _scale: number; // このフレームで掛け合わせる拡大率。拡大操作中以外は1。以此框架相乘的放大率。放大操作中以外为1
  _touchSingle: boolean; // シングルタッチ時はtrue，单触时为true
  _flipAvailable: boolean; // フリップが有効かどうか，触发是否有效
}
