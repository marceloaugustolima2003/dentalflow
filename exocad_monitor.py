import time
import os
import platform
import subprocess
import xml.etree.ElementTree as ET
import urllib.parse
import webbrowser
import threading
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("A biblioteca 'watchdog' não está instalada. Instale executando: pip install watchdog")
    exit(1)

# ==========================================
# CONFIGURAÇÕES
# ==========================================
# Altere para a pasta principal onde o Exocad salva os projetos (ex: C:\CAD-Data)
EXOCAD_FOLDER = r"C:\CAD-Data"

# URL do DentalFlow (Pode ser local para testes, ou a URL final na web)
DENTALFLOW_URL = "http://localhost:5500/index.html" # ou "https://seusite.com/dashboard"

LATEST_EXOCAD_DATA = None

class ExocadAPIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global LATEST_EXOCAD_DATA
        if self.path == '/api/exocad':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            response_data = LATEST_EXOCAD_DATA if LATEST_EXOCAD_DATA else {}
            self.wfile.write(json.dumps(response_data).encode('utf-8'))

            if LATEST_EXOCAD_DATA:
                LATEST_EXOCAD_DATA = None
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Desativa logs do servidor HTTP para não poluir o terminal
        pass

def start_http_server():
    server = HTTPServer(('localhost', 5501), ExocadAPIHandler)
    print("[*] Servidor local iniciado na porta 5501 para comunicação com o DentalFlow.")
    server.serve_forever()

class ExocadHandler(FileSystemEventHandler):
    def __init__(self):
        super().__init__()
        self.processed_files = {} # Evitar processar o mesmo arquivo repetidamente

    def on_created(self, event):
        self.process_file(event.src_path)

    def on_modified(self, event):
        self.process_file(event.src_path)

    def process_file(self, filepath):
        if filepath.endswith(".dentalProject"):
            # Evita acionar múltiplas vezes se o Exocad salvar em etapas rápidas
            current_time = time.time()
            if filepath in self.processed_files:
                if current_time - self.processed_files[filepath] < 5: # Espera 5 segundos antes de ler novamente o mesmo arquivo
                    return

            self.processed_files[filepath] = current_time
            print(f"\nNovo projeto/salvamento detectado: {filepath}")

            # Aguarda um pequeno instante para garantir que o Exocad terminou de escrever no arquivo
            time.sleep(1)
            self.extract_and_send(filepath)

    def extract_and_send(self, filepath):
        global LATEST_EXOCAD_DATA
        try:
            tree = ET.parse(filepath)
            root = tree.getroot()

            # Função auxiliar para buscar ignorando namespaces
            def find_text_ignore_ns(element, tag_name):
                # Procura por elementos que terminam com o tag_name (ignora xmlns como {http://...}Tag)
                for child in element.iter():
                    if child.tag.endswith(tag_name):
                        return child.text
                return ""

            # Extração de dados (Baseado no padrão XML do Exocad)

            # Paciente
            patient_name = find_text_ignore_ns(root, "PatientName")
            patient_last_name = find_text_ignore_ns(root, "PatientLastName")

            full_patient = f"{patient_name} {patient_last_name}".strip()

            # Dentista / Cliente
            dentist = find_text_ignore_ns(root, "Client")
            if not dentist:
                dentist = find_text_ignore_ns(root, "ClientName")

            # Observações / Notas
            notes = find_text_ignore_ns(root, "Notes")

            print(f"  -> Dados extraídos - Paciente: {full_patient}, Dentista: {dentist}")

            LATEST_EXOCAD_DATA = {
                "import_exocad": "true",
                "paciente": full_patient,
                "dentista": dentist,
                "obs": notes
            }

            print(f"  -> Dados prontos para serem puxados pelo DentalFlow via servidor local.")

        except Exception as e:
            print(f"Erro ao processar o arquivo {filepath}: {e}")

if __name__ == "__main__":
    if not os.path.exists(EXOCAD_FOLDER):
        print(f"Aviso: A pasta configurada {EXOCAD_FOLDER} não existe.")
        print("Criando a pasta apenas para fins de teste. No laboratório, aponte para a pasta real do Exocad.")
        os.makedirs(EXOCAD_FOLDER, exist_ok=True)

    # Iniciar servidor HTTP em uma thread separada
    server_thread = threading.Thread(target=start_http_server, daemon=True)
    server_thread.start()

    event_handler = ExocadHandler()
    observer = Observer()
    observer.schedule(event_handler, EXOCAD_FOLDER, recursive=True)
    observer.start()

    print(f"[*] Monitorando a pasta do Exocad: {EXOCAD_FOLDER}...")
    print("[*] Toda vez que um .dentalProject for salvo, o navegador abrirá automaticamente.")
    print("[*] Pressione Ctrl+C para sair.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nMonitoramento encerrado.")
        observer.stop()
    observer.join()
