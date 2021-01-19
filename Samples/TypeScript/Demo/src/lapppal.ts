/**
 * プラットフォーム依存機能を抽象化する Cubism Platform Abstraction Layer.
 *抽象平台依赖功能
 * ファイル読み込みや時刻取得等のプラットフォームに依存する関数をまとめる。
 * 汇总与平台相关的函数，例如读取文件和获取时间
 */
export class LAppPal {
  /**
   * 将文件作为字节数据读取
   *
   * @param filePath 读取目标文件路径
   * @return
   * {
   *      buffer,   读取的字节数据
   *      size        文件大小
   * }
   */
  public static loadFileAsBytes(
    filePath: string,
    callback: (arrayBuffer: ArrayBuffer, size: number) => void
  ): void {
    fetch(filePath)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => callback(arrayBuffer, arrayBuffer.byteLength));
  }

  /**
   * デルタ時間（前回フレームとの差分）を取得する，获取增量时间(与上一帧的差值)
   * @return デルタ時間[ms]，间隔时间[ms]
   */
  public static getDeltaTime(): number {
    return this.s_deltaTime;
  }

  public static updateTime(): void {
    this.s_currentFrame = Date.now();
    this.s_deltaTime = (this.s_currentFrame - this.s_lastFrame) / 1000;
    this.s_lastFrame = this.s_currentFrame;
  }

  /**
   * 输出消息
   * @param message 消息内容
   */
  public static printMessage(message: string): void {
    console.log(message);
  }

  static lastUpdate = Date.now();

  static s_currentFrame = 0.0;
  static s_lastFrame = 0.0;
  static s_deltaTime = 0.0;
}
