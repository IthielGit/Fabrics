"""Contrôle du gate G5 (M22, 22.5) : relit avec IfcOpenShell chaque IFC exporté par Fabrics.

Utilisation (terminal de VS Code, depuis la racine du projet) : `npm run check:ifc`, ou
    tools/ifc/.venv/Scripts/python.exe -I tools/ifc/check_g5.py tmp/ifc-g5 --ids tools/ifc/fabrics-g5.ids --report tmp/ifc-g5/report.md

Pour chaque `<nom>.ifc` du dossier (avec `<nom>.expected.json`) :
1. validation du schéma IFC4 (ifcopenshell.validate) : aucune erreur ;
2. exigences IDS (ifctester) : toutes remplies ;
3. quantités écrites (Qto_*) ↔ géométrie relue par IfcOpenShell : écart < 0,1 % (D21-6) ; une
   quantité « provisoire » côté Fabrics (propriété Fabrics.QuantityStatus) est signalée, pas comptée en
   échec ;
4. niveaux : mêmes noms et altitudes (±1 mm) que le plan ;
5. matériaux des murs et classification Uniclass : comptés.
Code de sortie 1 au premier point en échec.
"""

from __future__ import annotations

import argparse
import json
import logging
import pathlib
import sys

import ifcopenshell
import ifcopenshell.geom
import ifcopenshell.util.classification
import ifcopenshell.util.element
import ifcopenshell.util.shape
import ifcopenshell.util.unit
import ifcopenshell.validate
from ifctester import ids

TOLERANCE = 0.001


class _Collector(logging.Handler):
    def __init__(self) -> None:
        super().__init__()
        self.messages: list[str] = []

    def emit(self, record: logging.LogRecord) -> None:
        self.messages.append(self.format(record))


def schema_errors(model) -> list[str]:
    logger = logging.getLogger(f"g5-{id(model)}")
    logger.propagate = False
    collector = _Collector()
    logger.addHandler(collector)
    ifcopenshell.validate.validate(model, logger)
    return collector.messages


def ids_results(model, ids_path: str) -> list[dict]:
    specs = ids.open(ids_path)
    specs.validate(model)
    out = []
    for spec in specs.specifications:
        failed = sorted({f"{e.is_a()} « {getattr(e, 'Name', '') or ''} »" for e in getattr(spec, "failed_entities", set())})
        out.append({"name": spec.name, "ok": bool(spec.status), "failed": failed[:10], "failedCount": len(failed)})
    return out


def quantity(element, qto: str, name: str):
    return ifcopenshell.util.element.get_psets(element).get(qto, {}).get(name)


def status_of(element) -> str:
    return ifcopenshell.util.element.get_pset(element, "Fabrics", "QuantityStatus") or "validated"


def compare_quantities(model) -> list[dict]:
    scale = ifcopenshell.util.unit.calculate_unit_scale(model)
    settings = ifcopenshell.geom.settings()
    settings.set("use-world-coords", True)
    rows = []

    def geometry(element):
        try:
            return ifcopenshell.geom.create_shape(settings, element).geometry
        except Exception:
            return None

    def row(element, label: str, written, measured):
        if written is None or measured is None:
            return
        gap = abs(measured - written) / written if written else (0.0 if measured == 0 else float("inf"))
        within = gap <= TOLERANCE
        provisional = status_of(element) != "validated"
        rows.append(
            {
                "entity": element.is_a(),
                "name": element.Name or "",
                "quantity": label,
                "written": written,
                "measured": measured,
                "gap": gap,
                "ok": within or provisional,
                "note": "" if within else "quantité provisoire côté Fabrics" if provisional else "hors tolérance",
            }
        )

    for wall in model.by_type("IfcWall"):
        g = geometry(wall)
        row(wall, "NetVolume (m³)", quantity(wall, "Qto_WallBaseQuantities", "NetVolume"), g and ifcopenshell.util.shape.get_volume(g))
    for slab in model.by_type("IfcSlab"):
        g = geometry(slab)
        row(slab, "NetVolume (m³)", quantity(slab, "Qto_SlabBaseQuantities", "NetVolume"), g and ifcopenshell.util.shape.get_volume(g))
    for kind, qto in (("IfcDoor", "Qto_DoorBaseQuantities"), ("IfcWindow", "Qto_WindowBaseQuantities")):
        for element in model.by_type(kind):
            area = (element.OverallWidth or 0.0) * scale * (element.OverallHeight or 0.0) * scale
            row(element, "Area (m²)", quantity(element, qto, "Area"), area)
    for space in model.by_type("IfcSpace"):
        g = geometry(space)
        row(space, "GrossFloorArea (m²)", quantity(space, "Qto_SpaceBaseQuantities", "GrossFloorArea"), g and ifcopenshell.util.shape.get_footprint_area(g))
    return rows


