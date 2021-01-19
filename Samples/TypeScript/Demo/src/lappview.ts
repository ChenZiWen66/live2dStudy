/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { Live2DCubismFramework as cubismMatrix44 } from '@framework/math/cubismmatrix44';
import { Live2DCubismFramework as cubismviewmatrix } from '@framework/math/cubismviewmatrix';
import Csm_CubismViewMatrix = cubismviewmatrix.CubismViewMatrix;
import Csm_CubismMatrix44 = cubismMatrix44.CubismMatrix44;
import { TouchManager } from './touchmanager';
import { LAppLive2DManager } from './lapplive2dmanager';
import { LAppDelegate, canvas, gl } from './lappdelegate';
import { LAppSprite } from './lappsprite';
import { TextureInfo } from './lapptexturemanager';
import { LAppPal } from './lapppal';
import * as LAppDefine from './lappdefine';

/**
 * 绘图类。
 */
export class LAppView {
  /**
   * 构造函数
   */
  constructor() {
    this._programId = null;
    this._back = null;
    this._gear = null;

    // 触摸相关事件管理
    this._touchManager = new TouchManager();

    // 将设备坐标转换为屏幕坐标
    this._deviceToScreen = new Csm_CubismMatrix44();

    // 用于缩放或移动屏幕显示的矩阵
    this._viewMatrix = new Csm_CubismViewMatrix();
  }

  /**
   * 初始化。
   */
  public initialize(): void {
    //width，height:canvas的宽和高
    const { width, height } = canvas;

    const ratio: number = height / width;
    //将画面按照比例缩小到单位大小
    //left:逻辑屏幕左边界   -1
    const left: number = LAppDefine.ViewLogicalLeft;
    //right:逻辑右边界  1
    const right: number = LAppDefine.ViewLogicalRight;
    //bottom底端
    const bottom: number = -ratio;
    //顶端
    const top: number = ratio;

    this._viewMatrix.setScreenRect(left, right, bottom, top); // デバイスに対応する画面の範囲。 Xの左端、Xの右端、Yの下端、Yの上端

    //屏幕逻辑宽度
    const screenW: number = Math.abs(left - right);
    this._deviceToScreen.scaleRelative(screenW / width, -screenW / width);
    this._deviceToScreen.translateRelative(-width * 0.5, -height * 0.5);

    // 显示范围设置
    this._viewMatrix.setMaxScale(LAppDefine.ViewMaxScale); // 限界拡張率
    this._viewMatrix.setMinScale(LAppDefine.ViewMinScale); // 限界縮小率

    // 可显示的最大范围
    this._viewMatrix.setMaxScreenRect(
      LAppDefine.ViewLogicalMaxLeft,
      LAppDefine.ViewLogicalMaxRight,
      LAppDefine.ViewLogicalMaxBottom,
      LAppDefine.ViewLogicalMaxTop
    );
  }

  /**
   * 释放资源
   */
  public release(): void {
    this._viewMatrix = null;
    this._touchManager = null;
    this._deviceToScreen = null;

    this._gear.release();
    this._gear = null;

    this._back.release();
    this._back = null;

    gl.deleteProgram(this._programId);
    this._programId = null;
  }

  /**
   * 绘制。
   */
  public render(): void {
    gl.useProgram(this._programId);

    if (this._back) {
      this._back.render(this._programId);
    }
    if (this._gear) {
      this._gear.render(this._programId);
    }

    gl.flush();

    const live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance();

    live2DManager.onUpdate();
  }

