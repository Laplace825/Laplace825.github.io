---
title: CMake 链接 OpenCV(2)
published: 2024-02-13
updated: 2025-07-31
description: 使用`CMake`链接`OpenCV`实际上不需要直接指定绝对路径，本文主要是记录`OpenCV`更合理的配置
tags: [C++, CMake]
category: C++
draft: false
---

使用`CMake`链接`OpenCV`实际上不需要直接指定绝对路径，本文主要是记录`OpenCV`更合理的配置。

<!--more-->

## CMakelists如何编写

相信大家在网上查找如何使用`CMake`配置好`OpenCV`都会看见以下代码。

```cmake
find_package(OpenCV REQUIRED)
add_executable(opencv-project main.cpp)
target_include_directories(opencv-project PRIVATE ${OpenCV_INCLUDE_DIRS})
target_link_libraries(opencv-project ${OpenCV_LIBS})

message(STATUS "OpenCV_INCLUDE_DIRS = ${OpenCV_INCLUDE_DIRS}")
message(STATUS "OpenCV_LIBS = ${OpenCV_LIBS}")
```

这些代码十分神奇🤔，因为这里好像根本不需要指定路径就能调用`OpenCV`库，但是我们发现，整个`CMake`除了`message`是用来终端打印信息，其他的代码仿佛也都是在指定链接的库`lib`在哪、头文件`include`在哪，可是却没有一个路径。

## 为什么CMake能找到OpenCV?

### 关于`find_package`

实际上，这条语句会寻找一个文件`OpenCVConfig.cmake`，这也是为什么`find_package`内必须写的是**OpenCV**，而不能是**opencv、Opencv**。这是因为官方提供的`opencv`包中，`build`文件夹下提供是的`OpenCVConfig.cmake`，所以大小写必须按照该文件名来。同时，该语句会在系统环境变量中寻找"opencv/build"这样一个文件夹，所以实际上要链接`openCV`,`CMake`是通过系统环境变量找到这个文件夹，再通过`OpenCVConfig.cmake`提供相对路径找到其他文件夹。

### 关于`OpenCV_LIBS`和`OpenCV_INCLUDE_DIRS`

在`CMake`中，`&{}`内实际上是一个变量，也就是说`OpenCV_LIBS`和`OpenCV_INCLUDE_DIRS`应该是存储了静态库 lib 和头文件地址的变量，这可以在`message`中打印出来（执行`cmake ..`时可以在终端看见），而这两个变量由`find_package`找到系统环境变量中的"opencv/build"内各`OpenCVConfig.cmake`提供，这里可以通过打开相关`.cmake`文件查找两个变量。

## 关于路径

:::tip
实际上, 不一定非要绝对路径, CMake 自己有变量来控制路径
:::

```cmake
# 项目相关路径
${CMAKE_SOURCE_DIR}          # 项目根目录 (最顶层CMakeLists.txt所在目录)
${CMAKE_BINARY_DIR}          # 构建目录 (执行cmake命令的目录)
${CMAKE_CURRENT_SOURCE_DIR}  # 当前CMakeLists.txt所在目录
${CMAKE_CURRENT_BINARY_DIR}  # 当前目标的构建目录

# 项目信息
${PROJECT_SOURCE_DIR}       # 当前项目根目录
${PROJECT_BINARY_DIR}       # 当前项目构建目录
${PROJECT_NAME}              # 项目名称

# 系统相关路径
${CMAKE_INSTALL_PREFIX}      # 安装路径前缀 (默认 /usr/local)
${CMAKE_PREFIX_PATH}         # 查找包的路径前缀

# 编译器相关
${CMAKE_C_COMPILER}          # C编译器路径
${CMAKE_CXX_COMPILER}        # C++编译器路径
${CMAKE_BUILD_TYPE}          # 构建类型 (Debug/Release/RelWithDebInfo/MinSizeRel)

# 库和可执行文件输出路径
${CMAKE_RUNTIME_OUTPUT_DIRECTORY}  # 可执行文件输出目录
${CMAKE_LIBRARY_OUTPUT_DIRECTORY}  # 动态库输出目录
${CMAKE_ARCHIVE_OUTPUT_DIRECTORY}  # 静态库输出目录

# 平台检测
${CMAKE_SYSTEM_NAME}         # 操作系统名称 (Linux/Windows/Darwin等)
${CMAKE_SYSTEM_PROCESSOR}    # 处理器架构 (x86_64/arm64等)

# 常用示例
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
```