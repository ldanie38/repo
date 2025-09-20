
## It inherits from BaseAPIClient, so it automatically gets get, post, put, and delete
## SendGrid’s API (which is an email‑sending service)

import os
from .base_client import BaseAPIClient

class SendGridClient(BaseAPIClient):
    def __init__(self):
        super().__init__(
            base_url="https://api.sendgrid.com/v3",
            api_key=os.getenv("SENDGRID_API_KEY")
        )
        self.headers = {"Authorization": f"Bearer {self.api_key}"}

    def send_email(self, from_email, to_email, subject, content):
        data = {
            "personalizations": [{"to": [{"email": to_email}]}],
            "from": {"email": from_email},
            "subject": subject,
            "content": [{"type": "text/plain", "value": content}]
        }
        return self.post("/mail/send", json=data, headers=self.headers)

    def list_templates(self):
        return self.get("/templates", headers=self.headers)

    def update_template(self, template_id, name):
        data = {"name": name}
        return self.patch(f"/templates/{template_id}", json=data, headers=self.headers)

    def delete_template(self, template_id):
        return self.delete(f"/templates/{template_id}", headers=self.headers)


    


