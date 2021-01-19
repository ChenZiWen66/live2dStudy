import {
  Live2DCubismFramework as live2dcubismframework,
  Option as Csm_Option
} from '@framework/live2dcubismframework';
import Csm_CubismFramework = live2dcubismframework.CubismFramework;
import { LAppView } from './lappview';
import { LAppPal } from './lapppal';
import { LAppTextureManager } from './lapptexturemanager';
import { LAppLive2DManager } from './lapplive2dmanager';
import * as LAppDefine from './lappdefine';

export let canvas: HTMLCanvasElement = null;
export let s_instance: LAppDelegate = null;
export let gl: WebGLRenderingContext = null;
export let frameBuffer: WebGLFramebuffer = null;

/**
 * 对Cubism SDK进行管理
 */
export class LAppDelegate {
  /**
   * 单例模式
   * 返回类的单例
   * 如果没有生成实例，则在内部生成实例。
   *
   * @return 返回一个实例
   */
  public static getInstance(): LAppDelegate {
    if (s_instance == null) {
      s_instance = new LAppDelegate();
    }

    return s_instance;
  }

  /**
   * 销毁这个类的实例（单例模式）
   */
  public static releaseInstance(): void {
    if (s_instance != null) {
      //释放资源
      s_instance.release();
    }

    s_instance = null;
  }

  /**
   * 初始化App所需要的东西。
   */
  public initialize(): boolean {
    // 创建画布
    canvas = document.createElement('canvas');
    //设置画布的宽和高
    canvas.width = LAppDefine.RenderTargetWidth;
    canvas.height = LAppDefine.RenderTargetHeight;

    // 初始化gl上下文(检测浏览器是否支持webgl或者experimental-webgl)
    //contextType参数有以下四种：
    // “2d”,创建一个CanvasRenderingContext2D对象作为2D渲染的上下文。
    // “webgl”(或“experimental-webgl”),创建一个WebGLRenderingContext对象作为3D渲染的上下文，只在实现了WebGL 2的浏览器上可用，实验性特性。
    // “webgl2”,创建一个WebGL2RenderingContext对象作为3D渲染的上下文，只在实现了WebGL 3的浏览器上可用。
    // “bitmaprenderer”，创建一个ImageBitmapRenderingContext，用于将位图渲染到canvas上下文上，实验性特性。
    // @ts-ignore
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      alert('Cannot initialize WebGL. This browser does not support.');
      gl = null;

      //在浏览器中输出提示
      document.body.innerHTML =
        'This browser does not support the <code>&lt;canvas&gt;</code> element.';

      // gl初始化失败
      return false;
    }

    // 在body后面添加canvas控件
    document.body.appendChild(canvas);

    //获取缓冲对象
    if (!frameBuffer) {
      frameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    }

    // 透過設定
    //启用色彩混合
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const supportTouch: boolean = 'ontouchend' in canvas;

    if (supportTouch) {
      // タッチ関連コールバック関数登録
      //触摸相关的回调函数
      canvas.ontouchstart = onTouchBegan;
      canvas.ontouchmove = onTouchMoved;
      canvas.ontouchend = onTouchEnded;
      canvas.ontouchcancel = onTouchCancel;
    } else {
      // マウス関連コールバック関数登録
      // 注册鼠标相关的回调函数
      canvas.onmousedown = onClickBegan;
      canvas.onmousemove = onMouseMoved;
      canvas.onmouseup = onClickEnded;
    }

    // AppView初始化
    this._view.initialize();

    // Cubism SDK初始化
    this.initializeCubism();

