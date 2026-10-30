# dsh-notify-relay · 手机信使

Let your AI **proactively notify your phone** when long tasks finish, when things break, or when a decision is needed.

## 支持
**Server酱**(sc.ftqq.com)·**Bark**(iOS)·**Gotify**·任意接收`{title,message}`的webhook。面板配置里填webhook地址即用（或环境变量`DSH_NOTIFY_WEBHOOK`）。

## 常驻纪律
该推：长任务完成（结果+读数）/出错（错因+下一步）/需决策（选项列清）。不该推：中间进度、能自愈的小事、过程日志。**通知是打扰，内容必须值回打扰成本。**

## 安装
```
dsh plugin add github:xushilianzhuren/dsh-notify-relay
```
MIT License.
