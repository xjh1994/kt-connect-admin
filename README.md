# KT Connect Admin

Web管理界面，用于管理 kt-connect 集群连接。

## 界面
<img width="3024" height="1512" alt="ab87d689151b7ec532eb1ffa8630e792" src="https://github.com/user-attachments/assets/f34e2ec3-5241-4521-9ac6-c877f8dcde76" />
<img width="3024" height="1512" alt="ab783c4f4486e083f58e83225d7b4555" src="https://github.com/user-attachments/assets/554dbdf0-5a63-47f7-9cf7-0bdc5ceedb63" />
<img width="3024" height="1512" alt="9b0d5cc09f204bda4a70352b0902553b" src="https://github.com/user-attachments/assets/5cb49075-72c1-413e-9be0-396f231d4a9b" />
<img width="3024" height="1512" alt="e2c27f5d42b6358a5d4952d28a81f00c" src="https://github.com/user-attachments/assets/cbb580aa-3162-4327-a237-024ac6912270" />


## 功能

- **Connect**: 连接 Kubernetes 集群
- **Exchange**: 端口转发服务
- **Hosts**: 管理 hosts 文件条目
- **Cluster**: 管理集群配置

## 技术栈

- Frontend: React + TypeScript + Vite + TailwindCSS
- Backend: Node.js + Express + MySQL

## 快速开始

### 1. 安装依赖

```bash
# Frontend
cd kt-connect-admin
npm install

# Backend
cd server
npm install
```

### 2. 配置环境变量

复制 `server/.env.example` 为 `server/.env`，修改配置:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kt_connect_admin
PORT=3001
```

### 3. 初始化数据库

```bash
cd server
node init-db.js
```

### 4. 启动服务

```bash
# Terminal 1: 启动后端
cd server
npm start

# Terminal 2: 启动前端
cd kt-connect-admin
npm run dev
```

访问 http://localhost:5173

## 目录结构

```
kt-connect-admin/
├── src/                    # 前端源码
│   ├── components/        # React 组件
│   ├── stores/           # Zustand 状态管理
│   ├── utils/            # 工具函数
│   └── types/            # TypeScript 类型
├── server/               # 后端源码
│   ├── handlers/         # API 处理器
│   ├── kubeconfigs/      # Kubeconfig 存储
│   └── init-db.js        # 数据库初始化
└── dist/                 # 构建产物
```

## 注意事项

- 使用 MySQL 存储集群配置
- Kubeconfig 文件存储在 `server/kubeconfigs/`
- 多用户 session 隔离，任务按用户独立

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
