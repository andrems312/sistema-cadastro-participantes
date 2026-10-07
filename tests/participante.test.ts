import { test } from "node:test";
import assert from "node:assert/strict";
import { participanteSchema } from "../src/lib/validations/participante";
import { criarAcessoSchema, errosPorCampo } from "../src/lib/validations/auth";

const base = {
  cpf_cnpj: "11.222.333/0001-81",
  nome: "Empresa Teste Ltda",
  nome_fantasia: "",
  email: "",
  telefone: "(11) 98765-4321",
  cep: "01310-200",
  endereco: "Av. Paulista",
  numero: "1000",
  complemento: "",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  estado: "sp",
  categoria: "Empresa",
  latitude: null,
  longitude: null,
  imagem_path: null,
  observacoes: "",
};

test("participante válido é normalizado (só dígitos, vazios → null, UF maiúscula)", () => {
  const r = participanteSchema.parse(base);
  assert.equal(r.cpf_cnpj, "11222333000181");
  assert.equal(r.telefone, "11987654321");
  assert.equal(r.cep, "01310200");
  assert.equal(r.estado, "SP");
  assert.equal(r.email, null);
  assert.equal(r.nome_fantasia, null);
  assert.equal(r.observacoes, null);
});

test("participante inválido retorna erros por campo", () => {
  const r = participanteSchema.safeParse({
    ...base,
    cpf_cnpj: "111.111.111-11",
    email: "x@",
    telefone: "123",
    cep: "123",
    cidade: "",
    estado: "XX",
    categoria: "",
  });
  assert.equal(r.success, false);
  const erros = errosPorCampo(r.error!);
  assert.match(erros.cpf_cnpj, /CPF inválido/);
  assert.ok(erros.email);
  assert.ok(erros.telefone);
  assert.ok(erros.cep);
  assert.ok(erros.cidade);
  assert.ok(erros.estado);
  assert.ok(erros.categoria);
});

test("latitude/longitude só são aceitas em par", () => {
  const r = participanteSchema.parse({ ...base, latitude: -23.5, longitude: null });
  assert.equal(r.latitude, null);
  assert.equal(r.longitude, null);
  const ok = participanteSchema.parse({ ...base, latitude: -23.5, longitude: -46.6 });
  assert.equal(ok.latitude, -23.5);
});

test("criar acesso: senha forte e confirmação", () => {
  const ok = criarAcessoSchema.safeParse({ nome: "Maria Silva", email: "MARIA@X.COM ", senha: "senha123", confirmacao: "senha123", tipo_acesso: "usuario" });
  assert.equal(ok.success, true);
  assert.equal(ok.data!.email, "maria@x.com");
  const fraca = criarAcessoSchema.safeParse({ nome: "Maria", email: "m@x.com", senha: "abcdefgh", confirmacao: "abcdefgx", tipo_acesso: "root" });
  assert.equal(fraca.success, false);
  const e = errosPorCampo(fraca.error!);
  assert.ok(e.senha);
  assert.ok(e.tipo_acesso);
});
