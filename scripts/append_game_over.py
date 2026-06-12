from __future__ import annotations

import sys

from pathlib import Path

from PIL import Image, ImageDraw

BLACK = (0, 0, 0, 255)
DARK_CELL = (15, 23, 32, 255)
LIT_CELL = (57, 255, 20, 255)
GLOW_CELL = (57, 255, 20, 46)
SNAKE_HEAD = (139, 0, 139, 255)
SNAKE_BODY = (57, 255, 20, 255)
CELL = 11
GAP = 4
GRID_COLS = 53
GRID_ROWS = 7
FONT_5X7 = {
    "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    "G": ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
    "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
}


def grid_origin(size: tuple[int, int]) -> tuple[int, int]:
    grid_width = GRID_COLS * CELL + (GRID_COLS - 1) * GAP
    grid_height = GRID_ROWS * CELL + (GRID_ROWS - 1) * GAP
    return (size[0] - grid_width) // 2, max(16, (size[1] - grid_height) // 2 - 8)


def empty_grid_frame(size: tuple[int, int]) -> Image.Image:
    frame = Image.new("RGBA", size, BLACK)
    draw = ImageDraw.Draw(frame)
    left, top = grid_origin(size)

    for row in range(GRID_ROWS):
        for col in range(GRID_COLS):
            x = left + col * (CELL + GAP)
            y = top + row * (CELL + GAP)
            draw.rectangle((x, y, x + CELL - 1, y + CELL - 1), fill=DARK_CELL)

    return frame


def cell_box(left: int, top: int, col: int, row: int) -> tuple[int, int, int, int]:
    x = left + col * (CELL + GAP)
    y = top + row * (CELL + GAP)
    return x, y, x + CELL - 1, y + CELL - 1


def draw_cell(
    draw: ImageDraw.ImageDraw,
    left: int,
    top: int,
    col: int,
    row: int,
    color: tuple[int, int, int, int],
) -> None:
    draw.rectangle(cell_box(left, top, col, row), fill=color)


def extract_contribution_cells(source: Image.Image) -> dict[tuple[int, int], tuple[int, int, int, int]]:
    rgba = source.convert("RGBA")
    left, top = grid_origin(rgba.size)
    cells: dict[tuple[int, int], tuple[int, int, int, int]] = {}

    for row in range(GRID_ROWS):
        for col in range(GRID_COLS):
            x = left + col * (CELL + GAP) + CELL // 2
            y = top + row * (CELL + GAP) + CELL // 2
            red, green, blue, alpha = rgba.getpixel((x, y))
            highest = max(red, green, blue)
            lowest = min(red, green, blue)
            is_neutral = highest - lowest <= 45

            if alpha > 16 and highest > 80 and not is_neutral:
                cells[(col, row)] = (red, green, blue, 255)

    return cells


def draw_contribution_frame(
    size: tuple[int, int],
    cells: dict[tuple[int, int], tuple[int, int, int, int]],
    eaten: set[tuple[int, int]],
    snake: list[tuple[int, int]],
) -> Image.Image:
    frame = empty_grid_frame(size)
    draw = ImageDraw.Draw(frame, "RGBA")
    left, top = grid_origin(size)

    for (col, row), color in cells.items():
        if (col, row) not in eaten:
            draw_cell(draw, left, top, col, row, color)

    for col, row in snake[:-1]:
        draw_cell(draw, left, top, col, row, SNAKE_BODY)

    if snake:
        draw_cell(draw, left, top, *snake[-1], SNAKE_HEAD)

    return frame


def snake_path() -> list[tuple[int, int]]:
    path: list[tuple[int, int]] = []

    for row in range(GRID_ROWS):
        columns = range(GRID_COLS) if row % 2 == 0 else range(GRID_COLS - 1, -1, -1)
        for col in columns:
            path.append((col, row))

    return path


def snake_frames(
    size: tuple[int, int],
    cells: dict[tuple[int, int], tuple[int, int, int, int]],
) -> list[Image.Image]:
    frames: list[Image.Image] = []
    path = snake_path()
    eaten: set[tuple[int, int]] = set()
    body_length = 6

    for index in range(0, len(path), 2):
        head_path = path[max(0, index - body_length + 1) : index + 1]
        eaten.update(cell for cell in head_path if cell in cells)
        frames.append(draw_contribution_frame(size, cells, eaten, head_path))

    for _ in range(10):
        frames.append(draw_contribution_frame(size, cells, eaten, path[-body_length:]))

    return frames


def message_cells(message: str, font: dict[str, list[str]], max_rows: int) -> list[tuple[int, int]]:
    columns: list[list[str]] = []

    for char in message:
        if char == " ":
            for _ in range(3):
                columns.append(["0"] * max_rows)
            continue

        glyph = font[char]
        for col in range(len(glyph[0])):
            columns.append([glyph[row][col] for row in range(max_rows)])
        columns.append(["0"] * max_rows)

    if columns:
        columns.pop()

    start_col = max(0, (GRID_COLS - len(columns)) // 2)
    start_row = max(0, (GRID_ROWS - max_rows) // 2)
    cells: list[tuple[int, int]] = []

    for col_index, column in enumerate(columns):
        for row_index, value in enumerate(column):
            if value == "1":
                cells.append((start_col + col_index, start_row + row_index))

    return cells


def draw_lit_cell(draw: ImageDraw.ImageDraw, left: int, top: int, col: int, row: int) -> None:
    x = left + col * (CELL + GAP)
    y = top + row * (CELL + GAP)
    draw.rectangle((x - 3, y - 3, x + CELL + 2, y + CELL + 2), fill=GLOW_CELL)
    draw.rectangle((x, y, x + CELL - 1, y + CELL - 1), fill=LIT_CELL)


def message_frames(size: tuple[int, int], message: str, font: dict[str, list[str]], rows: int) -> list[Image.Image]:
    cells = message_cells(message, font, rows)
    frames: list[Image.Image] = []
    visible_cells: list[tuple[int, int]] = []
    left, top = grid_origin(size)

    for cell in cells:
        visible_cells.append(cell)
        frame = empty_grid_frame(size)
        draw = ImageDraw.Draw(frame, "RGBA")
        for col, row in visible_cells:
            draw_lit_cell(draw, left, top, col, row)
        frames.append(frame)

    for _ in range(14):
        frame = empty_grid_frame(size)
        draw = ImageDraw.Draw(frame, "RGBA")
        for col, row in cells:
            draw_lit_cell(draw, left, top, col, row)
        frames.append(frame)

    return frames


def main() -> None:
    if len(sys.argv) not in {2, 3}:
        raise SystemExit("Usage: append_game_over.py <input-gif-path> [output-gif-path]")

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2]) if len(sys.argv) == 3 else input_path
    source = Image.open(input_path)
    cells = extract_contribution_cells(source)
    animation_frames = [
        *snake_frames(source.size, cells),
        *message_frames(source.size, "GAME OVER", FONT_5X7, 7),
    ]
    frames = [frame.convert("P", palette=Image.Palette.ADAPTIVE) for frame in animation_frames]
    durations = [80] * len(frames)

    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        optimize=False,
        disposal=2,
    )


if __name__ == "__main__":
    main()
