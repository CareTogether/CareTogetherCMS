"""Render each narration step of launches/<launch>/videos/<video>.json to work/<launch>/<video>/audio/<step>.wav with Kokoro.

Usage: .venv/bin/python tts.py <launch>/<video>
"""

import json
import sys
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).parent


def main(launch_and_video: str) -> None:
    launch, video_id = launch_and_video.split("/")
    narration = json.loads((ROOT / "launches" / launch / "videos" / f"{video_id}.json").read_text())
    audio = ROOT / "work" / launch / video_id / "audio"
    audio.mkdir(parents=True, exist_ok=True)
    kokoro = Kokoro(str(ROOT / "models/kokoro-v1.0.onnx"), str(ROOT / "models/voices-v1.0.bin"))

    durations = {}
    for step in narration["steps"]:
        samples, sample_rate = kokoro.create(
            step["text"], voice=narration["voice"], speed=narration["speed"], lang="en-us"
        )
        sf.write(audio / f"{step['id']}.wav", samples, sample_rate)
        durations[step["id"]] = round(len(samples) / sample_rate, 3)
        print(f"{step['id']}: {durations[step['id']]}s")

    (audio / "durations.json").write_text(json.dumps(durations, indent=2))


if __name__ == "__main__":
    main(sys.argv[1])
