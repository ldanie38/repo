
# shared request logic

import os
import requests
from dotenv import load_dotenv

load_dotenv()

class BaseAPIClient:
    def __init__(self, base_url, api_key=None):
        self.base_url = base_url
        self.api_key = api_key

    def get(self, endpoint, params=None):
        return requests.get(f"{self.base_url}{endpoint}", params=params)

    def post(self, endpoint, data=None, json=None):
        return requests.post(f"{self.base_url}{endpoint}", data=data, json=json)

    def put(self, endpoint, data=None, json=None):
        return requests.put(f"{self.base_url}{endpoint}", data=data, json=json)

    def delete(self, endpoint):
        return requests.delete(f"{self.base_url}{endpoint}")
