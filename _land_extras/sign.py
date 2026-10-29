"""임장 노트 서명: 소스의 @@SIG@@를 core 스크립트 해시로 바꿔 출력 파일을 만든다.
사용: python3 sign.py 입력.html 출력.html"""
import re, sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding="utf-8").read()
m = re.search(r'<script id="core">(.*?)</script>', s, re.S)
core = m.group(1)
assert 'const _SIG="@@SIG@@";' in core
u = core.encode("utf-16-le")
x = 2166136261
for i in range(0, len(u), 2):
    cu = u[i] | (u[i+1] << 8)
    x ^= cu
    x = (x * 16777619) & 0xFFFFFFFF
sig = "%08x" % x
s = s.replace('const _SIG="@@SIG@@";', 'const _SIG="%s";' % sig, 1)
open(dst, "w", encoding="utf-8", newline="\n").write(s)
print("signed", sig)
