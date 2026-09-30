# 访客预约本地测试

`visitor-reservation.cjs` 读取 V03 静态入口并在 jsdom 执行本地脚本，不启动服务器、不访问页面网络资源，也不替代浏览器视觉验收。

需要 Node.js、jsdom 和 jsqr。依赖可装在临时目录，不必在前端包中加入 node_modules：

```sh
test_deps=$(mktemp -d /tmp/visitor-test-deps.XXXXXX)
npm install --prefix "$test_deps" --no-audit --no-fund jsdom@26 jsqr@1.4.0
NODE_PATH="$test_deps/node_modules" node 代码/tests/visitor-reservation.cjs
VISITOR_DELAY_SCRIPTS=1 NODE_PATH="$test_deps/node_modules" node 代码/tests/visitor-reservation.cjs
```

请在项目根目录运行。测试覆盖全页脚本初始化、入口、表单与时间校验、模拟验证码错误/过期/重发、上一步修改、存储失败回滚、重复提交、二维码独立解码、SVG 导出内容、打印调用与清理、凭证过期、身份/园区切换及清除记录，附带会议和报修入口冒烟检查。

第二条命令通过 jsdom 解析 HTML 并延迟加载本地脚本（services 150ms，其余脚本 10ms），保留 DOMContentLoaded 顺序，覆盖早期定时器先执行、后续首页模板重建的时序。不发起网络请求；两种模式都需通过，不能只依赖同步脚本测试。

下载与打印使用测试替身验证调用和输出内容，未验证真实浏览器的下载权限、保存位置、打印布局或打印机输出。邮件、企业人员身份和门禁接口均未接入；这些测试不能证明真实预约有效。
