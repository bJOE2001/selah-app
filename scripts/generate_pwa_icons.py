import os
from PIL import Image

def generate_icons():
    src_icon_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'images', 'icon.png')
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
    os.makedirs(out_dir, exist_ok=True)
    
    img = Image.open(src_icon_path).convert('RGBA')
    
    # 1. 192x192
    icon_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
    icon_192.save(os.path.join(out_dir, 'icon-192.png'), format='PNG')
    print('Generated icon-192.png')
    
    # 2. 512x512
    icon_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save(os.path.join(out_dir, 'icon-512.png'), format='PNG')
    print('Generated icon-512.png')
    
    # 3. 180x180 (Apple Touch Icon)
    apple_icon = img.resize((180, 180), Image.Resampling.LANCZOS)
    apple_icon.save(os.path.join(out_dir, 'apple-touch-icon.png'), format='PNG')
    print('Generated apple-touch-icon.png')
    
    # 4. 64x64 (Favicon)
    favicon = img.resize((64, 64), Image.Resampling.LANCZOS)
    favicon.save(os.path.join(out_dir, 'favicon.png'), format='PNG')
    print('Generated favicon.png')

    # 5. 512x512 Maskable Icon (safe zone is inner 80% circle/box, with #377333 bg)
    bg_color = (55, 115, 51, 255) # #377333
    maskable = Image.new('RGBA', (512, 512), bg_color)
    # Scale inner to 80% (410x410)
    inner_size = 410
    inner_img = img.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
    offset = ((512 - inner_size) // 2, (512 - inner_size) // 2)
    maskable.paste(inner_img, offset, inner_img)
    maskable.save(os.path.join(out_dir, 'icon-512-maskable.png'), format='PNG')
    print('Generated icon-512-maskable.png')

if __name__ == '__main__':
    generate_icons()
