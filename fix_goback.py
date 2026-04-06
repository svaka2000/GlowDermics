"""Replace router.back() in onPress handlers with the safe canGoBack version."""
import glob, re

files = sorted(glob.glob('app/**/*.tsx', recursive=True))
fixed = 0

for f in files:
    with open(f, 'r') as fh:
        content = fh.read()

    # Replace the most common inline pattern
    new = content.replace(
        "() => router.back()",
        "() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)"
    )

    if new != content:
        with open(f, 'w') as fh:
            fh.write(new)
        print(f'Fixed: {f}')
        fixed += 1

print(f'\nTotal files fixed: {fixed}')
