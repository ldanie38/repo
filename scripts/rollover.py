import logging
from logging.handlers import RotatingFileHandler

# Create a rotating file handler
handler = RotatingFileHandler("app.log", maxBytes=1000, backupCount=3)

# Attach it to the root logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.addHandler(handler)

# Write something to the log
logger.info("Before rollover")

# Trigger the rollover manually
handler.doRollover()

# Write again to confirm rollover worked
logger.info("After rollover")

