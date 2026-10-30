"""Start the WattWise website locally and check the Ollama connection."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.request import urlopen
from urllib.error import URLError
import json
import os

HOST = "127.0.0.1"
PORT = 8000
OLLAMA_TAGS_URL = "http://127.0.0.1:11434/api/tags"


def check_ollama():
    try:
        with urlopen(OLLAMA_TAGS_URL, timeout=3) as response:
            data = json.loads(response.read().decode("utf-8"))
        models = [item.get("name", "") for item in data.get("models", [])]
        print("Ollama is running.")
        if models:
            print("Installed models:")
            for model in models:
                print(f"  - {model}")
            print("Make sure the modelName value in script.js matches one of these names.")
        else:
            print("Ollama is running, but no installed models were listed. Try: ollama pull gemma3:4b")
    except (URLError, TimeoutError, json.JSONDecodeError, OSError):
        print("Could not reach Ollama at http://127.0.0.1:11434.")
        print("Start Ollama and make sure your Gemma 3 model is installed before using the AI feature.")


def main():
    folder = Path(__file__).resolve().parent
    os.chdir(folder)
    if not (folder / "index.html").exists():
        raise SystemExit("index.html was not found. Run setup.py from the extracted WattWise project folder.")

    print("\nWattWise local setup")
    print("--------------------")
    check_ollama()
    print(f"\nWebsite URL: http://localhost:{PORT}")
    print("Press Ctrl+C to stop the local server.\n")

    try:
        server = ThreadingHTTPServer((HOST, PORT), SimpleHTTPRequestHandler)
        server.serve_forever()
    except OSError as error:
        raise SystemExit(f"Could not start the server on port {PORT}: {error}\nClose another server using that port or change PORT in setup.py.")
    except KeyboardInterrupt:
        print("\nWattWise server stopped.")


if __name__ == "__main__":
    main()
