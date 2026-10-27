# 韓國風裝飾插圖產生器（原創 SVG）
# 風格參考：扁平的韓國傳統插畫——條狀雲紋、花紋圓章、노리개、層層山丘、圓月柿子枝、框角。
# 頂部橫幅用的是 Magnific（magnific.com）的免費插圖 img/deco/seollal.svg（不是這支程式產生的）。
# 執行：python3 tools/kr-deco.py   會把圖寫到 img/deco/
import math, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'img', 'deco')
os.makedirs(OUT, exist_ok=True)

def save(name, w, h, body, extra=''):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"{extra}>{body}</svg>'
    open(os.path.join(OUT, name), 'w').write(svg)

def n(v): return f'{v:.1f}'.rstrip('0').rstrip('.')

# ---------- 條狀雲（구름）：幾條圓頭的橫條錯開疊在一起 ----------
def cloud(bars, fill, stroke=None):
    s = ''
    for x, y, w, h in bars:
        st = f' stroke="{stroke}" stroke-width="1.5"' if stroke else ''
        s += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" fill="{fill}"{st}/>'
    return s

CLOUD_A = [(46, 2, 118, 15), (0, 21, 214, 17), (74, 44, 104, 14)]
CLOUD_B = [(0, 2, 96, 13), (30, 19, 140, 15)]

# ---------- 花紋圓章（꽃문양）：外圈＋花瓣＋中心 ----------
def medallion(cx, cy, r, color, petals=8, sw=1.4):
    s = f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{color}" stroke-width="{sw}"/>'
    s += f'<circle cx="{cx}" cy="{cy}" r="{n(r * .86)}" fill="none" stroke="{color}" stroke-width="{sw * .6}"/>'
    for i in range(petals):
        a = 2 * math.pi * i / petals
        px, py = cx + math.cos(a) * r * .42, cy + math.sin(a) * r * .42
        s += (f'<ellipse cx="{n(px)}" cy="{n(py)}" rx="{n(r * .36)}" ry="{n(r * .17)}" transform="rotate({n(math.degrees(a))} {n(px)} {n(py)})" '
              f'fill="none" stroke="{color}" stroke-width="{sw * .8}"/>')
    s += f'<circle cx="{cx}" cy="{cy}" r="{n(r * .14)}" fill="{color}"/>'
    return s

def sparkle(x, y, r, c):
    return ''.join(f'<path d="M{x} {y} L{n(x + math.cos(a) * r)} {n(y + math.sin(a) * r)}" stroke="{c}" stroke-width="1.1" stroke-linecap="round"/>'
                   for a in [k * math.pi / 4 for k in range(8)])

# 單元橫幅右側（拱門窗左邊）的裝飾：兩個圓章、條狀雲、小星
hero = (medallion(48, 40, 30, '#a9bfa4') + medallion(104, 82, 18, '#5b5f78', 6) + medallion(158, 34, 14, '#e2a08c', 8, 1.2)
        + cloud([(120, 66, 70, 10), (146, 80, 56, 10)], 'none', '#e8b9a6') + sparkle(16, 96, 7, '#e2a08c') + sparkle(176, 98, 5, '#a9bfa4'))
save('hero-deco.svg', 200, 120, hero)
save('hero-deco-dk.svg', 200, 120, hero.replace('#a9bfa4', '#6f8a6b').replace('#5b5f78', '#8a8fb0').replace('#e2a08c', '#b9786a').replace('#e8b9a6', '#8a5f55'))

# ---------- 層層山丘（單元橫幅底部）：粉、鼠尾草綠、藏青點點、茶色 ----------
pat = ('<defs><pattern id="d" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".9" fill="#ffffff" fill-opacity=".35"/>'
       '<circle cx="7" cy="7" r=".9" fill="#ffffff" fill-opacity=".25"/></pattern>'
       '<pattern id="w" width="12" height="8" patternUnits="userSpaceOnUse"><path d="M0 6 Q3 2 6 6 T12 6" fill="none" stroke="#ffffff" stroke-opacity=".3" stroke-width=".8"/></pattern></defs>')
def hills(c):
    return (pat + f'<path d="M0 40 V24 C120 8 220 6 330 22 C420 34 480 30 600 18 V40Z" fill="{c[0]}"/>'
            f'<path d="M0 40 V24 C120 8 220 6 330 22 C420 34 480 30 600 18 V40Z" fill="url(#w)"/>'
            f'<path d="M180 40 C260 14 360 10 470 24 C520 30 560 26 600 22 V40Z" fill="{c[1]}"/>'
            f'<path d="M380 40 C440 22 520 14 600 14 V40Z" fill="{c[2]}"/><path d="M380 40 C440 22 520 14 600 14 V40Z" fill="url(#d)"/>'
            f'<path d="M0 40 V32 C70 22 150 22 240 34 L250 40Z" fill="{c[3]}"/>')