def check_levels(model, expected: list[dict]) -> list[dict]:
    scale = ifcopenshell.util.unit.calculate_unit_scale(model)
    storeys = sorted(model.by_type("IfcBuildingStorey"), key=lambda s: s.Elevation or 0.0)
    found = [{"name": s.Name, "elevation_mm": round((s.Elevation or 0.0) * scale * 1000, 1)} for s in storeys]
    rows = []
    for i, level in enumerate(expected):
        got = found[i] if i < len(found) else None
        ok = got is not None and got["name"] == level["name"] and abs(got["elevation_mm"] - level["elevation_mm"]) <= 1
        rows.append({"expected": level, "found": got, "ok": ok})
    if len(found) != len(expected):
        rows.append({"expected": f"{len(expected)} niveaux", "found": f"{len(found)} niveaux", "ok": False})
    return rows


def check_file(ifc_path: pathlib.Path, ids_path: str) -> dict:
    expected = json.loads(ifc_path.with_suffix("").with_suffix(".expected.json").read_text(encoding="utf-8")) if ifc_path.with_name(ifc_path.stem + ".expected.json").exists() else {"levels": []}
    model = ifcopenshell.open(str(ifc_path))
    walls = model.by_type("IfcWall")
    products = [e for e in model.by_type("IfcElement") if not e.is_a("IfcOpeningElement")]
    result = {
        "name": ifc_path.stem,
        "schema": model.schema,
        "schemaErrors": schema_errors(model),
        "ids": ids_results(model, ids_path),
        "quantities": compare_quantities(model),
        "levels": check_levels(model, expected.get("levels", [])),
        "wallsWithMaterial": sum(1 for w in walls if ifcopenshell.util.element.get_material(w) is not None),
        "walls": len(walls),
        "classified": sum(1 for e in products if ifcopenshell.util.classification.get_references(e)),
        "products": len(products),
        "counts": {t: len(model.by_type(t)) for t in ("IfcBuildingStorey", "IfcWall", "IfcSlab", "IfcDoor", "IfcWindow", "IfcOpeningElement", "IfcSpace", "IfcRoof", "IfcStair", "IfcFurnishingElement")},
    }
    result["ok"] = (
        result["schema"] == "IFC4"
        and not result["schemaErrors"]
        and all(s["ok"] for s in result["ids"])
        and all(q["ok"] for q in result["quantities"])
        and all(level["ok"] for level in result["levels"])
        and result["wallsWithMaterial"] == result["walls"]
    )
    return result


def report(results: list[dict]) -> str:
    lines = ["# Contrôle IFC du gate G5 (M22)", "", f"Tolérance des quantités : {TOLERANCE:.1%} (D21-6).", ""]
    for r in results:
        lines += [f"## {r['name']} — {'OK' if r['ok'] else 'ÉCHEC'}", ""]
        lines.append(f"- Schéma : {r['schema']}, {len(r['schemaErrors'])} erreur(s) de validation")
        for message in r["schemaErrors"][:10]:
            lines.append(f"  - {message}")
        ids_ok = sum(1 for s in r["ids"] if s["ok"])
        lines.append(f"- IDS : {ids_ok} / {len(r['ids'])} exigence(s) remplie(s)")
        for s in r["ids"]:
            if not s["ok"]:
                lines.append(f"  - « {s['name']} » : {s['failedCount']} objet(s) en défaut ({', '.join(s['failed'])})")
        qs = r["quantities"]
        exact = sum(1 for q in qs if q["note"] == "")
        provisional = [q for q in qs if q["note"] == "quantité provisoire côté Fabrics"]
        bad = [q for q in qs if not q["ok"]]
        worst = max((q["gap"] for q in qs if q["note"] == ""), default=0.0)
        lines.append(f"- Quantités ↔ géométrie : {exact} / {len(qs)} dans la tolérance (écart le plus grand {worst:.3%}) ; {len(provisional)} provisoire(s) ; {len(bad)} hors tolérance")
        for q in provisional + bad:
            lines.append(f"  - {q['entity']} « {q['name']} » {q['quantity']} : écrit {q['written']:.4f}, géométrie {q['measured']:.4f} ({q['gap']:.2%}, {q['note']})")
        levels_ok = all(level["ok"] for level in r["levels"])
        lines.append(f"- Niveaux : {'mêmes noms et altitudes' if levels_ok else 'ÉCART'} ({', '.join(str(level['found']['name']) + ' ' + str(level['found']['elevation_mm']) + ' mm' for level in r['levels'] if isinstance(level.get('found'), dict))})")
        lines.append(f"- Matériaux : {r['wallsWithMaterial']} / {r['walls']} mur(s) avec un matériau")
        lines.append(f"- Classification Uniclass : {r['classified']} / {r['products']} objet(s) classés")
        lines.append("- Objets : " + ", ".join(f"{k} {v}" for k, v in r["counts"].items() if v))
        lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("folder")
    parser.add_argument("--ids", required=True)
    parser.add_argument("--report")
    args = parser.parse_args()
    files = sorted(pathlib.Path(args.folder).glob("*.ifc"))
    if not files:
        print(f"Aucun fichier .ifc dans {args.folder}")
        return 1
    results = [check_file(path, args.ids) for path in files]
    text = report(results)
    if args.report:
        pathlib.Path(args.report).write_text(text, encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    print(text)
    return 0 if all(r["ok"] for r in results) else 1


if __name__ == "__main__":
    sys.exit(main())
