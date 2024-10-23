# Hello !😊

+ This is my blog repository.

+ My blog is powered by `Hugo && Hugo-Next.Gemini`, you can reach `Hugo-Next` theme at [Hugo-Next](https://github.com/hugo-next/hugo-theme-next)

## Welcome to Add your site !

Welcome to All friends who want to add their site to my blogroll! Just send me a message like this:

```yml
- name: your name
  desc: your slogan
  avatar: your avatar link (or just the file)
  link: your site url
```

## What I did

+ [ ] refer to [如何将嘉然live2D添加到博客网站当看板娘](https://www.moeshou.com/310/) and config file [jsdeliver/gh/journey-ad/blog-img](https://www.jsdelivr.com/package/gh/journey-ad/blog-img?tab=files)
  + I add a live2d Diana in `/layouts/post/footer.html` 

+ [ ] 嘉然Diana moc3模型来源于 https://www.bilibili.com/video/BV1FZ4y1F7HH

+ [ ] 向晚Ava moc3模型来源于 https://www.bilibili.com/video/BV1uB4y1w7rH

+ [ ] refer to [Hugo | 记录MemE主题美化过程](https://blog.tantalum.life/posts/meme-theme-modify/)
  + Add a feature to import Bilibili video with `{{< bilibili BVxxxxx>}}` in .md file
  + Add a mouse click firework in `/layouts/partials/custom/script.html`

+ [ ] I add a net animation in `/assets/js/net-animation.js` and immediately called in `/layouts/_default/baseof.html`, also adjust the animation color according to the theme in `/assets/js/utils.js: registerToolButtons`