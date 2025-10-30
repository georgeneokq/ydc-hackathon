import requests

url = "http://localhost:8000/report"

def download_streaming_file():
    body = {
        "question": "Analyze the price trends of bitcoin and whether buy or sell indicator is stronger now"
    }
    with requests.post(url, json=body, stream=True) as response:
        response.raise_for_status()  # Raise error if request failed
        with open("downloaded_document.docx", "wb") as f:
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:  # filter out keep-alive chunks
                    f.write(chunk)
        print("Download complete and saved as downloaded_document.docx")

if __name__ == "__main__":
    download_streaming_file()