    return true;
  }

  /**
   * 释放资源。
   */
  public release(): void {
    this._textureManager.release();
    this._textureManager = null;

    this._view.release();
    this._view = null;

    // 释放资源
    LAppLive2DManager.releaseInstance();

    // Cubism SDK释放
    Csm_CubismFramework.dispose();
  }

  /**
   * 执行处理。
   */
  public run(): void {
    // 主循环
    const loop = (): void => {
      // 确认是否有实例
      if (s_instance == null) {
        return;
      }

      // 更新时间
      LAppPal.updateTime();

      // 画面初始化
      gl.clearColor(0.0, 0.0, 0.0, 1.0);

      // 启用深度测试
      gl.enable(gl.DEPTH_TEST);

      // 附近的物体将远处的物体遮盖起来
      gl.depthFunc(gl.LEQUAL);

      // 清除彩色缓冲区和深度缓冲区
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.clearDepth(1.0);

      // 透明设置
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // 绘图更新
      this._view.render();

      // 循环递归调用
      requestAnimationFrame(loop);
    };
    loop();
  }

  /**
   * 创建阴影。
   */
  public createShader(): WebGLProgram {
    // 编辑条形阴影
    const vertexShaderId = gl.createShader(gl.VERTEX_SHADER);

    if (vertexShaderId == null) {
      LAppPal.printMessage('failed to create vertexShader');
      return null;
    }

    const vertexShader: string =
      'precision mediump float;' +
      'attribute vec3 position;' +
      'attribute vec2 uv;' +
      'varying vec2 vuv;' +
      'void main(void)' +
      '{' +
      '   gl_Position = vec4(position, 1.0);' +
      '   vuv = uv;' +
      '}';

    gl.shaderSource(vertexShaderId, vertexShader);
    gl.compileShader(vertexShaderId);

    // 片段发生器的编译
    const fragmentShaderId = gl.createShader(gl.FRAGMENT_SHADER);

    if (fragmentShaderId == null) {
      LAppPal.printMessage('failed to create fragmentShader');
      return null;
    }

    const fragmentShader: string =
      'precision mediump float;' +
      'varying vec2 vuv;' +
      'uniform sampler2D texture;' +
      'void main(void)' +
      '{' +
      '   gl_FragColor = texture2D(texture, vuv);' +
      '}';

    gl.shaderSource(fragmentShaderId, fragmentShader);
    gl.compileShader(fragmentShaderId);

    // 创建程序对象
    const programId = gl.createProgram();
    gl.attachShader(programId, vertexShaderId);
    gl.attachShader(programId, fragmentShaderId);

    gl.deleteShader(vertexShaderId);
    gl.deleteShader(fragmentShaderId);

    // 连接
    gl.linkProgram(programId);

    gl.useProgram(programId);

    return programId;
  }

  /**
   * 获取View信息
   */
  public getView(): LAppView {
    return this._view;
  }

  /**
   * 获取材质管理信息
   */
  public getTextureManager(): LAppTextureManager {
    return this._textureManager;
  }

  /**
   * 构造器
   */
  constructor() {
    this._captured = false;
    this._mouseX = 0.0;
    this._mouseY = 0.0;
    this._isEnd = false;

    this._cubismOption = new Csm_Option();
    this._view = new LAppView();
    this._textureManager = new LAppTextureManager();
  }

  /**
   * Cubism SDK初始化
   */
  public initializeCubism(): void {
    // setup cubism
    this._cubismOption.logFunction = LAppPal.printMessage;
    this._cubismOption.loggingLevel = LAppDefine.CubismLoggingLevel;
    Csm_CubismFramework.startUp(this._cubismOption);

    // initialize cubism
    Csm_CubismFramework.initialize();

    // load model
    LAppLive2DManager.getInstance();

    LAppPal.updateTime();

    this._view.initializeSprite();
  }

  _cubismOption: Csm_Option; // Cubism SDK Option
  _view: LAppView; // View信息
  _captured: boolean; // 是否单击
  _mouseX: number; // 鼠标X座標
  _mouseY: number; // 鼠标Y坐标
  _isEnd: boolean; // App是否结束
  _textureManager: LAppTextureManager; // 材质管理器
}

/**
 * 点击后调用。
 */
function onClickBegan(e: MouseEvent): void {
  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }
  LAppDelegate.getInstance()._captured = true;

  const posX: number = e.pageX;
  const posY: number = e.pageY;

  LAppDelegate.getInstance()._view.onTouchesBegan(posX, posY);
}

/**
 * 鼠标一移动就调用。
 */
function onMouseMoved(e: MouseEvent): void {
  if (!LAppDelegate.getInstance()._captured) {
    return;
  }

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();
  const posX: number = e.clientX - rect.left;
  const posY: number = e.clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesMoved(posX, posY);
}

/**
 * 点击结束后调用。
 */
function onClickEnded(e: MouseEvent): void {
  LAppDelegate.getInstance()._captured = false;
  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();
  const posX: number = e.clientX - rect.left;
  const posY: number = e.clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}

/**
 * 触摸的时候调用。
 */
function onTouchBegan(e: TouchEvent): void {
  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  LAppDelegate.getInstance()._captured = true;

  const posX = e.changedTouches[0].pageX;
  const posY = e.changedTouches[0].pageY;

  LAppDelegate.getInstance()._view.onTouchesBegan(posX, posY);
}

/**
 * 触摸时移动。
 */
function onTouchMoved(e: TouchEvent): void {
  if (!LAppDelegate.getInstance()._captured) {
    return;
  }

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesMoved(posX, posY);
}

/**
 * 触摸结束时调用。
 */
function onTouchEnded(e: TouchEvent): void {
  LAppDelegate.getInstance()._captured = false;

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}

/**
 * 触摸取消时调用。
 */
function onTouchCancel(e: TouchEvent): void {
  LAppDelegate.getInstance()._captured = false;

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}
