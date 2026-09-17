# SDD ledger — plan: packages/apps/desktop-viewer-test/docs/superpowers/plans/2026-09-04-create-new-ivault.md

Spec: packages/apps/desktop-viewer-test/docs/superpowers/specs/2026-09-04-create-new-ivault-design.md
（注：docs 为 itwinjs-core display-test-app 版本的计划/spec；本 repo 是 viewer/desktop-viewer-test，按裁决适配执行。）

## Pre-flight scan 与适配裁决

| 项 | 计划/spec 假设 | viewer 仓库实际 | 裁决 |
|---|---|---|---|
| 目标 app | display-test-app（Surface/ToolBar/key-in 架构） | desktop-viewer-test（React + desktop-viewer-react，无 key-in/工具栏） | WHAT 按 spec，HOW 按目标仓库结构；spec 为绑定权威 |
| IPC 契约位置 | src/common/DtaIpcInterface.ts + dtaChannel | src/common/ViewerConfig.ts 的 `ViewerIpc` + `szewTwinChannel("desktop-viewer")` | 契约加进 ViewerIpc；类型名沿用 CreateNewIVaultArgs/Result |
| 后端 handler | DtaHandler（DtaElectronMain.ts） | `ViewerHandler extends IpcHandler implements ViewerIpc`（src/backend/ViewerHandler.ts） | 新建 backend/CreateNewIVaultImpl.ts + ViewerHandler 委托；main.ts 已注册 ipcHandlers: [ViewerHandler]，无需改动 |
| 保存对话框 | FileOpen.ts selectSaveFileName（ElectronApp.dialogIpc） | 已有 `saveFile` IPC + `SZEWTwinViewerApp.saveBriefcase()` 模式 | 复用 saveFile；SZEWTwinViewerApp 新增 createIVault() |
| UI 入口 | 工具栏按钮 + NewIVaultTool key-in | Home.tsx 导航区（Open 旁）+ SvgAdd 图标（szewtwinui-icons-react 已确认有 SvgAdd） | 仅 Home 入口；不实现 key-in 工具（app 无 key-in 系统） |
| editorToolSettings 回填 | spec 第 5 步 | 该 app 无编辑工具（package.json 无 editor-frontend）；连接由 desktop-viewer-react 内部创建 | 省略回填；契约字段 defaultModelId/defaultCategoryId 保留（后端照建默认内容）。若未来加编辑工具再回填 |
| 打开流程 | Surface.createViewer + dock | addRecent(filePath) + navigate("/viewer", { state: { filePath } }) | 沿用现有 open 流程 |
| i18n | 无（硬编码 tooltip） | public/locales/en/szewTwinDesktopViewer.json | 新增 "createNewIVault" key |
| 验证 | rushx build（itwinjs-core 路径） | viewer 仓库 rushx build（desktop-viewer-test） | 同法；E2E 步骤适配（无 svt key-in：验证默认视图打开 + Models/Categories 树可见默认内容 + 重开） |
| git | 非 git（itwinjs-core） | viewer 同样非 git（git rev-parse 失败） | 无 commit；快照 diff 评审 |
| 测试 | 无框架（test script 空） | 同（"test": ""） | rushx build 为验证手段 |
| 后端 API | 分叉源码（已核验） | 安装的 @szewtwin/core-backend 5.x 发布包 d.ts 已核验：StandaloneDb.createEmpty(CreateEmptyStandaloneIVaultProps.enableTransactions)、withEditTxn、SpatialCategory/PhysicalModel/ModelSelector/CategorySelector/DisplayStyle3d/OrthographicViewDefinition.insert(txn,...)、views.setDefaultViewId、IVault.dictionaryId/rootSubjectId（core-common）、SubCategoryAppearance（core-common）、Range3d/StandardViewIndex（core-geometry）、barrel star re-export | 直接使用 |
- V-Task 0: complete (baseline rushx build exit 0; node_modules 已存在，无需 rush install)
- V-Task A: complete (review clean, no commits — non-git)
- V-Task A: minor (deferred): node:fs 与 path 前缀风格不一致（brief-verbatim，仓库主导实践是裸 path）
- V-Task A: minor (deferred): 超长单行 import/insert 调用（无 prettier 门禁）
- V-Task A: minor (deferred): 委托方法 JSDoc 无描述（与邻近方法风格一致）
- Ruling: V-Task B 首次分派因模型别名故障失败（sonnet→deepseek-v4-flash 不存在，400）— 改用会话默认模型重派，任务内容不变
- Ruling: 子代理通道全面故障（所有分派含显式 opus 探针均路由到失效的 deepseek-v4-flash，400）— V-Task B 由控制器内联执行 + 自审，评审包已生成（task-b/review.diff），通道恢复后可补独立评审
- V-Task B: complete (inline by controller, build exit 0, self-review clean — 3 files match brief verbatim)
- V-Task C: complete — 用户手动验收通过
- Ruling（验收期间两个基线问题，均与本功能无关，由用户自行解决）：
  1) appauth 1.4.0 ESM 坏包导致 Electron 主进程启动失败 — 根因 ^1.3.2 浮动范围 + lockfile 生成时间差异（1.4.0 于 2026-08-19 发布）；用户处理后 store 现为 1.3.2
  2) native 5.9.17 序列化 $schema 为 .../dm/32/dmschema 而 TS 期望 .../ecschema 结尾（分叉改名不一致，Schema.ts:831 正则）→ schema RPC 加载路径 35070 报错；用户已解决（可能改了源码正则）
- Feature COMPLETE: viewer/desktop-viewer-test create-new-ivault 交付
