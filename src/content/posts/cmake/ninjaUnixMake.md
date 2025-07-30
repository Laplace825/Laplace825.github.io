---
title: Ninja 与 Unix Make 在使用 CMake 时的区别
published: 2024-10-13
description: 简单讨论讨论关于 `build.ninja` 与 `Makefile` 在使用 `cmake` 时的生成区别。
tags: [Tools]
category: Tools
draft: false
---

简单讨论讨论关于 `build.ninja` 与 `Makefile` 在使用 `cmake` 时的生成区别。


<!--more-->


## 简单build

`build` 语句之后接的是类似于 `Makefile` 中的`target`

ninja

```
build CMakeFiles/test.dir/test.cc.o
  FLAGS = (some compile flags)
```

Makefile

```makefile
CMakeFiles/test.dir/test.cc.o: 
    @CXX ... (some compile flags) 

```

在 `build.ninja` 中可以看见有一个 `build test`，那么应该是有一个 `target` 是`test`

`ninja`可以定义一个`target`的构建规则，这里是 `CXX_EXECUTABLE_LINKER__test_Debug`，表示如何将目标文件链接成一个可执行文件，这语句在 `build.ninja` 同目录的 `CMakeFiles/rules.ninja` 中可以找到

下面是 `build.ninja`
```bash
build test: CXX_EXECUTABLE_LINKER__test_Debug CMakeFiles/test.dir/test.cc.o
  FLAGS = -g
  OBJECT_DIR = CMakeFiles/test.dir
  POST_BUILD = :
  PRE_LINK = :
  TARGET_FILE = test
  TARGET_PDB = test.dbg

build all: phony test
```

这里是`CMakeFiles/rules.ninja`

```bash
rule CXX_EXECUTABLE_LINKER__test_Debug
  command = $PRE_LINK && /usr/bin/g++ $FLAGS $LINK_FLAGS $in -o $TARGET_FILE $LINK_PATH $LINK_LIBRARIES && $POST_BUILD
  description = Linking CXX executable $TARGET_FILE
  restat = $RESTAT
```

可以发现这里有一个 `command`, 然后里面是一个 `$FLAGS`, 而这个 `FLAGS` 在`build.ninja` 中被赋值了 `FLAGS = -g`，而 `LINK_FLAGS` 并没有被赋值。
 `test` 由后面的`CMakeFiles/test.dir/test.cc.o`文件进行构建，在`rules.ninja` 中的 `$in` 就是输入 `test.cc.o` 文件。

推测是因为我这里根目录的`cmake`只指定了编译`flag`为`-g`，并没有其他链接文件。


这里是根目录的`cmake`

```cmake
cmake_minimum_required(VERSION 3.20)

set(CMAKE_CXX_COMPILER "g++")
project(TEST)
add_executable(test test.cc)

target_compile_options(test PRIVATE "-g")
```

## build 且 link 一个自己的静态库

静态库`lib.cc` 和头文件`lib.h`, 下面是 `lib.cc` 的内容。头文件只提供声明。

```cpp
#include <iostream>

void printHello() { std::cout << "Hello, World!" << std::endl; }
```

然后我们的`test.cc` 加一条 `#include "lib.h"` 和 `printHello()`, 后者在 main 函数中调用。
之后将`CMakeLists.txt`加上链接。

下面是 `CMakeLists`

```cmake
cmake_minimum_required(VERSION 3.20)

set(CMAKE_CXX_COMPILER "g++")
project(TEST)
add_executable(test test.cc)

add_library(test_lib lib.cc)

target_compile_options(test PRIVATE "-g")
target_link_libraries(test PRIVATE test_lib)
```

然后我们重新用`ninja`一下。

```bash
# in build folder
$ cmake .. -G Ninja
$ ninja clean
$ ninja -v
```

之后再看看 `build.ninja` 和 `CMakeFiles/rules.ninja`。我们会发现`build.ninja`确实加上了一个`LINK_LIBRARIES`。
同时也可以看见后面的依赖不止`test.cc.o`了，还有 `libtest_lib.a`。这里我不太懂为什么出现了 `libtest_lib.a || libtest_lib.a`, Copilot 是这样说的，这里可能与 ninja 的独特语法规则有关系。

