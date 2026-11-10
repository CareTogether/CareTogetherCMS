"""Join work/<topic>/<video>/frames and its audio into work/<topic>/<output>.mp4, placing each clip where timeline.json says its step started.

Usage: .venv/bin/python build.py <topic>/<video>
"""

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent


def main(topic_and_video: str) -> None:
    topic, video_id = topic_and_video.split("/")
    work = ROOT / "work" / topic / video_id
    module = (ROOT / topic / "videos" / f"{video_id}.mjs").read_text()
    output = ROOT / "work" / topic / re.search(r"export const output = '([^']+)'", module).group(1)
    timeline = json.loads((work / "timeline.json").read_text())
    frames = timeline["frames"]
    origin = frames[0]["timestamp"]

    # Screencast frames arrive only when the screen changes, so each frame lasts until the next one.
    concat = work / "frames.txt"
    lines = []
    for frame, following in zip(frames, frames[1:] + [{"timestamp": timeline["end"]}]):
        lines.append(f"file 'frames/{frame['file']}'")
        lines.append(f"duration {max(following['timestamp'] - frame['timestamp'], 0.001):.3f}")
    lines.append(f"file 'frames/{frames[-1]['file']}'")
    concat.write_text("\n".join(lines) + "\n")

    clips = [
        (step, work / "audio" / f"{step['id']}.wav")
        for step in timeline["steps"]
        if (work / "audio" / f"{step['id']}.wav").exists()
    ]

    command = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat)]
    for _, clip in clips:
        command += ["-i", str(clip)]

    # Screencast JPEGs are full-range BT.601. Players assume HD video is limited-range BT.709,
    # so convert to that and tag it, or the app's teal plays back as cyan.
    video_filter = (
        "[0:v]fps=30,scale=in_color_matrix=bt601:in_range=pc:out_color_matrix=bt709:out_range=tv,format=yuv420p[v]"
    )
    if clips:
        delays = [
            f"[{index + 1}:a]adelay={round((step['start'] - origin) * 1000)}:all=1[a{index}]"
            for index, (step, _) in enumerate(clips)
        ]
        mix = "".join(f"[a{index}]" for index in range(len(clips)))
        audio_filter = f"{mix}amix=inputs={len(clips)}:normalize=0[a]"
        command += ["-filter_complex", ";".join([video_filter, *delays, audio_filter])]
        command += ["-map", "[v]", "-map", "[a]", "-c:a", "aac", "-b:a", "160k"]
    else:
        command += ["-filter_complex", video_filter, "-map", "[v]"]

    command += ["-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709"]
    command += ["-c:v", "libx264", "-preset", "slow", "-crf", "18", "-movflags", "+faststart", str(output)]
    subprocess.run(command, check=True, cwd=work)
    print(output)


if __name__ == "__main__":
    main(sys.argv[1])
