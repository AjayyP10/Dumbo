#!/usr/bin/env python
import os
import sys
from pathlib import Path

# Add project root to PYTHONPATH so that "backend" package is importable
ROOT_PATH = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_PATH))

if __name__ == "__main__":
    # Use the fully-qualified settings module path
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.dumbo.settings")
    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
