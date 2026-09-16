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


# ALTERAÇÃO (2026-09-16): POST /api/v1/pessoas/ estava completamente aberta,
# sem nenhum Depends de autenticação — qualquer um na internet podia criar
# uma Pessoa com senha e permissoes_sistema de sua própria escolha, ou criar
# uma Pessoa sem senha e (antes da remoção da "Ativação de Cadastro") se
# auto-ativar. Essa combinação recriava a Via 2 (decisao-controle-acesso-
# cadastro.md, seção 2) sem nenhuma validação humana — o motivo exato pelo
# qual a Via 2 exige aprovação. Esta dependência fecha essa porta: só quem
# já tem um token válido com papel administrativo pode chamar rotas de
# criação/gestão de Pessoa diretamente; um candidato novo passa a ser
# obrigado a usar POST /solicitacoes-cadastro (público, mas sem criar
# Pessoa nem emitir credencial por si só).
PAPEIS_ADMINISTRATIVOS = ("super_admin", "webmaster")


def exigir_papel_administrativo(payload: dict = Depends(obter_usuario_logado)):
    """Garante que o token pertence a alguém com papel administrativo
    (super_admin ou webmaster) — ver PAPEIS_ADMINISTRATIVOS acima."""
    if payload.get("role") not in PAPEIS_ADMINISTRATIVOS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta ação exige um papel administrativo (super_admin ou webmaster).",
        )
    return payload
