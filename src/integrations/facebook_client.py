import os
from .base_client import BaseAPIClient

class FacebookClient(BaseAPIClient):
    def __init__(self):
        super().__init__(
            base_url="https://graph.facebook.com/v17.0",
            api_key=os.getenv("FACEBOOK_API_KEY")
        )

    def get_campaign(self, campaign_id):
        return self.get(f"/{campaign_id}", params={"access_token": self.api_key})

    def create_campaign(self, ad_account_id, data):
        return self.post(
            f"/act_{ad_account_id}/campaigns",
            json=data,
            params={"access_token": self.api_key}
        )

    def update_campaign(self, campaign_id, data):
        return self.post(
            f"/{campaign_id}",
            json=data,
            params={"access_token": self.api_key}
        )

    def delete_campaign(self, campaign_id):
        return self.delete(
            f"/{campaign_id}",
            params={"access_token": self.api_key}
        )

