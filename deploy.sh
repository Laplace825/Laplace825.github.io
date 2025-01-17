#!/usr/bin/env bash

# ---------------------------------------------------------------#
# 
# This script is used to deploy the site to the main branch.
#
## Will update from remote main branch and then push
# 
# ---------------------------------------------------------------#


LANG=en_US.UTF-8

gitupdate() {
  git stash
  git pull -r
  git stash apply
  git submodule update --remote --recursive
}

gitcommit() {
  git add .
  git commit -m "$1 rebuilding site $(date)"
  git push
}

gitupdate

hugo --cleanDestinationDir -F -D -E

gitcommit "$1"
