---
title: 关于博客最近的改动和变化(2025-07-31)
published: 2025-07-31T22:09:45Z
description: '记录一下最近的博客改动, 也许这次的commit会更清楚(?)'
tags: [Blog]
category: 'Blog'
expired: true
---

最近把博客迁移到了 [Astro](https://astro.build/) & [Fuwari](https://github.com/saicaca/fuwari), 并新加了一些内容. 然而所有代码都是 Claude Sonnet 4 写的 😂. 后续可能会加一下 giscus.

<!--more-->


## 配置文件

一开始发现配置文件是 `ts`, 虽然基本没差, 但是个人还是更想用 `toml`, 所以新加了 `/src/utils/build-config.mjs` 来根据 `/config.toml` 生成 `ts` 配置, 然后其他文件用生成的 `Record`.

## 友链

原主题模版是不带友链功能的, 于是增加了一个友链 Nav 和 Side Bar. 可以看 `src/components/widget/FriendLinks.astro` 和 `src/pages/friends.astro`.

## Post Meta

### expired

新加了 `expired: boolean` 选项, 方便用于以后设置一下部分文章是否可能过时, 主要给读者一个 warning. 这篇 blog 设置了 `expired: true`, 因此顶部会有一个提示.

### published

稍微修改了一下 `/scripts/new-post.mjs` 让其按照 `${year}-${month}-${day}T${hour}:${minutes}:${seconds}Z` 的格式输出.

```js ins={11} del={10}
function getDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  const hours = String(today.getHours()).padStart(2, "0")
  const minutes = String(today.getMinutes()).padStart(2, "0")
  const seconds = String(today.getSeconds()).padStart(2, "0")

  return `${year}-${month}-${day}`
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`
}
```

## Page

### 背景

把背景加了一个 "深->浅->深" 的渐变.

```css {12-30} showLineNumbers=false
/* main.css */
html {
    background: var(--page-bg);
    position: relative;
}

body {
    background: transparent;
    min-height: 100vh;
    position: relative;
}

body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: -1;
    background: 
        linear-gradient(
            45deg,
            var(--page-bg) 0%,
            color-mix(in oklch, var(--page-bg), oklch(0.98 0.005 var(--hue)) 70%) 25%,
            color-mix(in oklch, var(--page-bg), oklch(0.96 0.01 var(--hue)) 50%) 10%,
            color-mix(in oklch, var(--page-bg), oklch(0.97 0.008 var(--hue)) 30%) 35%,
            var(--page-bg) 100%
        );
    pointer-events: none;
}
```

### 光标

添加了一个简单的光标尾迹. 也在 `main.css` 中.

```css ".cursor-trail" title="main.css" collapse={4-46}
/* Cursor Trail Animation */
.cursor-trail {
    position: fixed;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: radial-gradient(
        circle,
        color-mix(in oklch, var(--cursor-trail-bg), transparent 20%) 0%,
        color-mix(in oklch, var(--cursor-trail-secondary), transparent 60%) 50%,
        transparent 100%
    );
    pointer-events: none;
    z-index: 9999;
    transform: translate(-50%, -50%);
    animation: trail-fade 0.8s ease-out forwards;
    mix-blend-mode: multiply;
}

html.dark .cursor-trail {
    background: radial-gradient(
        circle,
        color-mix(in oklch, white, oklch(0.8 0.15 var(--hue)) 30%) 0%,
        color-mix(in oklch, white, oklch(0.7 0.12 var(--hue)) 50%) 50%,
        transparent 100%
    ) !important;
    mix-blend-mode: normal !important;
}

@keyframes trail-fade {
    0% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
    100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.3);
    }
}

/* Enhanced cursor for interactive elements */
a, button, [role="button"], input, textarea, select {
    cursor: pointer;
}

a:hover .cursor-trail,
button:hover .cursor-trail,
[role="button"]:hover .cursor-trail {
    animation-duration: 1.2s;
    background: radial-gradient(
        circle,
        hsl(var(--hue) 90% 60% / 0.9) 0%,
        hsl(var(--hue) 70% 50% / 0.5) 50%,
        transparent 100%
    );
}
```

### Toc

原本的 toc 会因为滚动屏幕而离开屏幕外, toc 被 fix 到了固定位置没有跟随内容滚动. 这里需要调整 `/src/layout/MainGridLayout.astro`. 主要是让 toc 在 page 中会一直在屏幕中可以被看见.

```html {3, 8-14} ins="relative" ins="sticky" showLineNumbers=false title="MainGridLayout.astro"
<!-- The things that should be under the banner, only the TOC for now -->
<div class="fixed top-0 right-3.5 w-[var(--toc-width)] h-screen z-0 hidden 2xl:block pointer-events-none">
    <div class="relative h-full pointer-events-auto" style="transform: translateX(0);">
        <!-- TOC component -->
        {siteConfig.toc.enable && <div id="toc-wrapper" class:list={["transition w-full h-full flex items-start justify-end",
            {"toc-hide": siteConfig.banner.enable}]}
        >
            <div id="toc-inner-wrapper" class="sticky top-20 w-[var(--toc-width)] h-[calc(100vh_-_6rem)] overflow-y-scroll overflow-x-hidden hide-scrollbar">
                <div id="toc" class="w-full h-full transition-swup-fade ">
                    <div class="h-8 w-full"></div>
                    <TOC headings={headings}></TOC>
                    <div class="h-8 w-full"></div>
                </div>
            </div>
        </div>}

        <!-- #toc needs to exist for Swup to work normally -->
        {!siteConfig.toc.enable && <div id="toc"></div>}
    </div>
