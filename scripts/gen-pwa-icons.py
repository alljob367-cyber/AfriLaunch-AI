#!/usr/bin/env python3
"""Generate PWA icons for AfriLaunch AI: 192px, 512px, apple-touch-icon 180px."""
from PIL import Image, ImageDraw, ImageFont
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/..')

for size, fname in [(192, 'icon-192.png'), (512, 'icon-512.png'), (180, 'apple-touch-icon.png')]:
    img = Image.new('RGBA', (size, size), (5, 5, 8, 255))
    draw = ImageDraw.Draw(img)
    # Gradient background (simplified: cyan -> violet vertical)
    for y in range(size):
        ratio = y / size
        r = int(34 + (124 - 34) * ratio)    # 22 -> 7c (cyan -> violet)
        g = int(211 + (132 - 211) * ratio)  # d3 -> 84
        b = int(238 + (247 - 238) * ratio)  # ee -> f7
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    # Draw "A" letter centered
    try:
        font_size = int(size * 0.6)
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
    except Exception:
        font = ImageFont.load_default()
    text = 'A'
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1]
    draw.text((x, y), text, fill='white', font=font)
    img.save(f'public/{fname}')
    print(f'Created public/{fname}')
