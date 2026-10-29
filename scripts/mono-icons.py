"""
Monochrome tool icons for the hero ring and the About toolkit.

  python3 scripts/mono-icons.py

Reads the colour logos in images/tools/ and writes src/icons/<name>.svg:
the logo's tile or shield becomes a thin outline and the glyph is filled,
both in currentColor, so CSS can turn them gold on hover.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "images/tools", ROOT / "src/icons"

# name: (outline the first path?, outline every path?, fills to drop)
ICONS = {
    "html5": (True, False, {"#ef652a"}),
    "css": (True, False, set()),
    "javascript": (True, False, set()),
    "threejs": (False, False, set()),
    "figma": (False, True, set()),
    "photoshop": (True, False, set()),
    "after-effects": (True, False, set()),
    "premiere": (True, False, set()),
    "illustrator": (True, False, set()),
    "python": (False, True, set()),
    "vscode": (False, False, set()),
    "github": (False, False, set()),
    "davinci": (False, True, set()),
    "canva": (True, False, set()),
}

STROKE = 'fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke"'


def convert(name: str, outline_first: bool, outline_all: bool, drop: set) -> str:
    svg = (SRC / f"{name}.svg").read_text()
    view_box = re.search(r'viewBox="([^"]+)"', svg).group(1)
    paths = re.findall(r"<path\b[^>]*?/?>", svg)
    out = []
    for i, p in enumerate(paths):
        fill = (re.search(r'fill="([^"]+)"', p) or [None, ""])[1].lower()
        if fill in drop:
            continue
        d = re.search(r'\sd="([^"]+)"', p).group(1)
        rule = re.search(r'fill-rule="([^"]+)"', p)
        extra = f' fill-rule="{rule.group(1)}"' if rule else ""
        style = STROKE if outline_all or (outline_first and i == 0) else 'fill="currentColor"'
        out.append(f'<path d="{d}" {style}{extra}/>')
    return f'<svg viewBox="{view_box}" aria-hidden="true" focusable="false">{"".join(out)}</svg>\n'


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, rules in ICONS.items():
        (OUT / f"{name}.svg").write_text(convert(name, *rules))
    print(f"{len(ICONS)} icons -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
