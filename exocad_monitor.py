import time
import os
import xml.etree.ElementTree as ET
import urllib.parse
import webbrowser
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
        try:
            tree = ET.parse(filepath)
            root = tree.getroot()

            # Extração de dados (Baseado no padrão XML do Exocad)

            # Paciente
            patient_elem = root.find(".//PatientName")
            patient_name = patient_elem.text if patient_elem is not None else ""

            patient_last_elem = root.find(".//PatientLastName")
            patient_last_name = patient_last_elem.text if patient_last_elem is not None else ""

            full_patient = f"{patient_name} {patient_last_name}".strip()

            # Dentista / Cliente
            client_elem = root.find(".//Client")
            if client_elem is None:
                client_elem = root.find(".//ClientName")
            dentist = client_elem.text if client_elem is not None else ""

            # Observações / Notas
            notes_elem = root.find(".//Notes")
            notes = notes_elem.text if notes_elem is not None else ""

            print(f"  -> Dados extraídos - Paciente: {full_patient}, Dentista: {dentist}")

            # Montar a URL com os dados
            query_params = {
                "import_exocad": "true",
                "paciente": full_patient,
                "dentista": dentist,
                "obs": notes
            }
            # Remove valores vazios para URL ficar limpa
            query_string = urllib.parse.urlencode({k: v for k, v in query_params.items() if v})

            final_url = f"{DENTALFLOW_URL}?{query_string}"

            print(f"  -> Abrindo DentalFlow no navegador...")
            webbrowser.open(final_url)

        except Exception as e:
            print(f"Erro ao processar o arquivo {filepath}: {e}")

if __name__ == "__main__":
    if not os.path.exists(EXOCAD_FOLDER):
        print(f"Aviso: A pasta configurada {EXOCAD_FOLDER} não existe.")
        print("Criando a pasta apenas para fins de teste. No laboratório, aponte para a pasta real do Exocad.")
        os.makedirs(EXOCAD_FOLDER, exist_ok=True)

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
