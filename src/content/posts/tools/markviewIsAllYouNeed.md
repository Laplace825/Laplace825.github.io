---
title: NeoVim 下 Markdown 实时预览神器 Markview is All You Need!
published: 2024-09-01
description: Markview is All You Need!
tags: [Tools]
category: Tools
draft: true
image: ./markview.png
---

一直没找到在neovim下能和typora,obsidian一样的实时预览markdown的插件，直到找到了`markview.nvim`。
这个插件可以在neovim里实时预览markdown文件，而不需要本地启动浏览器渲染。

我使用的是 `onedark` 主题[navarasu/onedark.nvim](https://github.com/navarasu/onedark.nvim)，其他效果完全默认：

## Markview

### 安装
Markview的github链接[OXY2DEV/markview.nvim](https://github.com/OXY2DEV/markview.nvim)。
按照官方的教程进行安装即可。还需要使用`TSInstall`安装`html`的语法高亮插件。需要确保安装了`nvim-treesitter`插件。
不过插件的`dependencies`里面已经包含了`nvim-treesitter`，所以不需要额外安装。

```
:TSInstall html
```


### 使用 Hybrid Mode

确保已经安装好插件后，在你的配置文件中添加以下内容，这样当`normal`模式下光标所在行就会回到源码模式，而其他行保持
渲染显示。

```lua
require("markview").setup({
    modes = { "n", "no", "c" }, -- Change these modes
                                -- to what you need
    hybrid_modes = { "n" },     -- Uses this feature on
                                -- normal mode
    -- This is nice to have
    callbacks = {
        on_enable = function (_, win)
            vim.wo[win].conceallevel = 2;
            vim.wo[win].concealcursor = "c";
        end
    }
})
```

### 配置 

由于我本人已经很喜欢默认效果了，如需特别配置，推荐参考官方`wiki`
[OXY2DEV/markview.nvim/wiki](https://github.com/OXY2DEV/markview.nvim/wiki)。
