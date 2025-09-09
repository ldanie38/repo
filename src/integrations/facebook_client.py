import os
from .base_client import BaseAPIClient
## It inherits from BaseAPIClient, so it automatically gets get, post, put, and delete

class FacebookClient(BaseAPIClient):
    def __init__(self):
        super().__init__(
            base_url="https://graph.facebook.com/v17.0",
            api_key=os.getenv("FACEBOOK_API_KEY")
        )

    def create_post(self, page_id, message):
        return self.post(
            f"/{page_id}/feed",
            json={"message": message},
            params={"access_token": self.api_key}
        )

    def upload_photo(self, page_id, image_url, caption=""):
        return self.post(
            f"/{page_id}/photos",
            json={"url": image_url, "caption": caption},
            params={"access_token": self.api_key}
        )

    def get_post(self, post_id):
        return self.get(
            f"/{post_id}",
            params={"access_token": self.api_key}
        )

    def update_post(self, post_id, message):
        return self.post(
            f"/{post_id}",
            json={"message": message},
            params={"access_token": self.api_key}
        )

    def delete_post(self, post_id):
        return self.delete(
            f"/{post_id}",
            params={"access_token": self.api_key}
        )
