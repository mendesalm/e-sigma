# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Envio de e-mail transacional do e-Sigma. Criado em 2026-09-16 junto com o
fluxo de Ativação de Cadastro (ver `rotas.py`, seção "Ativação de
Cadastro") — até então o ecossistema não tinha nenhuma infraestrutura de
envio de e-mail.

Reaproveita as variáveis de ambiente de e-mail que já existiam no `.env`
raiz do e-Sigma (usadas até aqui só como referência para uma futura conta de
e-mail institucional, nunca para envio automático):
    EMAIL_USER            (ex.: contato@e-sigma.app)
    EMAIL_PASSWORD
    EMAIL_SMTP_SERVER     (ex.: smtp.hostinger.com)
    EMAIL_SMTP_PORT       (ex.: 465)
    EMAIL_USE_TLS_SSL     ("true"/"false" — 465 é SSL implícito;
                            587 seria STARTTLS, não suportado por este
                            módulo simples; ajustar aqui se o provedor mudar)

Se as variáveis não estiverem configuradas, `enviar_email` não levanta
excessão — registra um aviso e retorna False. O chamador (rota de Ativação
de Cadastro) não repassa esse resultado ao cliente da API — a resposta é
sempre a mesma mensagem genérica, de propósito, para não revelar por essa
via se um identificador corresponde a um cadastro real (ver rotas.py).
"""
import logging
import os
import smtplib
import ssl
from email.message import EmailMessage

logger = logging.getLogger("esigma.email")

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
EMAIL_SMTP_SERVER = os.getenv("EMAIL_SMTP_SERVER")
EMAIL_SMTP_PORT = int(os.getenv("EMAIL_SMTP_PORT", "465"))
EMAIL_USE_TLS_SSL = os.getenv("EMAIL_USE_TLS_SSL", "true").lower() == "true"


def email_esta_configurado() -> bool:
    return bool(EMAIL_USER and EMAIL_PASSWORD and EMAIL_SMTP_SERVER)


def enviar_email(destinatario: str, assunto: str, corpo_texto: str) -> bool:
    """
    Envia um e-mail simples (texto puro) via SMTP. Retorna True em caso de
    sucesso, False em caso de falha (configuração ausente ou erro de envio),
    sempre registrando o motivo via logger — nunca propaga a exceção para
    quem chama, para que uma falha de e-mail não derrube a requisição HTTP.
    """
    if not email_esta_configurado():
        logger.warning(
            "Tentativa de envio de e-mail sem EMAIL_USER/EMAIL_PASSWORD/"
            "EMAIL_SMTP_SERVER configurados no .env — e-mail NÃO enviado "
            f"para {destinatario} (assunto: {assunto!r})."
        )
        return False

    mensagem = EmailMessage()
    mensagem["From"] = EMAIL_USER
    mensagem["To"] = destinatario
    mensagem["Subject"] = assunto
    mensagem.set_content(corpo_texto)

    try:
        if EMAIL_USE_TLS_SSL:
            contexto = ssl.create_default_context()
            with smtplib.SMTP_SSL(EMAIL_SMTP_SERVER, EMAIL_SMTP_PORT, context=contexto) as servidor:
                servidor.login(EMAIL_USER, EMAIL_PASSWORD)
                servidor.send_message(mensagem)
        else:
            with smtplib.SMTP(EMAIL_SMTP_SERVER, EMAIL_SMTP_PORT) as servidor:
                servidor.starttls()
                servidor.login(EMAIL_USER, EMAIL_PASSWORD)
                servidor.send_message(mensagem)
        logger.info(f"E-mail enviado com sucesso para {destinatario} (assunto: {assunto!r}).")
        return True
    except Exception as e:
        logger.error(f"Falha ao enviar e-mail para {destinatario}: {e}")
        return False


def enviar_senha_provisoria(destinatario: str, nome: str, senha_provisoria: str) -> bool:
    """Envio criado em 2026-09-16 para a Solicitação de Cadastro (Via 2,
    ver claude/decisao-controle-acesso-cadastro.md seção 12) — substitui o
    envio de código de "Ativação de Cadastro" (removido no mesmo dia por
    permitir auto-aprovação, sem validação humana). Só é chamado depois que
    um humano (SuperAdmin ou VM da Loja) já aprovou a solicitação — a senha
    aqui é gerada pelo sistema, nunca escolhida pelo candidato, e o login
    exige troca imediata (`Pessoa.deve_trocar_senha`)."""
    assunto = "E-Sigma — Seu cadastro foi aprovado"
    corpo = (
        f"Olá, {nome}.\n\n"
        f"Sua solicitação de cadastro no E-Sigma foi aprovada. Sua senha "
        f"provisória de acesso é:\n\n"
        f"    {senha_provisoria}\n\n"
        f"Ao fazer login por esta senha, você será obrigado a definir uma "
        f"nova senha antes de continuar. Se você não fez essa solicitação, "
        f"por favor ignore este e-mail e não compartilhe esta senha.\n\n"
        f"— E-Sigma"
    )
    return enviar_email(destinatario, assunto, corpo)


def enviar_rejeicao_solicitacao_cadastro(destinatario: str, nome: str, motivo: str) -> bool:
    """Concepção original da seção 2 do documento de decisão: 'se
    reprovado, e-mail com o motivo' — só usado para rejeição HUMANA
    (nunca para o caminho REJEITADO_AUTOMATICO, cujo motivo é interno e
    nunca revelado ao candidato — ver models.py, SolicitacaoCadastro)."""
    assunto = "E-Sigma — Sua solicitação de cadastro não foi aprovada"
    corpo = (
        f"Olá, {nome}.\n\n"
        f"Sua solicitação de cadastro no E-Sigma não foi aprovada.\n\n"
        f"Motivo informado: {motivo}\n\n"
        f"Se você acredita que isso é um engano, entre em contato com a "
        f"Secretaria da sua Loja ou com a Diretoria do Conselho.\n\n"
        f"— E-Sigma"
    )
    return enviar_email(destinatario, assunto, corpo)
