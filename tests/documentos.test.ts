import { test } from "node:test";
import assert from "node:assert/strict";
import { somenteDigitos, tipoDocumento, validarCNPJ, validarCPF, validarCpfCnpj } from "../src/lib/validations/documentos";
import { mascaraCEP, mascaraCNPJ, mascaraCPF, mascaraCpfCnpj, mascaraTelefone } from "../src/lib/utils/masks";
import { detectarTipoImagem, validarArquivoImagem } from "../src/lib/validations/upload";
import { capitalizar, sanitizarBusca } from "../src/lib/utils/texto";
import { montarEndereco } from "../src/lib/utils/format";

test("CPF válido e inválido", () => {
  assert.equal(validarCPF("529.982.247-25"), true);
  assert.equal(validarCPF("52998224725"), true);
  assert.equal(validarCPF("529.982.247-24"), false);
  assert.equal(validarCPF("111.111.111-11"), false);
  assert.equal(validarCPF("123"), false);
});

test("CNPJ válido e inválido", () => {
  assert.equal(validarCNPJ("11.222.333/0001-81"), true);
  assert.equal(validarCNPJ("19131243000197"), true);
  assert.equal(validarCNPJ("11.222.333/0001-80"), false);
  assert.equal(validarCNPJ("00000000000000"), false);
  assert.equal(validarCNPJ("1122233300018"), false);
});

test("Documentos de exemplo do seed são válidos", async () => {
  const { readFile } = await import("node:fs/promises");
  const dados = JSON.parse(await readFile(new URL("../supabase/dados-exemplo.json", import.meta.url), "utf8"));
  for (const p of dados) assert.equal(validarCpfCnpj(p.cpf_cnpj), true, p.cpf_cnpj);
});

test("tipoDocumento e somenteDigitos", () => {
  assert.equal(somenteDigitos("12.345-6/7"), "1234567");
  assert.equal(tipoDocumento("529.982.247-25"), "CPF");
  assert.equal(tipoDocumento("11.222.333/0001-81"), "CNPJ");
  assert.equal(tipoDocumento("123"), null);
});

test("Máscaras", () => {
  assert.equal(mascaraCPF("52998224725"), "529.982.247-25");
  assert.equal(mascaraCPF("5299822"), "529.982.2");
  assert.equal(mascaraCNPJ("11222333000181"), "11.222.333/0001-81");
  assert.equal(mascaraCNPJ("112223330"), "11.222.333/0");
  assert.equal(mascaraCpfCnpj("52998224725"), "529.982.247-25");
  assert.equal(mascaraCpfCnpj("112223330001"), "11.222.333/0001");
  assert.equal(mascaraCpfCnpj("11222333000181999"), "11.222.333/0001-81");
  assert.equal(mascaraCEP("01310200"), "01310-200");
  assert.equal(mascaraCEP("0131"), "0131");
  assert.equal(mascaraTelefone("1132345678"), "(11) 3234-5678");
  assert.equal(mascaraTelefone("11987654321"), "(11) 98765-4321");
  assert.equal(mascaraTelefone("119"), "(11) 9");
  assert.equal(mascaraTelefone(""), "");
});

test("Detecção de imagem por magic bytes", () => {
  assert.equal(detectarTipoImagem(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(detectarTipoImagem(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
  const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
  assert.equal(detectarTipoImagem(webp), "image/webp");
  assert.equal(detectarTipoImagem(new TextEncoder().encode("<?php echo 1; ?>")), null);
});

test("Validação de tamanho/tipo de upload", () => {
  assert.equal(validarArquivoImagem({ type: "image/png", size: 1000 }, 2000), null);
  assert.match(validarArquivoImagem({ type: "image/gif", size: 1000 }, 2000)!, /Formato inválido/);
  assert.match(validarArquivoImagem({ type: "image/png", size: 3000 }, 2000)!, /muito grande/);
  assert.match(validarArquivoImagem({ type: "image/png", size: 0 }, 2000)!, /vazio/);
});

test("Utilitários de texto e endereço", () => {
  assert.equal(capitalizar("AVENIDA DAS NACOES UNIDAS"), "Avenida das Nacoes Unidas");
  assert.equal(sanitizarBusca("  joão, (teste)%  "), "joão teste");
  assert.equal(
    montarEndereco({ endereco: "Av. Paulista", numero: "1578", bairro: "Bela Vista", cidade: "São Paulo", estado: "SP", cep: "01310200" }),
    "Av. Paulista, 1578, Bela Vista, São Paulo - SP, 01310-200",
  );
});