> CMakeFiles/test.dir/test.cc.o 是输入的对象文件，由编译 test.cc 源文件生成。竖线 | 后面的 libtest_lib.a 表示这是一个隐式依赖项，双竖线 || 后面的 libtest_lib.a 表示这是一个订单仅依赖项，确保在链接 test 之前构建 libtest_lib.a

这里是`build.ninja`

```bash
build test: CXX_EXECUTABLE_LINKER__test_Debug CMakeFiles/test.dir/test.cc.o | libtest_lib.a || libtest_lib.a
  FLAGS = -g
  LINK_LIBRARIES = libtest_lib.a
  OBJECT_DIR = CMakeFiles/test.dir
  POST_BUILD = :
  PRE_LINK = :
  TARGET_FILE = test
  TARGET_PDB = test.dbg
```

这里是`rules.ninja`, 几乎没有发生变化。

```bash
rule CXX_EXECUTABLE_LINKER__test_Debug
  command = $PRE_LINK && /usr/bin/g++ $FLAGS $LINK_FLAGS $in -o $TARGET_FILE $LINK_PATH $LINK_LIBRARIES && $POST_BUILD
  description = Linking CXX executable $TARGET_FILE
  restat = $RESTAT
```

## 关于 phony

在 `build.ninja` 中可以找到类似下面的语句, 感觉和 `Makefile` 的 `.PHONY` 没有什么区别, 只是一个 call。这里的 all 和 使用 `make` 直接作为生成器所生成的 `Makefile` 貌似区别不大。不过我发现在 `build folder/Makefile` 中的 `all` 实际上是跑的 `CMakeFiles/Makefile2` 中定义的 `all`。

这里是`build.ninja`
```bash
build all: phony test libtest_lib.a
```

这里是 `Makefile`, extend 实际可以直接 dry run 一下, 用 `make -n`。

```makefile
# The main all target
all: cmake_check_build_system
	$(CMAKE_COMMAND) -E cmake_progress_start /home/lap/app/justforfun/build/CMakeFiles /home/lap/app/justforfun/build//CMakeFiles/progress.marks
  # 注意下面这里用的是 -f Makefile2 all 
  # extend 一下是 make -s -f CMakeFiles/Makefile2 all
	$(MAKE) $(MAKESILENT) -f CMakeFiles/Makefile2 all 
	$(CMAKE_COMMAND) -E cmake_progress_start /home/lap/app/justforfun/build/CMakeFiles 0
.PHONY : all
```

这里是 `CMakeFiles/Makefile2`, 在该文件中可以找到关于 `test.dir/all` 和 `test_lib.dir/all` 的构建规则，不做赘述。

```makefile
# The main recursive "all" target.
all: CMakeFiles/test.dir/all
all: CMakeFiles/test_lib.dir/all
.PHONY : all
```

## 一个小总结

可以感觉到 `build.ninja` 主要是给出了很多构建的 `target`, 一般接在 `build` 语句之后。而其构建规则是由 `CMakeFiles/rules.ninja` 定义的, 只不过会通过 `build.ninja` 传入各种参数, 推测没有传入的会赋默认值或默认为空。这里实际上 `ninja -v` 进行build的时候可以发现是和`rules`中一致的。

```
[1/4] /usr/bin/g++   -g -MD -MT CMakeFiles/test_lib.dir/lib.cc.o -MF CMakeFiles/test_lib.dir/lib.cc.o.d -o CMakeFiles/test_lib.dir/lib.cc.o -c /home/lap/app/justforfun/lib.cc
[2/4] /usr/bin/g++   -g -g -MD -MT CMakeFiles/test.dir/test.cc.o -MF CMakeFiles/test.dir/test.cc.o.d -o CMakeFiles/test.dir/test.cc.o -c /home/lap/app/justforfun/test.cc
[3/4] : && /usr/bin/cmake -E rm -f libtest_lib.a && /usr/bin/ar qc libtest_lib.a  CMakeFiles/test_lib.dir/lib.cc.o && /usr/bin/ranlib libtest_lib.a && :
[4/4] : && /usr/bin/g++ -g  CMakeFiles/test.dir/test.cc.o -o test  libtest_lib.a && :
```