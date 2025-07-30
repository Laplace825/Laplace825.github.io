---
title: 解决 Hyprland Linux QQ 中文输入法问题
published: 2024-09-07
description: 解决 Hyprland Linux QQ 中文输入法问题
tags: [Desktop, ArchLinux, Linux]
category: Linux
draft: false
---

`Hyprland`桌面，`QQ`无法使用`fcitx5`输入中文。这里记录一下解决方法。

<!--more-->

## linuxqq

这里是用`paru`直接安装的`linuxqq`

## 解决中文输入

由于是`wayland`桌面，所以需要在`/etc/environment`中添加`

```bash
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
```

### 方法一、直接改启动脚本

但是还是无法输入中文，我直接更改`linuxqq`的启动脚本，添加启动参数，
`sudo vim /usr/bin/linuxqq`，最后一行改为

```bash
#!/bin/bash

if [ -d ~/.config/QQ/versions ]; then
    find ~/.config/QQ/versions -name sharp-lib -type d -exec rm -r {} \; 2>/dev/null
fi

rm -rf ~/.config/QQ/crash_files/*

XDG_CONFIG_HOME=${XDG_CONFIG_HOME:-~/.config}

if [[ -f "${XDG_CONFIG_HOME}/qq-flags.conf" ]]; then
    mapfile -t QQ_USER_FLAGS <<<"$(grep -v '^#' "${XDG_CONFIG_HOME}/qq-flags.conf")"
    echo "User flags:" ${QQ_USER_FLAGS[@]}
fi

# 将最后一行改为下面这样
exec /opt/QQ/qq ${QQ_USER_FLAGS[@]} --ozone-platform-hint=auto --enable-wayland-ime "$@"
```

### 方法二、添加启动参数

个人更推荐这个方法，否则每次更新`linuxqq`都需要重新改启动脚本。
通过启动脚本我们也知道可以在`~/.config/`目录下添加`qq-flags.conf`文件，添加启动参数。

```bash
echo "--ozone-platform-hint=auto\n--enable-wayland-ime" > ~/.config/qq-flags.conf
```

## 重启`Linuxqq`
