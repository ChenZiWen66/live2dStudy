/**
 * Live2D各种参数的配置
 */

import { LogLevel } from '@framework/live2dcubismframework';

/**
 * Sample App使用参数
 */
// 画面
export const ViewMaxScale = 2.0;
export const ViewMinScale = 0.8;

export const ViewLogicalLeft = -1.0;
export const ViewLogicalRight = 1.0;

export const ViewLogicalMaxLeft = -2.0;
export const ViewLogicalMaxRight = 2.0;
export const ViewLogicalMaxBottom = -2.0;
export const ViewLogicalMaxTop = 2.0;

// 资源的相对路径
export const ResourcesPath = '../../Resources/';

// (资源路径下)背景图像的路径
export const BackImageName = 'back_class_normal.png';

// (资源路径下)齿轮图片的路径
export const GearImageName = 'icon_gear.png';

// 结束按钮
export const PowerImageName = 'CloseNormal.png';

// 模型定义---------------------------------------------
// 配置模型的目录名称排列
// 使目录名和model3.json的名字一致
export const ModelDir: string[] = ['Haru', 'Hiyori', 'Mark', 'Natori', 'Rice'];
export const ModelDirSize: number = ModelDir.length;

// 与外部定义文件(JSON)一致
export const MotionGroupIdle = 'Idle'; // アイドリング
export const MotionGroupTapBody = 'TapBody'; // 体をタップしたとき

// 与外部定义文件(JSON)一致
export const HitAreaNameHead = 'Head';
export const HitAreaNameBody = 'Body';

// 动作优先度常数
export const PriorityNone = 0;
export const PriorityIdle = 1;
export const PriorityNormal = 2;
export const PriorityForce = 3;

// Debug的选项
export const DebugLogEnable = true;
export const DebugTouchLogEnable = false;

// Framework输出日志的级别
export const CubismLoggingLevel: LogLevel = LogLevel.LogLevel_Verbose;

// 设置画布的大小
export const RenderTargetWidth = 1900;
export const RenderTargetHeight = 1000;
