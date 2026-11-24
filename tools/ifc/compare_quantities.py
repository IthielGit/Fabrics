"""Comparaison du quantitatif de Fabrics avec un IFC relu par IfcOpenShell (M21, sous-lot 21.6).

Utilisation (terminal de VS Code, depuis la racine du projet) :
    npm run check:ifc-quantities
ou, sur des fichiers déjà écrits :
    tools/ifc/.venv/Scripts/python.exe -I tools/ifc/compare_quantities.py tmp/ifc-exchange [--report fichier.md]

Pour chaque jeu `<nom>.ifc` + `<nom>.quantities.json` du dossier :
- murs : volume du solide IFC (ouvertures découpées), calculé par la géométrie d'IfcOpenShell, sommé par
  élément Fabrics (un mur à plusieurs côtés donne plusieurs IfcWall), comparé au volume net de Fabrics ;
- portes et fenêtres : OverallWidth × OverallHeight, comparé à la surface de l'ouverture ;
- dalles dessinées (IfcSlab) : volume du solide, comparé au volume de la dalle ;
- pièces (IfcSpace) : surface au sol du solide, comparée à la surface au tracé, **pour information**
  (Pascal exporte le contour de sa zone, Fabrics mesure le contour tracé : conventions différentes).
Tolérance relative : celle du jeu (D21-6, 0,1 %, provisoire). Une quantité « provisoire » côté Fabrics
(statut 21.4) est signalée sans compter comme un échec. Code de sortie 1 si un écart dépasse la
tolérance sur une quantité validée, ou si un élément manque dans l'IFC.
"""

from __future__ import annotations

import argparse
import json
import pathlib
import sys

import ifcopenshell
import ifcopenshell.geom
import ifcopenshell.util.element
import ifcopenshell.util.shape
import ifcopenshell.util.unit


def node_id(element) -> str | None:
    return ifcopenshell.util.element.get_pset(element, "Pascal", "NodeId")


def shape_of(settings, element):
    try:
        return ifcopenshell.geom.create_shape(settings, element).geometry
    except Exception:  # géométrie illisible : l'élément est signalé comme manquant
        return None


def compare_set(ifc_path: pathlib.Path, json_path: pathlib.Path) -> dict:
    data = json.loads(json_path.read_text(encoding="utf-8"))
    tolerance = float(data["relativeTolerance"])
    model = ifcopenshell.open(str(ifc_path))
    scale = ifcopenshell.util.unit.calculate_unit_scale(model)
    settings = ifcopenshell.geom.settings()
    settings.set("use-world-coords", True)

    measured: dict[str, float] = {}
    found: set[str] = set()

    def add(element_id: str, value: float) -> None:
        measured[element_id] = measured.get(element_id, 0.0) + value
        found.add(element_id)

    for ifc_type in ("IfcWall", "IfcSlab", "IfcSpace", "IfcDoor", "IfcWindow"):
        for element in model.by_type(ifc_type):
            nid = node_id(element)
            fid = data["nodeToElement"].get(nid) if nid else None
            if fid is None:
                continue
            kind = data["elements"][fid]["kind"]
            if ifc_type in ("IfcDoor", "IfcWindow"):
                width = (element.OverallWidth or 0.0) * scale
                height = (element.OverallHeight or 0.0) * scale
                add(fid, width * height)
            elif ifc_type == "IfcSpace":
                geometry = shape_of(settings, element)
                if geometry is not None:
                    add(fid, ifcopenshell.util.shape.get_footprint_area(geometry))
            else:
                geometry = shape_of(settings, element)
                if geometry is not None and kind in ("wall", "slab"):
                    add(fid, ifcopenshell.util.shape.get_volume(geometry))

    rows = []
    for fid, element in data["elements"].items():
        kind = element["kind"]
        ours = element.get("netVolume") if kind == "wall" else element.get("volume") if kind == "slab" else element.get("area")
        if ours is None:
            continue
        theirs = measured.get(fid)
        if theirs is None:
            rows.append({"id": fid, "name": element["name"], "kind": kind, "fabrics": ours, "ifc": None, "gap": None, "ok": False, "note": "absent de l'IFC"})
            continue
        gap = abs(theirs - ours) / ours if ours else (0.0 if theirs == 0 else float("inf"))
        within = gap <= tolerance
        note = ""
        if not within and kind == "room":
            note = "information : conventions différentes"
        elif not within and element.get("status", "validated") != "validated":
            note = "quantité provisoire côté Fabrics"
        ok = within or note != ""
        rows.append({"id": fid, "name": element["name"], "kind": kind, "fabrics": ours, "ifc": theirs, "gap": gap, "ok": ok, "note": note})
    return {"name": data["name"], "tolerance": tolerance, "rows": rows, "ok": all(r["ok"] for r in rows)}


UNITS = {"wall": "m³", "slab": "m³", "opening": "m²", "room": "m²"}
KINDS = {"wall": "mur (volume net)", "slab": "dalle (volume)", "opening": "ouverture (surface)", "room": "pièce (surface)"}


def report(results: list[dict]) -> str:
    lines = ["# Comparaison du quantitatif avec IfcOpenShell", ""]
    for result in results:
        bad = [r for r in result["rows"] if not r["ok"]]
        status = "OK" if result["ok"] else f"{len(bad)} écart(s) hors tolérance"
        lines += [f"## {result['name']} — {status}", "", f"Tolérance relative : {result['tolerance'] * 100:.2f} %", ""]
        lines += ["| Élément | Quantité | Fabrics | IFC | Écart | Remarque |", "|---|---|---:|---:|---:|---|"]
        for r in result["rows"]:
            unit = UNITS[r["kind"]]
            ifc = "absent" if r["ifc"] is None else f"{r['ifc']:.4f} {unit}"
            gap = "—" if r["gap"] is None else f"{r['gap'] * 100:.3f} %"
            mark = "" if r["ok"] else " ⚠"
            lines.append(f"| {r['name']} | {KINDS[r['kind']]} | {r['fabrics']:.4f} {unit} | {ifc} | {gap}{mark} | {r['note']} |")
        lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("folder")
    parser.add_argument("--report", help="écrit le rapport Markdown dans ce fichier")
    args = parser.parse_args()
    folder = pathlib.Path(args.folder)
    results = []
    for json_path in sorted(folder.glob("*.quantities.json")):
        ifc_path = json_path.with_name(json_path.name.replace(".quantities.json", ".ifc"))
        results.append(compare_set(ifc_path, json_path))
    text = report(results)
    if args.report:
        pathlib.Path(args.report).write_text(text, encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    for result in results:
        bad = [r for r in result["rows"] if not r["ok"]]
        noted = [r for r in result["rows"] if r["ok"] and r["note"]]
        print(f"{result['name']} : {len(result['rows'])} quantités comparées, {len(bad)} hors tolérance, {len(noted)} signalées")
        for r in bad:
            print(f"  ÉCHEC {r['name']} ({KINDS[r['kind']]}) : Fabrics {r['fabrics']:.4f}, IFC {r['ifc']}")
        for r in noted:
            print(f"  signalé {r['name']} ({KINDS[r['kind']]}, {r['note']}) : Fabrics {r['fabrics']:.4f}, IFC {r['ifc']:.4f}")
    return 0 if results and all(r["ok"] for r in results) else 1


if __name__ == "__main__":
    sys.exit(main())
