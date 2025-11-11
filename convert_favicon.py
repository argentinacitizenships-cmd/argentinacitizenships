from PIL import Image

src = 'favicon.png'
dst = 'favicon.ico'

sizes = [(64,64),(48,48),(32,32),(16,16)]

try:
    img = Image.open(src).convert('RGBA')
except Exception as e:
    print('ERROR_OPEN', e)
    raise

# Ensure we have multiple sizes saved in the ICO
img.save(dst, format='ICO', sizes=sizes)
print('SAVED', dst)
