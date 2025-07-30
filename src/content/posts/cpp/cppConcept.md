---
title: C++ Concept
published: 2024-08-27
description: Concept 本质上是一种约束，用于限制模板参数的类型
tags: [C++]
category: C++
draft: false
---

补一个 `C++20`的特性`Concept`，用于约束模板参数。
Concept 本质上是一种约束，用于限制模板参数的类型。

<!--more-->

## 本文希望你使用`C++ 20`标准

希望根据你的编译器添加`-std=c++20`的参数，例如

```shell
$ g++ file.cc -std=c++20 # for g++
$ clang++ file.cc -std=c++20 # for clang++
```

## 制作一个判断迭代器是否存在的方法

[上篇谈到的C++中模板的基本使用技巧](www.blog.lap-lace.top/post/cpptrickstemplate/#more)中，我们提到在`C++ 20`以前如何判断一个类型
是否具有迭代器，我们可以使用`SFINAE`技巧，和括号表达式的方法对应有类型进行判断，但是这种比较难看😵。

```cpp
template <typename T>
struct is_iterable
{
    using type = decltype((
        begin(std::declval<T&>()) !=
            end(std::declval<T&>()), // begin/end and operator !=
        void(),                      // Handle evil operator ,
        ++std::declval<decltype(begin(std::declval<T&>()))&>(), // operator++
        void(*begin(std::declval<T&>())),                       // operator*
        std::true_type{}));
};
```

## 使用Concept

### 一个简单的加和例子

先来个简单的例子，我们该如何使用`Concept`来约束来个数相加的函数？

```cpp
template <typename T>
T add(T a, T b) { return a + b; }
```

这里我们几乎可以传入任何类型的参数，同时也会保证`T`类型支持`+`操作符(不支持就直接报错了)。
但是我们几乎只能靠自己来判断`T`是否支持`+`操作符，否则只能等报错。在`C++ 20`之前，如果我们希望模板参数是整数，
我们会使用`SFINAE`。

```cpp
/// C++ 17
template < typename T, typename = std::enable_if_t< std::is_integral_v< T > > >
T add(T a, T b) {
    return a + b;
}

int main() {
    add(1.1, 2); //报错
    add(11, 2);
}
```

`Clang`给出了一个不错的报错提示
>   2.cc:9:5: error: no matching function for call to 'add'
    9 |     add(1.1, 2);  
      |     ^~~  
    2.cc:4:3: note: candidate template ignored: deduced conflicting types for parameter 'T' ('double' vs. 'int')  
    4 | T add(T a, T b) {  
      |   ^  
1 error generated.  

但当我使用`gcc`的时候，嗯....😇至少我是很难受的。

>   2.cc: In function ‘int main()’:  
    2.cc:9:8: 错误：对‘add(double, double)’的调用没有匹配的函数
    9 |     add(1.1, 2.2);
      |     ~~~^~~~~~~~~~  
    2.cc:4:3: 附注：备选： ‘template<class T, class> T add(T, T)’
    4 | T add(T a, T b) {
      |   ^~~  
    2.cc:4:3: 附注：  template argument deduction/substitution failed:
In file included from 2.cc:1:
/usr/include/c++/14.2.1/type_traits: In substitution of ‘template<bool _Cond, class _Tp> using std::enable_if_t = typename std::enable_if::type [wi
th bool _Cond = false; _Tp = void]’:  
    2.cc:3:24:   required from here
    3 | template < typename T, typename = std::enable_if_t< std::is_integral_v< T > > >
      |                        ^~~~~~~~
/usr/include/c++/14.2.1/type_traits:2696:11: 错误：no type named ‘type’ in ‘struct std::enable_if<false, void>’
 2696 |     using enable_if_t = typename enable_if<_Cond, _Tp>::type;
      |           ^~~~~~~~~~~

### 使用Concept

先看代码

```cpp
/// C++ 20
template < typename T > concept Integral = std::is_integral_v< T >;

template < Integral T >
T add(T a, T b) {
    return a + b;
}
```

直觉上来说，我们大概是定义了一个类型？`Integral`，这个类型是`std::is_integral_v< T >`的类型？然后我们要求
在`add`函数中，`T`必须是`Integral`类型。

好像还挺理解的。先看`gcc`的报错

>   2.cc: In function ‘int main()’:  
    2.cc:11:8: 错误：对‘add(double, double)’的调用没有匹配的函数  
   11 |     add(1.1, 2.2);  
      |     ~~~^~~~~~~~~~  
    2.cc:6:3: 附注：备选： ‘template<class T>  requires  Integral<T> T add(T, T)’
    6 | T add(T a, T b) {  
      |   ^~~  
    2.cc:6:3: 附注：  template argument deduction/substitution failed:  
    2.cc:6:3: 附注：constraints not satisfied  
    2.cc: In substitution of ‘template<class T>  requires  Integral<T> T add(T, T) [with T = double]’:  
    2.cc:11:8:   required from here    
   11 |     add(1.1, 2.2);  
      |     ~~~^~~~~~~~~~  
    2.cc:3:33:   required for the satisfaction of ‘Integral<T>’ [with T = double]  
    2.cc:3:49: 附注：the expression ‘is_integral_v<T> [with T = double]’ evaluated to ‘false’  
    3 | template < typename T > concept Integral = std::is_integral_v< T >;  
      |                                            ~~~~~^~~~~~~~~~~~~~~~~~

好像还挺友好的，至少我知道了`double`不是`Integral`类型，还告诉了我`add`没有匹配的函数。同时还能看到
`Integral<T> [with T = double]`的表达式`std::is_integral_v< T >`的值是`false`。

简单来说`Concept`是一种约束，用于限制模板参数的类型。在上面这个例子中，我们定义一个`concept`并且要求其模板参数必须
对`std::is_integral_v`要为`true`，才能使用这个函数。

在`Concept`里仍然支持`||  &&`逻辑运算，所以如果我们想约束多种类型，我们可以使用`|| or &&`来连接。
例如我们想要约束整数和浮点数类型。这样我们的参数只支持所有整数和浮点数类型。

```cpp
template < typename T >
concept IntOrFloat = std::is_integral_v< T > || std::is_floating_point_v< T >;
```

## 使用requires

`concept`的复杂语句离不开`requires`的使用，我们继续`is_iterable`的例子。在`requires`语句里面，我们可以写任何语句，
`concept`的要求只是，对于`requires`的语句必须成立(也就是该表达式存在)。

```cpp
template < typename T >
concept is_iterable = requires(T t) {
    t.begin() != t.end();
    ++t.begin();
    *t.begin();
};

template < is_iterable T >
void print(T t) {
    for (auto i : t) {
        std::cout << i << std::endl;
    }
}

int main() {
    std::vector< int > vec{1, 2};
    print(vec);
    return 0;
}
```

在上面例子中，我们的`requires`语句里面使用了一个`T t`，好像是一个变量，然后`requires`语句体里面则写了一堆表达式。
在`requires`语句中，我们凭空定义一个`T`类型的`t`，然后要求这个`t`必须支持`begin`和`end`方法，以及`++`和`*`操作符。

## requires 的 requires

`requires`语句里面还可以使用`requires`语句，这样我们可以更加灵活的使用`Concept`。

```cpp
template < typename T >
concept is_iterable = requires(T t) {
    t.begin() != t.end();
    ++t.begin();
    *t.begin();
    requires requires(T t) { // requires 的 requires
        t.size();
    };
};

template < typename T >
    requires is_iterable< T >
void print(T t) {
    for (auto i : t) {
        std::cout << i << std::endl;
    }
}

int main() {
    std::vector< int > vec{1, 2};
    print(vec);
    return 0;
}
```

我们多了一条`requires`语句，这条语句其实是要求`T`类型必须支持`size`方法。
不过我们居然requires 套 requires。我的理解是`requires`语句本身构成了一个`concept`，
而我们本来也可以对`concept`进行`requires`的操作。

```cpp
template < typename T >
    requires is_iterable< T >
void print(T t) {
    for (auto i : t) {
        std::cout << i << std::endl;
    }
}
```

## 多concept组合

我们将上面定义的`is_iterable`和`IntOrFloat`组合起来，定义一个`is_intger_iterable`。
同时还要求第一个参数是模板类。只使用一个模板参数。但是在`print`函数中，我们可以支持模板类使用多个模板参数。
这是由于标准库的`std::vector`有多个模板参数，除第一个参数外，还有一个`std::allocator`的模板参数，只不过以默认参数的形式存在。

```cpp
template < template < typename > class T, typename U >
concept is_intger_iterable = requires(T< U > t) {
    requires is_iterable< T< U > >;
    requires IntOrFloat< U >;
};

template < template < typename... > class T, typename U >
void print(T< U > t) {
    for (auto i : t) {
        std::cout << i << std::endl;
    }
}

int main() {
    std::vector< int > vec{1, 2};
    print< std::vector, int >(vec);
    print(vec);
    return 0;
}
```
