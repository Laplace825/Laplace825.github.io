---
title: 关于博客最近的改动和变化(2024-10-23)
published: 2024-10-23
description: 这篇博客主要记录了博客最近的一些改动和变化。包括最近的网站统计，以及一些额外添加的功能。查看commit记录也ok，不过个人博客推的挺随意的，commit确实有点抽象。而且有很多只是多一行空行或少一行的也给我传上去了🤓。

tags: [Blog]
category: Blog
draft: false
---

这篇博客主要记录了博客最近的一些改动和变化。包括最近的网站统计，以及一些额外添加的功能。
查看commit记录也ok，不过个人博客推的挺随意的，commit确实有点抽象。而且有很多只是多一行空行或少一行的也给我传上去了🤓。

<!--more-->

## 关于网站统计

之前一直使用的是`51la`提供的网站统计服务。但是由于`51la`经常被ddos，导致网站统计信息老是显示不出来，而且
我也经常上不去他们官网。所以换成了`busuanzi`(由于上不去`51la`，导致之前的数据也拿不到了)。

### busuanzi

[busuanzi](https://busuanzi.apifox.cn/) 提供了免费且易于使用的网站统计服务。使用到 API `https://busuanzi.9420.ltd/js ` 。

之后可能需要查找一下`id`，删去了原来的`busuanzi_value_site_pv`和`busuanzi_value_site_uv`等的`value`。

### 主要修改文件


- `data/resources.yaml`
- `layouts/partials/sidebar/siteinfo.html`
- `layouts/partials/post/header_meta/views.html`
- `layouts/partials/post/header_meta/visitors.html`
- `assets/js/utils.js`

## 关于额外功能

### Asoul 小人

这边可以参考github博客仓库`README.md`。我fork了[stevenjoezhang/live2d-widget](https://github.com/stevenjoezhang/live2d-widget)的仓库，并增加了models。

+ [ ] [如何将嘉然live2D添加到博客网站当看板娘](https://www.moeshou.com/310/) 
  + 添加了嘉然Diana的live2d模型，在`layouts/post/footer.html`中。
+ [ ] 嘉然Diana moc3模型来源于[https://www.bilibili.com/video/BV1FZ4y1F7HH](https://www.bilibili.com/video/BV1FZ4y1F7HH)
+ [ ] 向晚Ava moc3模型来源于[https://www.bilibili.com/video/BV1uB4y1w7H](https://www.bilibili.com/video/BV1uB4y1w7H)
+ [ ] models:
  + [https://github.com/xiaoski/live2d_models_collection](https://github.com/xiaoski/live2d_models_collection)
  + [https://www.jsdelivr.com/package/gh/journey-ad/blog-img?tab=files&path=live2d](https://www.jsdelivr.com/package/gh/journey-ad/blog-img?tab=files&path=live2d)

### 导入B站视频

参考博客来源 [Zoe's Dumpster 记录MemE主题美化过程](https://blog.tantalum.life/posts/meme-theme-modify/)。
我直接在`layouts/shortcodes/bilibili.html`中添加了`\{\{< bilibili BVxxxxx>}}`的shortcode。
在博客中通过`\{\{< bilibili BVxxxxx>}}`(不需要加'\\',这里是为了防止插入视频)就可以插入B站视频了。

```html
{{ $videoID := index .Params 0 }}
{{ $pageNum := index .Params 1 | default 1}}

{{ if (findRE "^[bB][vV][0-9a-zA-Z]+$" $videoID) }}
<div><iframe id="biliplayer" src="//player.bilibili.com/player.html?bvid={{ $videoID }}&page={{ $pageNum }}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" loading="lazy" > </iframe></div>
{{ else }}
<div><iframe id="biliplayer" src="//player.bilibili.com/player.html?aid={{ $videoID }}&page={{ $pageNum }}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" loading="lazy" > </iframe></div>
{{ end }}

<style>
// 嵌入 BiliBili 视频
#biliplayer {
  width: 100%;
  height: 550px;
}
@media only screen and (min-device-width: 320px) and (max-device-width: 480px) {
  #biliplayer {
    width: 100%;
    height: 250px;
  }
}
</style>
```

### 鼠标点击特效

这里是网上找的鼠标点击特效，添加到了`layouts/partials/scripts.html`中。

```html
<script>
(function () {
  let balls = [];
  let longPressed = false;
  let longPress;
  let multiplier = 0;
  let width, height;
  let origin;
  let normal;
  let ctx;
  const colours = ["#F73859", "#14FFEC", "#00E0FF", "#FF99FE", "#FAF15D"];
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  canvas.setAttribute("style", "width: 60%; height: 60%; top: 0; left: 0; z-index: 99999; position: fixed; pointer-events: none;");
  const pointer = document.createElement("span");
  pointer.classList.add("pointer");
  document.body.appendChild(pointer);
 
  if (canvas.getContext && window.addEventListener) {
    ctx = canvas.getContext("2d");
    updateSize();
    window.addEventListener('resize', updateSize, false);
    loop();
    window.addEventListener("mousedown", function(e) {
      pushBalls(randBetween(10, 20), e.clientX, e.clientY);
      document.body.classList.add("is-pressed");
      longPress = setTimeout(function(){
        document.body.classList.add("is-longpress");
        longPressed = true;
      }, 500);
    }, false);
    window.addEventListener("mouseup", function(e) {
      clearInterval(longPress);
      if (longPressed == true) {
        document.body.classList.remove("is-longpress");
        pushBalls(randBetween(50 + Math.ceil(multiplier), 100 + Math.ceil(multiplier)), e.clientX, e.clientY);
        longPressed = false;
      }
      document.body.classList.remove("is-pressed");
    }, false);
    window.addEventListener("mousemove", function(e) {
      let x = e.clientX;
      let y = e.clientY;
      pointer.style.top = y + "px";
      pointer.style.left = x + "px";
    }, false);
  } else {
    console.log("canvas or addEventListener is unsupported!");
  }
 
 
  function updateSize() {
    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(2, 2);
    width = (canvas.width = window.innerWidth);
    height = (canvas.height = window.innerHeight);
    origin = {
      x: width / 2,
      y: height / 2
    };
    normal = {
      x: width / 2,
      y: height / 2
    };
  }
  class Ball {
    constructor(x = origin.x, y = origin.y) {
      this.x = x;
      this.y = y;
      this.angle = Math.PI * 2 * Math.random();
      if (longPressed == true) {
        this.multiplier = randBetween(14 + multiplier, 15 + multiplier);
      } else {
        this.multiplier = randBetween(6, 12);
      }
      this.vx = (this.multiplier + Math.random() * 0.5) * Math.cos(this.angle);
      this.vy = (this.multiplier + Math.random() * 0.5) * Math.sin(this.angle);
      this.r = randBetween(8, 12) + 3 * Math.random();
      this.color = colours[Math.floor(Math.random() * colours.length)];
    }
    update() {
      this.x += this.vx - normal.x;
      this.y += this.vy - normal.y;
      normal.x = -2 / window.innerWidth * Math.sin(this.angle);
      normal.y = -2 / window.innerHeight * Math.cos(this.angle);
      this.r -= 0.3;
      this.vx *= 0.9;
      this.vy *= 0.9;
    }
  }
 
  function pushBalls(count = 1, x = origin.x, y = origin.y) {
    for (let i = 0; i < count; i++) {
      balls.push(new Ball(x, y));
    }
  }
 
  function randBetween(min, max) {
    return Math.floor(Math.random() * max) + min;
  }
 
  function loop() {
    ctx.fillStyle = "rgba(255, 255, 255, 0)";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < balls.length; i++) {
      let b = balls[i];
      if (b.r < 0) continue;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2, false);
      ctx.fill();
      b.update();
    }
    if (longPressed == true) {
      multiplier += 0.2;
    } else if (!longPressed && multiplier >= 0) {
      multiplier -= 0.4;
    }
    removeBall();
    requestAnimationFrame(loop);
  }
 
  function removeBall() {
    for (let i = 0; i < balls.length; i++) {
      let b = balls[i];
      if (b.x + b.r < 0 || b.x - b.r > width || b.y + b.r < 0 || b.y - b.r > height || b.r < 0) {
        balls.splice(i, 1);
      }
    }
  }
})();

</script>
```

### 网页蛛网效果

也是网上找的，不过找到的貌似都是被混淆过的。虽然还是能看懂部分地方 maybe。

添加`assets/js/net-animation.js`，这里把`id`固定为`c_n75`。便于之后设置暗亮色主题切换。最后的`window.runNetAnimation`函数可以传入颜色参数(rgb形式`"255,255,255"`，`"0,0,0"`等)，来切换颜色。
当然，为了能切换主题色，额外在上面添加了移除原来可能已经存在的`canvas`代码。

```js
const runNetAnimation = function (the_color) {
    if (document.getElementById("c_n75") !== null) {
        document.getElementById("c_n75").remove();
    }

    function n(n, e, t) {
        return n.getAttribute(e) || t;
    }

    function t() {
        var t = document.getElementsByTagName("script"),
            o = t.length,
            i = t[o - 1];

        return {
            l: o,
            z: n(i, "zIndex", 2),
            o: n(i, "opacity", 0.5),
            c: n(i, "color", the_color),
            n: n(i, "count", 120),
        };
    }

    function o() {
        (a = m.width =
            window.innerWidth ||
            document.documentElement.clientWidth ||
            document.body.clientWidth),
            (c = m.height =
                window.innerHeight ||
                document.documentElement.clientHeight ||
                document.body.clientHeight);
    }

    function i() {
        r.clearRect(0, 0, a, c);
        var n, e, t, o, m, l;
        s.forEach(function (i, x) {
            for (i.x += i.xa, i.y += i.ya, i.xa *= i.x > a || i.x < 0 ? -1 : 1, i.ya *= i.y > c || i.y < 0 ? -1 : 1, r.fillRect(i.x - .5, i.y - .5, 1, 1), e = x + 1; e < u.length; e++) n = u[e], null !== n.x && null !== n.y && (o = i.x - n.x, m = i.y - n.y, l = o * o + m * m, l < n.max && (n === y && l >= n.max / 2 && (i.x -= .03 * o, i.y -= .03 * m), t = (n.max - l) / n.max, r.beginPath(), r.lineWidth = t / 2, r.strokeStyle = "rgba(" + d.c + "," + (t + .2) + ")", r.moveTo(i.x, i.y), r.lineTo(n.x, n.y), r.stroke()))
        }), x(i)
    }

    var a,
        c,
        u,
        m = document.createElement("canvas"),
        d = t(),
        l = "c_n75",
        r = m.getContext("2d"),
        x =
            window.requestAnimationFrame ||
            function (n) {
                window.setTimeout(n, 1e3 / 45);
            },
        w = Math.random,
        y = { x: null, y: null, max: 2e4 };
    (m.id = l),
        (m.style.cssText =
            "position:fixed;top:0;left:0;z-index:" + d.z + ";opacity:" + d.o + ";pointer-events:none"),
        document.getElementsByTagName("body")[0].appendChild(m),
        o(),
        (window.onresize = o),
        (window.onmousemove = function (n) {
            (n = n || window.event), (y.x = n.clientX), (y.y = n.clientY);
        }),
        (window.onmouseout = function () {
            (y.x = null), (y.y = null);
        });
    for (var s = [], f = 0; d.n > f; f++) {
        var h = w() * a,
            g = w() * c,
            v = 2 * w() - 1,
            p = 2 * w() - 1;
        s.push({ x: h, y: g, xa: v, ya: p, max: 6e3 });
    }
    (u = s.concat([y])),
        setTimeout(function () {
            i();
        }, 100);
};

window.runNetAnimation = runNetAnimation;
```

在`layouts/_default/baseof.html`中添加启动脚本，让网页加载时自动启动蛛网效果，同时根据主题颜色切换蛛网颜色。

```html
<script>
  document.documentElement.getAttribute('data-theme') === 'dark' ?
    runNetAnimation("255,255,255") :
    runNetAnimation("0,0,0"); 
</script>
```

在`assets/js/utils.js`中`registerToolButtons`函数为按钮添加自动改变蛛网颜色的功能。

```js
// in assets/js/utils.js: registerToolButtons: line 58
buttons.querySelector('div#toggle-theme').addEventListener('click', () => {
      const cur_theme = document.documentElement.getAttribute('data-theme');
      window.theme.toggle(cur_theme === 'dark' ? 'light' : 'dark');
      window.runNetAnimation(cur_theme === 'dark' ? "0,0,0" : "255,255,255");
    });
```

## 其他改动

### 字体

在`assets/css/_variables/base.scss`中添加了`custom-fonts-for-all`变量，来设置所有字体，以及修改`get-font-family`函数来使用这个变量。为了方便，这里把`font-family-base`设置为`$font-family-english, $font-family-chinese`。
本来是打算直接用`font-family-base`，但是老是出现字体不对的情况😿。

```scss
$font-family-chinese      : 'PingFang SC', 'Microsoft YaHei';
$font-family-english      : -apple-system, BlinkMacSystemFont, Lora;
$font-family-base         :  $font-family-english, $font-family-chinese;

$custom-fonts-for-all: (
  'title':  'Lora, "PingFang SC"',
  'headings': 'Lora, "PingFang SC"',
  'posts': '"PingFang SC"',
  'codes': 'jetbrains mono'
);

@function get-font-family($config) {
  $custom-family: map-get($custom-fonts-for-all, $config);
  @return if(type-of($custom-family) == string, unquote($custom-family), null);
}
```

### 颜色

调整了部分颜色，主要是`$text-color-dark`和`$text-color`。(因为之前的颜色太浅，容易看不清楚)。
这也是在`assets/css/_variables/base.scss`中修改。

```scss
$text-color                   : #12183A;
$text-color-dark              : #ffffff;
```