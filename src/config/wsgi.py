import os
import sys

# Allow imports from the top-level src/ directory
sys.path.insert(0, os.path.join(os.getcwd(), "src"))

import django
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()

# wsgi is the layer between  Django app and the outside world when we deploy.

##Your WSGI server (e.g., Gunicorn) is told: “Load the callable named application from config/wsgi.py.”

## That file:

##Sets the DJANGO_SETTINGS_MODULE so Django knows which settings to use.

# calls get_wsgi_application() to create the WSGI application object.

## Exposes it as application so the server can call it for every HTTP request.##