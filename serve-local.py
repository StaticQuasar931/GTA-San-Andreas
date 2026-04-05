from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class LocalGameHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        super().end_headers()


if __name__ == "__main__":
    root = Path(__file__).resolve().parent
    LocalGameHandler.extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".wasm": "application/wasm",
        ".ISO": "application/octet-stream",
        ".iso": "application/octet-stream",
    }
    server = ThreadingHTTPServer(("127.0.0.1", 8000), lambda *args, **kwargs: LocalGameHandler(*args, directory=str(root), **kwargs))
    print(f"Serving {root} at http://127.0.0.1:8000")
    server.serve_forever()
