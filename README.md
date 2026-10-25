# Massage Mayhem（疯狂按摩店）

一款以接单、选择技师、手势操作和顾客评价为核心的按摩店游戏原型。本仓库包含可运行的浏览器规则原型、策划文档及美术概念资源。

## 本地运行

需要 Python 3 和现代浏览器：

```bash
cd massage_mayhem_engine
python -m http.server 8000
```

打开 <http://localhost:8000/play.html>。直接双击 HTML 会受到浏览器对 ES Modules 的限制。

规则测试需要 Node.js 20+：

```bash
cd massage_mayhem_engine
npm test
```

详细架构、已实现内容和限制见 [规则原型说明](massage_mayhem_engine/README.md)。美术需求与生产清单见 `art/视觉概念与资源生产清单.md` 及根目录美术文档。

## 当前阶段

这是可玩的规则与交互原型，正式美术、骨骼动画、音效和商业化 SDK 尚未接入。`art/concepts/` 中的图片是视觉方向参考，并非可直接用于正式游戏的拆分素材。

用户提供的原始参考图及真人研究资料仅保存在本地，不包含在仓库中。
