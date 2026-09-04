from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
import os

# Define que o token deve vir no formato Bearer na requisição
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "minha_chave_super_secreta_sigma_2")
ALGORITHM = "HS256"

def obter_usuario_logado(token: str = Depends(oauth2_scheme)):
    """
    Decodifica o token JWT e retorna o payload do usuário.
    Garante que a rota só pode ser acessada por alguém com um token válido.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Aqui o payload contém {"sub": email, "user_id": ..., "role": ...}
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas ou token malformado",
            headers={"WWW-Authenticate": "Bearer"},
        )
