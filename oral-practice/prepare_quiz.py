import json,shutil
from pathlib import Path
r=Path('oral-practice'); d=Path(r'C:\Users\Redjan Phil\Downloads')
rows=[('images (23).jpg','Front-panel connectors','Connections'),('images (22).jpg','Northbridge','Components'),('images (21).jpg','Southbridge','Components'),('images (20).jpg','CMOS / RTC battery','Components'),('images (19).jpg','4-pin CPU power connector','Connections'),('images (18).jpg','24-pin ATX power connector','Connections'),('IDE_Connector-c0e876cf-300x200.jpg','IDE / PATA connector','Connections'),('istockphoto-1200023270-612x612.jpg','RAM module','Components'),('images (17).jpg','SATA ports','Connections'),('images (16).jpg','PCI slots','Connections'),('pcie-gen6-01.jpg','PCI Express slots','Connections'),('images (15).jpg','Motherboard','Components'),('images (14).jpg','Computer chassis / case','Components'),('images (13).jpg','SATA data cable','Connections'),('images (12).jpg','IDE / PATA ribbon cable','Connections'),('images (11).jpg','Optical disc drive','Components'),('images (10).jpg','Hard disk drive (HDD)','Components'),('images (9).jpg','Power supply unit (PSU)','Components'),('images (8).jpg','Graphics card / video card','Components'),('images (7).jpg','RAM module','Components'),('images (6).jpg','CPU cooler (heat sink and fan)','Cooling'),('images (5).jpg','CPU cooler (heat sink and fan)','Cooling'),('images (4).jpg','CPU / processor','Components')]
items=[]
for i,(f,a,c) in enumerate(rows,1):
 image=f'assets/quiz-{i}.jpg';shutil.copy2(d/f,r/image);items.append(dict(id=i,image=image,answer=a,category=c))
for f,t in [('481115172_654560880556531_6115142837076586667_n.jpg','author.jpg'),('external-parts-of-a-computer.jpg','external-reference.jpg'),('what-is-a-back-panel.jpg','rear-reference.jpg')]:shutil.copy2(d/f,r/'assets'/t)
(r/'quiz-data.js').write_text('window.QUIZ_ITEMS = '+json.dumps(items)+';',encoding='utf-8')
print('Prepared 23 quiz photos and 3 reference/profile photos.')
