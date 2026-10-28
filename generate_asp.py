import re
import os

pages = [
    {
        "src": "contents-create.html",
        "dest": "contents-create.asp",
        "menu": "contents-notice",
        "group": "contents"
    },
    {
        "src": "contents-edit.html",
        "dest": "contents-edit.asp",
        "menu": "contents-notice",
        "group": "contents"
    },
    {
        "src": "orchard-content.html",
        "dest": "orchard-content.asp",
        "menu": "orchard-content",
        "group": "content-hub"
    },
    {
        "src": "monthly-content-form.html",
        "dest": "monthly-content-form.asp",
        "menu": "orchard-content",
        "group": "content-hub"
    },
    {
        "src": "cultivation-content.html",
        "dest": "cultivation-content.asp",
        "menu": "cultivation-content",
        "group": "content-hub"
    },
    {
        "src": "videos-list.html",
        "dest": "videos-list.asp",
        "menu": "videos",
        "group": ""
    },
    {
        "src": "videos-detail.html",
        "dest": "videos-detail.asp",
        "menu": "videos",
        "group": ""
    },
    {
        "src": "permissions.html",
        "dest": "permissions.asp",
        "menu": "permissions",
        "group": ""
    },
    {
        "src": "permissions-edit.html",
        "dest": "permissions-edit.asp",
        "menu": "permissions",
        "group": ""
    },
    {
        "src": "home-content-preview.html",
        "dest": "home-content-preview.asp",
        "menu": "home",
        "group": ""
    }
]

common_scripts = [
    "mock-data.js", "content-store.js", "resource-store.js", "common.js", "components.js"
]

for p in pages:
    src_path = p["src"]
    if not os.path.exists(src_path):
        print(f"Skipping {src_path} (not found)")
        continue
    with open(src_path, "r", encoding="utf-8") as f:
        html = f.read()

    # Extract Title
    title_m = re.search(r"<title>(.*?)(?:\||\-|<)", html)
    title = title_m.group(1).strip() if title_m else ""

    # Extract body data-page
    page_m = re.search(r'<body[^>]*data-page=["\']([^"\']+)["\']', html)
    page_id = page_m.group(1) if page_m else ""

    # Extract main content and modals
    # Find start of <main
    main_start = html.find("<main")
    # Find end of modals or last </div> before scripts
    # Look for scripts
    script_pos = html.rfind("<script")
    
    # We want content from <main to just before the first script after main
    main_to_end = html[main_start:script_pos]
    
    # In main_to_end, let's remove closing </div>\s*</div> of layout if present
    # Usually it ends with </div>\s*</div>\s*(<div class="modal".*?)?
    # Let's clean up layout closing tags because footer.asp has:
    # </div><!-- /.layout__body -->
    # </div><!-- /.layout -->
    
    # Find all scripts
    scripts = re.findall(r'<script[^>]*src=["\']([^"\']+)["\'][^>]*></script>', html[script_pos:])
    extra_scripts = [s for s in scripts if not any(c in s for c in common_scripts)]

    # Clean up main_to_end
    # If it ends with modals, modals are outside layout in the original html!
    # Let's check where `</main>` is and where `<div class="modal"` is.
    main_end_pos = main_to_end.find("</main>") + len("</main>")
    main_content = main_to_end[:main_end_pos]
    rest_content = main_to_end[main_end_pos:]

    # Remove the </div>\s*</div> of .layout__body and .layout
    # Typically: </main>\s*</div>\s*</div>\s*(<div class="modal"...)
    # Replace those two closing divs
    cleaned_rest = re.sub(r'^\s*</div>\s*</div>', '', rest_content, flags=re.DOTALL)

    body_content = main_content + "\n" + cleaned_rest.strip()

    # Convert .html links in href to .asp
    # e.g., href="contents-list.html" -> href="contents-list.asp"
    # href="contents-create.html" -> href="contents-create.asp"
    # etc. But leave ../../../../peach-web/index.html unchanged
    def replace_link(match):
        prefix = match.group(1)
        url = match.group(2)
        if "peach-web" in url or url.startswith("http"):
            return match.group(0)
        new_url = re.sub(r'([a-zA-Z0-9_-]+)\.html', r'\1.asp', url)
        return f'{prefix}="{new_url}"'

    body_content = re.sub(r'(href|action)=["\']([^"\']+)["\']', replace_link, body_content)

    script_lines = []
    for s in extra_scripts:
        script_lines.append(f'<script src="{s}"></script>')
    extra_script_asp = " & vbCrLf & _\n              ".join([f'"{s}"' for s in script_lines]) if script_lines else '""'

    asp_code = f'''<%@ Language="VBScript" CodePage="65001" %>
<!--#include file="inc/common.asp"-->
<%
Dim pageTitle, pageId, currentMenu, currentMenuGroup, extraCss, extraScript
pageTitle = "{title}"
pageId = "{page_id}"
currentMenu = "{p['menu']}"
currentMenuGroup = "{p['group']}"
extraCss = ""
%>
<!--#include file="inc/header.asp"-->
<!--#include file="inc/sidebar.asp"-->

{body_content}

<%
extraScript = {extra_script_asp}
%>
<!--#include file="inc/footer.asp"-->
'''
    with open(p["dest"], "w", encoding="utf-8") as out:
        out.write(asp_code)
    print(f"Generated {p['dest']}")
