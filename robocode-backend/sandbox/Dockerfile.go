# robocode-sandbox-go
FROM golang:1.22-alpine

COPY run.sh /run.sh
RUN chmod +x /run.sh

# Prewarm the Go build cache for the standard-library packages student
# programs commonly import, baked into a fixed path in the image so run.sh
# can seed each request's writable (tmpfs) cache from it instead of
# recompiling the standard library from scratch on every run. Without this,
# a cold-cache `go run` of a one-line "fmt" hello-world took ~46s locally
# under --cpus=1 — far over any reasonable per-request wall-clock budget.
# GOCACHE is fixed here (not the runtime /tmp/gocache) precisely so it
# survives into the image layer; run.sh copies from it at request time.
ENV GOCACHE=/opt/gocache-seed
RUN mkdir -p /tmp/prewarm && \
  printf 'package main\n\nimport (\n\t"bufio"\n\t"fmt"\n\t"math"\n\t"os"\n\t"sort"\n\t"strconv"\n\t"strings"\n\t"time"\n)\n\nfunc main() {\n\tfmt.Println(strings.ToUpper("x"), strconv.Itoa(1), sort.IntsAreSorted([]int{1}), math.Abs(1), time.Now().Unix(), bufio.NewReader(os.Stdin))\n}\n' > /tmp/prewarm/main.go && \
  go build -o /tmp/prewarm/out /tmp/prewarm/main.go && \
  rm -rf /tmp/prewarm && \
  chmod -R a+rX /opt/gocache-seed

WORKDIR /work
USER 65534
