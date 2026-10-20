"""Local quiz server. Uses only Python's standard library."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from xml.sax.saxutils import escape
import io, json, os, re, secrets, socket, sqlite3, subprocess, sys, threading, time, zipfile
from contextlib import contextmanager

ROOT = Path(sys.executable).resolve().parent if getattr(sys,'frozen',False) else Path(__file__).resolve().parent
RECORDS = ROOT / 'records'
LOCK = threading.Lock()
SERVER_INSTANCE = secrets.token_hex(12)

def usb_devices():
    """Read USB disk metadata only. No disk management operation is performed."""
    if os.name!='nt':return dict(drives=[],error='USB detection is available on Windows only.')
    script="""$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[Text.UTF8Encoding]::new(); $items=@(Get-Disk | Where-Object { $_.BusType -eq 'USB' -and -not $_.IsBoot -and -not $_.IsSystem } | ForEach-Object { $d=$_; $letters=@(Get-Partition -DiskNumber $d.Number -ErrorAction SilentlyContinue | Where-Object { $_.DriveLetter } | ForEach-Object { [string]$_.DriveLetter }); [pscustomobject]@{ disk=[int]$d.Number; name=[string]$d.FriendlyName; sizeGB=[math]::Round($d.Size/1000000000,1); letters=$letters } }); ConvertTo-Json -InputObject $items -Depth 3 -Compress"""
    try:
        result=subprocess.run(['powershell.exe','-NoProfile','-NonInteractive','-Command',script],capture_output=True,timeout=20,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
        if result.returncode:return dict(drives=[],error='Windows could not read USB metadata. Use a simulated drive or retry on this computer.')
        drives=json.loads(result.stdout.decode('utf-8-sig').strip() or '[]')
        return dict(drives=drives if isinstance(drives,list) else [drives])
    except (OSError,ValueError,subprocess.TimeoutExpired):return dict(drives=[],error='USB detection is unavailable. Simulated drives still work.')

def workbook(rows):
    def cell(ref, text, style=0):
        text = ''.join(c for c in str(text) if c in '\t\n\r' or ord(c) >= 32)
        return f'<c r="{ref}" s="{style}" t="inlineStr"><is><t xml:space="preserve">{escape(text)}</t></is></c>'
    data = ['<row r="1">'+cell('A1','Name',1)+cell('B1','Score',1)+'</row>']
    for n,(name,score,total) in enumerate(rows,2):
        data.append(f'<row r="{n}">'+cell(f'A{n}',name)+cell(f'B{n}',f'{score} / {total}')+'</row>')
    files = {
        '[Content_Types].xml':'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
        '_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
        'xl/workbook.xml':'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Scores" sheetId="1" r:id="rId1"/></sheets></workbook>',
        'xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
        'xl/styles.xml':'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF315C43"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf xfId="0"/><xf fontId="1" fillId="2" applyFont="1" applyFill="1" xfId="0"/></cellXfs></styleSheet>',
        'xl/worksheets/sheet1.xml':'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="45" customWidth="1"/><col min="2" max="2" width="18" customWidth="1"/></cols><sheetData>'+''.join(data)+'</sheetData><autoFilter ref="A1:B'+str(len(rows)+1)+'"/></worksheet>'
    }
    out=io.BytesIO()
    with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
        for path,xml in files.items():z.writestr(path,'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+xml)
    return out.getvalue()

@contextmanager
def connect():
    RECORDS.mkdir(exist_ok=True)
    db=sqlite3.connect(RECORDS/'scores.sqlite3')
    db.execute('CREATE TABLE IF NOT EXISTS scores (attempt TEXT PRIMARY KEY, name TEXT NOT NULL, score INTEGER NOT NULL, total INTEGER NOT NULL)')
    db.execute('CREATE TABLE IF NOT EXISTS oral_order (name_key TEXT PRIMARY KEY, name TEXT NOT NULL)')
    db.execute('CREATE TABLE IF NOT EXISTS student_study (name_key TEXT PRIMARY KEY, name TEXT NOT NULL, deadline INTEGER NOT NULL, finished INTEGER NOT NULL DEFAULT 0)')
    try:
        yield db
    finally:
        db.close()

def export(db):
    data=workbook(db.execute('SELECT name,score,total FROM scores ORDER BY rowid').fetchall())
    temp=RECORDS/'Quiz Scores.tmp'
    temp.write_bytes(data)
    os.replace(temp, RECORDS/'Quiz Scores.xlsx')

def record(payload):
    attempt=payload.get('attempt','');name=payload.get('name','').strip();score=payload.get('score');total=payload.get('total')
    if not isinstance(attempt,str) or not re.fullmatch(r'[A-Za-z0-9-]{8,100}',attempt) or not isinstance(name,str) or not 1<=len(name)<=80 or type(score) is not int or type(total) is not int or not 0<=score<=total<=30 or total<1:raise ValueError('Invalid score record.')
    with LOCK, connect() as db:
        db.execute('INSERT OR IGNORE INTO scores VALUES (?,?,?,?)',(attempt,name,score,total))
        db.commit()
        export(db)

def student_study(payload,finish=False):
    name=payload.get('name')
    if not isinstance(name,str):raise ValueError('Student name is required.')
    name=' '.join(name.split())
    if not 1<=len(name)<=80:raise ValueError('Student name is required.')
    key=name.casefold();now=int(time.time()*1000)
    with LOCK, connect() as db:
        completed=any(' '.join(row[0].split()).casefold()==key for row in db.execute('SELECT name FROM scores'))
        db.execute('INSERT OR IGNORE INTO student_study VALUES (?,?,?,0)',(key,name,now+300000))
        if finish or completed:db.execute('UPDATE student_study SET finished=1 WHERE name_key=?',(key,))
        deadline,finished=db.execute('SELECT deadline,finished FROM student_study WHERE name_key=?',(key,)).fetchone()
        db.commit()
    return dict(name=name,deadline=deadline,studyFinished=bool(finished or deadline<=now),quizCompleted=completed)

def oral_state(db):
    roster={}
    for (name,) in db.execute('SELECT name FROM scores ORDER BY rowid'):
        clean=' '.join(name.split())
        roster.setdefault(clean.casefold(),clean)
    called=[dict(key=key,name=name) for key,name in db.execute('SELECT name_key,name FROM oral_order ORDER BY rowid')]
    used={row['key'] for row in called}
    return dict(remaining=[dict(key=key,name=name) for key,name in roster.items() if key not in used],called=called,total=len(roster))

def spin_oral(reset=False):
    with LOCK, connect() as db:
        if reset:
            db.execute('DELETE FROM oral_order');db.commit()
            return oral_state(db)
        state=oral_state(db)
        if not state['remaining']:return dict(state=state,selected=None)
        selected=secrets.choice(state['remaining'])
        db.execute('INSERT INTO oral_order VALUES (?,?)',(selected['key'],selected['name']));db.commit()
        return dict(selected=selected,state=oral_state(db))

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def valid_host(self):return self.headers.get('Host') in ('localhost:8767','127.0.0.1:8767')
    def reply(self,status,data):
        body=json.dumps(data).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
    def do_GET(self):
        if not self.valid_host():return self.reply(403,{'error':'Local access only.'})
        path=urlsplit(self.path).path
        if path=='/api/status':return self.reply(200,{'scoreRecording':True,'instance':SERVER_INSTANCE,'restartSupported':True})
        if path=='/api/usb-devices':return self.reply(200,usb_devices())
        if path=='/api/oral':
            with LOCK, connect() as db:state=oral_state(db)
            return self.reply(200,state)
        if path=='/scores.xlsx':
            with LOCK, connect() as db:
                data=workbook(db.execute('SELECT name,score,total FROM scores ORDER BY rowid').fetchall())
            self.send_response(200);self.send_header('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');self.send_header('Content-Disposition','attachment; filename="Quiz Scores.xlsx"');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data);return
        if path not in ('/','/index.html','/style.css','/app.js','/engine.js','/explorer.js') and not re.fullmatch(r'/assets/[A-Za-z0-9_.-]+',path):return self.send_error(404)
        super().do_GET()
    def do_POST(self):
        if not self.valid_host() or self.headers.get('Origin') not in ('http://localhost:8767','http://127.0.0.1:8767') or self.headers.get('Content-Type')!='application/json':return self.reply(403,{'error':'Open the quiz using the local launcher.'})
        if self.path=='/api/restart':
            try:
                size=int(self.headers.get('Content-Length','0'))
                if not 0<size<=1024:raise ValueError()
                password=json.loads(self.rfile.read(size)).get('password')
                if not isinstance(password,str) or not secrets.compare_digest(password,'Redjan09'):
                    return self.reply(403,{'error':'Incorrect password.'})
            except (ValueError,TypeError,AttributeError):return self.reply(400,{'error':'Invalid request.'})
            self.reply(200,{'restarting':True,'instance':SERVER_INSTANCE})
            self.server.restart_requested=True
            threading.Thread(target=self.server.shutdown,daemon=True).start()
            return
        if self.path in ('/api/oral/spin','/api/oral/reset'):
            return self.reply(200,spin_oral(reset=self.path.endswith('/reset')))
        if self.path not in ('/api/scores','/api/student/start','/api/student/study-finish'):return self.reply(404,{'error':'Not found.'})
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<=4096:raise ValueError()
            payload=json.loads(self.rfile.read(length))
            if self.path.startswith('/api/student/'):
                return self.reply(200,student_study(payload,finish=self.path.endswith('/study-finish')))
            record(payload)
        except (ValueError,TypeError,AttributeError):return self.reply(400,{'error':'Invalid score record.'})
        except OSError:return self.reply(503,{'error':'Score is backed up locally. Close Quiz Scores.xlsx in Excel, then click Retry saving.'})
        self.reply(200,{'saved':True})

class LocalQuizServer(ThreadingHTTPServer):
    allow_reuse_address=False
    def server_bind(self):
        if os.name=='nt':self.socket.setsockopt(socket.SOL_SOCKET,socket.SO_EXCLUSIVEADDRUSE,1)
        super().server_bind()

def main():
    import webbrowser
    from launcher import quiz_is_running
    if quiz_is_running():
        print('The quiz server is already running. Opening the existing website.')
        if '--no-browser' not in sys.argv:webbrowser.open('http://localhost:8767')
        return 0
    try:server=LocalQuizServer(('127.0.0.1',8767),Handler)
    except OSError as error:
        if error.errno in (98,10048) or getattr(error,'winerror',None)==10048:
            if quiz_is_running():
                print('The quiz server is already running. Opening the existing website.')
                if '--no-browser' not in sys.argv:webbrowser.open('http://localhost:8767')
                return 0
            print('Port 8767 is occupied by another program. Close that program and open the quiz launcher again.')
            return 1
        raise
    with connect() as db:
        try:export(db)
        except OSError:pass
    print('CSS USB Oral Simulator: http://localhost:8767\nScores: '+str(RECORDS/'Quiz Scores.xlsx')+'\nKeep this window open while students take the quiz.')
    if '--no-browser' not in sys.argv:webbrowser.open('http://localhost:8767')
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
    if getattr(server,'restart_requested',False):return 75
    return 0

if __name__=='__main__':sys.exit(main())
