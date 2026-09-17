# V-Task A: 后端 — IPC 契约与创建实现（desktop-viewer-test）

**Files:**
- Modify: `packages/apps/desktop-viewer-test/src/common/ViewerConfig.ts`
- Create: `packages/apps/desktop-viewer-test/src/backend/CreateNewIVaultImpl.ts`
- Modify: `packages/apps/desktop-viewer-test/src/backend/ViewerHandler.ts`

**Interfaces:**
- Consumes（全部已在安装的 @szewtwin 5.x 发布包 d.ts 中核验）:
  - `StandaloneDb.createEmpty(filePath, { rootSubject: { name }, enableTransactions: true })`（CreateEmptyStandaloneIVaultProps 在 @szewtwin/core-common IVault.d.ts:183-201）
  - `withEditTxn<T>(iVault, fn: (txn: EditTxn) => T): T`（@szewtwin/core-backend）
  - `SpatialCategory.insert(txn, IVaultDb.dictionaryId, "Default", new SubCategoryAppearance())`（SubCategoryAppearance 来自 @szewtwin/core-common）
  - `PhysicalModel.insert(txn, IVaultDb.rootSubjectId, "Default")`
  - `ModelSelector.insert(txn, dictId, "Default", [modelId])`、`CategorySelector.insert(txn, dictId, "Default", [catId])`
  - `DisplayStyle3d.insert(txn, dictId, "Default")`
  - `OrthographicViewDefinition.insert(txn, dictId, "Default View", msId, csId, dsId, new Range3d(-100,-100,-100,100,100,100), StandardViewIndex.Iso)`
  - `db.views.setDefaultViewId(viewId)`（须在 EditTxn 结束后调用）
  - `IVaultDb.dictionaryId`/`IVaultDb.rootSubjectId` 静态（继承自 core-common IVault）；`Range3d`/`StandardViewIndex` 来自 @szewtwin/core-geometry
- Produces:
  - `interface CreateNewIVaultArgs { filePath: string; name?: string }` 和 `interface CreateNewIVaultResult { filePath: string; defaultModelId: Id64String; defaultCategoryId: Id64String }`（ViewerConfig.ts 导出）
  - `ViewerIpc.createNewIVault(args: CreateNewIVaultArgs): Promise<CreateNewIVaultResult>`

## Step 1: ViewerConfig.ts 增加契约

1. 文件顶部 import 区（electron 类型 import 之后）新增：

```ts
import type { Id64String } from "@szewtwin/core-szewec";
```

2. 在 `ViewerIpc` 接口内（`saveFile` 之后、`setConnectivity` 之前）新增：

```ts
  createNewIVault: (args: CreateNewIVaultArgs) => Promise<CreateNewIVaultResult>;
```

3. 在文件末尾（`ViewerSettings` 接口之后）新增类型：

```ts
/** Arguments for ViewerIpc.createNewIVault. */
export interface CreateNewIVaultArgs {
  /** The absolute path of the new .bim file. A ".bim" extension is appended if the path has no ".bim"/".ibim" extension. */
  filePath: string;
  /** Name for the root Subject of the new iVault. Defaults to the file name (without extension). */
  name?: string;
}

/** Result of ViewerIpc.createNewIVault. */
export interface CreateNewIVaultResult {
  /** The absolute path of the created file. */
  filePath: string;
  /** The Id of the default PhysicalModel initialized in the new iVault. */
  defaultModelId: Id64String;
  /** The Id of the default SpatialCategory initialized in the new iVault. */
  defaultCategoryId: Id64String;
}
```

注意：ViewerConfig.ts 现有 import 均为 `import type`（除 value import 外）——新增 Id64String 用 `import type` 即可；若 TS 因"仅类型使用"报 lint，保持 `import type`。

## Step 2: 新建 CreateNewIVaultImpl.ts（全文）

