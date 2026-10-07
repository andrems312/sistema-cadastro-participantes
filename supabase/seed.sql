-- =====================================================================
--  DADOS DE EXEMPLO — SOMENTE PARA DESENVOLVIMENTO
--  Executado automaticamente pelo Supabase CLI em "supabase db reset"
--  (ambiente local). NÃO é aplicado por "supabase db push" em produção.
--  Gerado a partir de supabase/dados-exemplo.json (CPFs/CNPJs fictícios,
--  com dígitos verificadores válidos, prefixo 9000000…).
--  Para criar também usuários de teste, use: npm run seed:dev
-- =====================================================================

insert into public.participantes (cpf_cnpj, nome, razao_social, nome_fantasia, email, telefone, cep, endereco, numero, complemento, bairro, cidade, estado, categoria, latitude, longitude, observacoes)
values
  ('90000001000129', 'Aurora Tecnologia e Dados Ltda (Exemplo)', 'Aurora Tecnologia e Dados Ltda (Exemplo)', 'Aurora Dados', 'contato@aurora.exemplo.com', '1132345678', '01310200', 'Avenida Paulista', '1578', 'Sala 12', 'Bela Vista', 'São Paulo', 'SP', 'Empresa', -23.5614, -46.6559, 'Registro de exemplo para desenvolvimento.'),
  ('90000002000173', 'Minas Inovação Agro S.A. (Exemplo)', 'Minas Inovação Agro S.A. (Exemplo)', 'MinasAgro', 'comercial@minasagro.exemplo.com', '3135551020', '30140010', 'Praça da Liberdade', '100', null, 'Funcionários', 'Belo Horizonte', 'MG', 'Patrocinador', -19.932, -43.9381, 'Registro de exemplo para desenvolvimento.'),
  ('90000003000118', 'Costa Azul Eventos Ltda (Exemplo)', 'Costa Azul Eventos Ltda (Exemplo)', 'Costa Azul', 'eventos@costaazul.exemplo.com', '21998765432', '22021001', 'Avenida Atlântica', '1702', 'Loja B', 'Copacabana', 'Rio de Janeiro', 'RJ', 'Fornecedor', -22.9711, -43.1822, null),
  ('90000004000162', 'Araucária Software Ltda (Exemplo)', 'Araucária Software Ltda (Exemplo)', 'Araucária Soft', 'oi@araucaria.exemplo.com', '4132221100', '80020310', 'Rua XV de Novembro', '700', 'Conjunto 501', 'Centro', 'Curitiba', 'PR', 'Expositor', -25.4296, -49.2713, null),
  ('90000005000107', 'Mangue Digital Ltda (Exemplo)', 'Mangue Digital Ltda (Exemplo)', 'Mangue Digital', 'contato@manguedigital.exemplo.com', '81988887777', '51011000', 'Avenida Boa Viagem', '3200', null, 'Boa Viagem', 'Recife', 'PE', 'Parceiro', -8.1189, -34.9005, 'Parceiro de exemplo.'),
  ('90000006000151', 'Amazônia Sustentável Ltda (Exemplo)', 'Amazônia Sustentável Ltda (Exemplo)', null, null, '9232334455', '69010001', 'Avenida Eduardo Ribeiro', '520', null, 'Centro', 'Manaus', 'AM', 'Cliente', -3.1316, -60.0233, null),
  ('90000000175', 'Ana Beatriz Souza (Exemplo)', null, null, 'ana.souza@exemplo.com', '61991234567', '70100000', 'Praça dos Três Poderes', 's/n', null, 'Zona Cívico-Administrativa', 'Brasília', 'DF', 'Palestrante', -15.7998, -47.8645, null),
  ('90000000256', 'Carlos Eduardo Lima (Exemplo)', null, null, 'carlos.lima@exemplo.com', '71987651234', '40026280', 'Largo do Pelourinho', '12', null, 'Pelourinho', 'Salvador', 'BA', 'Visitante', -12.9714, -38.51, null),
  ('90000000337', 'Fernanda Rocha (Exemplo)', null, null, 'fernanda.rocha@exemplo.com', '85999990000', '60165121', 'Avenida Beira Mar', '2500', 'Apto 801', 'Meireles', 'Fortaleza', 'CE', 'Palestrante', -3.7258, -38.495, null),
  ('90000000418', 'João Pedro Martins (Exemplo)', null, null, null, '51981112222', '90020007', 'Rua dos Andradas', '1001', null, 'Centro Histórico', 'Porto Alegre', 'RS', 'Visitante', null, null, 'Sem coordenadas: será geocodificado ao editar e salvar.')
on conflict (cpf_cnpj) do nothing;
