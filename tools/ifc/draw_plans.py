"""Plans et façades d'un fichier IFC dessinés par IfcOpenShell (`ifcopenshell.draw`), M20 20.8.

Outil complémentaire, hors application : un second dessin, indépendant de Fabrics, pour contrôler un
export IFC (murs, ouvertures et pièces à la bonne place). Ce n'est pas un moteur de feuilles (voir
`docs/phases/M20-ifcopenshell-draw.md`).

Utilisation (terminal de VS Code, depuis la racine du projet) :
    tools/ifc/.venv/Scripts/python.exe -I tools/ifc/draw_plans.py fichier.ifc dossier_de_sortie [--scale 50]

Écrit un SVG par dessin (un plan par niveau, puis les quatre façades) à l'échelle demandée, en mm sur une
feuille A1 paysage.

Contournements des défauts d'IfcOpenShell 0.9.0.post1 :
  - le calcul des « cellules » plante (`SwigPyObject … is_a`) : désactivé (`cells=False`) ;
  - tous les dessins sont posés au même endroit d'une seule page : un fichier par dessin ;
  - le « ² » des surfaces est échappé deux fois (`m&amp;#178;`) : remis en « m² » ;
  - les styles sont dans une feuille CSS que plusieurs visionneuses ignorent : recopiés sur chaque trait.
"""

from __future__ import annotations

import argparse
import re
import sys
import time
from pathlib import Path
from xml.dom import minidom

import ifcopenshell
import ifcopenshell.draw

CUT = "fill:#808080;stroke:#000000;stroke-width:0.35;fill-rule:evenodd"
SEEN = "fill:none;stroke:#000000;stroke-width:0.18"
TEXT = "font-size:2.5px;font-family:'Liberation Sans',Arial,sans-serif"


def styled(group: minidom.Element) -> None:
    """Recopie le style de la feuille CSS sur chaque trait : matière coupée en gris, éléments vus en trait fin."""

    def walk(node: minidom.Element, mode: str) -> None:
        for child in node.childNodes:
            if child.nodeType != child.ELEMENT_NODE:
                continue
            classes = child.getAttribute("class").split()
            current = "cut" if "cut" in classes else "projection" if "projection" in classes else mode
            if child.tagName == "path":
                child.setAttribute("style", CUT if current == "cut" else SEEN)
            elif child.tagName == "text":
                child.setAttribute("style", TEXT)
            walk(child, current)

    walk(group, "projection")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("ifc", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--scale", type=float, default=50.0, help="dénominateur de l'échelle (50 pour 1:50)")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    model = ifcopenshell.open(str(args.ifc))
    settings = ifcopenshell.draw.draw_settings(
        width=841,
        height=594,
        scale=1 / args.scale,
        cells=False,
        auto_floorplan=True,
        auto_elevation=True,
        space_names=True,
        space_areas=True,
        door_arcs=True,
    )
    start = time.time()
    raw = ifcopenshell.draw.main(settings, [model])
    seconds = time.time() - start
    text = raw.decode("utf-8") if isinstance(raw, bytes) else raw

    document = minidom.parseString(text)
    root = document.documentElement
    args.output.mkdir(parents=True, exist_ok=True)
    count = 0
    for group in [n for n in root.childNodes if n.nodeType == n.ELEMENT_NODE and n.tagName == "g"]:
        name = group.getAttribute("ifc:name") or f"dessin-{count + 1}"
        styled(group)
        body = group.toxml().replace("m&amp;#178;", "m²")
        svg = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:ifc="http://www.ifcopenshell.org/ns" '
            f'width="841mm" height="594mm" viewBox="0 0 841 594"><title>{name}</title>'
            f'<rect width="841" height="594" fill="#ffffff"/>{body}</svg>\n'
        )
        safe = re.sub(r"[^A-Za-z0-9+]+", "_", name).strip("_")
        (args.output / f"{safe}.svg").write_text(svg, encoding="utf-8")
        count += 1
    print(f"{count} dessin(s) à 1:{args.scale:g} dans {args.output} ({seconds:.1f} s)")
    return 0 if count else 1


if __name__ == "__main__":
    sys.exit(main())
