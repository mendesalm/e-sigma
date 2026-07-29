from database import motor_banco_dados
from sqlalchemy import text

with motor_banco_dados.connect() as c:
    try:
        c.execute(text('ALTER TABLE organizacoes ADD COLUMN sigla VARCHAR(50);'))
        c.execute(text('ALTER TABLE organizacoes ADD COLUMN cliente_ativo_sigma BOOLEAN DEFAULT FALSE;'))
        c.commit()
        print("Columns added")
    except Exception as e:
        print(e)
