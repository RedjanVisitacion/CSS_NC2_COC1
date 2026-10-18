import json, re, zipfile, posixpath
from pathlib import Path
import xml.etree.ElementTree as E

root=Path(__file__).parent
z=zipfile.ZipFile(r'C:\Users\Redjan Phil\Downloads\CSS_NCII_COC1_Real_Photos_Updated.pptx')
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
prompts={
3:'Name three input or output devices and explain what each does.',
4:'What is the motherboard and what components does it connect?',
5:'What does the CPU do, and what precautions should you take when installing it?',
6:'How do the heat sink and fan cool a CPU, and what must you check before power-on?',
7:'What is RAM, and how do you install a memory module correctly?',
8:'What does a GPU do, where is it installed, and what power connection might it need?',
9:'What does the PSU do, and what safety precautions apply when servicing a computer?',
10:'What does an HDD store, how does it connect, and how should it be handled?',
11:'What is an optical disc drive, and which interfaces might it use?',
12:'Explain the difference between SATA data and SATA power connections.',
13:'What is IDE or PATA, and what settings might older drives require?',
14:'What is the purpose of the chassis, and why do standoffs and airflow matter?',
15:'How do PCI and PCI Express differ, and what should you check before installing a card?',
16:'What is the 24-pin ATX connector used for, and how should you connect it?',
17:'What is the CPU power connector, where is it usually located, and what happens if it is disconnected?',
18:'What is the purpose of the CMOS or RTC battery?',
19:'What did the northbridge and southbridge do in older computers?',
20:'Explain POWER SW, RESET SW, HDD LED, and POWER LED connections.',
21:'Identify the uses of USB, Ethernet, HDMI, VGA, and PS/2 ports.',
22:'What do the blue, green, and pink audio jacks usually do?',
23:'Describe the precautions you take before handling internal computer components.',
24:'Walk through the basic PC assembly sequence, including checks before power-on.',
25:'What should you check and configure in BIOS or UEFI before installing an operating system?',
26:'Describe the basic OS installation process and how you verify drivers afterward.',
27:'How would you troubleshoot no power, no display, missing storage, or overheating?'
}
items=[]
for n,prompt in prompts.items():
    tree=E.fromstring(z.read(f'ppt/slides/slide{n}.xml'))
    texts=[t.text or '' for t in tree.findall('.//a:t',ns)]
    points=list(dict.fromkeys(t.lstrip('• ').strip() for t in texts if t.startswith('•')))
    image=None
    relpath=f'ppt/slides/_rels/slide{n}.xml.rels'
    if relpath in z.namelist():
        for rel in E.fromstring(z.read(relpath)):
            if rel.attrib.get('Type','').endswith('/image'):
                target=posixpath.normpath(posixpath.join('ppt/slides',rel.attrib['Target']))
                if target in z.namelist():
                    image=f'assets/slide-{n}{Path(target).suffix}'
                    (root/image).write_bytes(z.read(target)); break
    category='Hardware' if n<=19 else ('Connections' if n<=22 else 'Installation & safety')
    items.append(dict(id=n,title=texts[0],question=prompt,points=points,image=image,category=category))
(root/'content.js').write_text('window.TOPICS = '+json.dumps(items,ensure_ascii=False)+';',encoding='utf-8')
print(f'Extracted {len(items)} topics and {sum(bool(i["image"]) for i in items)} images.')
