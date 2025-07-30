---
title: C++ CRTP 中基类接口获取子类定义的类型？
published: 2024-08-17
description: 实际上是通过模版元的方式来获取
tags: [C++]
category: C++
draft: false
---

其实是之前在学院群里的一个问题，当时并没有真正解决，只是通过暴力解决了。一个是对`CRTP`的理解不够深入，另一个是对于`C++`的模板元编程的使用不够熟练。希望记录一下。

<!--more-->

## 问题

下面代码是很常见的`CRTP`，我们的目的是在`Base`类中获取`Derived`类中定义的`RawT`类型。
但是却报错了`no typename RawT in Derived<byteVector>`，因为`Base`类并不知道`Derived`类的定义，所以无法获取`RawT`类型。
可是`CRTP`却让`Base`类能够使用到`Derived`类的成员函数？

```cpp
#include <print>
#include <vector>

using byteVector = std::vector< std::byte >;

template < typename DerivedT >
class Base {
  public:
    using RawT = typename DerivedT::RawT;

    void foo() {
        std::println("{}", typeid(RawT).name());
        static_cast< DerivedT* >(this)->impl();
    }
};

template < typename T >
class Derived;

template <>
class Derived< byteVector > : public Base< Derived< byteVector > > {
    template < typename U >
    friend class Base; // make all Base's member functions visible to Derived

    using RawT = byteVector;

    void impl() { std::println("Derived<int>::impl()"); }
};

int main() {
    Derived< byteVector > d;
    d.foo();
    return 0;
}
```

## 为什么`CRTP`能够让`Base`类使用到`Derived`类的成员函数？

**以下来自Claude 3.5 Sonnet**，感觉解释的很好，我就直接翻译过来了。

这是一个很好的问题，涉及到 CRTP（Curiously Recurring Template Pattern，奇异递归模板模式）的核心机制。让我们深入探讨一下：

1. CRTP 的基本结构

在 CRTP 中，基类模板接受派生类作为模板参数：

```cpp
template <typename DerivedT>
class Base {
    // ...
};

class Derived : public Base<Derived> {
    // ...
};
```

2. 编译器的两阶段名称查找

CRTP 能够工作的关键在于 C++ 编译器的两阶段名称查找（two-phase name lookup）机制：

   a. 第一阶段：在模板定义时，编译器会检查语法和非依赖名称。
   b. 第二阶段：在模板实例化时，编译器会检查依赖名称。

3. 延迟绑定

当基类模板中使用 `Derived` 类的成员时，这些名称被视为依赖名称。编译器会延迟这些名称的解析，直到模板实例化时。

4. 示例解析

考虑以下代码：

```cpp
template <typename DerivedT>
class Base {
public:
    void interface() {
        static_cast<DerivedT*>(this)->implementation();
    }
};

class Derived : public Base<Derived> {
public:
    void implementation() {
        std::cout << "Derived implementation" << std::endl;
    }
};
```


在这个例子中：

+ 当编译器首次遇到 `Base` 类模板时，它不会报错说找不到 `implementation()`。
+ 编译器知道 `Derived` 是一个模板参数，因此假设 `implementation()` 将在 `Derived` 中定义。
+ 当 `Derived` 类实例化 `Base<Derived>` 时，编译器检查 `Derived` 是否真的有 `implementation()` 方法。

5. 为什么不报错

编译器不会立即报错，因为：

+ 在模板定义时，编译器不知道 `Derived` 的具体内容，所以它假设 `Derived` 会提供所需的方法。
+ 只有在实际实例化模板时，如果缺少所需的方法，编译器才会报错。

6. 注意事项

+ 如果 `Derived` 类没有定义所需的方法，错误只会在使用 `Derived` 类时出现，而不是在定义 `Base` 模板时。
+ 这种延迟检查可能导致错误消息出现在意想不到的地方，有时会使调试变得复杂。

总结：`CRTP` 利用了 `C++` 模板的延迟实例化和两阶段名称查找机制，允许基类模板使用尚未定义的派生类成员，而不会在模板定义时报错。这种机制提供了强大的静态多态性，但也需要开发者确保正确实现所有必要的方法。

