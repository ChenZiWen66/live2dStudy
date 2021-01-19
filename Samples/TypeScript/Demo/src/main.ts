/**
 * 主函数
 */
import { LAppDelegate } from './lappdelegate';

/**
 * 打开页面时，初始化并启动
 */
window.onload = (): void => {
  // create the application instance
  if (LAppDelegate.getInstance().initialize() == false) {
    return;
  }

  LAppDelegate.getInstance().run();
};

/**
 * 关闭页面时处理
 */
window.onbeforeunload = (): void => LAppDelegate.releaseInstance();
