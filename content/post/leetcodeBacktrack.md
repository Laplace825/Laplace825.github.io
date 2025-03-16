---
date: '2025-03-16T21:28:48+08:00'
draft: true
title: '每日一算法——回溯; Leetcode 17.电话号码字母组合'
author: Laplace
description: "The Backtrack algorithm. Leetcode 17"

tags:
  - Leetcode
  - Backtrack
categories:
- Leetcode
---

之后在该系列记录Leetcode刷题吧, ~~虽然大概率做不到"每日"~~. 主要以特定算法为主, 目前主要跟[代码随想录](https://programmercarl.com/)学习.
第一篇先记录一个回溯, 这个算法相当巧妙, 并没有那么难以理解.

<!--more-->

## 回溯算法

### 经典的组合例子

组合问题经常使用回溯算法. 所谓回溯算法, 本质上是通过函数调用栈展开模拟多叉树. 假设我们需要从 `[1,2,3,4]`
这个序列中得到所有长度为 2 的组合, 那我们可以将选择以树的形式展开, 从根到叶的每条边代表被选择的数字.
每次剩余的数字则组成其他的节点. 对于不同的问题, 例如不能产生重复情况时, 我们会把第二层的节点值从 `+1` 的位置开始,
也即第一次剩余了 `234`, 那么下次选择的是 2, 对应节点是从 2 之后开始的所有剩余数字 `34`. 这样就得到了一颗树.

![](../post-images/backtrack.svg)

### C++ 实现

下面是 C++ 实现, 为方便直接将返回的结果和模拟的路径用全局变量了. 这里用了一个 `start` 变量记录每次回溯从哪开始,
以便控制上面的 "+1" 过程.

```c++
// 最终的结果
std::vector<std::vector<int>> ret;

// 模拟的树的路径(从根到底的所有边的组合)
std::vector<int> path;

// 这里的 n 应为 4, k 应为 2, start 为开始的地方
void backtrace(int n, int k, int start) {
    if ( path.size() == k ) {
        ret.push_back(path);
        return;
    }

    for (int i = start; i < n; i++) {
        path.push_back(i);
        backtrace(n, k, i + 1);
        path.pop_back();
    }
}
```

### 为什么本质是模拟函数栈的递归展开?

回溯最难理解的部分应该就是上面的递归以及之后的 `pop_back` 部分了.

#### 为什么要递归?

递归求解可以抽象成在上节中树当前层继续搜索下一层. 假设当前从 `1234` 开始, 先 `push_back(1)`, 那么之后就是搜索 `234` 来拿到序列,
递归就是搜索这颗树下一层的 `234`. 而每次递归结束, 要么是由于当前路径到了预定的条数(例如 size == k), 或者当前路径依然不满足 k 个, 还需要继续求解,
所以继续往下循环并递归.

应该将递归理解成子任务求解, 同时, 其退出条件一定是满足了查找目的 (size == k), 那这时, 我们已经查到了结果, 只需要把刚查到的那个数字先 `pop` 掉, 再继续求解.
这个 `pop` 的过程就是从树中当前层往上移动的过程. 之后随着 `for` 循环继续, 我们从右边的边继续往下求解.

假设现在在图中的 `34` 节点, `pop` 就是从边 `2` 往上跑到 `234` 节点, 然后随着 `for` 循环让 `i=3` , 从边 `3` 继续往下到节点 `4`.

#### 为什么从 `i+1` 继续而不是 `start+1` ?

从 `i+1` 继续本质上是避免重复. 大家应该理解需要从某个起始点之后开始继续搜索. 实际上如果从 `start+1` 继续, 假设我们目前的 `i=2, start=1` (对应图中最左侧的 `34` 节点),
那么是从 `i=2, start=2` 继续搜索, 也就是向该 `34` 节点下层添加了一条边 `i=2` (因为下一次递归的循环是 `i=start`), 节点仍然为 `34`. 这时候实际上存在重复的可能.
而从 `i+1` 开始则保证了当前已经入的边之后的一个开始, 也就是添加了一条边 `i=3`, 而节点为 `4` , 这就解决了重复的问题.

![](../post-images/backtrack-start_plus_1.svg)

## Leetcode 17.电话号码的字母组合

ps. 也不知道之后的系列还抄不抄原文(, 如果内容相对少就抄一下吧? &#9998;

[跳转原题](https://leetcode.cn/problems/letter-combinations-of-a-phone-number/description/)

给定一个仅包含数字 2-9 的字符串, 返回所有它能表示的字母组合. 答案可以按任意顺序返回.
给出数字到字母的映射如下(与电话按键相同). 注意 1 不对应任何字母.

| 数字 | 字母 |
| :--: | :--: |
| 2 | "abc" |
| 3 |  "def" |
| 4 | "ghi" |
| 5 | "jkl" |
| 6 | "mno" |
| 7 | "pgrs" |
| 8 | "tuv" |
| 9 | "wxyz" |

- 输入：digits = "23"
  - 输出：`["ad","ae","af","bd","be","bf","cd","ce","cf"]`
- 输入：digits = ""
  - 输出：`[]`
- 输入：digits = "2"
  - 输出：`["a","b","c"]`

## 思路

### 读题

常识来说, 按下一个按键只能得到一个字符, 两个按键先后组合在一起得到两个输出, 也就是 "2" &#10142; "a/b/c" 其一;
"3" &#10142; "d/e/f" 其一, 然后组合在一起.

所以不难得到, 我们只需要将 "2" 对应的 "abc" 随机选取一个, 然后 "3" 的 "def" 随机选取一个, 再按顺序拼在一起.
本质上像一个在固定的范围内选择一个字母的组合问题.

### 回溯解决

我们只要控制回溯选择的字母每次是在某个数字对应的字符串内部就行, 之后再到另一个数字对应的字符串内部选择.

```cpp
class Solution {
  public:
    std::vector<std::string> letterCombinations(std::string digits) {
        if (digits.empty()) {
            return {};
        }
        std::array<std::string, 8> dict = {"abc", "def",  "ghi", "jkl",
                                           "mno", "pqrs", "tuv", "wxyz"};
        std::vector<std::string> ret{};

        const auto getFromDict = [&dict](int index) { return dict[index - 2]; };
        std::vector<std::string> conbinedStr;
        for (char c : digits) {
            conbinedStr.push_back(getFromDict(c - '0'));
        }
        std::string path{};
        backtrace(ret, conbinedStr, path, 0);
        return ret;
    }

    void backtrace(std::vector<std::string>& ret,
                   const std::vector<std::string>& conbinedStr,
                   std::string& path, int start) {
        if (path.size() == conbinedStr.size()) {
            ret.push_back(path);
            return;
        }

        for (int j = start; j < conbinedStr.size(); j++) {
            for (int i = 0; i < conbinedStr[j].size(); i++) {
                path.push_back(conbinedStr[j][i]);
                backtrace(ret, conbinedStr, path, j + 1);
                path.pop_back();
            }
        }
    }
};
```
