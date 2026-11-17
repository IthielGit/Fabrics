"""Contrôle d'un fichier IFC avec IfcOpenShell (M17, lot 8).

Utilisation (terminal de VS Code, depuis la racine du projet) :
    tools/ifc/.venv/Scripts/python.exe -I tools/ifc/validate.py chemin/fichier.ifc [--json]

Affiche le schéma, le nombre d'entités par type de bâtiment, les niveaux (altitudes en mm) et le
résultat de la validation du schéma. Code de sortie 1 si la validation trouve une erreur.
"""

from __future__ import annotations

import argparse
import json
import logging
import sys

import ifcopenshell
import ifcopenshell.util.unit
import ifcopenshell.validate

BUILDING_TYPES = (
    "IfcProject",
    "IfcSite",
    "IfcBuilding",
    "IfcBuildingStorey",
    "IfcWall",
    "IfcWallStandardCase",
    "IfcSlab",
    "IfcRoof",
    "IfcDoor",
    "IfcWindow",
    "IfcOpeningElement",
    "IfcSpace",
    "IfcStair",
    "IfcColumn",
    "IfcBeam",
    "IfcFurnishingElement",
    "IfcCovering",
    "IfcMaterial",
    "IfcPropertySet",
    "IfcElementQuantity",
)


class _Collector(logging.Handler):
    def __init__(self) -> None:
        super().__init__()
        self.messages: list[str] = []

    def emit(self, record: logging.LogRecord) -> None:
        self.messages.append(self.format(record))


def check(path: str) -> dict:
    model = ifcopenshell.open(path)
    scale = ifcopenshell.util.unit.calculate_unit_scale(model)  # unités du fichier -> mètres
    counts = {name: len(model.by_type(name, include_subtypes=False)) for name in BUILDING_TYPES}
    storeys = [
        {
            "name": storey.Name,
            "elevation_mm": round((storey.Elevation or 0) * scale * 1000),
        }
        for storey in model.by_type("IfcBuildingStorey")
    ]
    storeys.sort(key=lambda s: s["elevation_mm"])

    logger = logging.getLogger("ifc-validate")
    logger.propagate = False
    logger.setLevel(logging.ERROR)
    collector = _Collector()
    logger.handlers = [collector]
    ifcopenshell.validate.validate(model, logger)

    return {
        "file": path,
        "ifcopenshell": ifcopenshell.version,
        "schema": model.schema,
        "lengthUnitToMetre": scale,
        "counts": {k: v for k, v in counts.items() if v},
        "storeys": storeys,
        "validationErrors": len(collector.messages),
        "firstErrors": collector.messages[:3],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Contrôle d'un fichier IFC (IfcOpenShell)")
    parser.add_argument("path")
    parser.add_argument("--json", action="store_true", help="sortie JSON")
    args = parser.parse_args()
    # La console Windows n'est pas en UTF-8 par défaut : accents illisibles sans cette ligne.
    sys.stdout.reconfigure(encoding="utf-8")
    result = check(args.path)
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"Fichier : {result['file']}")
        print(f"IfcOpenShell {result['ifcopenshell']} · schéma {result['schema']} · 1 unité = {result['lengthUnitToMetre']} m")
        for name, count in result["counts"].items():
            print(f"  {name:<22} {count}")
        for storey in result["storeys"]:
            print(f"  Niveau « {storey['name']} » à {storey['elevation_mm']} mm")
        print(f"Erreurs de validation : {result['validationErrors']}")
        for message in result["firstErrors"]:
            print(f"  - {message}")
    return 1 if result["validationErrors"] else 0


if __name__ == "__main__":
    sys.exit(main())
