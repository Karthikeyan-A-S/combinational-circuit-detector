# ⚡ CircuitIQ — Hand-Drawn Logic Circuit Recognizer

> Upload or snap a photo of a hand-drawn combinational logic circuit and instantly extract Boolean equations, truth tables, gate graphs, and clean schematics.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-2.x-000000?style=flat&logo=flask)
![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-00BFFF?style=flat)
![TensorFlow](https://img.shields.io/badge/TensorFlow-Keras-FF6F00?style=flat&logo=tensorflow&logoColor=white)
![HTML/CSS/JS](https://img.shields.io/badge/Frontend-HTML%2FCSS%2FJS-F7DF1E?style=flat&logo=javascript&logoColor=black)

---

## 📸 What It Does

CircuitIQ is an end-to-end pipeline that processes a photograph or scan of a hand-drawn digital logic circuit through **8 stages**:

| Stage   | Description                                                     |
| ------- | --------------------------------------------------------------- |
| **0.5** | Keras CNN removes handwritten text labels from the image        |
| **A**   | Sauvola binarization & morphological preprocessing              |
| **B**   | YOLOv8 detects logic gates (AND, OR, NOT, NAND, NOR, XOR, XNOR) |
| **C**   | Wire skeleton extraction after masking detected gates           |
| **D**   | Endpoint & junction detection on the wire skeleton              |
| **E**   | Macro-graph construction & wire tracing                         |
| **F**   | Gate terminal assignment & netlist generation                   |
| **G/H** | Boolean equation synthesis, merging & truth table computation   |

**Outputs returned:**

- ✅ Boolean equations (text & symbolic modes)
- ✅ Full truth table
- ✅ Graphviz circuit graph (colour-coded by gate type)
- ✅ Schemdraw gate schematics per output

---

## 🗂️ Project Structure

```
circuitiq/
├── backend/
│   └── app.py              # Flask API — full pipeline
├── frontend/
│   ├── index.html          # Main UI
│   ├── style.css           # Dark/Light themed styles
│   └── script.js           # Upload, cropping, results rendering
├── models/                 # (not committed — stored in Google Drive)
│   ├── best.pt             # Trained YOLOv8 gate detector
│   └── alphabet_recognition_model.keras  # Text-removal CNN
└── README.md
```

---

## 🚀 Quick Start — Google Colab Backend

The backend is designed to run in **Google Colab** with your trained models stored in Google Drive. It uses `flask-cloudflared` to create a public tunnel that bypasses institutional firewalls.

### Step 1 — Mount Drive & Install Dependencies

```python
from google.colab import drive
drive.mount('/content/drive')

!pip install flask flask-cors flask-cloudflared ultralytics \
             opencv-python-headless scikit-image graphviz \
             schemdraw tensorflow
```

### Step 2 — Set Your Model Paths

Edit the paths near the bottom of `app.py` to match where your models are stored in Drive:

```python
MODEL_PATH      = "/content/drive/MyDrive/<your-folder>/best.pt"
TEXT_MODEL_PATH = "/content/drive/MyDrive/<your-folder>/alphabet_recognition_model.keras"
```

### Step 3 — Run the Server

Upload `app.py` to Colab or paste it into a cell, then run:

```python
# In a Colab cell
exec(open('app.py').read())
```

Or if running from file:

```bash
!python app.py
```

When the cell runs, look for a line like this in the Colab output:

```
 * Running on https://xxxx-xxxx.trycloudflare.com
```

**Copy that URL** — you will paste it into the frontend.

> The server exposes one endpoint: `POST /process-circuit`

---

## 🌐 Using the Frontend

The frontend is a **pure static site** — no build step needed.

### Option A — Open Locally

1. Clone or download this repo.
2. Open `frontend/index.html` directly in your browser (double-click or `File → Open`).

### Option B — Host on GitHub Pages

1. Push `index.html`, `style.css`, and `script.js` to a GitHub repo.
2. Go to **Settings → Pages** and set the source to your main branch.
3. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

### Connecting to the Colab Backend

1. Start your Colab notebook (Step 3 above).
2. Copy the `trycloudflare.com` URL from the output.
3. In the web UI, paste the URL into the **"Paste Colab URL…"** input in the top bar.
4. Click **Apply** — it saves to `localStorage` for the session.

> **Note:** The frontend automatically appends `/process-circuit` to the URL you paste.

---

## 📡 API Reference

### `POST /process-circuit`

**Request:** `multipart/form-data`

| Field   | Type | Description                           |
| ------- | ---- | ------------------------------------- |
| `image` | File | PNG/JPG of a hand-drawn logic circuit |

**Response:** `application/json`

```jsonc
{
  "equations": {
    "Y1": "(I1 and I2) or (not I3)"
  },
  "truth_table": {
    "columns": ["I1", "I2", "I3", "Y1"],
    "rows": [
      { "I1": 0, "I2": 0, "I3": 0, "Y1": 0 },
      ...
    ]
  },
  "graphviz_image": "<base64-encoded PNG>",
  "schemdraw_images": {
    "Y1": "<base64-encoded PNG>"
  }
}
```

**Error Response:**

```json
{ "error": "Description of what went wrong" }
```

---

## 🧠 Models

### YOLOv8 Gate Detector (`best.pt`)

- Trained with [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics)
- Detects 7 gate classes: `AND`, `OR`, `NOT`, `NAND`, `NOR`, `XOR`, `XNOR`
- Confidence threshold: `0.30` (configurable in `run_yolo_detection()`)

### Keras Text Remover (`alphabet_recognition_model.keras`)

- Input: 28×28 grayscale patch
- Output: 26-class softmax (A–Z)
- Removes handwritten labels before wire tracing
- Confidence threshold for erasure: `0.80`

### Training Your Own Models

You can retrain on your own data. For the YOLO model:

```bash
yolo detect train data=gates.yaml model=yolov8n.pt epochs=100 imgsz=640
```

For the Keras text model, train on EMNIST or a custom alphabet dataset and export as `.keras`.

---

## 🖥️ Frontend Features

| Feature                  | Details                                                         |
| ------------------------ | --------------------------------------------------------------- |
| **Image source**         | Browse files, drag & drop, or camera capture                    |
| **Crop tool**            | Built-in Cropper.js integration before upload                   |
| **Dark / Light theme**   | Persisted in `localStorage`                                     |
| **Equation modes**       | Toggle between text (`and/or/not`) and symbolic (`·/+/overbar`) |
| **Collapsible sections** | Animated collapse for each result panel                         |
| **Status pills**         | Visual pipeline progress indicators                             |
| **API URL config**       | Saved in `localStorage` — survives page refresh                 |

---

## ⚙️ Configuration

| Variable                | Location                                | Default                                         | Description                     |
| ----------------------- | --------------------------------------- | ----------------------------------------------- | ------------------------------- |
| `DEFAULT_API_URL`       | `script.js` line 2                      | `https://xxx.trycloudflare.com/process-circuit` | Fallback API URL                |
| `conf_thres`            | `app.py` → `run_yolo_detection()`       | `0.30`                                          | YOLO confidence threshold       |
| Text removal confidence | `app.py` → `remove_text_labels_keras()` | `0.80`                                          | Min confidence to erase a label |
| `MODEL_PATH`            | `app.py`                                | Google Drive path                               | Path to `best.pt`               |
| `TEXT_MODEL_PATH`       | `app.py`                                | Google Drive path                               | Path to `.keras` model          |

---

## 📦 Python Dependencies

```txt
flask
flask-cors
flask-cloudflared
ultralytics
opencv-python-headless
scikit-image
numpy
tensorflow
graphviz
schemdraw
```

Install all at once:

```bash
pip install flask flask-cors flask-cloudflared ultralytics \
            opencv-python-headless scikit-image numpy \
            tensorflow graphviz schemdraw
```

You also need the **Graphviz system package**:

```bash
# Ubuntu / Colab
sudo apt-get install graphviz -y

# macOS
brew install graphviz
```

---

## 🔧 Troubleshooting

| Problem                                         | Fix                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| `CORS error` in browser                         | Make sure `flask-cors` is installed and `CORS(app)` is present in `app.py`     |
| `trycloudflare` URL not appearing               | Re-run the Colab cell; the tunnel can take ~10 seconds to start                |
| API returns `{"error": "Invalid image format"}` | Ensure the cropped canvas is exported as PNG before sending                    |
| Gate count is wrong                             | Lower `conf_thres` in `run_yolo_detection()` to `0.20` and retry               |
| Equations contain `FLOAT`                       | A wire endpoint couldn't be traced to a source; try a cleaner/higher-res image |
| Schemdraw images missing                        | Equations with `FLOAT` tokens are skipped by schemdraw; resolve wiring first   |
| Colab disconnects mid-session                   | Re-run the server cell and paste the new Cloudflare URL into the UI            |

---

## 📄 License

MIT License — free to use, modify, and distribute with attribution.

---

## 🙏 Acknowledgements

- [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics) for gate detection
- [Schemdraw](https://schemdraw.readthedocs.io/) for schematic rendering
- [Graphviz](https://graphviz.org/) for circuit graph generation
- [Cropper.js](https://fengyuanchen.github.io/cropperjs/) for in-browser image cropping
- [flask-cloudflared](https://github.com/theskumar/python-dotenv) for tunnel support
