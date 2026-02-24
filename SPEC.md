# kt-connect Admin UI - 规格说明书

## 1. 项目概述

**项目名称**: kt-connect Admin UI  
**项目类型**: Web 应用  
**核心功能**: 为 kt-connect 工具提供可视化界面，简化连接 K8s 集群和流量交换操作  
**目标用户**: 使用 Kubesphere 平台的开发者

---

## 2. UI/UX 规格

### 2.1 布局结构

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Logo + 标题 + 连接状态指示器                            │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│   Sidebar    │              Main Content                       │
│   (导航)      │                                                  │
│              │   ┌─────────────────────────────────────────┐   │
│  - 集群管理   │   │  Task Panel (可展开多个)               │   │
│  - Connect   │   │  - 任务卡片                              │   │
│  - Exchange  │   │  - 实时日志                              │   │
│  - 历史记录   │   │  - 控制按钮                             │   │
│              │   └─────────────────────────────────────────┘   │
│              │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

**响应式断点**:
- Mobile: < 768px (侧边栏折叠为底部导航)
- Tablet: 768px - 1024px
- Desktop: > 1024px

### 2.2 视觉设计

**色彩方案** (深色主题，适合开发者):
- `--bg-primary`: #0f172a (主背景)
- `--bg-secondary`: #1e293b (卡片背景)
- `--bg-tertiary`: #334155 (输入框背景)
- `--text-primary`: #f8fafc (主文字)
- `--text-secondary`: #94a3b8 (次要文字)
- `--accent-primary`: #3b82f6 (主按钮蓝色)
- `--accent-success`: #22c55e (连接成功)
- `--accent-warning`: #f59e0b (警告)
- `--accent-error`: #ef4444 (错误)
- `--border-color`: #475569 (边框)

**字体**:
- 主字体: "JetBrains Mono", "Fira Code", monospace (开发者风格)
- 标题: 24px (h1), 20px (h2), 16px (h3)
- 正文: 14px
- 小字: 12px

**间距系统**:
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

**视觉效果**:
- 卡片阴影: `0 4px 6px -1px rgba(0, 0, 0, 0.3)`
- 圆角: 8px (卡片), 6px (按钮), 4px (输入框)
- 过渡动画: 150ms ease-in-out

### 2.3 组件规格

**Header 组件**:
- 高度: 64px
- 左侧: Logo + "kt-connect Admin"
- 右侧: 当前连接状态 + 用户菜单

**Sidebar 导航**:
- 宽度: 240px (desktop), 60px (collapsed)
- 图标 + 文字
- 当前激活项: 左侧蓝色边框 + 背景高亮

**ClusterCard (集群配置卡片)**:
- 显示: 集群名称、API Server 地址、状态
- 操作: 编辑、删除、连接
- 状态指示: 绿点(已连接) / 灰点(未连接)

**TaskCard (任务卡片)**:
- 标题: 操作类型 + 目标
- 状态: pending / running / success / error
- 实时日志区域 (可滚动)
- 控制按钮: 开始 / 停止 / 查看详情

**Form 组件**:
- 输入框: 带标签、placeholder、验证错误提示
- 下拉选择: 搜索过滤
- 开关: boolean 选项
- 按钮: primary / secondary / danger

---

## 3. 功能规格

### 3.1 集群配置管理

**功能**:
- 添加新集群配置 (kubeconfig 上传/粘贴)
- 编辑现有配置
- 删除配置
- 测试连接有效性

**配置字段**:
```typescript
interface ClusterConfig {
  id: string;
  name: string;           // 显示名称
  kubeconfig: string;     // kubeconfig 内容或文件路径
  apiServer: string;      // API Server URL (从 kubeconfig 解析)
  namespace: string;      // 默认 namespace
  includeIps?: string;    // includeIps 参数 (CIDR 格式)
  autoHosts?: boolean;    // 是否自动修改 hosts
}
```

**存储**: localStorage (客户端) 或后端数据库

### 3.2 Connect 场景 (连接集群)

**命令**:
```bash
ktctl connect --namespace {namespace} --kubeconfig {path} --includeIps {cidr} --debug
```

**参数表单**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| cluster | select | 是 | - | 选择集群配置 |
| namespace | input | 是 | default | K8s namespace |
| includeIps | input | 否 | - | 允许访问的 IP 段 (CIDR) |
| autoHosts | switch | 是 | true | 自动修改 hosts 文件 |
| debug | switch | 否 | false | 开启调试模式 |

