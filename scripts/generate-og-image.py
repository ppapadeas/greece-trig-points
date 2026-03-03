"""Generate OG image (1200x630) for vathra.xyz social sharing."""
from PIL import Image, ImageDraw, ImageFont
import os

WIDTH, HEIGHT = 1200, 630
BG_COLOR = "#1a2744"       # dark navy
ACCENT = "#00a0b0"         # teal from brand
WHITE = "#ffffff"
LIGHT_GRAY = "#c0c8d4"
GRID_COLOR = "#2a3a5a"

img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
draw = ImageDraw.Draw(img)

# Draw subtle grid pattern (map feel)
for x in range(0, WIDTH, 40):
    draw.line([(x, 0), (x, HEIGHT)], fill=GRID_COLOR, width=1)
for y in range(0, HEIGHT, 40):
    draw.line([(0, y), (WIDTH, y)], fill=GRID_COLOR, width=1)

# Draw Greece-ish outline with dots (simplified scatter of trig points)
import random
random.seed(42)
dots = []
# Rough bounding box for Greece shape - mainland + islands
regions = [
    # mainland (lat 37-41, lon 20-26 mapped to pixels)
    (380, 100, 700, 450),
    # peloponnese
    (350, 350, 550, 520),
    # crete
    (400, 530, 700, 580),
    # eastern aegean
    (720, 150, 820, 400),
    # cyclades
    (600, 380, 750, 520),
]
for rx, ry, rx2, ry2 in regions:
    count = int((rx2 - rx) * (ry2 - ry) / 600)
    for _ in range(count):
        x = random.randint(rx, rx2)
        y = random.randint(ry, ry2)
        # Random status colors
        color = random.choice(["#28a745", "#28a745", "#28a745", "#ffc107", "#dc3545", "#6c757d", "#17a2b8"])
        size = random.choice([2, 2, 3, 3, 4])
        draw.ellipse([x - size, y - size, x + size, y + size], fill=color)

# Draw accent bar at top
draw.rectangle([0, 0, WIDTH, 6], fill=ACCENT)

# Load icon and paste it
icon_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "icon-512x512.png")
if os.path.exists(icon_path):
    icon = Image.open(icon_path).convert("RGBA")
    icon = icon.resize((80, 80), Image.LANCZOS)
    img.paste(icon, (60, 40), icon)

# Try to use system fonts, fall back to default
def get_font(size, bold=False):
    names = [
        "C:/Windows/Fonts/segoeui.ttf" if not bold else "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/arial.ttf" if not bold else "C:/Windows/Fonts/arialbd.ttf",
    ]
    for name in names:
        if os.path.exists(name):
            return ImageFont.truetype(name, size)
    return ImageFont.load_default()

font_title = get_font(64, bold=True)
font_subtitle = get_font(30)
font_cta = get_font(26, bold=True)
font_url = get_font(22)

# Site name
draw.text((160, 55), "vathra.xyz", fill=WHITE, font=font_title)

# Headline (Greek)
y = 170
draw.text((60, y), "Καταγράφουμε τα Τριγωνομετρικά", fill=WHITE, font=get_font(44, bold=True))
draw.text((60, y + 55), "Σημεία της Ελλάδας", fill=ACCENT, font=get_font(44, bold=True))

# Subtitle
draw.text((60, y + 130), "25.000+ σημεία ΓΥΣ  ·  Crowd-sourced  ·  Open Data", fill=LIGHT_GRAY, font=font_subtitle)

# Call-to-action button
cta_text = "Εξερευνήστε τον χάρτη →"
cta_y = HEIGHT - 120
cta_bbox = draw.textbbox((0, 0), cta_text, font=font_cta)
cta_w = cta_bbox[2] - cta_bbox[0] + 40
cta_h = cta_bbox[3] - cta_bbox[1] + 20
draw.rounded_rectangle([60, cta_y, 60 + cta_w, cta_y + cta_h], radius=8, fill=ACCENT)
draw.text((80, cta_y + 8), cta_text, fill=WHITE, font=font_cta)

# URL at bottom right
draw.text((WIDTH - 220, HEIGHT - 50), "vathra.xyz", fill=LIGHT_GRAY, font=font_url)

# Save
out_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "og-image.png")
img.save(out_path, "PNG", optimize=True)
print(f"Created {out_path} ({os.path.getsize(out_path)} bytes)")
