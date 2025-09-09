from unittest.mock import patch, MagicMock
from src.integrations.facebook_client import FacebookClient
from src.integrations.sendgrid_client import SendGridClient
##cd repo
## python -m src.integrations.birthday_automation_demo


def run_demo():
    fb = FacebookClient()
    sendgrid = SendGridClient()

    with patch.object(FacebookClient, 'create_post') as mock_fb_post, \
         patch.object(SendGridClient, 'send_email') as mock_send_email:

        # Fake Facebook response
        fb_response = MagicMock()
        fb_response.json.return_value = {
            "id": "fb_post_123",
            "message": "Happy Birthday, Alex! 🎉 Enjoy 20% off today!"
        }
        mock_fb_post.return_value = fb_response

        # Fake SendGrid response
        sendgrid_response = MagicMock()
        sendgrid_response.json.return_value = {"message": "Email queued"}
        mock_send_email.return_value = sendgrid_response

        # 1. Facebook Post
        fb_post = fb.create_post("123456789", "Happy Birthday, Alex! 🎉 Enjoy 20% off today!")
        print(f"[Facebook] Created post: {fb_post.json()}")

        # 2. SendGrid Email
        email_resp = sendgrid.send_email(
            from_email="hello@mybakery.com",
            to_email="alex@example.com",
            subject="Happy Birthday from My Bakery 🎂",
            content="We hope you have an amazing day! Stop by for a free cupcake."
        )
        print(f"[SendGrid] Email status: {email_resp.json()}")

if __name__ == "__main__":
    run_demo()
