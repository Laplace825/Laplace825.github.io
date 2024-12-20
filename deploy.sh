#!/bin/bash
LANG=en_US.UTF-8
# 用于部署博客的脚本
hugo --cleanDestinationDir -F -D -E
# 文件夹的内容推送到远程仓库
git add .
git commit -m "rebuilding site $(date)"
git submodule update --remote --recursive
# 拉取远程仓库的更新
git pull -r
git push 
