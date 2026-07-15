首先创建github仓库
将git连接到github仓库
```
git remote add origin https://github.com/你的GitHub用户名/Codex-Status-Island.git
git push -u origin main
```

初始化git创库
```
git init
```

==注意==
GitHub 已经不支持在 `git push` 时使用账号登录密码。终端虽然显示：

```
Password for 'https://...':
```

但这里需要输入的是 **Personal Access Token（个人访问令牌）**，不是 GitHub 密码、邮箱密码或 QQ 密码。


在浏览器打开 GitHub，按以下路径进入：

**右上角头像 → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**

填写：

- **Token name**：`Mac Git`
- **Expiration**：可以选 `90 days`
- **Resource owner**：选择 `xuchangzhen`
- **Repository access**：选择 `Only select repositories`
- 选中：`Codex-Status-Island`
- **Repository permissions → Contents**：设置为 `Read and write`

然后点击 **Generate token**。GitHub 推荐使用这种可以限定仓库和权限的 Fine-grained token。
这个就是密码，用户名就是名字

后续上传只需：
```
git add .
git commit -m "更新 GPIO 笔记"
git push
```