```ts
/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { CategorySelector, DisplayStyle3d, IVaultDb, ModelSelector, OrthographicViewDefinition, PhysicalModel, SpatialCategory, StandaloneDb, withEditTxn } from "@szewtwin/core-backend";
import { SubCategoryAppearance } from "@szewtwin/core-common";
import { Range3d, StandardViewIndex } from "@szewtwin/core-geometry";
import { existsSync } from "node:fs";
import * as path from "path";

import type { CreateNewIVaultArgs, CreateNewIVaultResult } from "../common/ViewerConfig";

/** Appends a ".bim" extension to `filePath` if it does not already end in ".bim" or ".ibim". */
function normalizeFilePath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return ".bim" === ext || ".ibim" === ext ? filePath : `${filePath}.bim`;
}

/** Creates a new, empty, editable standalone iVault (.bim) file on disk, initialized with a default
 * PhysicalModel, SpatialCategory, and spatial view so that the file is immediately usable.
 */
export function createNewIVault(args: CreateNewIVaultArgs): CreateNewIVaultResult {
  const filePath = normalizeFilePath(args.filePath);
  if (existsSync(filePath))
    throw new Error(`File already exists: ${filePath}`);

  const name = args.name ?? path.basename(filePath, path.extname(filePath));
  const db = StandaloneDb.createEmpty(filePath, {
    rootSubject: { name },
    enableTransactions: true,
  });

  const { defaultModelId, defaultCategoryId, defaultViewId } = withEditTxn(db, (txn) => {
    const defaultCategoryId = SpatialCategory.insert(txn, IVaultDb.dictionaryId, "Default", new SubCategoryAppearance());
    const defaultModelId = PhysicalModel.insert(txn, IVaultDb.rootSubjectId, "Default");

    // Create a default spatial view that displays the new model and category.
    const modelSelectorId = ModelSelector.insert(txn, IVaultDb.dictionaryId, "Default", [defaultModelId]);
    const categorySelectorId = CategorySelector.insert(txn, IVaultDb.dictionaryId, "Default", [defaultCategoryId]);
    const displayStyleId = DisplayStyle3d.insert(txn, IVaultDb.dictionaryId, "Default");
    const defaultViewId = OrthographicViewDefinition.insert(txn, IVaultDb.dictionaryId, "Default View", modelSelectorId, categorySelectorId, displayStyleId, new Range3d(-100, -100, -100, 100, 100, 100), StandardViewIndex.Iso);

    return { defaultModelId, defaultCategoryId, defaultViewId };
  });

  // setDefaultViewId writes via the implicit txn, so it must be called outside the EditTxn above.
  db.views.setDefaultViewId(defaultViewId);

  db.close(); // All changes are saved; close it so the frontend can open it.

  return { filePath, defaultModelId, defaultCategoryId };
}
```

注意：ViewerHandler.ts 用 `node:` 前缀 import（`node:fs`、`node:path`），故本文件沿用 `node:` 风格（与仓库一致）。若 lint 报 import 顺序，按仓库现有风格调整（eslint.config.js）。

## Step 3: ViewerHandler 增加委托方法

1. 顶部 import 区新增：

```ts
import type { CreateNewIVaultArgs, CreateNewIVaultResult } from "../common/ViewerConfig";
```

（如已有 `../common/ViewerConfig` 的 import 语句，则并入该语句。）

2. 在 `ViewerHandler` 类内、`saveFile` 方法之后新增：

```ts
  /**
   * Create a new, empty, editable standalone iVault (.bim) file on disk.
   * @param args
   * @returns
   */
  public async createNewIVault(
    args: CreateNewIVaultArgs
  ): Promise<CreateNewIVaultResult> {
    return createNewIVault(args);
  }
```

并在文件 import 区新增：

```ts
import { createNewIVault } from "./CreateNewIVaultImpl";
```

注意方法名与导入函数同名（现有委托模式如此，无递归风险——导入函数被遮蔽仅在自身作用域内引用不到时才会发生，这里 import 的函数与类方法不冲突，与 ViewerHandler 现有 openFile→dialog 委托模式一致；若 TS 报 self-reference 错误，把导入改名为 `createNewIVaultImpl` 并在委托中调用之）。

## Step 4: 构建验证

```bash
cd D:/01Work/NameReplaceTest/viewer/packages/apps/desktop-viewer-test
rushx build
```

预期 exit 0。若失败按错误修复；若 API 签名与 brief 不符，报告 BLOCKED 附完整错误。

## 全局约束

- 非 git 仓库：不要运行 git 命令，不要 commit。
- 无测试框架（test script 为空）：验证 = rushx build；不写测试文件。
- Rush monorepo：只用 rushx。
- 术语 iVault；扩展名 .bim/.ibim；enableTransactions: true。
- 不改动 brief 未列出的文件或行为。
