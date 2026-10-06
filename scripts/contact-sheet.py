# Gera uma prévia (grade) dos slides de um post: python3 scripts/contact-sheet.py <pasta> <saida.png>
import sys, glob
from PIL import Image
files = sorted(glob.glob(sys.argv[1] + '/slides/*.png'))
cols = 5
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (360 * cols, 450 * rows), '#000')
for k, f in enumerate(files):
    sheet.paste(Image.open(f).resize((360, 450)), ((k % cols) * 360, (k // cols) * 450))
sheet.save(sys.argv[2])
