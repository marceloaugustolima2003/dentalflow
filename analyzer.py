import re

with open('app.js', 'r') as f:
    content = f.read()

print("--- appendChild or addEventListener in forEach ---")
matches = re.finditer(r'forEach\s*\(\s*(.*?)\s*=>\s*\{(.*?)\}\s*\)', content, re.DOTALL)
for match in matches:
    body = match.group(2)
    if 'appendChild' in body or 'innerHTML +=' in body or 'addEventListener' in body:
        # Check if there is addEventListener
        if 'addEventListener' in body:
            print(f"Potential memory leak with addEventListener: {body[:100]}...")
        if 'appendChild' in body:
            print(f"Reflow potential with appendChild: {body[:100]}...")

print("--- localStorage ---")
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'localStorage' in line:
        print(f"Line {i+1}: {line.strip()}")
