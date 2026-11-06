"""Gera os ícones do app em assets/ (rode com: python scripts/gerar-icones.py).

- Aquenda: "a" minúsculo em Atkinson Hyperlegible sobre ameixa, com a fita rosa e azul.
- Clima: sol e nuvem sobre azul-céu, para o modo discreto.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
ASSETS = RAIZ / "assets"
FONTE = RAIZ / "node_modules/@expo-google-fonts/atkinson-hyperlegible/700Bold/AtkinsonHyperlegible_700Bold.ttf"

AMEIXA = "#22172B"
PAPEL = "#F4F2F7"
FITA_AZUL = "#8DD3EE"
FITA_ROSA = "#F2A7BB"
CEU = "#5AA9E6"
LADO = 1024


def marca(img: Image.Image, cor_letra: str, escala: float = 1.0, fita: bool = True) -> None:
    d = ImageDraw.Draw(img)
    cx = cy = LADO / 2
    fonte = ImageFont.truetype(str(FONTE), int(560 * escala))
    caixa = d.textbbox((0, 0), "a", font=fonte)
    w, h = caixa[2] - caixa[0], caixa[3] - caixa[1]
    x = cx - w / 2 - caixa[0]
    y = cy - h / 2 - caixa[1] - 40 * escala
    d.text((x, y), "a", font=fonte, fill=cor_letra)
    if fita:
        largura = w * 1.05
        topo = y + caixa[3] + 36 * escala
        esp = 26 * escala
        d.rectangle([cx - largura / 2, topo, cx + largura / 2, topo + esp], fill=FITA_AZUL)
        d.rectangle([cx - largura / 2, topo + esp, cx + largura / 2, topo + 2 * esp], fill=FITA_ROSA)


def nuvem_sol(img: Image.Image, escala: float = 1.0, cor: str = "#FFFFFF", sol: str = "#FFD15C") -> None:
    d = ImageDraw.Draw(img)
    c = LADO / 2
    s = escala
    # sol atrás, à direita e acima
    sx, sy, r = c + 110 * s, c - 110 * s, 150 * s
    d.ellipse([sx - r, sy - r, sx + r, sy + r], fill=sol)
    # nuvem: três círculos e uma base arredondada
    for (ox, oy, rr) in [(-150, 40, 120), (10, -30, 165), (170, 60, 105)]:
        d.ellipse([c + (ox - rr) * s, c + (oy - rr) * s, c + (ox + rr) * s, c + (oy + rr) * s], fill=cor)
    d.rounded_rectangle([c - 270 * s, c + 40 * s, c + 275 * s, c + 165 * s], radius=int(62 * s), fill=cor)


def salvar(img: Image.Image, nome: str) -> None:
    img.save(ASSETS / nome)
    print("ok", nome)


def main() -> None:
    ASSETS.mkdir(exist_ok=True)

    icone = Image.new("RGB", (LADO, LADO), AMEIXA)
    marca(icone, PAPEL)
    salvar(icone, "icon.png")

    frente = Image.new("RGBA", (LADO, LADO), (0, 0, 0, 0))
    marca(frente, PAPEL, escala=0.62)
    salvar(frente, "android-icon-foreground.png")

    mono = Image.new("RGBA", (LADO, LADO), (0, 0, 0, 0))
    marca(mono, "#FFFFFF", escala=0.62, fita=False)
    salvar(mono, "android-icon-monochrome.png")

    splash = Image.new("RGBA", (LADO, LADO), (0, 0, 0, 0))
    marca(splash, AMEIXA, escala=0.9)
    salvar(splash, "splash-icon.png")

    favicon = icone.resize((48, 48), Image.LANCZOS)
    salvar(favicon, "favicon.png")

    clima = Image.new("RGB", (LADO, LADO), CEU)
    nuvem_sol(clima, escala=1.15)
    salvar(clima, "icon-clima.png")

    clima_frente = Image.new("RGBA", (LADO, LADO), (0, 0, 0, 0))
    nuvem_sol(clima_frente, escala=0.72)
    salvar(clima_frente, "icon-clima-foreground.png")


if __name__ == "__main__":
    main()
