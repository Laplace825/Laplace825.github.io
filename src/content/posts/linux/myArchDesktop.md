---
title: 我的 ArchLinux + Hyprland 自动化脚本桌面配置
published: 2024-08-16
description:  使用自动化脚本的`Hyprland`的桌面配置。
tags: [Desktop, ArchLinux, Linux]
category: Linux
image: ./archdesktop.png
draft: false
expired: true
---

使用自动化脚本的`Hyprland`的桌面配置。
桌面的配置可能需要尽量保持比较干净的环境，毕竟各种依赖冲突的时候实在...😇

<!--more-->

# Hyprland 的自动化脚本

我重新安装`arch`时安装的是`KDE`桌面，但是最后还是想转到平铺式窗口管理，就转向了`hyprland`。
由于个人也懒得捣鼓桌面了（~~其实是菜~~）,使用到了[JaKooLit/Arch-Hyprland](https://github.com/JaKooLit/Arch-Hyprland.git)自动安装。

## 安装过程

### 执行脚本

参照`github`，在安装时会提示选择项，推荐还是查看官方wiki [KooL's Hyprland - Dots wiki](https://github.com/JaKooLit/Hyprland-Dots/wiki/)

```bash
git clone --depth=1 https://github.com/JaKooLit/Arch-Hyprland.git ~/Arch-Hyprland
cd ~/Arch-Hyprland
chmod +x install.sh
./install.sh
```

### 我的选项

注意该安装脚本会自动安装`pipewire audio`并卸载`pulseaudio`，在安装脚本191行注释掉，就不会安装`pipewire`。
不过个人建议使用`pipewire`。
因为`zsh`是自己进行配置的所以不选择`Y`。这里按照提示选择即可。
华硕的同学可以将`Asus` `ROG`选项改`Y`(虽然我是天选)。
```bash
### -Type AUR helper
### yay or paru 
aur_helper="yay"
############ use : "Y" or "N"
###-Do you have any nvidia gpu in your system?
nvidia="Y"
###-Install GTK themes (required for Dark/Light function)?
gtk_themes="Y"
###-Do you want to configure Bluetooth?
bluetooth="Y"
###-Do you want to install Thunar file manager?
thunar="Y"
###-Install & configure SDDM log-in Manager plus (OPTIONAL) SDDM Theme?
sddm="Y"
###-Install XDG-DESKTOP-PORTAL-HYPRLAND? (For proper Screen Share ie OBS)
xdph="Y"
###-Install zsh, oh-my-zsh & (Optional) pokemon-colorscripts?
zsh="N"
###-Installing in a Asus ROG Laptops?
rog="Y"
###-Do you want to download pre-configured Hyprland dotfiles?
dots="Y"

### These are the sub-questions of the above choices
### Would you like to blacklist nouveau? (y/n)
blacklist_nouveau="Y"
### XDG-desktop-portal-KDE & GNOME (if installed) should be manually disabled or removed! Script cant remove nor disable it.
### Would you like to try to remove other XDG-Desktop-Portal-Implementations? (y/n) 
XDPH1="Y"
### SDDM is already installed. Would you like to manually install sddm-git to remove it? This requires manual intervention. (y/n)
manual_install_sddm="N"
### OPTIONAL - Would you like to install SDDM themes? (y/n)
install_sddm_theme="Y"
### " This script will add your user to the 'input' group."
### " Please note that adding yourself to the 'input' group might be necessary for waybar keyboard-state functionality."
input_group_choid="Y"
### OPTIONAL - Do you want to add Pokemon color scripts? (y/n): 
pokemon_choice="Y"
### Do you want to upgrade to the latest version? (y/n) - This is for the dotfiles
upgrade_choice="Y"
```


## super + h 快速查阅keybinding

## 多显示器

直接安装好之后并不支持多显示器，随便找一个`terminal`执行下面命令(也可以super + enter唤起`kitty terminal`)。

```bash
hyprctl monitors | grep "Monitor"
# hyprctl monitors 会显示全部信息
```

这会显示你有哪些显示器可以使用，`Monitor`后面跟着的就是显示器的名字。
然后使用你喜欢的编辑器，这里我使用`neovim`，打开`${HOME}/.config/hypr/UserConfigs/Monitors.conf`，
也可以使用super + e 选择`edit Monitors`快速打开，默认会使用`nano`。

参考[wiki hyprland Monitors](https://wiki.hyprland.org/Configuring/Monitors/)我的配置如下，其中`eDP-1`是笔记本内置屏幕，`HDMI-A-1`是外接屏。
这里的参数是 `Monitor name, resolution, position, scale`，我的显示器是支持2k 144hz ，且在笔记本左边，所以
第三个参数设置为`0x0`。

```yaml
monitor = eDP-1, preferred, auto, 1
monitor = HDMI-A-1, 2560x1440@144, 0x0, 1 #own screen
```

## 更换编辑器

由于super + e 可以快速编辑各种配置，但是默认的又是`nano`，作为一个半天不知道`nano`怎么退出的人，十分痛苦🥺，遂更改为`nvim`。
打开`${HOME}/.config/hypr/UserScripts/QuickEdit.sh`，将第五行`editor`后面的`nano`改成想用的编辑器即可。
之后super + e 打开任何配置都会使用修改后的编辑器。

## 添加自启动项

直接super + e 选择`edit Startup_Apps`。这里我需要使用`fcitx5`和`clash-verge`，所以添加了两条

```yaml
exec-once = fcitx5 --replace -d
exec-once = clash-verge
```

## 更改应用打开效果
这个在`${HOME}/.config/hypr/UserConfigs/UserSettings.conf`里，建议自行查阅官方文档进行修改。
这里我只更改了`decoration`中的`rounding` `inactive_opacity`。

```yaml
rounding = 15
active_opacity = 1.0
inactive_opacity = 1.0
```

## 更改壁纸
所有壁纸都默认放在`${HOME}/Pictures/wallpapers`里，我们需要用的壁纸放进去就行。使用super + w 可以快速更换壁纸。

## 其他

+ 在展示系统信息时使用了`fastfetch`和`kitty terminal`，`kitty`本身支持图片展示，所以直接更改`fastfetch`的`logo source`为某图片路径。
+ 系统检测包括`htop++`和`btop`，不过个人更喜欢`btop`，好看而且也很全面。
+ 音频响应使用`cava`，并没有做其他更改。
