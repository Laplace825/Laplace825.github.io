---
title: "Python项目使用pyproject安装pytorch"
description: "using pyproject to install pytorch"
author: "Laplace"
date: 2024-10-22T09:31:16+08:00
tags:
  - Python
  - Tools
categories:
  - Python
  - Tools
---

In this post, I will show you how to use `pyproject` to install `pytorch` with specific `cuda` version using `poetry` and `pipx`.

<!--more-->

## What we will use

+ [Poetry](https://python-poetry.org/)
+ [pipx](https://pipxproject.github.io/pipx/)
+ [PyTorch](https://pytorch.org/)

Actually, ***please ensure you have a python environment and pip installed.***

## install pipx

I use `pip` to install `pipx` in a system-wide python environment
because `pipx` will automatically install the python packages separately.

Actually, if you don't want `pipx`, you can use `pip` to install `poetry` directly.

```bash
❯ pip install pipx
```

## install poetry

`Poetry` is a tool for dependency management and packaging in Python.

It allows you to declare the libraries your project depends on and it will manage (install/update) them for you.

Different from `pip`, it will create a virtual environment for you and install the packages in the virtual environment.

```bash
❯ pipx install poetry
```

Now you can use `pipx list` to check if `poetry` is installed.

```bash
❯ pipx list
# output like this
venvs are in /home/lap/.local/share/pipx/venvs
apps are exposed on your $PATH at /home/lap/.local/bin
manual pages are exposed at /home/lap/.local/share/man
   package poetry 1.8.4, installed using Python 3.12.7
    - poetry
```

## Install pytorch with poetry

Because the `pytorch` just supplies with `cuda` `pip`, but we want to install the `pytorch` with specific `cuda` version and  using `poetry`.

using poetry the add a source to the pytorch wheel files with specific cuda version.

```bash
❯ poetry source add --priority=supplemental pytorch_cu124 https://download.pytorch.org/whl/cu124
```

Then add the pytorch package with the following command.

This is a large package so it will take some time to install.
(Actually maybe 3.5GB because I using mobile data network to download accidentally 😵)

```bash
❯ poetry add --source pytorch_cu124 torch torchvision torchaudio
```

## try it

```bash
# activate the poetry environment
❯ poetry shell

# try it  
❯ python -c "import torch; print(torch.__version__)"
# output like this
2.5.0+cu124
```
