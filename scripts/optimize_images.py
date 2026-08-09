import os
from PIL import Image

image_specs = {
    'brand_logo.png': (360, 96),
    'mascot_glow_koala.png': (160, 160),
    'mascot_nano_banana.png': (160, 160),
    'glow-kit.png': (500, 500),
    'koveria-flagship.png': (500, 500),
    'glow-serum.png': (500, 500),
    'glow-mist.png': (500, 500),
    'glow-elixir.png': (500, 500),
    'pakistani_girl_facemask.png': (400, 400),
    'pakistani_girl_toner.png': (400, 400)
}

def resize_and_optimize(dir_path):
    if not os.path.exists(dir_path):
        return
    for filename, (max_w, max_h) in image_specs.items():
        filepath = os.path.join(dir_path, filename)
        if os.path.isfile(filepath):
            old_size = os.path.getsize(filepath)
            try:
                with Image.open(filepath) as img:
                    img.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
                    if img.mode in ('RGBA', 'LA'):
                        quantized = img.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
                        quantized.save(filepath, 'PNG', optimize=True)
                    else:
                        img = img.convert('RGB')
                        img.save(filepath, 'JPEG', optimize=True, quality=82)
                new_size = os.path.getsize(filepath)
                print(f"Resized & Optimized {filename} ({max_w}x{max_h}): {old_size / 1024:.2f} KB -> {new_size / 1024:.2f} KB ({((old_size - new_size) / old_size)*100:.1f}% reduction)")
            except Exception as e:
                print(f"Error optimizing {filename}: {e}")

if __name__ == '__main__':
    public_img_dir = r"c:\Users\Lenovo\Desktop\Pure Herbex\PUREHERBEX-KOVERIA-main\public\images"
    resize_and_optimize(public_img_dir)
