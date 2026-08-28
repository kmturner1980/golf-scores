"""Local static file server for previewing this site, with caching disabled
so edits show up immediately on reload (the plain `python -m http.server`
lets the browser cache scripts/styles indefinitely, which makes local
testing confusing). Not part of the deployed site -- GitHub Pages ignores
the .claude/ folder.
"""
import http.server
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    http.server.test(HandlerClass=NoCacheHandler, port=port)
