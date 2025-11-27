#!/usr/bin/env python3
"""Simple markdown to HTML converter for docs."""

import os
import re
from pathlib import Path

# Minimal CSS - no external frameworks
CSS = """
:root {
    --bg: #ffffff;
    --bg-secondary: #f8f9fa;
    --text: #1a1a2e;
    --text-muted: #6c757d;
    --border: #e1e4e8;
    --link: #0066cc;
    --link-hover: #004499;
    --code-bg: #f1f3f5;
    --code-text: #d63384;
    --pre-bg: #1e1e2e;
    --pre-text: #cdd6f4;
    --card-shadow: 0 2px 8px rgba(0,0,0,0.08);
    --card-hover-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
@media (prefers-color-scheme: dark) {
    :root {
        --bg: #0d1117;
        --bg-secondary: #161b22;
        --text: #e6edf3;
        --text-muted: #8b949e;
        --border: #30363d;
        --link: #58a6ff;
        --link-hover: #79b8ff;
        --code-bg: #21262d;
        --code-text: #f97583;
        --pre-bg: #161b22;
        --pre-text: #c9d1d9;
        --card-shadow: 0 2px 8px rgba(0,0,0,0.3);
        --card-hover-shadow: 0 4px 16px rgba(0,0,0,0.4);
    }
}
* { box-sizing: border-box; }
body {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.7;
    color: var(--text);
    background: var(--bg);
}
h1, h2, h3 {
    margin-top: 2em;
    margin-bottom: 0.5em;
    font-weight: 600;
    line-height: 1.3;
}
h1 { font-size: 2.25rem; }
h2 { font-size: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
h3 { font-size: 1.25rem; }
a { color: var(--link); text-decoration: none; transition: color 0.2s; }
a:hover { color: var(--link-hover); text-decoration: underline; }
p { margin: 1em 0; }
code {
    background: var(--code-bg);
    color: var(--code-text);
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-family: "SF Mono", "Fira Code", Consolas, monospace;
    font-size: 0.875em;
}
pre {
    background: var(--pre-bg);
    color: var(--pre-text);
    padding: 1.25em;
    border-radius: 8px;
    overflow-x: auto;
    font-size: 0.875em;
    line-height: 1.6;
    border: 1px solid var(--border);
}
pre code {
    background: none;
    color: inherit;
    padding: 0;
    font-size: inherit;
}
nav {
    border-bottom: 1px solid var(--border);
    padding-bottom: 1rem;
    margin-bottom: 2rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
}
nav a {
    padding: 0.25rem 0;
    font-weight: 500;
}
.hero {
    text-align: center;
    margin: 3rem 0;
    padding: 2rem;
    background: var(--bg-secondary);
    border-radius: 12px;
    border: 1px solid var(--border);
}
.hero h1 { margin-top: 0; }
.hero p { color: var(--text-muted); font-size: 1.125rem; }
.cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
}
.card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: var(--card-shadow);
    transition: transform 0.2s, box-shadow 0.2s;
}
.card:hover {
    transform: translateY(-2px);
    box-shadow: var(--card-hover-shadow);
}
.card h3 { margin-top: 0; margin-bottom: 0.5rem; }
.card p { color: var(--text-muted); margin: 0.5rem 0 1rem; font-size: 0.95rem; }
.card a { font-weight: 500; }
ul, ol { padding-left: 1.5em; margin: 1em 0; }
li { margin: 0.5em 0; }
li strong { color: var(--text); }
@media (max-width: 600px) {
    body { padding: 1rem; }
    h1 { font-size: 1.75rem; }
    h2 { font-size: 1.25rem; }
    .hero { padding: 1.5rem; margin: 2rem 0; }
}
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
