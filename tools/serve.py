# Local test server (handles many parallel requests, unlike `python3 -m http.server`).
# Run from anywhere: python3 tools/serve.py .   → http://127.0.0.1:5517

import http.server, functools, sys
class S(http.server.ThreadingHTTPServer):
    request_queue_size = 256
    daemon_threads = True
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=sys.argv[1])
H.log_message = lambda *a: None
S(('127.0.0.1', 5517), H).serve_forever()
