import requests
import os
from datetime import date, timedelta
from dotenv import load_dotenv

load_dotenv()

# Credenciais do Asaas
ASAAS_API_KEY = os.getenv("ASAAS_API_KEY", "dummy_asaas_key_please_change")
# URL Base (Use 'https://sandbox.asaas.com/api/v3' para homologação)
ASAAS_BASE_URL = os.getenv("ASAAS_BASE_URL", "https://sandbox.asaas.com/api/v3")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

def criar_sessao_checkout(org_id: str, nome_org: str, valor_mensal: float = 250.00) -> str:
    """
    Cria uma sessão de Checkout hospedada no Asaas para assinatura.
    Retorna a URL do Checkout.
    """
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "access_token": ASAAS_API_KEY
    }
    
    # Próximo vencimento daqui a 30 dias (se cobrar hoje, nextDueDate é o próximo)
    # Como é assinatura, o Asaas pode cobrar o primeiro imediatamente e o nextDueDate é o próximo
    next_due_date = (date.today() + timedelta(days=30)).strftime("%Y-%m-%d")

    payload = {
        "customer": None, # Deixa o Asaas criar o cliente no checkout
        "billingTypes": ["CREDIT_CARD", "PIX", "BOLETO"],
        "chargeTypes": ["RECURRENT"],
        "name": f"Assinatura Sigma 2.0 - {nome_org}",
        "description": "Acesso completo ao painel de gestão SaaS.",
        "externalReference": str(org_id),
        "items": [
            {
                "name": "Mensalidade SaaS",
                "quantity": 1,
                "value": valor_mensal
            }
        ],
        "subscription": {
            "cycle": "MONTHLY",
            "value": valor_mensal,
            "nextDueDate": next_due_date
        },
        "callback": {
            "successUrl": f"{FRONTEND_URL}/global?stripe_checkout=success",
            "autoRedirect": True
        }
    }

    url = f"{ASAAS_BASE_URL}/checkouts"
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        # O Asaas retorna o ID do checkout. Precisamos montar a URL
        checkout_id = data.get("id")
        
        # No Sandbox a URL é diferente da de produção, mas geralmente o link completo também vem na resposta?
        # A documentação indica: https://asaas.com/checkoutSession/show?id={ID} ou para sandbox: sandbox.asaas.com...
        
        # O Asaas não costuma retornar uma 'url' direta na v3/checkouts igual Stripe, mas vamos montar ou tentar extrair
        checkout_url = f"{ASAAS_BASE_URL.replace('/api/v3', '')}/checkoutSession/show?id={checkout_id}"
        return checkout_url
    except requests.exceptions.RequestException as e:
        print(f"[ASAAS] Erro ao criar checkout: {e.response.text if hasattr(e, 'response') and e.response else str(e)}")
        raise Exception("Falha na comunicação com o gateway Asaas.")
