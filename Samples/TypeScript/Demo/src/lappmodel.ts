import { Live2DCubismFramework as live2dcubismframework } from '@framework/live2dcubismframework';
import { Live2DCubismFramework as cubismid } from '@framework/id/cubismid';
import { Live2DCubismFramework as cubismusermodel } from '@framework/model/cubismusermodel';
import { Live2DCubismFramework as icubismmodelsetting } from '@framework/icubismmodelsetting';
import { Live2DCubismFramework as cubismmodelsettingjson } from '@framework/cubismmodelsettingjson';
import { Live2DCubismFramework as cubismdefaultparameterid } from '@framework/cubismdefaultparameterid';
import { Live2DCubismFramework as acubismmotion } from '@framework/motion/acubismmotion';
import { Live2DCubismFramework as cubismeyeblink } from '@framework/effect/cubismeyeblink';
import { Live2DCubismFramework as cubismbreath } from '@framework/effect/cubismbreath';
import { Live2DCubismFramework as csmvector } from '@framework/type/csmvector';
import { Live2DCubismFramework as csmmap } from '@framework/type/csmmap';
import { Live2DCubismFramework as cubismmatrix44 } from '@framework/math/cubismmatrix44';
import { Live2DCubismFramework as cubismmotion } from '@framework/motion/cubismmotion';
import { Live2DCubismFramework as cubismmotionqueuemanager } from '@framework/motion/cubismmotionqueuemanager';
import { Live2DCubismFramework as csmstring } from '@framework/type/csmstring';
import { Live2DCubismFramework as csmrect } from '@framework/type/csmrectf';
import { CubismLogInfo } from '@framework/utils/cubismdebug';
import csmRect = csmrect.csmRect;
import csmString = csmstring.csmString;
import InvalidMotionQueueEntryHandleValue = cubismmotionqueuemanager.InvalidMotionQueueEntryHandleValue;
import CubismMotionQueueEntryHandle = cubismmotionqueuemanager.CubismMotionQueueEntryHandle;
import CubismMotion = cubismmotion.CubismMotion;
import CubismMatrix44 = cubismmatrix44.CubismMatrix44;
import csmMap = csmmap.csmMap;
import csmVector = csmvector.csmVector;
import CubismBreath = cubismbreath.CubismBreath;
import BreathParameterData = cubismbreath.BreathParameterData;
import CubismEyeBlink = cubismeyeblink.CubismEyeBlink;
import ACubismMotion = acubismmotion.ACubismMotion;
import FinishedMotionCallback = acubismmotion.FinishedMotionCallback;
import CubismFramework = live2dcubismframework.CubismFramework;
import CubismIdHandle = cubismid.CubismIdHandle;
import CubismUserModel = cubismusermodel.CubismUserModel;
import ICubismModelSetting = icubismmodelsetting.ICubismModelSetting;
import CubismModelSettingJson = cubismmodelsettingjson.CubismModelSettingJson;
import CubismDefaultParameterId = cubismdefaultparameterid;

import { LAppPal } from './lapppal';
import { gl, canvas, frameBuffer, LAppDelegate } from './lappdelegate';
import { TextureInfo } from './lapptexturemanager';
import * as LAppDefine from './lappdefine';
import 'whatwg-fetch';

enum LoadStep {
  LoadAssets,
  LoadModel,
  WaitLoadModel,
  LoadExpression,
  WaitLoadExpression,
  LoadPhysics,
  WaitLoadPhysics,
  LoadPose,
  WaitLoadPose,
  SetupEyeBlink,
  SetupBreath,
  LoadUserData,
  WaitLoadUserData,
  SetupEyeBlinkIds,
  SetupLipSyncIds,
  SetupLayout,
  LoadMotion,
  WaitLoadMotion,
  CompleteInitialize,
  CompleteSetupModel,
  LoadTexture,
  WaitLoadTexture,
  CompleteSetup
}

/**
 * 用户使用的模型的实体类<br>
 * 进行模型生成、功能组件生成、更新处理和呈现的调用。
 */
