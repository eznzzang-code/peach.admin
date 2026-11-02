"""Serve the existing administrator publishing on loopback without installing dependencies."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import sys, webbrowser
ROOT=Path(__file__).resolve().parent
class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        super().end_headers()
def main():
    port=8798
    try: server=ThreadingHTTPServer(('127.0.0.1',port),partial(Handler,directory=str(ROOT)))
    except OSError:
        print('Port 8798 is in use. Close the previous preview window and try again.')
        return 1
    url=f'http://127.0.0.1:{port}/events-list.html'
    print(url+'\nKeep this window open. Press Ctrl+C to stop.')
    if '--no-open' not in sys.argv: webbrowser.open(url)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close()
    return 0
if __name__=='__main__': raise SystemExit(main())
