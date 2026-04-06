"""
Fix unescaped apostrophes ONLY in JS string literal values.
Targets: property values like `key: 'text with it's'`
Skips: JSX text content, TypeScript types, imports, etc.

A JS string value line looks like one of:
  someKey: 'content',
  someKey: 'content'
  const x = 'content';
  ['item', 'another item']

We ONLY touch lines that start (after whitespace) with an identifier/bracket
followed by `: '` or `= '` or just `'` in an array context.

A safe heuristic: only process lines where the FIRST single-quote on the line
is a string delimiter (i.e., preceded by `: `, `= `, `[ `, `, `, or `( `),
not JSX content lines (which are just plain text with no JS syntax).
"""
import glob, re

def is_js_string_line(line):
    """
    Returns True if this line contains a JS string literal that could have
    an unescaped apostrophe. We look for the pattern:
    - (colon|equals|open-bracket|comma|open-paren) then optional space then single-quote
    """
    stripped = line.strip()
    # Skip lines that are JSX elements or text fragments
    if stripped.startswith('<') or stripped.startswith('{/*') or stripped.startswith('//'):
        return False
    # Skip import lines
    if stripped.startswith('import ') or stripped.startswith('export '):
        return False
    # Must have word-apostrophe pattern
    if not re.search(r"[a-zA-Z]'[a-zA-Z]", line):
        return False
    # Must have a JS string-start pattern before the problematic apostrophe
    if re.search(r"(?::\s*|=\s*|\[\s*|,\s*|\(\s*)'", line):
        return True
    return False

def fix_line(line):
    """
    For each JS string value on the line, if it contains a word apostrophe,
    convert from single-quotes to double-quotes.
    We only process strings that follow : = [ , (
    """
    result = []
    i = 0
    n = len(line)

    while i < n:
        c = line[i]

        # Look for string-start contexts: after ': ' or '= ' or '[ ' or ', ' or '( '
        if c == "'" and i > 0:
            # Check what precedes this quote (skip whitespace backward)
            prev = line[i-1]
            is_string_start = prev in (':', '=', '[', ',', '(', ' ')

            if is_string_start:
                # Collect the string content until the real closing quote
                j = i + 1
                inner = []
                found_word_apostrophe = False

                while j < n:
                    ch = line[j]
                    if ch == "'" and ch != '\n':
                        prev_ch = line[j-1] if j > 0 else ''
                        next_ch = line[j+1] if j+1 < n else ''
                        # Word apostrophe: letter before AND letter after
                        if prev_ch.isalpha() and next_ch.isalpha():
                            inner.append(ch)
                            found_word_apostrophe = True
                            j += 1
                            continue
                        else:
                            # Real closing quote
                            j += 1
                            break
                    elif ch == '\n':
                        # Don't consume newlines — this isn't a multi-line string
                        break
                    else:
                        inner.append(ch)
                        j += 1

                inner_str = ''.join(inner)

                if found_word_apostrophe and '"' not in inner_str:
                    result.append('"' + inner_str + '"')
                else:
                    result.append("'" + inner_str + "'")

                i = j
                continue

        result.append(c)
        i += 1

    return ''.join(result)

files = sorted(glob.glob('app/**/*.tsx', recursive=True))
total_fixed_files = 0

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        original_lines = f.readlines()

    new_lines = []
    file_changed = False

    for line in original_lines:
        if is_js_string_line(line):
            new_line = fix_line(line)
        else:
            new_line = line

        if new_line != line:
            file_changed = True
        new_lines.append(new_line)

    if file_changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f'Fixed: {filepath}')
        total_fixed_files += 1

print(f'Total files fixed: {total_fixed_files}')
