import unittest
from unittest.mock import patch, MagicMock
from src.integrations.facebook_client import FacebookClient
## python -m unittest discover -s src/tests -p "test*.py" -v
## python -m unittest -v


class TestFacebookClient(unittest.TestCase):

    @patch("src.integrations.facebook_client.BaseAPIClient.post")
    def test_create_post(self, mock_base_post):
        fake_response = MagicMock()
        fake_response.json.return_value = {"id": "post_123"}
        fake_response.status_code = 200
        mock_base_post.return_value = fake_response

        fb = FacebookClient()
        resp = fb.create_post("page_1", "Happy Birthday!")
        print("DEBUG:", resp.json())
        


        self.assertEqual(resp.json()["id"], "post_123")
        mock_base_post.assert_called_once_with(
            "/page_1/feed",
            json={"message": "Happy Birthday!"},
            params={"access_token": fb.api_key}
        )

    @patch("src.integrations.facebook_client.BaseAPIClient.post")
    def test_upload_photo(self, mock_base_post):
        fake_response = MagicMock()
        fake_response.json.return_value = {"id": "photo_456"}
        fake_response.status_code = 200
        mock_base_post.return_value = fake_response

        fb = FacebookClient()
        resp = fb.upload_photo("page_1", "http://example.com/image.jpg", "Birthday cake!")

        self.assertEqual(resp.json()["id"], "photo_456")
        mock_base_post.assert_called_once_with(
            "/page_1/photos",
            json={"url": "http://example.com/image.jpg", "caption": "Birthday cake!"},
            params={"access_token": fb.api_key}
        )

    @patch("src.integrations.facebook_client.BaseAPIClient.get")
    def test_get_post(self, mock_base_get):
        fake_response = MagicMock()
        fake_response.json.return_value = {"id": "post_123", "message": "Happy Birthday!"}
        fake_response.status_code = 200
        mock_base_get.return_value = fake_response

        fb = FacebookClient()
        resp = fb.get_post("post_123")

        self.assertEqual(resp.json()["message"], "Happy Birthday!")
        mock_base_get.assert_called_once_with(
            "/post_123",
            params={"access_token": fb.api_key}
        )

    @patch("src.integrations.facebook_client.BaseAPIClient.post")
    def test_update_post(self, mock_base_post):
        fake_response = MagicMock()
        fake_response.json.return_value = {"success": True}
        fake_response.status_code = 200
        mock_base_post.return_value = fake_response

        fb = FacebookClient()
        resp = fb.update_post("post_123", "Updated birthday message")

        self.assertTrue(resp.json()["success"])
        mock_base_post.assert_called_once_with(
            "/post_123",
            json={"message": "Updated birthday message"},
            params={"access_token": fb.api_key}
        )

    @patch("src.integrations.facebook_client.BaseAPIClient.delete")
    def test_delete_post(self, mock_base_delete):
        fake_response = MagicMock()
        fake_response.json.return_value = {"success": True}
        fake_response.status_code = 200
        mock_base_delete.return_value = fake_response

        fb = FacebookClient()
        resp = fb.delete_post("post_123")
        print(f"Simulated Facebook API response: {resp.json()}")

        self.assertTrue(resp.json()["success"])
        mock_base_delete.assert_called_once_with(
            "/post_123",
            params={"access_token": fb.api_key}
        )


if __name__ == "__main__":
    unittest.main()



## in the root run 
## python -m unittest discover -s src/tests



## or
## python -m pytest src/tests


