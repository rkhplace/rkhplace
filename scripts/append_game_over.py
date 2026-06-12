from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageSequence


def load_font(size: int) -> ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
    ]

    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)

    return ImageFont.load_default()


def centered_text_frame(size: tuple[int, int]) -> Image.Image:
    frame = Image.new("RGBA", size, "#000000")
    draw = ImageDraw.Draw(frame)

    title_font = load_font(max(22, size[0] // 11))
    subtitle_font = load_font(max(12, size[0] // 30))

    title = "GAME OVER!"
    subtitle = "Restarting..."

    title_box = draw.textbbox((0, 0), title, font=title_font)
    subtitle_box = draw.textbbox((0, 0), subtitle, font=subtitle_font)

    title_width = title_box[2] - title_box[0]
    title_height = title_box[3] - title_box[1]
    subtitle_width = subtitle_box[2] - subtitle_box[0]

    title_x = (size[0] - title_width) // 2
    title_y = (size[1] - title_height) // 2 - 10
    subtitle_x = (size[0] - subtitle_width) // 2
    subtitle_y = title_y + title_height + 18

    draw.text((title_x, title_y), title, fill="#39D353", font=title_font)
    draw.text((subtitle_x, subtitle_y), subtitle, fill="#8B949E", font=subtitle_font)

    return frame


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: append_game_over.py <gif-path>")

    gif_path = Path(sys.argv[1])
    source = Image.open(gif_path)

    frames: list[Image.Image] = []
    durations: list[int] = []

    for frame in ImageSequence.Iterator(source):
        rgba = frame.convert("RGBA")
        background = Image.new("RGBA", rgba.size, "#000000")
        background.alpha_composite(rgba)
        frames.append(background.convert("P", palette=Image.Palette.ADAPTIVE))
        durations.append(frame.info.get("duration", 80))

    game_over = centered_text_frame(source.size).convert("P", palette=Image.Palette.ADAPTIVE)
    frames.append(game_over)
    durations.append(1400)

    frames[0].save(
        gif_path,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        optimize=False,
        disposal=2,
    )


if __name__ == "__main__":
    main()