export class LAppModel extends CubismUserModel {
  /**
   * 从放置了model3.json的目录和文件路径生成模型
   * @param dir
   * @param fileName
   */
  public loadAssets(dir: string, fileName: string): void {
    this._modelHomeDir = dir;

    fetch(`${this._modelHomeDir}/${fileName}`)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => {
        const setting: ICubismModelSetting = new CubismModelSettingJson(
          arrayBuffer,
          arrayBuffer.byteLength
        );

        // 更新状态
        this._state = LoadStep.LoadModel;

        // 保存结果
        this.setupModel(setting);
      });
  }

  /**
   * 从model3.json生成模型。
   * model3.jsonの記述に従ってモデル生成、モーション、物理演算などのコンポーネント生成を行う。
   * 根据model3.json的描述，进行模型生成、动作、物理运算等组件生成
   * @param setting ICubismModelSetting的实例
   */
  private setupModel(setting: ICubismModelSetting): void {
    this._updating = true;
    this._initialized = false;

    this._modelSetting = setting;

    // CubismModel
    if (this._modelSetting.getModelFileName() != '') {
      const modelFileName = this._modelSetting.getModelFileName();

      fetch(`${this._modelHomeDir}/${modelFileName}`)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          this.loadModel(arrayBuffer);
          this._state = LoadStep.LoadExpression;

          // callback
          loadCubismExpression();
        });

      this._state = LoadStep.WaitLoadModel;
    } else {
      LAppPal.printMessage('Model data does not exist.');
    }

    // Expression
    const loadCubismExpression = (): void => {
      if (this._modelSetting.getExpressionCount() > 0) {
        const count: number = this._modelSetting.getExpressionCount();

        for (let i = 0; i < count; i++) {
          const expressionName = this._modelSetting.getExpressionName(i);
          const expressionFileName = this._modelSetting.getExpressionFileName(
            i
          );

          fetch(`${this._modelHomeDir}/${expressionFileName}`)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
              const motion: ACubismMotion = this.loadExpression(
                arrayBuffer,
                arrayBuffer.byteLength,
                expressionName
              );

              if (this._expressions.getValue(expressionName) != null) {
                ACubismMotion.delete(
                  this._expressions.getValue(expressionName)
                );
                this._expressions.setValue(expressionName, null);
              }

              this._expressions.setValue(expressionName, motion);

              this._expressionCount++;

              if (this._expressionCount >= count) {
                this._state = LoadStep.LoadPhysics;

                // callback
                loadCubismPhysics();
              }
            });
        }
        this._state = LoadStep.WaitLoadExpression;
      } else {
        this._state = LoadStep.LoadPhysics;

        // callback
        loadCubismPhysics();
      }
    };

    // Physics
    const loadCubismPhysics = (): void => {
      if (this._modelSetting.getPhysicsFileName() != '') {
        const physicsFileName = this._modelSetting.getPhysicsFileName();

        fetch(`${this._modelHomeDir}/${physicsFileName}`)
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => {
            this.loadPhysics(arrayBuffer, arrayBuffer.byteLength);

            this._state = LoadStep.LoadPose;

            // callback
            loadCubismPose();
          });
        this._state = LoadStep.WaitLoadPhysics;
      } else {
        this._state = LoadStep.LoadPose;

        // callback
        loadCubismPose();
      }
    };

    // Pose
    const loadCubismPose = (): void => {
      if (this._modelSetting.getPoseFileName() != '') {
        const poseFileName = this._modelSetting.getPoseFileName();

        fetch(`${this._modelHomeDir}/${poseFileName}`)
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => {
            this.loadPose(arrayBuffer, arrayBuffer.byteLength);

            this._state = LoadStep.SetupEyeBlink;

            // callback
            setupEyeBlink();
          });
        this._state = LoadStep.WaitLoadPose;
      } else {
        this._state = LoadStep.SetupEyeBlink;

        // callback
        setupEyeBlink();
      }
    };

    // EyeBlink
    const setupEyeBlink = (): void => {
      if (this._modelSetting.getEyeBlinkParameterCount() > 0) {
        this._eyeBlink = CubismEyeBlink.create(this._modelSetting);
        this._state = LoadStep.SetupBreath;
      }

      // callback
      setupBreath();
    };

    // Breath
    const setupBreath = (): void => {
      this._breath = CubismBreath.create();

      const breathParameters: csmVector<BreathParameterData> = new csmVector();
      breathParameters.pushBack(
        new BreathParameterData(this._idParamAngleX, 0.0, 15.0, 6.5345, 0.5)
      );
      breathParameters.pushBack(
        new BreathParameterData(this._idParamAngleY, 0.0, 8.0, 3.5345, 0.5)
      );
      breathParameters.pushBack(
        new BreathParameterData(this._idParamAngleZ, 0.0, 10.0, 5.5345, 0.5)
      );
      breathParameters.pushBack(
        new BreathParameterData(this._idParamBodyAngleX, 0.0, 4.0, 15.5345, 0.5)
      );
      breathParameters.pushBack(
        new BreathParameterData(
          CubismFramework.getIdManager().getId(
            CubismDefaultParameterId.ParamBreath
          ),
          0.0,
          0.5,
          3.2345,
          0.5
        )
      );

      this._breath.setParameters(breathParameters);
      this._state = LoadStep.LoadUserData;

      // callback
      loadUserData();
    };

    // UserData
    const loadUserData = (): void => {
      if (this._modelSetting.getUserDataFile() != '') {
        const userDataFile = this._modelSetting.getUserDataFile();

        fetch(`${this._modelHomeDir}/${userDataFile}`)
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => {
            this.loadUserData(arrayBuffer, arrayBuffer.byteLength);

            this._state = LoadStep.SetupEyeBlinkIds;

            // callback
            setupEyeBlinkIds();
          });

        this._state = LoadStep.WaitLoadUserData;
      } else {
        this._state = LoadStep.SetupEyeBlinkIds;

        // callback
        setupEyeBlinkIds();
      }
    };

    // EyeBlinkIds
    const setupEyeBlinkIds = (): void => {
      const eyeBlinkIdCount: number = this._modelSetting.getEyeBlinkParameterCount();

      for (let i = 0; i < eyeBlinkIdCount; ++i) {
        this._eyeBlinkIds.pushBack(
          this._modelSetting.getEyeBlinkParameterId(i)
        );
      }

      this._state = LoadStep.SetupLipSyncIds;

      // callback
      setupLipSyncIds();
    };

    // LipSyncIds
    const setupLipSyncIds = (): void => {
      const lipSyncIdCount = this._modelSetting.getLipSyncParameterCount();

      for (let i = 0; i < lipSyncIdCount; ++i) {
        this._lipSyncIds.pushBack(this._modelSetting.getLipSyncParameterId(i));
      }
      this._state = LoadStep.SetupLayout;

      // callback
      setupLayout();
    };

    // Layout
    const setupLayout = (): void => {
      const layout: csmMap<string, number> = new csmMap<string, number>();
      this._modelSetting.getLayoutMap(layout);
      this._modelMatrix.setupFromLayout(layout);
      this._state = LoadStep.LoadMotion;

      // callback
      loadCubismMotion();
    };

    // Motion
    const loadCubismMotion = (): void => {
      this._state = LoadStep.WaitLoadMotion;
      this._model.saveParameters();
      this._allMotionCount = 0;
      this._motionCount = 0;
      const group: string[] = [];

      const motionGroupCount: number = this._modelSetting.getMotionGroupCount();

      // モーションの総数を求める
      //求动作总数
      for (let i = 0; i < motionGroupCount; i++) {
        group[i] = this._modelSetting.getMotionGroupName(i);
        this._allMotionCount += this._modelSetting.getMotionCount(group[i]);
      }

      // モーションの読み込み
      //载入动作
      for (let i = 0; i < motionGroupCount; i++) {
        this.preLoadMotionGroup(group[i]);
      }

      // モーションがない場合
      //没有动作的情况
      if (motionGroupCount == 0) {
        this._state = LoadStep.LoadTexture;

        // 停止所有的动作
        this._motionManager.stopAllMotions();

        this._updating = false;
        this._initialized = true;

        this.createRenderer();
        this.setupTextures();
        this.getRenderer().startUp(gl);
      }
    };
  }

  /**
   * テクスチャユニットにテクスチャをロードする
   * 在纹理单元中加载纹理
   */
  private setupTextures(): void {
    // iPhoneでのアルファ品質向上のためTypescriptではpremultipliedAlphaを採用
    //为了提高iPhone的α品质，Typerscript采用了premultipliedAlpha
    const usePremultiply = true;

    if (this._state == LoadStep.LoadTexture) {
      // 皮肤的数量
      const textureCount: number = this._modelSetting.getTextureCount();

      for (
        let modelTextureNumber = 0;
        modelTextureNumber < textureCount;
        modelTextureNumber++
      ) {
        // テクスチャ名が空文字だった場合はロード・バインド処理をスキップ
        //如果皮肤字符为空则跳过加载和绑定处理
        if (this._modelSetting.getTextureFileName(modelTextureNumber) == '') {
          console.log('getTextureFileName null');
          continue;
        }

        // WebGLのテクスチャユニットにテクスチャをロードする
        //在WebGL的纹理单元中加载纹理
        let texturePath = this._modelSetting.getTextureFileName(
          modelTextureNumber
        );
        texturePath = this._modelHomeDir + texturePath;

        // ロード完了時に呼び出すコールバック関数
        // 加载完成是的回调函数
        const onLoad = (textureInfo: TextureInfo): void => {
          this.getRenderer().bindTexture(modelTextureNumber, textureInfo.id);

          this._textureCount++;

          if (this._textureCount >= textureCount) {
            // ロード完了
            //加载完了
            this._state = LoadStep.CompleteSetup;
          }
        };

        // 読み込み
        //载入
        LAppDelegate.getInstance()
          .getTextureManager()
          .createTextureFromPngFile(texturePath, usePremultiply, onLoad);
        this.getRenderer().setIsPremultipliedAlpha(usePremultiply);
      }

      this._state = LoadStep.WaitLoadTexture;
    }
  }

  /**
   * 重新渲染
   */
  public reloadRenderer(): void {
    this.deleteRenderer();
    this.createRenderer();
    this.setupTextures();
  }

  /**
   * 更新
   */
  public update(): void {
    if (this._state != LoadStep.CompleteSetup) return;

    const deltaTimeSeconds: number = LAppPal.getDeltaTime();
    this._userTimeSeconds += deltaTimeSeconds;

    this._dragManager.update(deltaTimeSeconds);
    this._dragX = this._dragManager.getX();
    this._dragY = this._dragManager.getY();

    // モーションによるパラメータ更新の有無
    //是否更新动作参数
    let motionUpdated = false;

    //--------------------------------------------------------------------------
    this._model.loadParameters(); // 前回セーブされた状態をロード,装入上次保存的状态
    if (this._motionManager.isFinished()) {
      // モーションの再生がない場合、待機モーションの中からランダムで再生する
      // 在没有动作的再生的情况下，从待机动作中随机再生
      this.startRandomMotion(
        LAppDefine.MotionGroupIdle,
        LAppDefine.PriorityIdle
      );
    } else {
      motionUpdated = this._motionManager.updateMotion(
        this._model,
        deltaTimeSeconds
      ); // モーションを更新,更新动作
    }
    this._model.saveParameters(); // 状態を保存,保存状态
    //--------------------------------------------------------------------------

    // 眨眼
    if (!motionUpdated) {
      if (this._eyeBlink != null) {
        // 没有更新主动作时
        this._eyeBlink.updateParameters(this._model, deltaTimeSeconds); // 眨眼
      }
    }

    if (this._expressionManager != null) {
      this._expressionManager.updateMotion(this._model, deltaTimeSeconds); // 表情参数更新（相対変化）
    }

    // 通过拖拽改变
    // 通过拖拽调整脸部朝向
    this._model.addParameterValueById(this._idParamAngleX, this._dragX * 30); // -30から30の値を加える,-30到30
    this._model.addParameterValueById(this._idParamAngleY, this._dragY * 30);
    this._model.addParameterValueById(
      this._idParamAngleZ,
      this._dragX * this._dragY * -30
    );

    // 通过拖拽调整身体方向
    this._model.addParameterValueById(
      this._idParamBodyAngleX,
      this._dragX * 10
    ); // -10から10の値を加える,-10到10

    // 通过拖拽调整眼睛方向
    this._model.addParameterValueById(this._idParamEyeBallX, this._dragX); // -1から1の値を加える,-1到1
    this._model.addParameterValueById(this._idParamEyeBallY, this._dragY);

    // 呼吸等
    if (this._breath != null) {
      this._breath.updateParameters(this._model, deltaTimeSeconds);
    }

    // 物理运算设置
    if (this._physics != null) {
      this._physics.evaluate(this._model, deltaTimeSeconds);
    }

    // リップシンクの設定
    //嘴巴设置
    if (this._lipsync) {
      //实时进行嘴巴动作时，从系统中获取音量，在0~1的范围内输入值。
      const value = 0; // リアルタイムでリップシンクを行う場合、システムから音量を取得して、0~1の範囲で値を入力します。

      for (let i = 0; i < this._lipSyncIds.getSize(); ++i) {
        this._model.addParameterValueById(this._lipSyncIds.at(i), value, 0.8);
      }
    }

    // 姿势设定
    if (this._pose != null) {
      this._pose.updateParameters(this._model, deltaTimeSeconds);
    }

    this._model.update();
  }

  /**
   * 引数で指定したモーションの再生を開始する
   * 开始参数指定的动作的再生
   * @param group 动作组名称
   * @param no 组内编号
   * @param priority 优先度
   * @param onFinishedMotionHandler モーション再生終了時に呼び出されるコールバック関数,动作再生结束时调用的回调函数
   * @return 開始したモーションの識別番号を返す。個別のモーションが終了したか否かを判定するisFinished()の引数で使用する。開始できない時は[-1],返回开始动作的识别号码。用于判定个别动作是否结束的isFinished（）参数。无法开始时[-1]
   */
  public startMotion(
    group: string,
    no: number,
    priority: number,
    onFinishedMotionHandler?: FinishedMotionCallback
  ): CubismMotionQueueEntryHandle {
    if (priority == LAppDefine.PriorityForce) {
      this._motionManager.setReservePriority(priority);
    } else if (!this._motionManager.reserveMotion(priority)) {
      if (this._debugMode) {
        LAppPal.printMessage("[APP]can't start motion.");
      }
      return InvalidMotionQueueEntryHandleValue;
    }

    const motionFileName = this._modelSetting.getMotionFileName(group, no);

    // ex) idle_0
    const name = `${group}_${no}`;
    let motion: CubismMotion = this._motions.getValue(name) as CubismMotion;
    let autoDelete = false;

    if (motion == null) {
      fetch(`${this._modelHomeDir}/${motionFileName}`)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          motion = this.loadMotion(
            arrayBuffer,
            arrayBuffer.byteLength,
            null,
            onFinishedMotionHandler
          );
          let fadeTime: number = this._modelSetting.getMotionFadeInTimeValue(
            group,
            no
          );

          if (fadeTime >= 0.0) {
            motion.setFadeInTime(fadeTime);
          }

          fadeTime = this._modelSetting.getMotionFadeOutTimeValue(group, no);
          if (fadeTime >= 0.0) {
            motion.setFadeOutTime(fadeTime);
          }

          motion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);
          autoDelete = true; // 終了時にメモリから削除,结束时从内存中删除
        });
    } else {
      motion.setFinishedMotionHandler(onFinishedMotionHandler);
    }

    if (this._debugMode) {
      LAppPal.printMessage(`[APP]start motion: [${group}_${no}`);
    }
    return this._motionManager.startMotionPriority(
      motion,
      autoDelete,
      priority
    );
  }

  /**
   * 开始播放随机选择的动作
   * @param group 动作组名
   * @param priority 优先度
   * @param onFinishedMotionHandler モーション再生終了時に呼び出されるコールバック関数,动作再生结束时调用的回调汉化
   * @return 開始したモーションの識別番号を返す。個別のモーションが終了したか否かを判定するisFinished()の引数で使用する。開始できない時は[-1]
   */
  public startRandomMotion(
    group: string,
    priority: number,
    onFinishedMotionHandler?: FinishedMotionCallback
  ): CubismMotionQueueEntryHandle {
    if (this._modelSetting.getMotionCount(group) == 0) {
      return InvalidMotionQueueEntryHandleValue;
    }

    const no: number = Math.floor(
      Math.random() * this._modelSetting.getMotionCount(group)
    );

    return this.startMotion(group, no, priority, onFinishedMotionHandler);
  }

  /**
   * 引数で指定した表情モーションをセットする
   *设定参数指定的表情动作
   * @param expressionId 表情モーションのID,表情动作的id
   */
  public setExpression(expressionId: string): void {
    const motion: ACubismMotion = this._expressions.getValue(expressionId);

    if (this._debugMode) {
      LAppPal.printMessage(`[APP]expression: [${expressionId}]`);
    }

    if (motion != null) {
      this._expressionManager.startMotionPriority(
        motion,
        false,
        LAppDefine.PriorityForce
      );
    } else {
      if (this._debugMode) {
        LAppPal.printMessage(`[APP]expression[${expressionId}] is null`);
      }
    }
  }

  /**
   * ランダムに選ばれた表情モーションをセットする
   * 使用随机的表情
   */
  public setRandomExpression(): void {
    if (this._expressions.getSize() == 0) {
      return;
    }

    const no: number = Math.floor(Math.random() * this._expressions.getSize());

    for (let i = 0; i < this._expressions.getSize(); i++) {
      if (i == no) {
        const name: string = this._expressions._keyValues[i].first;
        this.setExpression(name);
        return;
      }
    }
  }

  /**
   * イベントの発火を受け取る
   * 接受活动的点燃
   */
  public motionEventFired(eventValue: csmString): void {
    CubismLogInfo('{0} is fired on LAppModel!!', eventValue.s);
  }

  /**
   * 当たり判定テスト
   * 判定测试
   * 指定ＩＤの頂点リストから矩形を計算し、座標をが矩形範囲内か判定する。
   *从指定ID的顶点列表计算矩形，判定坐标是否在矩形范围内。
   * @param hitArenaName  当たり判定をテストする対象のID,每个测试判定的对象的ID
   * @param x             进行判定的X坐标
   * @param y             进行判定的Y坐标
   */
  public hitTest(hitArenaName: string, x: number, y: number): boolean {
    // 透明时不做判定
    if (this._opacity < 1) {
      return false;
    }

    const count: number = this._modelSetting.getHitAreasCount();

    for (let i = 0; i < count; i++) {
      if (this._modelSetting.getHitAreaName(i) == hitArenaName) {
        const drawId: CubismIdHandle = this._modelSetting.getHitAreaId(i);
        return this.isHit(drawId, x, y);
      }
    }

    return false;
  }

  /**
   * モーションデータをグループ名から一括でロードする。
   * 从组名中统一加载动作数据
   * モーションデータの名前は内部でModelSettingから取得する。
   *动作数据的名字在内部从ModelSetting取得
   * @param group 动作数据组名称
   */
  public preLoadMotionGroup(group: string): void {
    for (let i = 0; i < this._modelSetting.getMotionCount(group); i++) {
      const motionFileName = this._modelSetting.getMotionFileName(group, i);

      // ex) idle_0
      const name = `${group}_${i}`;
      if (this._debugMode) {
        LAppPal.printMessage(
          `[APP]load motion: ${motionFileName} => [${name}]`
        );
      }

      fetch(`${this._modelHomeDir}/${motionFileName}`)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          const tmpMotion: CubismMotion = this.loadMotion(
            arrayBuffer,
            arrayBuffer.byteLength,
            name
          );

          let fadeTime = this._modelSetting.getMotionFadeInTimeValue(group, i);
          if (fadeTime >= 0.0) {
            tmpMotion.setFadeInTime(fadeTime);
          }

          fadeTime = this._modelSetting.getMotionFadeOutTimeValue(group, i);
          if (fadeTime >= 0.0) {
            tmpMotion.setFadeOutTime(fadeTime);
          }
          tmpMotion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);

          if (this._motions.getValue(name) != null) {
            ACubismMotion.delete(this._motions.getValue(name));
          }

          this._motions.setValue(name, tmpMotion);

          this._motionCount++;
          if (this._motionCount >= this._allMotionCount) {
            this._state = LoadStep.LoadTexture;

            // 停止所有动作
            this._motionManager.stopAllMotions();

            this._updating = false;
            this._initialized = true;

            this.createRenderer();
            this.setupTextures();
            this.getRenderer().startUp(gl);
          }
        });
    }
  }

  /**
   * 释放所有动作数据
   */
  public releaseMotions(): void {
    this._motions.clear();
  }

  /**
   * 释放所有标签数据。
   */
  public releaseExpressions(): void {
    this._expressions.clear();
  }

  /**
   * モデルを描画する処理。モデルを描画する空間のView-Projection行列を渡す。
   * 绘制模型处理。传递绘制模型的空间的View-Projection矩阵
   */
  public doDraw(): void {
    if (this._model == null) return;

    // 传递画布大小
    const viewport: number[] = [0, 0, canvas.width, canvas.height];

    this.getRenderer().setRenderState(frameBuffer, viewport);
    this.getRenderer().drawModel();
  }

  /**
   * モデルを描画する処理。モデルを描画する空間のView-Projection行列を渡す。
   * 绘制模型处理。传递绘制模型的空间的View-Projection矩阵。
   */
  public draw(matrix: CubismMatrix44): void {
    if (this._model == null) {
      return;
    }

    // 读取结束后
    if (this._state == LoadStep.CompleteSetup) {
      matrix.multiplyByMatrix(this._modelMatrix);

      this.getRenderer().setMvpMatrix(matrix);

      this.doDraw();
    }
  }

  /**
   * 构造器
   */
  public constructor() {
    super();

    this._modelSetting = null;
    this._modelHomeDir = null;
    this._userTimeSeconds = 0.0;

    this._eyeBlinkIds = new csmVector<CubismIdHandle>();
    this._lipSyncIds = new csmVector<CubismIdHandle>();

    this._motions = new csmMap<string, ACubismMotion>();
    this._expressions = new csmMap<string, ACubismMotion>();

    this._hitArea = new csmVector<csmRect>();
    this._userArea = new csmVector<csmRect>();

    this._idParamAngleX = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamAngleX
    );
    this._idParamAngleY = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamAngleY
    );
    this._idParamAngleZ = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamAngleZ
    );
    this._idParamEyeBallX = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamEyeBallX
    );
    this._idParamEyeBallY = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamEyeBallY
    );
    this._idParamBodyAngleX = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamBodyAngleX
    );

    this._state = LoadStep.LoadAssets;
    this._expressionCount = 0;
    this._textureCount = 0;
    this._motionCount = 0;
    this._allMotionCount = 0;
  }

  _modelSetting: ICubismModelSetting; // 模型设置信息
  _modelHomeDir: string; // 放置模型设置的目录
  _userTimeSeconds: number; // デルタ時間の積算値[秒],增量时间的累计值[秒]

  _eyeBlinkIds: csmVector<CubismIdHandle>; // モデルに設定された瞬き機能用パラメータID,模型中设定的瞬时功能用参数ID
  _lipSyncIds: csmVector<CubismIdHandle>; // モデルに設定されたリップシンク機能用パラメータID,模型中设定的唇宿功能用参数ID

  _motions: csmMap<string, ACubismMotion>; // 読み込まれているモーションのリスト,正在装入的动作列表
  _expressions: csmMap<string, ACubismMotion>; // 読み込まれている表情のリスト,装入表情列表

  _hitArea: csmVector<csmRect>;
  _userArea: csmVector<csmRect>;

  _idParamAngleX: CubismIdHandle; // 参数ID: ParamAngleX
  _idParamAngleY: CubismIdHandle; // 参数ID: ParamAngleY
  _idParamAngleZ: CubismIdHandle; // 参数ID: ParamAngleZ
  _idParamEyeBallX: CubismIdHandle; // 参数ID: ParamEyeBallX
  _idParamEyeBallY: CubismIdHandle; // 参数ID: ParamEyeBAllY
  _idParamBodyAngleX: CubismIdHandle; // 参数ID: ParamBodyAngleX

  _state: number; // 用于当前状态管理
  _expressionCount: number; // 表情数据计数
  _textureCount: number; // 材质数据计数
  _motionCount: number; // 动作数据计数
  _allMotionCount: number; // 动作总数
}
