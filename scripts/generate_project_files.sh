#!/usr/bin/env bash
set -euo pipefail

PROJECT_PATH=${UE4_PROJECT:-/workspace/Game-Concept-2-UE4/GameConcept2.uproject}
UE4_ROOT=${UE4_ROOT:-/home/ue4/UnrealEngine}

"${UE4_ROOT}/GenerateProjectFiles.sh" -project="${PROJECT_PATH}" -game -engine