</div>
```

## Math

原来的 Math 用的 Katex 进行渲染, 效果挺好的, 但是个人换成了 Typst, 主要是 https://hanwen.io/en/posts/use_typst_for_math_in_blog/ 这篇博客帮助很大.

### 依赖

只需要安装一下 `@myriaddreamin/rehype-typst`. `remark-math` 是已经安装过了的.

```bash frame="terminal" showLineNumbers=false
pnpm add @myriaddreamin/rehype-typst remark-math
```

### 修改 Astro 配置项

```js ins={1,17} del={2,16} collapse={8-13, 18-54} title="astro.config.mjs"
import rehypeTypst from "@myriaddreamin/rehype-typst";
import rehypeKatex from "rehype-katex";

export default defineConfig({
	markdown: {
		remarkPlugins: [
			remarkMath,
			remarkReadingTime,
			remarkExcerpt,
			remarkGithubAdmonitionsToDirectives,
			remarkDirective,
			remarkSectionize,
			parseDirectiveNode,
		],
		rehypePlugins: [
			rehypeKatex,
			rehypeTypst,
			rehypeSlug,
			[
				rehypeComponents,
				{
					components: {
						github: GithubCardComponent,
						note: (x, y) => AdmonitionComponent(x, y, "note"),
						tip: (x, y) => AdmonitionComponent(x, y, "tip"),
						important: (x, y) => AdmonitionComponent(x, y, "important"),
						caution: (x, y) => AdmonitionComponent(x, y, "caution"),
						warning: (x, y) => AdmonitionComponent(x, y, "warning"),
					},
				},
			],
			[
				rehypeAutolinkHeadings,
				{
					behavior: "append",
					properties: {
						className: ["anchor"],
					},
					content: {
						type: "element",
						tagName: "span",
						properties: {
							className: ["anchor-icon"],
							"data-pagefind-ignore": true,
						},
						children: [
							{
								type: "text",
								value: "#",
							},
						],
					},
				},
			],
		],
	},
});
```

### 配置 svg.typst-doc

由于公式被渲染成 `svg` 插入文章, 先解决一下主题适配明暗主题, 这里 `color` 值使用 `currentColor` 就行.

之后需要考虑一下行内公式, 因为 `svg` 插入, 可能造成大于 `<p>` 等行内元素的现象, 实际上调整为 `display: inline` 就足够了, 但是还需要根据页面调整一些行内大小 padding 等, 至少看起来居中且不会过小.

```css ins={2-42} del={44-48} title="markdown.css" "color: currentColor !important;" "vertical-align: -0.575em !important;" "display: inline !important;"
.custom-md {
    svg.typst-doc {
        @apply transition;
        /* Force all elements inside to use current color */
        color: currentColor !important;
        /* Default alignment for block formulas */
        vertical-align: middle !important;
    }
    
    /* Inline formulas - align with prose text baseline */
    p svg.typst-doc,
    span svg.typst-doc,
    li svg.typst-doc {
        /* Fine-tuned alignment for prose-base typography (16px font, 1.75 line-height) */
        vertical-align: -0.575em !important; /* Slight downward adjustment for mathematical symbols */
        /* Slightly larger than text for better readability */
        font-size: 1.2em !important;
        /* Ensure it stays inline */
        display: inline !important;
        margin-left: 0.1em !important; /* Small left margin for spacing */
        margin-right: 0.1em !important; /* Small right margin for spacing */
        margin-bottom: 0em !important;
    }
    
    /* Typst SVG complete color override - target everything */
    svg.typst-doc,
    svg.typst-doc *,
    svg.typst-doc .typst-text,
    svg.typst-doc g,
    svg.typst-doc path,
    svg.typst-doc use,
    svg.typst-doc text,
    svg.typst-doc tspan,
    svg.typst-doc .outline_glyph {
        fill: currentColor !important;
        stroke: currentColor !important;
        --glyph_fill: currentColor !important;
        --glyph_stroke: currentColor !important;
        transition: fill 0.3s ease, stroke 0.3s ease !important;
        margin-bottom: 0.75em !important;
        font-size: 1.25em;
    }

    .katex-display-container {
        max-width: 100%;
        overflow-x: auto;
        margin: 1em 0;
    }
}
```
