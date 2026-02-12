import sys
import json
from faster_whisper import WhisperModel

audio_path = sys.argv[1]
output_path = sys.argv[2]

model = WhisperModel("small", device="cpu", compute_type="int8")

segments, info = model.transcribe(audio_path)

result = {
    "text": "",
    "segments": []
}

for segment in segments:
    result["text"] += segment.text + " "
    result["segments"].append({
        "start": float(segment.start),
        "end": float(segment.end),
        "text": segment.text
    })

with open(output_path, "w") as f:
    json.dump(result, f)