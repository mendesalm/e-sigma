# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Rate limiter em memória, criado em 2026-09-16 para cobrir a lacuna apontada
em claude/decisao-controle-acesso-cadastro.md, seção 2.1: qualquer endpoint
de escrita não-autenticado do ecossistema (por definição, é o caso de
`/auth/ativacao-cadastro/*` — a Pessoa ainda não tem senha para se
autenticar) precisa de limite de tentativas por IP e por identificador,
tanto para impedir spam de e-mail quanto para dificultar força bruta do
código de 6 dígitos.

LIMITAÇÃO CONHECIDA, documentada de propósito: isto é um contador em
memória do próprio processo Python (dict simples, protegido por um lock).
Funciona bem para um único processo `uvicorn` (o cenário atual de
desenvolvimento/produção pequena deste projeto), mas NÃO é compartilhado
entre múltiplos processos/workers nem sobrevive a um restart. Se o e-Sigma
um dia rodar com múltiplos workers (`--workers N`) ou atrás de um load
balancer com várias instâncias, isto precisa migrar para um backend
compartilhado (Redis é o candidato natural) — registrado aqui para não virar
uma surpresa silenciosa depois.
"""
import threading
import time
from collections import defaultdict
from typing import Dict, List

from fastapi import HTTPException

_lock = threading.Lock()
_tentativas: Dict[str, List[float]] = defaultdict(list)


def aplicar_rate_limit(chave: str, max_tentativas: int, janela_segundos: int) -> None:
    """
    Registra uma tentativa para `chave` (ex.: "acao:ip" ou "acao:identificador")
    e levanta HTTPException(429) se `max_tentativas` já foram feitas dentro
    de `janela_segundos`. Chamar UMA VEZ por combinação (chave) relevante no
    início da rota — cada chamada já conta como uma tentativa.
    """
    agora = time.monotonic()
    limite_inferior = agora - janela_segundos

    with _lock:
        tentativas = _tentativas[chave]
        # Descarta tentativas fora da janela deslizante.
        tentativas[:] = [t for t in tentativas if t > limite_inferior]

        if len(tentativas) >= max_tentativas:
            raise HTTPException(
                status_code=429,
                detail="Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.",
            )

        tentativas.append(agora)
