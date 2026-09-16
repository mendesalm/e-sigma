"""
Política de força de senha — 2026-09-16, a pedido explícito do usuário:
"quando houver a substituição da senha não aceitar senha fraca".

Usada em POST /auth/trocar-senha-obrigatoria (api/auth/rotas.py) — o único
lugar do ecossistema onde uma Pessoa escolhe a própria senha hoje (a senha
provisória enviada na aprovação de uma Solicitação de Cadastro é gerada
pelo sistema com `secrets.choice`, não passa por esta checagem).
"""
import re
from typing import Optional

# Lista curta de senhas comuns/fracas, verificada além das regras
# estruturais abaixo — não pretende ser exaustiva, só pegar os casos mais
# óbvios que passariam pelas regras de comprimento/composição.
SENHAS_FRACAS_COMUNS = {
    "12345678", "123456789", "1234567890", "password", "password1",
    "password123", "senha1234", "senha123!", "qwerty123", "qwertyui",
    "abcdefgh", "abcd1234", "11111111", "00000000", "admin1234",
    "letmein123", "trocar123", "mudar1234",
}


def validar_forca_senha(senha: str) -> Optional[str]:
    """Retorna None se a senha é forte o bastante, ou uma mensagem de erro
    (em português, pronta para HTTPException.detail) explicando o que
    falta. Regras: pelo menos 10 caracteres, com maiúscula, minúscula,
    número e caractere especial — e fora da lista de senhas óbvias
    conhecidas."""
    if not senha or len(senha) < 10:
        return "A senha precisa ter pelo menos 10 caracteres."
    if not re.search(r"[A-Z]", senha):
        return "A senha precisa ter pelo menos uma letra maiúscula."
    if not re.search(r"[a-z]", senha):
        return "A senha precisa ter pelo menos uma letra minúscula."
    if not re.search(r"\d", senha):
        return "A senha precisa ter pelo menos um número."
    if not re.search(r"[^A-Za-z0-9]", senha):
        return "A senha precisa ter pelo menos um caractere especial (ex.: ! @ # $ % &)."
    if senha.lower() in SENHAS_FRACAS_COMUNS:
        return "Essa senha é muito comum/fraca. Escolha outra."
    return None
