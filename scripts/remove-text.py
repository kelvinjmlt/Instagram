# Remove o texto sobreposto à foto (preenchendo com inpainting) para animar o texto separadamente.
# Uso: python3 scripts/remove-text.py <entrada.png> <saida.png> <y_inicial> [x0,y0,x1,y1 ...]
# Os retângulos opcionais são apagados por inteiro (ex.: o selo de crédito da foto, que vira camada fixa).
# As faixas de subtítulo/rodapé abaixo foram ajustadas para a arte dos chimpanzés (1080x1440).
import sys
import cv2
import numpy as np

src, dst, y0 = sys.argv[1], sys.argv[2], int(sys.argv[3])
img = cv2.imread(src)
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
mask = np.zeros(img.shape[:2], np.uint8)
region = hsv[y0:]
bright = region[..., 2] > 150                        # texto creme/branco (a pele dos chimpanzés é mais escura)
yellow = (region[..., 0] > 15) & (region[..., 0] < 35) & (region[..., 1] > 90) & (region[..., 2] > 140)
mask[y0:][bright | yellow] = 255
# Nas faixas que são só fundo escuro (subtítulo e rodapé), pega também o antisserrilhado mais fraco.
for ya, yb in [(1120, 1300), (1330, 1400)]:
    band = hsv[ya:yb, :, 2] > 55
    mask[ya:yb][band] = 255
for box in sys.argv[4:]:
    x0, y0b, x1, y1 = map(int, box.split(','))
    mask[y0b:y1, x0:x1] = 255
mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), iterations=2)
clean = cv2.inpaint(img, mask, 9, cv2.INPAINT_TELEA)
# Da metade de baixo para o fim a arte é só um degradê vertical: refaz cada linha com a cor das margens
# (sem texto), com transição suave, para não sobrar nenhum vestígio de letra.
ya, yb = 1000, 1090
margins = np.concatenate([img[:, :70], img[:, -70:]], axis=1)
rows = np.median(margins, axis=1).astype(np.float32)
flat = np.repeat(rows[:, None, :], img.shape[1], axis=1)
alpha = np.clip((np.arange(img.shape[0]) - ya) / (yb - ya), 0, 1)[:, None, None]
clean = (clean * (1 - alpha) + flat * alpha).astype(np.uint8)
cv2.imwrite(dst, clean)
