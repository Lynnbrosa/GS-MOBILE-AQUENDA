"""Gera os ícones do app em assets/ (rode com: python scripts/gerar-icones.py).

Gera só o ícone "Clima" do modo discreto (sol e nuvem sobre azul-céu).
O ícone do Aquenda vem de scripts/logo/logo.js.
"""
from pathlib import Path

from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent
ASSETS = RAIZ / "assets"
LADO = 1024
SUPER = 4  # desenha 4x maior e reduz, para bordas lisas

LARANJA = "#FFE7D4"
CEU = "#5AA9E6"
PAPEL = "#FFFFFF"
CORES = {
    "casca": "#7A5230",
    "polpa": "#8CC63F",
    "polpaClara": "#B8E07A",
    "miolo": "#F4F7D8",
    "semente": "#2B2118",
    "olho": "#FFFFFF",
    "pupila": "#1E1B24",
    "bochecha": "#FF9DBB",
}
SEMENTES = [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320]
CENTRO = (44, 58)


def bezier(p0, p1, p2, p3, n=40):
    pts = []
    for i in range(n + 1):
        t = i / n
        a = (1 - t) ** 3
        b = 3 * (1 - t) ** 2 * t
        c = 3 * (1 - t) * t**2
        d = t**3
        pts.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return pts


def mascote(img: Image.Image, escala: float, cores=CORES, so_contorno: str | None = None) -> None:
    """Desenha no viewBox 0..100, centralizado, ocupando `escala` do lado."""
    d = ImageDraw.Draw(img)
    W = img.width
    lado = W * escala
    ox = (W - lado) / 2
    oy = (W - lado) / 2
    k = lado / 100

    def P(x, y):
        return (ox + x * k, oy + y * k)

    def cor(nome):
        return so_contorno or cores[nome]

    def circulo(cx, cy, r, c):
        x, y = P(cx, cy)
        d.ellipse([x - r * k, y - r * k, x + r * k, y + r * k], fill=c)

    def elipse(cx, cy, rx, ry, c):
        x, y = P(cx, cy)
        d.ellipse([x - rx * k, y - ry * k, x + rx * k, y + ry * k], fill=c)

    def traco(pts, largura, c):
        # um círculo a cada pedacinho do caminho: borda lisa e ponta redonda
        r = largura * k / 2
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            passos = max(2, int(((x1 - x0) ** 2 + (y1 - y0) ** 2) ** 0.5 * k / (r / 3)))
            for i in range(passos + 1):
                x, y = P(x0 + (x1 - x0) * i / passos, y0 + (y1 - y0) * i / passos)
                d.ellipse([x - r, y - r, x + r, y + r], fill=c)

    import math

    def unica(nome):
        return so_contorno or cores[nome]

    def semente(ang):
        a = math.radians(ang)
        cx, cy = CENTRO[0] + math.cos(a) * 12.5, CENTRO[1] + math.sin(a) * 12.5
        # gota fina apontando para o centro: polígono de uma elipse girada
        pts = []
        for i in range(24):
            tt = 2 * math.pi * i / 24
            ex, ey = 1.3 * math.cos(tt), 2.6 * math.sin(tt)
            rot = a  # eixo maior na direção radial
            x = cx + ex * math.cos(rot + math.pi / 2) - ey * math.sin(rot + math.pi / 2)
            y = cy + ex * math.sin(rot + math.pi / 2) + ey * math.cos(rot + math.pi / 2)
            pts.append(P(x, y))
        d.polygon(pts, fill=cores["semente"])

    tromba = bezier((60, 39), (71, 43), (72, 56), (71, 70)) + bezier((71, 70), (70.5, 80), (74, 85), (81, 83))[1:]
    # patinhas
    elipse(34, 84, 6, 5, unica("casca"))
    elipse(52, 84, 6, 5, unica("casca"))
    # orelha
    elipse(24, 43, 14, 17, unica("casca"))
    if not so_contorno:
        elipse(24.5, 43.5, 11, 14, cores["polpa"])
        elipse(25, 44, 5, 7, cores["polpaClara"])
    # tromba
    traco(tromba, 13, unica("casca"))
    if not so_contorno:
        traco(tromba, 8.5, cores["polpa"])
    # corpo
    circulo(*CENTRO, 26, unica("casca"))
    if not so_contorno:
        circulo(*CENTRO, 22.5, cores["polpa"])
        circulo(*CENTRO, 15, cores["polpaClara"])
        elipse(*CENTRO, 7.5, 6, cores["miolo"])
        for ang in SEMENTES:
            semente(ang)
        circulo(57, 44, 5.5, cores["olho"])
        circulo(58.2, 44.8, 2.8, cores["pupila"])
        circulo(60, 55, 3.2, cores["bochecha"])


def nuvem_sol(img: Image.Image, escala: float = 1.0, cor: str = "#FFFFFF", sol: str = "#FFD15C") -> None:
    d = ImageDraw.Draw(img)
    c = img.width / 2
    s = escala * img.width / LADO
    sx, sy, r = c + 110 * s, c - 110 * s, 150 * s
    d.ellipse([sx - r, sy - r, sx + r, sy + r], fill=sol)
    for (ox, oy, rr) in [(-150, 40, 120), (10, -30, 165), (170, 60, 105)]:
        d.ellipse([c + (ox - rr) * s, c + (oy - rr) * s, c + (ox + rr) * s, c + (oy + rr) * s], fill=cor)
    d.rounded_rectangle([c - 270 * s, c + 40 * s, c + 275 * s, c + 165 * s], radius=int(62 * s), fill=cor)


def novo(fundo):
    return Image.new("RGBA", (LADO * SUPER, LADO * SUPER), fundo)


def salvar(img: Image.Image, nome: str, tamanho: int = LADO) -> None:
    img = img.resize((tamanho, tamanho), Image.LANCZOS)
    if nome.endswith(".png") and nome in ("icon.png", "icon-clima.png", "favicon.png"):
        img = img.convert("RGB")
    img.save(ASSETS / nome)
    print("ok", nome)


def main() -> None:
    """Só o ícone do modo discreto. O do Aquenda sai de scripts/logo/logo.js (SVG com textura)."""
    ASSETS.mkdir(exist_ok=True)

    clima = novo(CEU)
    nuvem_sol(clima, escala=1.15)
    salvar(clima, "icon-clima.png")

    clima_frente = novo((0, 0, 0, 0))
    nuvem_sol(clima_frente, escala=0.72)
    salvar(clima_frente, "icon-clima-foreground.png")


if __name__ == "__main__":
    main()