**hosts 修改逻辑**:
1. 从 kubeconfig 解析 API Server 地址和端口
2. 解析集群 IP (可能需要 DNS 解析)
3. 在 `/etc/hosts` (macOS/Linux) 或 `C:\Windows\System32\drivers\etc\hosts` (Windows) 添加条目:
   ```
   {cluster_ip} {api_server_host}
   ```
4. 需要管理员/root 权限

**执行流程**:
1. 用户填写参数 → 点击"连接"
2. 如果 autoHosts=true → 修改 hosts 文件
3. 启动 ktctl connect 命令
4. 实时显示输出日志
5. 记录连接状态

### 3.3 Exchange 场景 (流量重定向)

**命令**:
```bash
ktctl exchange {serviceName} --expose {localPort}:{remotePort} --namespace {namespace} --kubeconfig {path} --debug
```

**参数表单**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| cluster | select | 是 | - | 选择集群配置 |
| namespace | input | 是 | - | K8s namespace |
| serviceName | input | 是 | - | 要交换的服务名 |
| localPort | input | 是 | 8080 | 本地监听端口 |
| remotePort | input | 是 | 80 | 远程服务端口 |
| debug | switch | 否 | false | 开启调试模式 |

**执行流程**:
1. 用户填写参数 → 点击"开始交换"
2. 执行 ktctl exchange 命令
3. 实时显示输出日志
4. 流量进来时显示请求日志

### 3.4 多任务管理

**功能**:
- 支持同时运行多个 Connect/Exchange 任务
- 每个任务独立的状态和日志
- 可以单独停止某个任务
- 任务列表展示所有活跃任务

**任务状态**:
```typescript
interface Task {
  id: string;
  type: 'connect' | 'exchange';
  status: 'pending' | 'running' | 'success' | 'error' | 'stopped';
  params: ConnectParams | ExchangeParams;
  logs: string[];
  startTime: Date;
  endTime?: Date;
}
```

### 3.5 历史记录

**功能**:
- 记录所有执行过的操作
- 可查看历史操作的参数和日志
- 可重新执行历史操作
- 可导出日志

---

## 4. 技术架构

### 4.1 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **命令行执行**: Node.js child_process (Web 后端 API)
- **hosts 修改**: 需要后端 API (Node.js/Express)

### 4.2 项目结构

```
kt-connect-admin/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   ├── ClusterManager/
│   │   ├── ConnectPanel/
│   │   ├── ExchangePanel/
│   │   ├── TaskCard/
│   │   └── common/
│   ├── hooks/
│   ├── stores/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── server/
│   ├── index.js          # Express 服务
│   ├── handlers/
│   │   ├── command.js    # ktctl 命令执行
│   │   └── hosts.js      # hosts 文件操作
│   └── package.json
└── package.json
```

### 4.3 API 设计

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/clusters` | GET | 获取集群列表 |
| `/api/clusters` | POST | 添加集群配置 |
| `/api/clusters/:id` | PUT | 更新集群配置 |
| `/api/clusters/:id` | DELETE | 删除集群配置 |
| `/api/clusters/:id/test` | POST | 测试连接 |
| `/api/command/execute` | POST | 执行 ktctl 命令 |
| `/api/command/stop` | POST | 停止命令进程 |
| `/api/hosts/write` | POST | 写入 hosts 文件 |
| `/api/hosts/read` | GET | 读取当前 hosts |

---

## 5. 验收标准

### 5.1 功能验收

- [ ] 可以添加、编辑、删除集群配置
- [ ] Connect 功能可以正确执行并显示日志
- [ ] Exchange 功能可以正确执行并显示日志
- [ ] hosts 文件可以自动修改 (需要后端)
- [ ] 多任务可以并发运行
- [ ] 可以停止运行中的任务
- [ ] 历史记录功能正常

### 5.2 视觉验收

- [ ] 深色主题正确应用
- [ ] 响应式布局在不同屏幕尺寸下正常
- [ ] 动画过渡流畅
- [ ] 日志区域可滚动且样式清晰

### 5.3 交互验收

- [ ] 表单验证正确提示错误
- [ ] 按钮状态正确 (loading/disabled)
- [ ] 任务状态变化有视觉反馈
- [ ] 错误信息清晰可读
