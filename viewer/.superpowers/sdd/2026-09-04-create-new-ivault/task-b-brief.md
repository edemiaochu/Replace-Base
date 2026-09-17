# V-Task B: 前端 — Home 新建入口（desktop-viewer-test）

前置：V-Task A 已完成（`ViewerIpc.createNewIVault` 与 `CreateNewIVaultArgs/CreateNewIVaultResult` 已在 common/ViewerConfig.ts 定义；后端已实现）。

**Files:**
- Modify: `packages/apps/desktop-viewer-test/src/frontend/app/SZEWTwinViewerApp.ts`
- Modify: `packages/apps/desktop-viewer-test/src/frontend/components/home/Home.tsx`
- Modify: `packages/apps/desktop-viewer-test/public/locales/en/szewTwinDesktopViewer.json`

**Interfaces:**
- Consumes:
  - `SZEWTwinViewerApp.ipcCall.saveFile(options: SaveDialogOptions): Promise<SaveDialogReturnValue>`（已有，ViewerHandler.saveFile → dialog.showSaveDialog）
  - `SZEWTwinViewerApp.ipcCall.createNewIVault(args: CreateNewIVaultArgs): Promise<CreateNewIVaultResult>`（V-Task A 新增；`ipcCall` 代理通过 `PickAsyncMethods<ViewerIpc>` 自动包含新方法）
  - `SvgAdd` 图标（@szewtwin/szewtwinui-icons-react，已确认导出存在）
- Produces:
  - `SZEWTwinViewerApp.createIVault(): Promise<CreateNewIVaultResult | undefined>` — 弹保存对话框 → IPC 创建 → 返回结果；取消返回 undefined
  - Home 导航区 "Create New iVault" 入口（Open 旁）

## Step 1: SZEWTwinViewerApp.ts 增加 createIVault()

1. import 区把 ViewerConfig 的 type import 扩展（第 12 行现有）：

```ts
import type { CreateNewIVaultResult, ViewerConfig, ViewerIpc } from "../../common/ViewerConfig";
```

2. 在 `saveBriefcase` 方法之后新增：

```ts
  public static async createIVault(): Promise<CreateNewIVaultResult | undefined> {
    const options: SaveDialogOptions = {
      title: SZEWTwinViewerApp.translate("createNewIVault"),
      defaultPath: "NewIVault.bim",
      filters: [{ name: "iVaults", extensions: ["ibim", "bim"] }],
    };
    const val = await SZEWTwinViewerApp.ipcCall.saveFile(options);
    if (val.canceled || !val.filePath)
      return undefined;

    return SZEWTwinViewerApp.ipcCall.createNewIVault({ filePath: val.filePath });
  }
```

## Step 2: Home.tsx 增加导航入口

1. import 区（第 10 行现有）改为：

```ts
import { SvgAdd, SvgFolderOpened, SvgIvault } from "@szewtwin/szewtwinui-icons-react";
```

2. `openFile` 函数之后新增：

```ts
  const createIVault = async () => {
    try {
      const result = await SZEWTwinViewerApp.createIVault();
      if (result) {
        void userSettings.addRecent(result.filePath);
        void navigate("/viewer", { state: { filePath: result.filePath } });
      }
    } catch (err: any) {
      alert(`Error creating iVault: ${err.toString()}`);
    }
  };
```

3. 导航区（`openFile` 的 `<div>` 之后、Download 的 `<div>` 之前）新增：

```tsx
            <div>
              <SvgAdd />
              <span onClick={createIVault}>{SZEWTwinViewerApp.translate("createNewIVault")}</span>
            </div>
```

## Step 3: i18n json 增加 key

`public/locales/en/szewTwinDesktopViewer.json`，在 `"open": "Open",` 之后新增一行：

```json
  "createNewIVault": "Create New iVault",
```

注意 JSON 逗号正确（前一行 `"open": "Open",` 已有逗号，新增行带尾逗号与后续行衔接）。

## Step 4: 构建验证

```bash
cd D:/01Work/NameReplaceTest/viewer/packages/apps/desktop-viewer-test
rushx build
```

预期 exit 0。若失败按错误修复；不改动 brief 未列出的文件或行为。

## 全局约束

- 非 git 仓库：不要运行 git 命令，不要 commit。
- 无测试框架：验证 = rushx build；不写测试文件。
- Rush monorepo：只用 rushx。
- 术语 iVault；扩展名 .bim/.ibim。
- 前端错误处理 try/catch + alert（spec 要求）。
- 不改动 dist/ 下构建产物（build 会重新生成）。
