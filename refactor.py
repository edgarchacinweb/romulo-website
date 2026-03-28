import os
import re

base_path = "C:/Users/pc/Documents/proyecto/romulo-website/app/admin"

# Regex patterns
aside_pattern = re.compile(r'<aside class="sidebar">.*?</aside>', re.DOTALL)
main_pattern = re.compile(r'<main class="main">')
body_close_pattern = re.compile(r'</body>')
head_close_pattern = re.compile(r'</head>')

for root, dirs, files in os.walk(base_path):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Skip if already modified
            if 'navbar-container' in content:
                continue
                
            # Replace aside
            new_aside = '''<header id="navbar-container" class="navbar-wrapper"></header>
  <div class="layout-main">
    <aside id="sidebar-container" class="sidebar-wrapper"></aside>'''
            content = aside_pattern.sub(new_aside, content)

            # Replace main class
            content = main_pattern.sub('<main class="content-wrapper main">', content)

            # Add closing div before body
            content = body_close_pattern.sub('  </div>\n</body>', content)

            # Add css and js links before </head>
            links = '''  <link rel="stylesheet" href="/src/styles/layout.css" />
  <script src="/src/scripts/layout.js" defer></script>
</head>'''
            content = head_close_pattern.sub(links, content)

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

print("Modification complete!")
