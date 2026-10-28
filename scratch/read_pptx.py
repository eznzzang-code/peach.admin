import zipfile
import glob
import xml.etree.ElementTree as ET
import os

pptx_files = glob.glob(r"C:\Workspace\peach.admin\*20261026.pptx")
if not pptx_files:
    print("No pptx found")
    exit()

pptx_path = pptx_files[0]
print(f"Reading: {pptx_path}")

with zipfile.ZipFile(pptx_path, 'r') as z:
    for name in z.namelist():
        if name.startswith("ppt/slides/slide") and name.endswith(".xml"):
            xml_content = z.read(name)
            root = ET.fromstring(xml_content)
            # Find all a:t elements
            texts = [elem.text for elem in root.iter() if elem.tag.endswith('}t') and elem.text]
            full_text = " ".join(texts)
            if any(k in full_text for k in ["과원", "월별", "재배", "달력"]):
                print(f"=== {name} ===")
                print(full_text)
                print("-" * 50)
