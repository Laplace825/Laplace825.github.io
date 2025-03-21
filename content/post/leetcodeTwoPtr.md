---
date: '2025-03-21T14:59:54+08:00'
draft: true
title: '每日一算法——双指针; leetcode LCR 008.长度最小的子数组'
author: Laplace
description: "The two pointers algorithm. Leetcode LCR 008"
math: mathjax

tags:
  - Leetcode
  - TwoPtr
categories:
- Leetcode
---

典型的双指针算法, 虽然看起来是两层循环, 实际上有很多优化.

<!--more-->

## 双指针

双指针方法较为灵活, 很难说哪些场景固定使用. 但一般像滑动窗口、两层 for 循环仅控制下标等都能变为双指针.
直接通过题目来学习吧.

## Leetcode LCR 008.长度最小的子数组

给定一个含有 n 个正整数的数组 `nums` 和一个正整数 `target` .

找出该数组中满足其和 $\ge$ `target` 的长度最小的 连续子数组 `numsl, numsl+1, ..., numsr-1, numsr`, 并返回其长度. 
如果不存在符合条件的子数组, 返回 0 .

- 输入: target = 7, nums = \[2,3,1,2,4,3]
- 输出: 2
- 解释: 子数组 \[4,3] 是该条件下的长度最小的子数组.

[跳转原题](https://leetcode.cn/problems/2VG8Kg/description/)


### Brute Force

最 Brute 的思路, 控制两层 `for` 循环分别控制下标, `i` 控制起始, `j` 控制从 `i` 开始之后的每一个数,
求和, 然后每次更新满足条件的最小长度即可. 下面是个大致的代码思路, **没运行测试过, 可能有误**. 
这里我们让 `len` 先等于最大的 `int`, 方便最后判断是否存在一个子数组满足大于等于 `targer`.

```cpp
int minSubArrayLen(int target, vector<int>& nums) {
    const int N = nums.size();
    int len = INT_MAX;
    int sumup = 0;
    for(int i = 0; i < N; i++) {
        sumup = 0;

        for( int j = i; j < N; j++) {
            sumup += nums[j];
            if (sumup >= target) {
                len = min(len, j - i + 1);
                break;
            }
        }

    }
    return len == INT_MAX ? 0 : len;
}
```

对于上面的代码, 实际上我们很容易就知道有大量的重复工作, 例如从 `i=2, j=2` 求一遍, 然后 `i=3, j=3` 求一遍, 
实际在反复地遍历 `j < N` 的部分, 特别是当不存在求和成立的时候. 平均时间复杂度 $O(n^2)$ .

### 使用双指针

实际上, 我们可以维护一个"滑动窗口", 每次计算滑动窗口内的和, 当和小于 `target` 时扩大, 反之则尝试缩小. 
而关键的点在于如何缩小或移动这个滑动窗口才能减少时间复杂度.

一个想法是, 当我们有一定大小的滑动窗口且满足 `target` 的大小条件时, 我们不收缩最右侧的位置, 
而是从左侧开始收缩直到当前的和不再满足大小条件, 则可以开始将右指针继续向右移动. 这个收缩的过程同样需要避免反复求和,
即我们可以将之前已经得到的和减去收缩被丢弃的数.

```cpp
int minSubArrayLen(int target, vector<int>& nums) {
    const int N = nums.size();
    int len = INT_MAX;
    int sumup = 0;
    int left = 0, right = 0;
    while (right < N) {
        sumup += nums[right];
        while (sumup >= target) {
            len = std::min(right - left + 1, len);
            sumup -= nums[left];
            left++;
        }
        right++;
    }
    return len == INT_MAX ? 0 : len;
}
```
