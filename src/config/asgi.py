import os
import sys

# Allow imports from the top-level src/ directory
sys.path.insert(0, os.path.join(os.getcwd(), "src"))

import django
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_asgi_application()
