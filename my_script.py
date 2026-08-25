import re

with open('app.js', 'r') as f:
    content = f.read()

# find all loop-based appending to DOM
matches = re.finditer(r'forEach\s*\(\s*(.*?)\s*=>\s*\{(.*?)\}\s*\)', content, re.DOTALL)
for match in matches:
    body = match.group(2)
    if 'appendChild' in body or 'innerHTML +=' in body:
        print(body[:100] + '...')
