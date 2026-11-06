"""Tira o fundo branco da logo original e gera os ícones do app.

Uso: python scripts/logo/recortar.py
Entrada: assets/logo-original.png (a arte da logo, fundo branco).
Saída em assets/: logo.png (recorte quadrado, transparente), mascote.png, icon.png,
android-icon-foreground.png, android-icon-monochrome.png, splash-icon.png e favicon.png.
Só o fundo ligado às bordas some; os contornos brancos de dentro do desenho ficam.
"""
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

RAIZ = Path(__file__).resolve().parents[2]
ASSETS = RAIZ / "assets"
FUNDO_ICONE = (255, 231, 212)  # pêssego da aba casa (#FFE7D4)
LIMIAR = 238


def recortar(img: Image.Image) -> Image.Image:
    rgb = img.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    fundo = bytearray(w * h)
    fila = deque()
    for x in range(w):
        fila.extend([(x, 0), (x, h - 1)])
    for y in range(h):
        fila.extend([(0, y), (w - 1, y)])
    while fila:
        x, y = fila.popleft()
        i = y * w + x
        if fundo[i]:
            continue
        r, g, b = px[x, y]
        if min(r, g, b) < LIMIAR:
            continue
        fundo[i] = 1
        if x > 0: fila.append((x - 1, y))
        if x < w - 1: fila.append((x + 1, y))
        if y > 0: fila.append((x, y - 1))
        if y < h - 1: fila.append((x, y + 1))
    mascara = Image.frombytes("L", (w, h), bytes(0 if f else 255 for f in fundo))
    # borda macia: desfoca de leve só a máscara
    mascara = mascara.filter(ImageFilter.GaussianBlur(0.8))
    saida = rgb.convert("RGBA")
    saida.putalpha(mascara)
    return saida.crop(mascara.point(lambda v: 255 if v > 20 else 0).getbbox())


def quadrado(img: Image.Image, lado: int, ocupacao: float, fundo=None) -> Image.Image:
    tela = Image.new("RGBA", (lado, lado), fundo + (255,) if fundo else (0, 0, 0, 0))
    escala = ocupacao * lado / max(img.size)
    peca = img.resize((round(img.width * escala), round(img.height * escala)), Image.LANCZOS)
    tela.alpha_composite(peca, ((lado - peca.width) // 2, (lado - peca.height) // 2))
    return tela


def main() -> None:
    logo = recortar(Image.open(ASSETS / "logo-original.png"))
    quadrado(logo, 1024, 0.96).save(ASSETS / "logo.png")
    quadrado(logo, 512, 0.98).save(ASSETS / "mascote.png")
    quadrado(logo, 1024, 0.78, FUNDO_ICONE).convert("RGB").save(ASSETS / "icon.png")
    quadrado(logo, 1024, 0.56).save(ASSETS / "android-icon-foreground.png")
    branco = Image.new("RGBA", logo.size, (255, 255, 255, 255))
    branco.putalpha(logo.getchannel("A"))
    quadrado(branco, 1024, 0.56).save(ASSETS / "android-icon-monochrome.png")
    quadrado(logo, 1024, 0.9).save(ASSETS / "splash-icon.png")
    quadrado(logo, 48, 0.92, FUNDO_ICONE).convert("RGB").save(ASSETS / "favicon.png")
    print("ok", logo.size)


if __name__ == "__main__":
    main()