save('hero-hills.svg', 600, 40, hills(['#efc9bb', '#b6c9b1', '#4f5874', '#a8876f']), ' preserveAspectRatio="none"')
save('hero-hills-dk.svg', 600, 40, hills(['#4a3631', '#33433a', '#2c3247', '#4a3c32']), ' preserveAspectRatio="none"')

# ---------- 노리개：絲線、繩結、流蘇 ----------
def norigae(c1, c2):
    knot = ''.join(f'<circle cx="{n(14 + math.cos(a) * 5)}" cy="{n(40 + math.sin(a) * 5)}" r="4" fill="none" stroke="{c1}" stroke-width="1.6"/>'
                   for a in [k * math.pi / 2 + math.pi / 4 for k in range(4)])
    tassel = ''.join(f'<path d="M{x} 70 L{n(14 + (x - 14) * 1.5)} 104" stroke="{c1}" stroke-width="1.2"/>' for x in range(10, 19, 2))
    return (f'<path d="M14 0V32" stroke="{c1}" stroke-width="1.2"/>{knot}<circle cx="14" cy="40" r="2.4" fill="{c2}"/>'
            f'<path d="M14 49V56" stroke="{c1}" stroke-width="1.2"/><circle cx="14" cy="60" r="4" fill="{c2}"/>'
            f'<rect x="9" y="64" width="10" height="7" rx="2" fill="{c1}"/>{tassel}')
save('norigae.svg', 28, 106, norigae('#e2a08c', '#f3cdbf'))
save('norigae-dk.svg', 28, 106, norigae('#b9786a', '#6e4a42'))

# ---------- 首頁主打卡片：圓月＋柿子枝 ----------
branch = ('<circle cx="112" cy="70" r="56" fill="#f8d36b"/><circle cx="112" cy="70" r="56" fill="none" stroke="#f3c252" stroke-width="3"/>'
          '<path d="M0 34 C30 36 58 46 80 62 C98 75 120 82 150 84 M44 42 C52 30 66 24 80 24 M80 62 C84 76 82 90 74 100 M112 80 C120 92 132 98 146 100" '
          'stroke="#6b4a36" stroke-width="3.2" stroke-linecap="round" fill="none"/>')
for x, y in [(60, 52), (88, 70), (74, 100), (124, 88), (146, 100), (80, 26)]:
    branch += f'<circle cx="{x}" cy="{y + 7}" r="6.5" fill="#e8743b"/><path d="M{x - 3} {y + 1} L{x + 3} {y + 1}" stroke="#5d7a3c" stroke-width="2.2" stroke-linecap="round"/>'
for x, y, a in [(30, 36, -20), (100, 78, 20), (132, 92, 10), (58, 32, -40)]:
    branch += f'<ellipse cx="{x}" cy="{y}" rx="9" ry="3.6" transform="rotate({a} {x} {y})" fill="#7c9a52"/>'
save('moon-persimmon.svg', 170, 130, branch)

# ---------- 框角（四個角的階梯狀框線） ----------
FR = '#d6bfa4'
def corner(rot):
    p = 'M1 22 V1 H22 M6 22 V6 H22 M6 12 H12 V6'
    return f'<g transform="rotate({rot} 12 12)"><path d="{p}" fill="none" stroke="{FR}" stroke-width="1.3"/></g>'
for nm, r in [('tl', 0), ('tr', 90), ('br', 180), ('bl', 270)]:
    save(f'frame-{nm}.svg', 24, 24, corner(r))

# ---------- 頁面背景：很淡的條狀雲和小星，可以重複鋪滿 ----------
bg = (f'<g fill="none" stroke="#efe2d0" stroke-width="1.2">'
      f'<rect x="40" y="70" width="90" height="11" rx="5.5"/><rect x="66" y="86" width="64" height="11" rx="5.5"/>'
      f'<rect x="420" y="300" width="100" height="11" rx="5.5"/><rect x="396" y="316" width="74" height="11" rx="5.5"/></g>'
      + sparkle(520, 120, 5, '#efe0cc') + sparkle(230, 470, 4, '#efe0cc'))
save('bg-pattern.svg', 600, 520, bg)
save('bg-pattern-dk.svg', 600, 520, bg.replace('#efe2d0', '#26231f').replace('#efe0cc', '#2a2621'))
print('ok', sorted(os.listdir(OUT)))
