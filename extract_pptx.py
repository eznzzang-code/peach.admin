import zipfile
import xml.etree.ElementTree as ET
import re

pptx = '복숭아자조금_PC관리자_화면기획서_개발전달용_20261023.pptx'
with zipfile.ZipFile(pptx) as z:
    slides = [name for name in z.namelist() if name.startswith('ppt/slides/slide') and name.endswith('.xml')]
    def get_num(s):
        m = re.search(r'slide(\d+)\.xml', s)
        return int(m.group(1)) if m else 0
    slides.sort(key=get_num)
    print(f'Total slides: {len(slides)}')
    with open('pptx_summary.txt', 'w', encoding='utf-8') as out:
        for s in slides:
            content = z.read(s).decode('utf-8')
            root = ET.fromstring(content)
            # Find all a:t elements (draw text)
            ns = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}
            texts = [node.text for node in root.findall('.//a:t', ns) if node.text and node.text.strip()]
            s_num = get_num(s)
            line = f"=== Slide {s_num} ===\n" + "\n".join(texts) + "\n\n"
            out.write(line)
print("Done writing pptx_summary.txt")
