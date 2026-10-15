# b-roll

根据真人口播视频和 SRT，用 HyperFrames 生成逐句触发的代码动画 B-roll。

## 规则

- 16:9、1920×1080、30fps
- 每页 5–8 秒，一个语义小段一个连续场景
- 每句字幕开始时触发对应动作，未讲到的内容保持隐藏
- 保留真人画中画和原声；真人画中画位于左下角
- 使用 HTML、CSS、SVG、GSAP 和 HyperFrames，不使用视频生成模型

## 安装

```bash
npx skills add Moistenxx/b-roll
```

仓库内的 `assets/approved-v3/` 是一份 30 秒节奏参考，包含页面计划、SRT、HyperFrames 源码和验证脚本。它需要使用者自己的原始口播视频作为 `面试口播.mp4`，不会上传原始视频。

## 调用

```text
$b-roll
```

提供原始口播视频和 SRT 后，先建立 `SRT → 页面 → 动作` 对照，再制作和渲染。交付前必须检查实际渲染帧、字幕、未来内容隐藏、随机 seek 和音画时长。
