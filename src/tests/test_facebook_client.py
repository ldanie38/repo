import unittest
from unittest.mock import patch, MagicMock
from src.integrations.facebook_client import FacebookClient

class TestFacebookClient(unittest.TestCase):

    @patch("src.integrations.facebook_client.BaseAPIClient.get")
    def test_get_campaign(self, mock_base_get):
        # Arrange: fake response object
        fake_response = MagicMock()
        fake_response.json.return_value = {
            "id": "123",
            "name": "Test Campaign"
        }
        fake_response.status_code = 200
        mock_base_get.return_value = fake_response

        fb = FacebookClient()

        # Act
        resp = fb.get_campaign("123")

        # Assert
        self.assertEqual(resp.json()["name"], "Test Campaign")
        mock_base_get.assert_called_once_with(
            "/123",
            params={"access_token": fb.api_key}
        )

if __name__ == "__main__":
    unittest.main()


## in the root run 
## python -m unittest discover -s src/tests

## or
## python -m pytest src/tests


