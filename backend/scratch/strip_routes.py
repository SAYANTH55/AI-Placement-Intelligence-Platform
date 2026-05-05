import sys

with open(sys.argv[1], 'r', encoding='utf-8') as f:
    content = f.read()

cutoff_marker = '@router.get("/student/me")'
idx = content.find(cutoff_marker)
if idx != -1:
    content = content[:idx].rstrip() + '\n'
    with open(sys.argv[1], 'w', encoding='utf-8') as f:
        f.write(content)
    print('Removed /student/me routes. Lines now:', len(content.splitlines()))
else:
    print('Marker not found - already removed')
