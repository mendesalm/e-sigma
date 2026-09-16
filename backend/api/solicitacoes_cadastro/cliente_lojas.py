# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Cliente HTTP do e-Sigma para a API de Hierarquia do módulo Lojas (2026-09-
16) — usado pela Solicitação de Cadastro para validar Potência/Loja contra
o dado REAL de `lojas_db`, em vez de uma cópia local de `organizacoes` que
tinha ficado desconectada da realidade (achado ao testar pela UI real; ver
claude/decisao-controle-acesso-cadastro.md, seção 13, no Project "Core",
para a análise completa e a decisão).

Espelha o padrão já usado em `Lojas/backend/core/auth_esigma.py` (biblioteca
`requests`, timeout configurável via variável de ambiente), só que na
direção contrária: aqui é o e-Sigma quem chama, autenticado por uma chave
de serviço estática (não há usuário humano nesta chamada).

Falha segura, deliberada: qualquer erro de conectividade, timeout, ou
resposta inesperada é tratado exatamente como "Loja não encontrada" para
quem chama — isso preserva a rejeição automática DURA já existente (seção
2.3 da decisão) e nunca revela ao candidato que o problema foi de
infraestrutura em vez de dado inválido. O erro real é logado no servidor
para o SuperAdmin investigar, nunca engolido silenciosamente.
"""
import logging
import os
from typing import Optional

import requests

logger = logging.getLogger("esigma.cliente_lojas")

LOJAS_API_BASE_URL = os.getenv("LOJAS_API_BASE_URL", "").rstrip("/")
LOJAS_SERVICE_KEY = os.getenv("LOJAS_SERVICE_KEY", "")
LOJAS_API_TIMEOUT_SEGUNDOS = float(os.getenv("LOJAS_API_TIMEOUT_SEGUNDOS", "5"))


def buscar_loja_por_numero(numero_loja: str) -> Optional[dict]:
    """Devolve `{"loja": {...}, "potencia": {...}, "obediencia": {...}|None}`
    quando o número resolve para uma Loja real no módulo Lojas, ou `None`
    em qualquer outro caso (não encontrada, configuração ausente, erro de
    rede, timeout, ou resposta inesperada) — o chamador trata todos esses
    casos da mesma forma: rejeição automática dura, sem criar registro."""
    if not LOJAS_API_BASE_URL or not LOJAS_SERVICE_KEY:
        logger.error(
            "LOJAS_API_BASE_URL/LOJAS_SERVICE_KEY não configuradas -- não é "
            "possível validar a Loja contra o módulo Lojas."
        )
        return None

    try:
        resposta = requests.get(
            f"{LOJAS_API_BASE_URL}/api/v1/hierarquia/lojas/buscar",
            params={"numero_loja": numero_loja},
            headers={"X-Service-Key": LOJAS_SERVICE_KEY},
            timeout=LOJAS_API_TIMEOUT_SEGUNDOS,
        )
    except requests.RequestException as erro:
        logger.error(f"Falha ao consultar a API de Hierarquia do Lojas: {erro}")
        return None

    if resposta.status_code == 404:
        return None
    if resposta.status_code != 200:
        logger.error(
            f"Resposta inesperada da API de Hierarquia do Lojas: "
            f"{resposta.status_code} {resposta.text}"
        )
        return None

    try:
        return resposta.json()
    except ValueError as erro:
        logger.error(f"Resposta da API de Hierarquia do Lojas não é JSON válido: {erro}")
        return None
