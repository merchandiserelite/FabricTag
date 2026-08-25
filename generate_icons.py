import os
from PIL import Image, ImageDraw, ImageFont

static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)

def create_pwa_icon(size, filename):
    # Create canvas with rich gradient-like background
    img = Image.new("RGBA", (size, size), (15, 23, 42, 255)) # Slate dark #0f172a
    draw = ImageDraw.Draw(img)
    
    # Draw rounded badge in the center with indigo gradient
    pad = int(size * 0.08)
    corner_radius = int(size * 0.22)
    badge_rect = [pad, pad, size - pad, size - pad]
    
    # Gradient simulation with concentric round rectangles
    draw.rounded_rectangle(badge_rect, radius=corner_radius, fill=(79, 70, 229, 255)) # Indigo #4f46e5
    
    # Top highlight for 3D depth
    highlight_rect = [pad + 4, pad + 4, size - pad - 4, int(size * 0.52)]
    draw.rounded_rectangle(highlight_rect, radius=corner_radius - 2, fill=(99, 102, 241, 180)) # Indigo lighter
    
    # Draw inner tag shape in white / sky blue
    tag_pad = int(size * 0.24)
    tag_w = size - 2 * tag_pad
    tag_h = int(tag_w * 0.8)
    tag_top = int(size * 0.28)
    
    # Tag outline / fill
    draw.rounded_rectangle(
        [tag_pad, tag_top, tag_pad + tag_w, tag_top + tag_h],
        radius=int(size * 0.08),
        fill=(255, 255, 255, 245),
        outline=(56, 189, 248, 255),
        width=int(max(2, size * 0.02))
    )
    
    # Draw mini barcode lines inside tag
    bar_top = tag_top + int(tag_h * 0.55)
    bar_bottom = tag_top + int(tag_h * 0.85)
    bar_left = tag_pad + int(tag_w * 0.12)
    bar_width = tag_w - int(tag_w * 0.24)
    
    x = bar_left
    bar_patterns = [3, 2, 4, 1, 3, 2, 5, 2, 4, 1, 3, 4, 2, 3, 1, 4]
    scale = bar_width / sum(bar_patterns)
    
    for i, w in enumerate(bar_patterns):
        actual_w = max(1, int(w * scale))
        if i % 2 == 0:
            draw.rectangle([x, bar_top, x + actual_w, bar_bottom], fill=(30, 41, 59, 255))
        x += actual_w + 1
        if x >= bar_left + bar_width:
            break
            
    # Text "FT" inside top of tag
    try:
        font = ImageFont.truetype("arial.ttf", int(size * 0.16))
    except Exception:
        font = ImageFont.load_default()
        
    draw.text((int(size * 0.36), int(tag_top + tag_h * 0.1)), "FT", fill=(79, 70, 229, 255), font=font)

    out_path = os.path.join(static_dir, filename)
    img.save(out_path, "PNG")
    print(f"Saved: {out_path} ({size}x{size})")

create_pwa_icon(192, "icon-192.png")
create_pwa_icon(512, "icon-512.png")
