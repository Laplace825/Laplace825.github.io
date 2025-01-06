---
title: "新增音乐播放和视频插入"
description: "add music play and video insert in post"

date: 2025-01-06

categories:
  - Blog
tags:
  - Blog
toc: true
music: true
---

`Hugo-Next` 近日添加了对音乐和视频播放的支持。

<!--more-->

## Bilibili 视频

```markdown
{{</* bilibili BV1Sx411T7QQ */>}}
```
{{< bilibili id=BV1Sx411T7QQ >}}

## 音乐播放器

基于[APlayer](https://github.com/DIYgod/APlayer)和[MetingJS](https://github.com/metowolf/MetingJS)库实现见面内嵌的响应式音乐播放器，自动识别的音乐平台URL，包括：`netease`、 `tencent`、 `kugou`、 `baidu` 和 `xiami` 平台，也可以支持用户自定义的音乐源。其他相关的参数说明如下：

根据网易云的分享链接可以直接知道某个playlist类型的id。 https://music.163.com/playlist?id=2105429598

| 参数名  | 默认   | 说明  |
| :----: | :------: | :--- |
| **id** | _必选_  | 音乐 ID，即音乐在音乐平台的唯一标识符 |
| **server** | _必选_  | 音乐平台，支持 `netease`、 `tencent`、 `kugou`、 `baidu` 和 `xiami` 平台 |
| **type** | _必选_  | 播放类型，目前支持 `song` 、 `playlist`、 `album`、 `search` 和 `artist` 类型 |
| **auto** | _可选_  | 音乐的地址，仅支持 server 参数中的平台 |
| **theme** | `#448aff`  | 播放器的主题色，默认为 `#448aff` |
| **url** | 空  | 自定的音乐源 URL，默认为空 |
| **name** | 空 | 音乐名称，默认为空 |
| **artist** | 空  | 音乐作者，默认为空 |
| **cover** | 空  | 音乐封面 URL，默认为空 |
| **fixed** | `false` | 固定播放器，默认为 `false` |
| **mini** | `false`  | 显示小播放器，默认为 `false` |
| **autoplay** | `false`  | 自动播放，默认为 `false` |
| **loop** | `all`  | 循环播放，支持`all`、`one` 和 `none`，默认为 `all` |
| **order** | `list`  | 播放顺序`list` 和 `random`，支持默认为 `list` |
| **volume** | `0.7`  | 音量，默认为 `0.7` |
| **mutex** | `true` | 有多个音乐播放时，是否只开启当前播放器，默认为 `true` |
| **list-folded** | `false`  | 列表折叠，默认为 `false` |
| **list-max-height** | `340px`  | 列表最大高度，默认为：340px |

### 单曲播放 

貌似`autoplay`并未生效。

```markdown
{{</* music server="netease" type="song" id="2097486090" mini="true" autoplay="true" */>}}
```

{{< music server="netease" type="song" id="2097486090" mini="true" autoplay="true" >}}

### 列表播放

```markdown
{{</* music server="netease" type="album" id="246241907" list-max-height="140" */>}}
```

{{< music server="netease" type="album" id="246241907" list-max-height="140px" >}}

### 自定义音乐源

ps. 这个暂时不知道怎么用，先占个坑

```markdown
{{</* music url="https://ri-sycdn.kuwo.cn/ea345253b94e7ad564e6fb0cdf37fee6/677b6574/resource/n1/87/56/4272600974.mp3" name="天空之城" artist="宫崎骏" cover="http://img4.kuwo.cn/star/starheads/500/27/66/2532818318.jpg" */>}}
```
