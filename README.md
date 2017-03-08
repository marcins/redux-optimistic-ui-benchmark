# redux-optimistic-ui Benchmarking

This is a set of scripts / tools for benchmarking the [redux-optimistic-ui library](https://github.com/mattkrick/redux-optimistic-ui).

Based on the original GitHub issue here: https://github.com/mattkrick/redux-optimistic-ui/issues/21

## Usage

Easiest way to get the `redux-optimistic-ui` dependency is to use `yarn link`, in your clone of
redux-optimistic-ui run `yarn link`. In the clone of this repository run `yarn link redux-optimistic-ui`.

This lets you make changes in `redux-optimistic-ui`, rebuild, and run the benchmark again.

To run the benchmark run `yarn run benchmark`.

It will produce a file called `heapstats.txt` which contains GC / heap data in a format that can be
used with gnuplot. When testing between icepick / immutable I'd copy this to either `data-icepick.txt`
or `data-immutable.txt` after the run.

There is a gnuplot script that will read and chart data from two files: `data-icepick.txt`
and `data-immutable.txt`. Run `gnuplot benchmark.p` to generate a chart in `benchmark.png`
