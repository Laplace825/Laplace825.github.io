---
title: leetcode 169
published: 2025-08-09T21:07:51Z
description: '最近在准备leetcode hot100刷到的, 看到一个相当有有意思的思路'
tags: [Algorithm, Leetcode]
category: 'Algorithm'
---

# Leetcode 169 多数元素

给定一个大小为 n 的数组 nums，返回其中的多数元素。
多数元素是指在数组中出现次数大于 $floor.l n/2 floor.r$ 的元素。
你可以假设数组是非空的，并且给定的数组总是存在多数元素。
要求实现一个时间复杂度 $O(n)$，空间复杂度 $O(1)$ 的算法。

 

>**示例 1：**
>>输入：nums = [3,2,3] \
输出：3

>**示例 2：**
>>输入：nums = [2,2,1,1,1,2,2] \
输出：2

## 暴力

题干意思就是找到众数，暴力的方法就是开个 `HashTable` 统计一下所有数的出现次数，
然后再遍历拿出现次数最多的数，但是这个方法显然是不符合复杂度要求的。

## Boyer-Moore

这里记录一下看到有意思的题解吧，Boyer-Moore 投票算法。

假设把目标的数定义为 `+1`，非目标定义为 `-1`，那么所有数的和一定是正的，
因为超过半数都是 `+1`，基于这个原理，我们定义一个 `cnt: int = 0`，
那么此时就该想如何得到目标。遍历数组的过程中，我们维护一个动态改变的 `winner`，
每遇到一个数和当前的 `winner` 一致，那么 `cnt+1`，否则出现了不一样的数，
此时我们就需要判断了，假设 `cnt` 已经为 0 了，那么产生了新的 `winner`，
如果 `cnt != 0`，那么还没产生新 `winner`，让 `cnt-1`。


```cpp {8-17} "cnt" "winner" 
class Solution {
public:
    int majorityElement(vector<int>& nums) {
        int winner = nums[0];
        int cnt{1};

        for (int i = 1; i < nums.size(); ++i) {
            if (nums[i] == winner) {
                ++cnt;
            } else {
                if (cnt == 0) {
                    winner = nums[i];
                    ++cnt;
                } else {
                    --cnt;
                }
            }
        }
        return winner;
    }
};
```

其实简单来说，就是我们知道最多的数一定会成为最终的 `winner`，不断争抢得到 `cnt`，
也就是 `nums[i] == winner` 的发生次数是最多的，由于我们的目标出现次数大于 $floor.l n/2 floor.r$，
因此我们可以把其中的部分数与其他数抵消让 `cnt=0`，剩下的数则会让 `cnt` 一直自增。

也就是100个数中有51个114514，49个其他数，可以拿出49个114514与49个其他的数抵消，剩下两个114514一定会成为 `winner`。
