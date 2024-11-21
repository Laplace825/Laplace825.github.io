---
title: "Parallel Computing CS149 ASST1 note"
author: "Laplace"
description: "A note record my CS149 ASST1"
date: 2024-11-20T20:30:32+08:00
tags:
  - Parallel-Computing
  - CS149
categories:
  - Parallel-Computing
---

This series will cover my assignment solution and some notes to *Standford CS149 lecture*.
And I truly recommand anyone who wants to learn *Parallel-Computing* to follow this lecture.
This is my github repo which contains source code [laplace/cs149-asst](https://github.com/Laplace825/cs149-asst.git),
but I truly recommand you finish it by u self.

<!--more-->

## ASST1 ( runned by Apple M3 )

### important things

+  Property of a program where the same instruction sequence applies to many data elements
+ *Coherent execution IS NECESSARY for SIMD* processing resources to be used efficiently
+ *Coherent execution IS NOT NECESSARY for efficient parallelization across different cores*, since each core
has the capability to fetch/decode a different instructions from their thread’s instruction stream

### task

+ try to make mandelbrot set built with Multi-Thread has the same
Result as the Serial method.
+ add code to workerThreadStart function to accomplish this task.  
+ just change the `fn workerThreadStart`

### done

#### notice

Because the height is 1200 (maybe we can change), so if we divide the picture partly
by height div number of threads and can't get a integer result, there will be wrong
error.

#### 2 thread

We split the picture generating to 2 part. The first Thread deals with
half of the picture in the top, and other draws who in the bottom.

Result:

+ Serial: 316.964ms
+ 2-Threads: 163.130ms

*Almost two times faster*

```cpp
void workerThreadStart(WorkerArgs * const args) {

    // NOTE:  in a program that uses two threads, thread 0 could compute the top
    // half of the image and thread 1 could compute the bottom half.
    printf("[thread %d] working\n", args->threadId);
    if (!args->threadId){

    mandelbrotSerial(args->x0, args->y0, args->x1, args->y1,
                     args->width,  args->height, 
                     0,  args->height / 2,
                     args->maxIterations, args->output);
    }
    else{

    mandelbrotSerial(args->x0, args->y0, args->x1, args->y1,
                     args->width,  args->height, 
                     args->height /2 ,  args->height / 2,
                     args->maxIterations, args->output);
    }
}
```

#### more thread using split method

This Idea just divides the picture horizontally to different part (match the number
of threads).

Result:

+ 8-Threads: 3.53x speedup
+ 16-Threads: 5.13x speedup

Actually this doesn't give me 8 times faster, just 4 times faster.

#### some bad things

When we run the view 1 and set to odd thread numbers, the speedup is smaller than
less thread.

e.g. `3-Thread` gets 1.58x speedup at the same time `2-Thread` gets 1.94x.

## ASST2 ( runned by Ryzen7 6800H )

*I must say this is very an interesting assignment. As we just in the lecture for
maybe 2 classes, the SIMD instructions we are not easy to get, but the CS149intrin helps
us. Although it just use fixed-length array to simulate, the code frame helps us analyse
our Vector Utilization which helps us build a SIMD eye in an acceptable way.*

### task

+ using CS149's "fake vector intrinsics" defined in `CS149intrin.h`.
+ vectorize `clampedExpVector` & `arraySumVector` so it can be run on a
machine with SIMD vector instructions.

### done

#### Vectorize Clamped EXP

*THINKS for Serial implement.* My job is just translate the Serial Version to
"CS149 SIMD" Version. Maybe you can see that in `asst1/prog2_vecintrin/main.cpp` 

#### Vectorize Array Sum

*I Like The Hint ❤️*. "You may find the `hadd` and `interleave` operations useful."
That helps me a lot.

This is a part of the code which I use `hadd` and `interleave`.

+ `hadd`
  + Adds up adjacent pairs of elements, so [0 1 2 3] -> [0+1 0+1 2+3 2+3]
+ `interleave`
  + Performs an even-odd interleaving where all even-indexed 
  elements move to front half of the array and odd-indexed to the back half,
  so [0 1 2 3 4 5 6 7] -> [0 2 4 6 1 3 5 7]  

So if I get `1 2 2 1` to get sum, just do this:

+ [1 2 3 4] -> [1+2 1+2 3+4 3+4] -> [3 3 7 7]
+ [3 3 7 7] -> [3 7 3 7]
+ [3 7 3 7] -> [3+7 3+7 3+7 3+7] -> result


```cpp
    // O( N / VECTOR_WIDTH )
    for (int i = 0; i < N; i += VECTOR_WIDTH) {
        _cs149_vload_float(temp, values + i, maskAll);
        _cs149_vadd_float(sum, sum, temp, maskAll);
    }

    // O( log2(VECTOR_WIDTH) )
    for (int i = 1; i < VECTOR_WIDTH; i *= 2) {
        _cs149_hadd_float(sum, sum);
        _cs149_interleave_float(sum, sum);
    }
    float result[VECTOR_WIDTH];
    _cs149_vstore_float(result, sum, maskAll);
    return result[0];
```

## ASST3 (Ryzen7 6800H)

### Part 1

in `mandelbrot_ispc_task`, we can see that every task is allocated with
a continuous picture clip.

```cpp
// taskIndex is an ISPC built-in

uniform int ystart = taskIndex * rowsPerTask;
uniform int yend = ystart + rowsPerTask;
```

This is speedup below for different task number for **view-1**.

| number | multi-task ispc |  ispc   |
| :----: | :-------------: | :-----: |
| 2 | 16.87x | 8.89x  |
| 4 | 21.67x | 7.76x |
| 8 | 32.71x | 9.02x |
| 16 | 51.41x | 7.93x |
| 32 | 71.71x ~ 100.x | 5.87x |
| 200 | 72.00x ~ 91.x | 5.88x |
| 800 | 70.x ~ 110.x |  5.83x |

This is speedup below for different task number for **view-2**.

| number | multi-task ispc |  ispc   |
| :----: | :-------------: | :-----: |
| 2 | 7.89x | 4.92x  |
| 4 | 17.05x | 7.54x |
| 8 | 18.47x | 4.94x |
| 16 | 33.86x | 4.91x |
| 32 | 46.36.x ~ 68.x | 4.92x |
| 200 | 59.41x ~ 60.x | 4.92x |
| 800 | 57.x ~ 94.x | 5.43x |

*The result is very interesting, as I even get 105.52x when I launch 32 tasks. But the ispc part is very unstable, sometimes
goes up to 9.x speedup while sometimes just get 5.x speedup. When I switch to 32 tasks, seems there can't
be faster more.*

I must say in view-2, 32-task version is slower than 200-task. I just list the fastest upper boundary
I get when I run, but that happens little. If I can run more turn and calculate an avarage number,
the 200-task may run a little fast. And actually 800-task seems to be even faster on avarage ( appear much more 
60.x speedup).

#### The Expected 8-wide AVX2 performance

In theory, `8-wide AVX2` can do 8 times job more than just serial per operation, which
means that we will get 8 times faster, right? But we get `5.x ~ 9.x` speedup, and most of that is
slower than `8.x` speedup. Why?

*Coherent execution IS NECESSARY for SIMD*. The view-2 is much more slower than view-1. If we put
the focus to see where block the *Coherent*, most obvious part is the `white` & `black` boundary.
view-2 has much more white-black boundary, which is not very ideal for SIMD. But for view-2, we launch
more task with `height / the number of task`. Each task will do smaller part for the job, which may 
allocate more `Coherent` chip for task to do.

### Part 2 determine how many task is best

Actually I can't tell the result. Ryzen7 6800h is 8 cores with 16 threads at most simultaneously.
But 32-tasks is really faster than 16-tasks. In view-2 version, 800-task seems better on avarage.
If we analyse the profiling using `perf stat`, we can tell that in 'thread version' for `prog1_mandelbrot_thread`,
the cpu utilization is heigher. But the ispc version using `task` is faster and exceeds the sequential code over
32 times. BTW, the 32-task has lower cpu utilization then 'thread version'.
