import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from main import app

@pytest.fixture(scope="module")
def client():
    # Inicializa o TestClient com a nossa aplicação principal
    with TestClient(app) as c:
        yield c
