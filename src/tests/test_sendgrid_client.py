import unittest
from unittest.mock import patch, MagicMock
from src.integrations.sendgrid_client import SendGridClient
## python -m unittest -v src.tests.test_sendgrid_client
## python -m unittest -v src/tests/test_sendgrid_client.py


class TestSendGridClient(unittest.TestCase):

    @patch("src.integrations.sendgrid_client.BaseAPIClient.post")
    def test_send_email(self, mock_post):
        fake_response = MagicMock()
        fake_response.json.return_value = {"message": "Email queued"}
        fake_response.status_code = 202
        mock_post.return_value = fake_response

        sg = SendGridClient()
        resp = sg.send_email("from@example.com", "to@example.com", "Subject", "Body text")

        self.assertEqual(resp.json()["message"], "Email queued")
        mock_post.assert_called_once()

    @patch("src.integrations.sendgrid_client.BaseAPIClient.get")
    def test_list_templates(self, mock_get):
        fake_response = MagicMock()
        fake_response.json.return_value = {
            "templates": [
                {"id": "tmpl_1", "name": "Birthday Template"},
                {"id": "tmpl_2", "name": "Promo Template"}
            ]
        }
        fake_response.status_code = 200
        mock_get.return_value = fake_response

        sg = SendGridClient()
        resp = sg.list_templates()

        self.assertEqual(len(resp.json()["templates"]), 2)
        mock_get.assert_called_once()

    @patch("src.integrations.sendgrid_client.BaseAPIClient.patch")
    def test_update_template(self, mock_patch):
        fake_response = MagicMock()
        fake_response.json.return_value = {"id": "tmpl_1", "name": "Updated Template"}
        fake_response.status_code = 200
        mock_patch.return_value = fake_response

        sg = SendGridClient()
        resp = sg.update_template("tmpl_1", "Updated Template")

        self.assertEqual(resp.json()["name"], "Updated Template")
        mock_patch.assert_called_once()

    @patch("src.integrations.sendgrid_client.BaseAPIClient.delete")
    def test_delete_template(self, mock_delete):
        fake_response = MagicMock()
        fake_response.json.return_value = {"message": "Template deleted"}
        fake_response.status_code = 204
        mock_delete.return_value = fake_response

        sg = SendGridClient()
        resp = sg.delete_template("tmpl_1")

        self.assertEqual(resp.json()["message"], "Template deleted")
        mock_delete.assert_called_once()

if __name__ == "__main__":
    unittest.main()
