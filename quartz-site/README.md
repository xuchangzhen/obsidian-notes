# Quartz 网站发布

## 网站工作原理

```text
Obsidian 笔记
→ push 到 main
→ GitHub Actions
→ prepare-content
→ Quartz build
→ GitHub Pages
```

## 本地预览

在 `quartz-site` 目录中运行：

```bash
npm ci
npx quartz plugin install
node scripts/prepare-content.mjs
npx quartz build --serve
```

构建内容会写入被 Git 忽略的 `content/`，网站文件会写入被 Git 忽略的
`public/`。默认预览地址由 Quartz 在终端中显示。

## 日常使用

平时只需在仓库根目录正常编辑笔记，然后执行 `git add`、`git commit` 和
`git push`。当变更推送到 `main` 后，GitHub Actions 会自动构建并部署网站；
无需手动复制笔记或运行 Quartz。

带有 `draft: true` frontmatter 的笔记会由 Quartz 从公开网站中排除。请注意：
这不会让已经公开的 GitHub 仓库文件变为私密。

## 排查

在 GitHub 仓库依次打开 **Actions → Deploy Quartz site**，查看构建或部署
步骤的日志。GitHub Pages 的来源必须设为 **Settings → Pages → Build and
deployment → Source → GitHub Actions**。

## 更新 Quartz

先在新分支中查看 Quartz `v5` 上游的变更，再有选择地更新程序文件与
`package-lock.json`。保留本仓库的 `quartz.config.yaml`、`scripts/`、
`site-content/` 和本 README；不要覆盖或移动仓库根目录的 Obsidian 笔记。
