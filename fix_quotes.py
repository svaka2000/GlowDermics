import glob

files = glob.glob('app/**/*.tsx', recursive=True)
fixed = []

for f in files:
    with open(f, 'rb') as fh:
        original = fh.read()

    content = original
    content = content.replace(b'\xe2\x80\x99', b"'")   # right single curly apostrophe
    content = content.replace(b'\xe2\x80\x98', b"'")   # left single curly quote
    content = content.replace(b'\xe2\x80\x9c', b'"')   # left double curly quote
    content = content.replace(b'\xe2\x80\x9d', b'"')   # right double curly quote

    if content != original:
        with open(f, 'wb') as fh:
            fh.write(content)
        fixed.append(f)

print('Fixed:')
for f in fixed:
    print(' ', f)
print(f'Total: {len(fixed)} files')
