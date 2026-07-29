def test_auth_google_invalid_token(client):
    response = client.post("/api/v1/auth/google", json={"credential": "invalid_token_xyz"})
    
    # A rota deve retornar 401 Unauthorized se o token não puder ser decodificado pelo Google
    assert response.status_code == 401
    assert "Token do Google inválido" in response.json()["detail"]

def test_auth_login_tradicional_invalid_credentials(client):
    response = client.post("/api/v1/auth/login", json={"username": "fake@user.com", "password": "wrongpassword"})
    
    # O mock retorna 401 para credenciais não encontradas
    assert response.status_code == 401
    assert "Credenciais inválidas" in response.json()["detail"]