## 为什么`Base`类无法获取`Derived`类中定义的`RawT`类型？

### 严格编译期确定

这与`CRTP`是有不同的，在继承时发生了模板实例化`public Base<Derived<byteVector>>`, 此时实例化的`Base`类中
`using RawT = typename Der::RawT;`会去查找`Derived<byteVector>`类中的`RawT`类型，但是请注意，此时的
`Derived<byteVector>`类还没有定义`RawT`类型(因为我们从继承的时候就开始了`Base`的实例化，而此时甚至还没有进入到`Derived`的定义)
所以会报错。也就是说，`Derived<byteVector>`的完整类型出现在`Base`之后。

编译期间`Derived<byteVector>`在类型不完整的时候就被依赖了。

### `CRTP`的延迟绑定

`CRTP`中，基类通常不会直接使用派生类的成员，而是使用其成员函数。方法的调用完全可以延迟到实例化完成后，
而类型的获取则必须在编译时确定。

## 解决方案

### 获取一个模板类的第一个参数

其实通过分析我们不难发现，我们不能在实例化的时候用`Base`的模板参数来获取`RawT`，因为这样的话派生类必然还没有完整定义。
所以我们可以通过套一层模板来直接获取一个模板类的参数，简单来说就是有一个模板能获取模板类的模板参数。
这样说比较绕，我们直接看代码。

```cpp
get_raw_t< Derived< byteVector > > -> byteVector
get_raw_t< std::vector< int > > -> int
```

所以目标是构造一个`get_raw_t`模板，能够获取`Derived`类的`RawT`类型。

```cpp
template < typename >
struct get_raw;

/*
 * @brief: get_raw< std::vector< std::byte > > -> std::byte
 */
template < template < typename... > class TemplateClass, typename InnerType >
struct get_raw< TemplateClass< InnerType > > {
    using type = InnerType;
};

template < typename T >
using get_raw_t = typename get_raw< T >::type;
```

我们知道，类似于`std::vector< std::byte >`这样的模板类，其实是一个被实例化的模板类。
如果使用`get_raw< std::vector< std::byte > >`，那么就会匹配到特化的`get_raw`，从而获取到`std::byte`类型。
也即是`get_raw< TemplateClass< InnerType > >`对应`get_raw< std::vector< std::byte > >`。
所以 `< TemplateClass, InnerType >` 匹配到`< std::vector, std::byte >`。

### 改进我们的代码

只需要在`Base`类中使用`get_raw_t`就可以了。

```cpp
template < typename DerivedT >
class Base {
  public:
    // bypass using RawT = typename Der::RawT;
    using RawT = get_raw_t< DerivedT >;

    void foo() {
        std::println("{}", typeid(RawT).name());
        static_cast< DerivedT* >(this)->impl();
    }
};
```

本质上还是绕过`DerivedT`这个不完整类型。通过实例化的`get_raw_t`来获取`RawT`类型。当然，必须保证`Derived`类中的
`RawT`就是被`CRTP`的`Derived`类的模板参数。

## 关于`C++ 23`之后`CRTP`的一些改善

`C++ 23`引入了显示`this`。大大增强了`CRTP`的能力，可以直接在`Base`类中获取`Derived`类的类型。

```cpp
template < typename Der >
class Base {
  public:
    using RawT = get_raw_t< Der >;

    void foo(this auto&& self) {
        std::println("{}", typeid(RawT).name());
        self.impl();
    }
};
```

通过将`this`作为参数传递给`foo`函数，我们实例化的`Derived`就可以被直接传入作为第一个参数，
从而直接调用`Derived`的成员函数。不过此时应该将`Base`设置为友元类，以便`Base`类能够访问`Derived`类的私有成员。

```cpp
template < typename T >
class Derived;

template <>
class Derived< byteVector > : public Base< Derived< byteVector > > {
    template < typename U >
    friend class Base; // make all Base's member functions visible to Derived

    void impl() { std::println("Derived<int>::impl()"); }
};

int main() {
    Derived< byteVector > d;
    d.foo();
    return 0;
}
```
