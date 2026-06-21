"""
Downloads NSL-KDD dataset files into backend/data/
Run: python download_data.py
"""
import os
import urllib.request

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

FILES = {
    "KDDTrain+.txt": "https://raw.githubusercontent.com/defcom17/NSL_KDD/master/KDDTrain%2B.txt",
    "KDDTest+.txt": "https://raw.githubusercontent.com/defcom17/NSL_KDD/master/KDDTest%2B.txt",
}


def download(filename, url):
    dest = os.path.join(DATA_DIR, filename)
    if os.path.exists(dest):
        print(f"  {filename} already exists, skipping.")
        return
    print(f"  Downloading {filename}...")
    try:
        urllib.request.urlretrieve(url, dest)
        size_mb = os.path.getsize(dest) / 1024 / 1024
        print(f"  {filename} saved ({size_mb:.1f} MB)")
    except Exception as e:
        print(f"  ERROR downloading {filename}: {e}")
        print(f"  Manual download: {url}")


if __name__ == "__main__":
    print("Downloading NSL-KDD dataset...")
    for fname, url in FILES.items():
        download(fname, url)
    print("\nDone. Now run: python train.py")
