#!/bin/bash
set -e
pushd front_end
echo "Type-checking the front end"
tsc --strict main.ts
echo "Type-checking the back end"
mypy gash.py --strict --ignore-missing-imports
echo "Running"
python3 gash.py
popd
echo "Done"
