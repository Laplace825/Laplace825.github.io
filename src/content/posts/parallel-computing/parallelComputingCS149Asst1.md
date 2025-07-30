---
title: Parallel Computing CS149 ASST 1 note
published: 2024-11-20
description: A note record my CS149 ASST 1
tags: [Parallel-Computing, CS149]
category: Parallel-Computing
draft: false
---

This series will cover my assignment solution and some notes to *Standford CS149 lecture*.
And I truly recommand anyone who wants to learn *Parallel-Computing* to follow this lecture.

<!--more-->


## Program 1 by Apple M3

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

### notice

Because the height is 1200 ( maybe we can change ), so if we divide the picture partly
by height div number of threads and can't get a integer result, there will be wrong
error.

### done

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
    if (!args->threadId) {
        mandelbrotSerial(args->x0, args->y0, args->x1, args->y1,
                     args->width,  args->height, 
                     0,  args->height / 2,
                     args->maxIterations, args->output);
    }
    else {
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

## Program 2 ( runned by Ryzen7 6800H )

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

## Program 3 (Ryzen7 6800H)

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

*After I see the lecture 4, I get it. I only have 16-wide task per instructions, but giving 32-task makes the compiler
issue two instructions which run continuously and that is more conducive to pipeline computing.*

## Program 4 (Ryzen7 6800H)

### Part 1 Build and Run

we can see the speedup there.

| multi-task ispc |   ispc   |
| :-------------: | :------: |
| 55.24x |  4.97x  |

### Part 2 Best or Worst Case

#### Best Case

Since all the values are the same, some every lane can do the same SIMD instruction while
the sequential version must compute with maxIterations.

| multi-task ispc |   ispc   |
| :-------------: | :------: |
| 81.87x |  6.77x  |

#### Worst Case

The SIMD used is `avx2` which supports '8-wide' SIMD instructions. So we should
break the 8-wide can't be implement with useful SIMD instructions while let sequential
version to be fast. Obviously, the fastest case for `sqrt` is setting all the value to `1`
that needed lest iteration. So we can assign the `value` every 8 rounds to be slowest for
compute, and the rest to assign as fast as the sequential can do.

I choose from '2.5f ~ 2.8f' and finally I choose *2.68f*. Because we shouldn't give a value to
near to 3, or the sequential part's job will be more. ***Our goal is just let SIMD is not very helpful
, we should break Coherent.*** So in that case, we can choose `0.1f` also.

| multi-task ispc |   ispc   |
| :-------------: | :------: |
| 6.98x |  0.94x  |

```cpp
if ( i % 8 == 0 ) {
    values[i] = 2.68f;
} else {
    values[i] = 1.f; 
}

// if ( i % 8 == 0 ) {
//     values[i] = 0.101f;
// } else {
//     values[i] = 1.f; 
// }
```

### Part 3 AVX2 version

Refer to [intel intrinsics guide](https://software.intel.com/sites/landingpage/IntrinsicsGuide/).
AVX2 version is near to ispc version, but a little faster. In the worst case, it gets 1.2x speedup while ispc gets 0.9x.
And in the good case, avx2 version can gets faster than just ispc.


---

***Now we all runned by Ryzen7 6800H.***

---

## Program 5

### Part 1 speedup

```
[saxpy serial]:		[29.205] ms	[10.204] GB/s	[1.370] GFLOPS
[saxpy ispc]:		[26.056] ms	[11.438] GB/s	[1.535] GFLOPS
[saxpy task ispc]:	[21.102] ms	[14.123] GB/s	[1.896] GFLOPS
				(1.12x speedup from ISPC to serial)
				(1.38x speedup from task ISPC to serial)
				(1.23x speedup from use of tasks to just ISPC)
```

A problem happens here, the `extra credit` hints to think about cpu caches work and memory bandwidth.
I dont know the `myth machine`'s situation. In order to think about what happened, I try to test with just
`ispc` or with just `task`.

I find that there is many page-faults in just 'ispc', and lots of `frontend cycles idle`.
All these make the program slower.

The multi-task version uses CPU up to 345.2%. That exceeds my past program much more (in the past almost just 100% maybe more a little).
But the speedup is still not good.

```
// ispc
Performance counter stats for './saxpy -i':

            129.53 msec task-clock:u                     #    0.992 CPUs utilized             
                 0      context-switches:u               #    0.000 /sec                      
                 0      cpu-migrations:u                 #    0.000 /sec                      
             2,754      page-faults:u                    #   21.262 K/sec                     
       254,357,756      cycles:u                         #    1.964 GHz                       
        47,137,032      stalled-cycles-frontend:u        #   18.53% frontend cycles idle      
       680,745,469      instructions:u                   #    2.68  insn per cycle            
                                                  #    0.07  stalled cycles per insn   
       134,833,625      branches:u                       #    1.041 G/sec                     
            19,039      branch-misses:u                  #    0.01% of all branches           

// task-ispc
Performance counter stats for './saxpy -t':

            435.02 msec task-clock:u                     #    3.452 CPUs utilized             
                 0      context-switches:u               #    0.000 /sec                      
                 0      cpu-migrations:u                 #    0.000 /sec                      
             2,791      page-faults:u                    #    6.416 K/sec                     
     1,139,191,206      cycles:u                         #    2.619 GHz                       
         2,627,409      stalled-cycles-frontend:u        #    0.23% frontend cycles idle      
       695,864,736      instructions:u                   #    0.61  insn per cycle            
                                                  #    0.00  stalled cycles per insn   
       134,857,706      branches:u                       #  310.000 M/sec                     
            22,567      branch-misses:u                  #    0.02% of all branches           
```

So I still analyse the memory miss (actually L1-cache miss). I also analysed `sqrt` program, and thus we know there meets
memory boundary.

```
// sqrt
39,405      l1_dtlb_misses:u                 #    5.129 K/sec

// task-ispc
25,874      l1_dtlb_misses:u                 #   60.855 K/sec

// ispc
19,639      l1_dtlb_misses:u                 #  151.536 K/sec
```

### Part 2 try to improve

I just have an idea to pre-load some data to the cache. If our 'task 1' is doing '1 ~ 1 + span' work, we can 
load '2 ~ 2 + span' data to cache simultaneously. But I don't know how to achieve it😭.

## Program 6

*Case I can't access the myth machine, I generate data.*

```
Running K-means with: M=1000000, N=100, K=3, epsilon=0.100000
[Total Time]: 4297.427 ms
```

### Part 1 profiling

Based on profiling, we can see that the `computeAssignments` may be the boundary. And `dist` was called
the maxminum times. We can try to improve the performance of function `dist`,`computeAssignments`,`computeCentroids`,
`computeCost`(initData isn't our care)

```
Each sample counts as 0.01 seconds.
  %   cumulative   self              self     total           
 time   seconds   seconds    calls   s/call   s/call  name    
 59.48      4.62     4.62       24     0.19     0.19  computeAssignments(WorkerArgs*)
 15.19      5.80     1.18       24     0.05     0.05  computeCost(WorkerArgs*)
 14.68      6.94     1.14        1     1.14     1.14  initData(double*, int, int)
  8.75      7.62     0.68       24     0.03     0.03  computeCentroids(WorkerArgs*)
  1.67      7.75     0.13  3000000     0.00     0.00  dist(double*, double*, int)
  0.26      7.77     0.02        2     0.01     0.01  logToFile(std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, double, double*, int*, double*, int, int, int)
  0.00      7.77     0.00        4     0.00     0.00  std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >::basic_string<std::allocator<char> >(char const*, std::allocator<char> const&)
  0.00      7.77     0.00        2     0.00     0.00  CycleTimer::secondsPerTick()
  0.00      7.77     0.00        1     0.00     6.48  kMeansThread(double*, double*, int*, int, int, int, double)
  0.00      7.77     0.00        1     0.00     0.00  initCentroids(double*, int, int)
  0.00      7.77     0.00        1     0.00     0.00  readData(std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, double**, double**, int**, int*, int*, int*, double*)
  0.00      7.77     0.00        1     0.00     0.00  writeData(std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, double*, double*, int*, int*, int*, int*, double*)
```

### Part 2 SIMD dist

A simple and quick try, I make a SIMD dist using AVX2. Actually it seems reducing the time consumed about
1 seconds.

```
[Total Time]: 3024.816 ms
```

But finally it seems the SIMD dist( `distAVX2` ) is the boundary. But this is because we have so many data to compute (as the function is called 99000000 times),
and time consumed per call is near to 0s.

```
Each sample counts as 0.01 seconds.
  %   cumulative   self              self     total           
 time   seconds   seconds    calls   s/call   s/call  name    
 63.47      3.45     3.45 99000000     0.00     0.00  distAVX2(double*, double*, int)
 17.87      4.42     0.97        1     0.97     0.97  initData(double*, int, int)
 12.71      5.11     0.69       24     0.03     0.03  computeCentroids(WorkerArgs*)
  4.61      5.36     0.25       24     0.01     0.11  computeAssignments(WorkerArgs*)
  0.74      5.40     0.04       24     0.00     0.04  computeCost(WorkerArgs*)
  0.37      5.42     0.02        2     0.01     0.01  logToFile(std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, double, double*, int*, double*, int, int, int)
  0.18      5.43     0.01                             main
  0.09      5.43     0.01                             distNoSqrt(double*, double*, int)
  0.00      5.43     0.00        4     0.00     0.00  std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >::basic_string<std::allocator<char> >(char const*, std::allocator<char> const&)
  0.00      5.43     0.00        2     0.00     0.00  CycleTimer::secondsPerTick()
  0.00      5.43     0.00        1     0.00     4.32  kMeansThread(double*, double*, int*, int, int, int, double)
  0.00      5.43     0.00        1     0.00     0.00  initCentroids(double*, int, int)
  0.00      5.43     0.00        1     0.00     0.00  readData(std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, double**, double**, int**, int*, int*, int*, double*)
  0.00      5.43     0.00        1     0.00     0.00  writeData(std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, double*, double*, int*, int*, int*, int*, double*)
```

### Part 3 Multi-Thread

just compute the `computeAssignments` with 32-threads.

```
[Total Time]: 2023.298 ms # With SIMD dist
[Total Time]: 3529.115 ms # Without SIMD dist
```

this is profiling.

```
# With SIMD dist
Each sample counts as 0.01 seconds.
  %   cumulative   self              self     total           
 time   seconds   seconds    calls   s/call   s/call  name    
 56.69      2.76     2.76 29357400     0.00     0.00  distAVX2(double*, double*, int)
 20.95      3.78     1.02        1     1.02     1.02  initData(double*, int, int)
 17.46      4.63     0.85       24     0.04     0.04  computeCentroids(WorkerArgs*)
  3.08      4.78     0.15                             computeAssignmentsSingle(WorkerArgs*, double*, int, int)
  0.82      4.82     0.04       24     0.00     0.00  computeAssignmentsMutiThread(WorkerArgs*)
  0.62      4.85     0.03       24     0.00     0.10  computeCost(WorkerArgs*)
  0.41      4.87     0.02                             _init
  0.00      4.87     0.00        4     0.00     0.00  std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >::basic_string<std::allocator<char> >(char const*, std::allocator<char> const&)
  0.00      4.87     0.00        2     0.00     0.00  logToFile(std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, double, double*, int*, double*, int, int, int)
  0.00      4.87     0.00        2     0.00     0.00  CycleTimer::secondsPerTick()
  0.00      4.87     0.00        1     0.00     3.18  kMeansThread(double*, double*, int*, int, int, int, double)
  0.00      4.87     0.00        1     0.00     0.00  initCentroids(double*, int, int)
  0.00      4.87     0.00        1     0.00     0.00  readData(std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, double**, double**, int**, int*, int*, int*, double*)
  0.00      4.87     0.00        1     0.00     0.00  writeData(std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, double*, double*, int*, int*, int*, int*, double*)
```

It seems magic happens. Times of calling `distAVX2` is reduced significantly. ( But Actually I dont know why 🥹) And the iteration turns
is the same, 24-iteration.