  /**
   * 进行图像初始化。
   */
  public initializeSprite(): void {
    const width: number = canvas.width;
    const height: number = canvas.height;

    const textureManager = LAppDelegate.getInstance().getTextureManager();
    const resourcesPath = LAppDefine.ResourcesPath;

    let imageName = '';

    // 初始化图像背景
    imageName = LAppDefine.BackImageName;

    // 由于异步，创建回调函数
    const initBackGroundTexture = (textureInfo: TextureInfo): void => {
      const x: number = width * 0.5;
      const y: number = height * 0.5;

      const fwidth = textureInfo.width * 2.0;
      const fheight = height * 0.95;
      this._back = new LAppSprite(x, y, fwidth, fheight, textureInfo.id);
    };

    textureManager.createTextureFromPngFile(
      resourcesPath + imageName,
      false,
      initBackGroundTexture
    );

    // 齿轮图像初始化
    imageName = LAppDefine.GearImageName;
    const initGearTexture = (textureInfo: TextureInfo): void => {
      const x = width - textureInfo.width * 0.5;
      const y = height - textureInfo.height * 0.5;
      const fwidth = textureInfo.width;
      const fheight = textureInfo.height;
      this._gear = new LAppSprite(x, y, fwidth, fheight, textureInfo.id);
    };

    textureManager.createTextureFromPngFile(
      resourcesPath + imageName,
      false,
      initGearTexture
    );

    // 创建阴影
    if (this._programId == null) {
      this._programId = LAppDelegate.getInstance().createShader();
    }
  }

  /**
   * 被触摸时调用
   *
   * @param pointX 屏幕X坐标
   * @param pointY 屏幕Y坐标
   */
  public onTouchesBegan(pointX: number, pointY: number): void {
    this._touchManager.touchesBegan(pointX, pointY);
  }

  /**
   * 触摸的时候如果指针移动了就被叫。
   *
   * @param pointX 屏幕X坐标
   * @param pointY 屏幕Y坐标
   */
  public onTouchesMoved(pointX: number, pointY: number): void {
    const viewX: number = this.transformViewX(this._touchManager.getX());
    const viewY: number = this.transformViewY(this._touchManager.getY());

    this._touchManager.touchesMoved(pointX, pointY);

    const live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance();
    live2DManager.onDrag(viewX, viewY);
  }

  /**
   * 触摸结束后调用。
   *
   * @param pointX 屏幕X坐标
   * @param pointY 屏幕Y坐标
   */
  public onTouchesEnded(pointX: number, pointY: number): void {
    // 触摸结束
    const live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance();
    live2DManager.onDrag(0.0, 0.0);

    {
      // シングルタップ
      const x: number = this._deviceToScreen.transformX(
        this._touchManager.getX()
      ); // 获得逻辑坐标转换后的坐标。
      const y: number = this._deviceToScreen.transformY(
        this._touchManager.getY()
      ); // 获得逻辑坐标转换后的坐标。

      if (LAppDefine.DebugTouchLogEnable) {
        LAppPal.printMessage(`[APP]touchesEnded x: ${x} y: ${y}`);
      }
      live2DManager.onTap(x, y);

      // 有没有碰到齿轮
      if (this._gear.isHit(pointX, pointY)) {
        live2DManager.nextScene();
      }
    }
  }

  /**
   * 将X坐标转换成View坐标。
   *
   * @param deviceX 设备X坐标
   */
  public transformViewX(deviceX: number): number {
    const screenX: number = this._deviceToScreen.transformX(deviceX); // 获得逻辑坐标转换后的坐标。
    return this._viewMatrix.invertTransformX(screenX); // 缩放和移动后的值。
  }

  /**
   * 将Y坐标转换成View坐标。
   *
   * @param deviceY 设备Y坐标
   */
  public transformViewY(deviceY: number): number {
    const screenY: number = this._deviceToScreen.transformY(deviceY); // 获得逻辑坐标转换后的坐标。
    return this._viewMatrix.invertTransformY(screenY);
  }

  /**
   * 把X坐标转换成Screen坐标。
   * @param deviceX 设备X坐标
   */
  public transformScreenX(deviceX: number): number {
    return this._deviceToScreen.transformX(deviceX);
  }

  /**
   * 把Y坐标转换成Screen坐标。
   *
   * @param deviceY 设备Y坐标
   */
  public transformScreenY(deviceY: number): number {
    return this._deviceToScreen.transformY(deviceY);
  }

  _touchManager: TouchManager; // 触摸管理器
  _deviceToScreen: Csm_CubismMatrix44; // 设备到屏幕的矩阵
  _viewMatrix: Csm_CubismViewMatrix; // 屏幕矩阵
  _programId: WebGLProgram; // 阴影ID
  _back: LAppSprite; // 背景图像
  _gear: LAppSprite; // 齿轮图像
  _changeModel: boolean; // 模型切换的标志
  _isClick: boolean; // 点击中
}
