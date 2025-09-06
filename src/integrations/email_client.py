from .base_client import BaseAPIClient
import os

class EmailClient(BaseAPIClient):
    def __init__(self):
        super().__init__(
            base_url="https://api.sendgrid.com/v3",
            api_key=os.getenv("SENDGRID_API_KEY")
        )

    def send_email(self, from_email, to_email, subject, content):
        data = {
            "personalizations": [{"to": [{"email": to_email}]}],
            "from": {"email": from_email},
            "subject": subject,
            "content": [{"type": "text/plain", "value": content}]
        }
        headers = {"Authorization": f"Bearer {self.api_key}"}
        return self.post("/mail/send", json=data, headers=headers)
