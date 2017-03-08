set term png size 1024,768
set output "benchmark.png"
set xlabel "Runtime (ms)"
set ylabel "Heap Used (KB)"
plot "data-immutable.txt" using 1:($2/1024) title "Immutable" with lines, \
    "data-icepick.txt" using 1:($2/1024) title "Icepick" with lines