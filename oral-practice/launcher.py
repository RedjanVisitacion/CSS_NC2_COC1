"""Keep the local quiz server running across password-authorized restarts."""
from pathlib import Path
import subprocess
import sys
import json
import urllib.request
import webbrowser

def quiz_is_running():
    try:
        opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open('http://localhost:8765/api/status',timeout=2) as response:
            return json.load(response).get('scoreRecording') is True
    except (OSError,ValueError,AttributeError):return False

def main():
    if quiz_is_running():
        print('The quiz server is already running. Opening the existing website.\nSaved records are unchanged.')
        webbrowser.open('http://localhost:8765')
        return 0
    frozen=getattr(sys,'frozen',False)
    root=Path(sys.executable).resolve().parent if frozen else Path(__file__).resolve().parent
    args=[sys.executable,'--serve'] if frozen else [sys.executable,str(root/'server.py')]
    while True:
        try:code=subprocess.call(args,cwd=root)
        except KeyboardInterrupt:return 0
        if code!=75:return code
        print('Restarting quiz server. Saved records are preserved...')
        args=[sys.executable,'--serve','--no-browser'] if frozen else [sys.executable,str(root/'server.py'),'--no-browser']

def self_test():
    """Check the bundled runtime and local endpoints without touching class data."""
    import server
    import tempfile
    import threading
    import zipfile
    from xml.etree import ElementTree
    with tempfile.TemporaryDirectory() as directory:
        server.RECORDS=Path(directory)
        http=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler)
        worker=threading.Thread(target=http.serve_forever,daemon=True)
        worker.start()
        opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
        base='http://127.0.0.1:'+str(http.server_port)
        def request(path,payload=None):
            req=urllib.request.Request(base+path,data=json.dumps(payload).encode() if payload is not None else None,headers={'Host':'localhost:8765','Origin':'http://localhost:8765','Content-Type':'application/json'})
            with opener.open(req,timeout=5) as response:return response.read()
        try:
            assert b'CSS Picture Quiz' in request('/')
            study=json.loads(request('/api/student/start',{'name':'Portable Test'}))
            assert not study['studyFinished']
            assert json.loads(request('/api/student/study-finish',{'name':'Portable Test'}))['studyFinished']
            payload=dict(attempt='portable-self-test',name='Portable Test',score=8,total=10)
            assert json.loads(request('/api/scores',payload))['saved']
            request('/api/scores',payload)
            with server.connect() as db:assert db.execute('SELECT count(*) FROM scores').fetchone()[0]==1
            with zipfile.ZipFile(server.RECORDS/'Quiz Scores.xlsx') as book:
                for name in book.namelist():ElementTree.fromstring(book.read(name))
            roster=json.loads(request('/api/oral'));assert roster['total']==1
            assert json.loads(request('/api/oral/spin',{}))['selected']['name']=='Portable Test'
            assert json.loads(request('/api/oral/spin',{}))['selected'] is None
            print('PASS: bundled executable, website, student timers, Excel recording, retry protection, and oral wheel. Class records unchanged.')
        finally:http.shutdown();http.server_close();worker.join()
    return 0

if __name__=='__main__':
    if '--self-test' in sys.argv:sys.exit(self_test())
    if '--serve' in sys.argv:
        import server
        sys.exit(server.main())
    sys.exit(main())
