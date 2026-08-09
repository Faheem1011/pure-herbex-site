import os
from PIL import Image

def optimize_directory(dir_path):
    if not os.path.exists(dir_path):
        return
    for filename in os.listdir(dir_path):
        filepath = os.path.join(dir_path, filename)
        if os.path.isfile(filepath) and filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            old_size = os.path.getsize(filepath)
            try:
                with Image.open(filepath) as img:
                    max_dim = 800
                    if img.width > max_dim or img.height > max_dim:
                        img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

                    if img.mode in ('RGBA', 'LA'):
                        quantized = img.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
                        quantized.save(filepath, 'PNG', optimize=True)
                    else:
                        img = img.convert('RGB')
                        img.save(filepath, 'JPEG', optimize=True, quality=80)
                new_size = os.path.getsize(filepath)
                print(f"Compressed {filename}: {old_size / 1024:.2f} KB -> {new_size / 1024:.2f} KB ({((old_size - new_size) / old_size)*100:.1f}% reduction)")
            except Exception as e:
                print(f"Error optimizing {filename}: {e}")

if __name__ == '__main__':
    public_img_dir = r"c:\Users\Lenovo\Desktop\Pure Herbex\PUREHERBEX-KOVERIA-main\public\images"
    optimize_directory(public_img_dir)
