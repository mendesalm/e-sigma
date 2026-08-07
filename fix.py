import re

path = 'c:/Users/engan/OneDrive/Área de Trabalho/sigma/sigma2.0/frontend/src/modulos/painel_global/componentes/ModalEdicaoOrganizacao.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

correct_block = '''            {(org.tipo === 'LOJA' || org.tipo === 'SUBOBEDIENCIA' || formData.classificacao === 'Jurisdição') && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth sx={textFieldStyles}>
                    <InputLabel shrink>Federação/Confederação (Mãe)</InputLabel>
                    <Select
                      value={obedienciaRaiz}
                      label="Federação/Confederação (Mãe)"
                      onChange={(e) => {
                        setObedienciaRaiz(e.target.value);
                        setSubobediencia(''); // Reseta a subobediência ao trocar a raiz
                      }}
                    >
                      <MenuItem value=""><em>Nenhuma / Independente</em></MenuItem>
                      {todasOrganizacoes
                        .filter(o => o.tipo === 'OBEDIENCIA')
                        .sort((a,b) => a.nome.localeCompare(b.nome))
                        .map(ob => (
                          <MenuItem key={ob.id} value={ob.id}>{ob.nome}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {org.tipo === 'LOJA' && (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={textFieldStyles} disabled={!obedienciaRaiz}>
                      <InputLabel shrink>Jurisdição (Subobediência)</InputLabel>
                      <Select
                        value={subobediencia}
                        label="Jurisdição (Subobediência)"
                        onChange={(e) => setSubobediencia(e.target.value)}
                      >
                        <MenuItem value=""><em>Direta à Mãe</em></MenuItem>
                        {todasOrganizacoes
                          .filter(o => o.tipo === 'SUBOBEDIENCIA' && o.organizacao_superior_id === obedienciaRaiz)
                          .sort((a,b) => a.nome.localeCompare(b.nome))
                          .map(sub => (
                            <MenuItem key={sub.id} value={sub.id}>{sub.nome}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </>
            )}'''

start_idx = content.find("            {(org.tipo === 'LOJA'")
if start_idx == -1:
    start_idx = content.find("            {org.tipo === 'LOJA' && (\n              <>\n                <Grid item xs={12} sm={6}>\n                  <FormControl fullWidth")

end_idx = content.find("            <Grid item xs={12} sm={6}>\n              <TextField InputLabelProps={{ shrink: true }} fullWidth label=\"Webmaster")

new_content = content[:start_idx] + correct_block + '\n\n' + content[end_idx:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

# We need to run the grid size and shrink script again to restore Grid size syntax!
content = new_content
content = re.sub(r'<Grid item xs={12} sm={(\d+)}>', r'<Grid size={{ xs: 12, sm: \1 }}>', content)
content = re.sub(r'<Grid item xs={12} sm={org.tipo === \'LOJA\' \? 4 : 8}>', r'<Grid size={{ xs: 12, sm: org.tipo === \'LOJA\' ? 4 : 8 }}>', content)
content = re.sub(r'<Grid item xs={12}>', r'<Grid size={{ xs: 12 }}>', content)
content = re.sub(r'<Grid item xs={6}>', r'<Grid size={{ xs: 6 }}>', content)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Feito')
