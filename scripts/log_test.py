import os
import sys
import django

# Add src/ to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

# Point to Django settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Load Django
django.setup()

# Trigger the log
import logging
logger = logging.getLogger(__name__)
logger.error("Failed to connect to external API (timeout after 5s)")

