#!/usr/bin/env python3
"""Simple markdown to HTML converter for docs."""

import os
import re
from pathlib import Path

# Minimal CSS - no external frameworks
CSS = """
body {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
}
@media (prefers-color-scheme: dark) {
    body { background: #1a1a1a; color: #e0e0e0; }
    a { color: #6b9eff; }
    code { background: #2a2a2a; }
}
h1, h2, h3 { margin-top: 1.5em; }
a { color: #0066cc; text-decoration: none; }
a:hover { text-decoration: underline; }
code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }
pre { background: #f4f4f4; padding: 1em; border-radius: 4px; overflow-x: auto; }
pre code { background: none; padding: 0; }
nav { border-bottom: 1px solid #ddd; padding-bottom: 1rem; margin-bottom: 2rem; }
nav a { margin-right: 1.5rem; }
.hero { text-align: center; margin: 3rem 0; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin: 2rem 0; }
.card { border: 1px solid #ddd; padding: 1.5rem; border-radius: 8px; }
.card h3 { margin-top: 0; }
""".strip()

def simple_markdown_to_html(md_content):
    """Convert markdown to HTML using simple regex patterns."""
    html = md_content

    # Code blocks
    html = re.sub(r'```(\w+)?\n(.*?)```', r'<pre><code>\2</code></pre>', html, flags=re.DOTALL)

    # Headers
    html = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)

    # Bold and italic
    html = re.sub(r'\*\*\*(.*?)\*\*\*', r'<strong><em>\1</em></strong>', html)
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)

    # Inline code
    html = re.sub(r'`(.*?)`', r'<code>\1</code>', html)

    # Links
    html = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>', html)

    # Lists
    html = re.sub(r'^\- (.*?)$', r'<li>\1</li>', html, flags=re.MULTILINE)
    html = re.sub(r'^\d+\. (.*?)$', r'<li>\1</li>', html, flags=re.MULTILINE)
    html = re.sub(r'(<li>.*?</li>)', r'<ul>\1</ul>', html, flags=re.DOTALL)
    html = html.replace('</ul>\n<ul>', '\n')

    # Paragraphs
    html = re.sub(r'\n\n', '</p><p>', html)
    html = '<p>' + html + '</p>'

    # Clean up empty paragraphs
    html = re.sub(r'<p>\s*</p>', '', html)
    html = re.sub(r'<p>(<h[1-6]>)', r'\1', html)
    html = re.sub(r'(</h[1-6]>)</p>', r'\1', html)
    html = re.sub(r'<p>(<pre>)', r'\1', html)
    html = re.sub(r'(</pre>)</p>', r'\1', html)
    html = re.sub(r'<p>(<ul>)', r'\1', html)
    html = re.sub(r'(</ul>)</p>', r'\1', html)

    return html

def create_html_page(title, content):
    """Create a complete HTML page."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>{CSS}</style>
</head>
<body>
    <nav>
        <a href="index.html">Home</a>
        <a href="user-guide.html">User Guide</a>
        <a href="developer-guide.html">Developer Guide</a>
        <a href="architecture.html">Architecture</a>
        <a href="api-reference.html">API Reference</a>
    </nav>
    {content}
</body>
</html>"""

def main():
    docs_dir = Path('docs')
    output_dir = Path('_site')
    output_dir.mkdir(exist_ok=True)

    # Convert all markdown files
    for md_file in docs_dir.glob('*.md'):
        if md_file.name == 'README.md':
            continue

        content = md_file.read_text()
        html_content = simple_markdown_to_html(content)

        # Extract title from first h1
        title_match = re.search(r'<h1>(.*?)</h1>', html_content)
        title = title_match.group(1) if title_match else md_file.stem.replace('-', ' ').title()

        html_page = create_html_page(title, html_content)

        output_file = output_dir / md_file.with_suffix('.html').name
        output_file.write_text(html_page)
        print(f'Generated {output_file}')

    # Create index page
    index_content = """
    <div class="hero">
        <h1>📋 GitHub Projects for Obsidian</h1>
        <p>Manage GitHub Projects V2 with Kanban boards directly in Obsidian</p>
    </div>

    <div class="cards">
        <div class="card">
            <h3>📖 User Guide</h3>
            <p>Learn how to install and use the plugin</p>
            <a href="user-guide.html">Read the guide →</a>
        </div>

        <div class="card">
            <h3>🛠️ Developer Guide</h3>
            <p>Contributing and development setup</p>
            <a href="developer-guide.html">Start developing →</a>
        </div>

        <div class="card">
            <h3>🏗️ Architecture</h3>
            <p>Technical design and architecture decisions</p>
            <a href="architecture.html">Explore architecture →</a>
        </div>

        <div class="card">
            <h3>🔌 API Reference</h3>
            <p>Plugin API and extension points</p>
            <a href="api-reference.html">View API docs →</a>
        </div>
    </div>

    <h2>Quick Start</h2>
    <ol>
        <li><strong>Install:</strong> Search for "GitHub Projects" in Obsidian Community Plugins</li>
        <li><strong>Configure:</strong> Add your GitHub Personal Access Token in settings</li>
        <li><strong>Connect:</strong> Enter your organization name and project number</li>
        <li><strong>Use:</strong> Click the dashboard icon to open your project board</li>
    </ol>

    <h2>Features</h2>
    <ul>
        <li>📋 Interactive Kanban board view of GitHub Projects V2</li>
        <li>🔄 Drag & drop items between columns</li>
        <li>🔐 Secure token storage (not synced with vault)</li>
        <li>⚡ Real-time sync with configurable intervals</li>
        <li>🎨 Seamless integration with Obsidian themes</li>
        <li>📱 Full mobile support (iOS/Android)</li>
    </ul>
    """

    index_html = create_html_page('GitHub Projects for Obsidian', index_content)
    (output_dir / 'index.html').write_text(index_html)
    print('Generated index.html')

if __name__ == '__main__':
    main()
