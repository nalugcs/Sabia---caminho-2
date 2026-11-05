#!/usr/bin/env python3
"""Monta o livro de Identidade Visual Sabiá (10 páginas, 794x1123)."""
import sys
sys.path.insert(0, "/home/z/my-project/scripts/sabia")
from book_css import CSS
import book_assets as A

FONTS_CSS = open("/home/z/my-project/scripts/sabia/fonts_b64.css").read()

FOOT = ('<div class="footer"><span>Sabiá · Identidade Visual · V1.1</span>'
        '<span class="pg">{pg:02d}</span></div>')


def page(n, kicker, title, inner, dark=False, h="h1"):
    kick = (f'<div class="kicker on-dark">{kicker}</div>' if dark
            else f'<div class="kicker">{kicker}</div>')
    ttl = f'<{h}>{title}</{h}>'
    d = " dark" if dark else ""
    return (f'<div class="page{d}"><div class="pad">{kick}{ttl}'
            f'{inner}</div>{FOOT.format(pg=n)}</div>')


# ============================== P1 · CAPA ==============================
cover = f'''
<div class="page" id="capa">
  <div class="cover-bg">
    <svg width="794" height="1123" viewBox="0 0 794 1123">
      <circle cx="730" cy="80" r="136" fill="none" stroke="#243D2C" stroke-width="1" opacity="0.10"/>
      <circle cx="758" cy="110" r="136" fill="none" stroke="#243D2C" stroke-width="0.6" opacity="0.06"/>
    </svg>
  </div>
  <div class="cover-l3">
    <div class="cover-meta" style="top:96px;text-align:center">
      <span class="kicker">Identidade Visual · V1.1 · 2026 · Símbolo S4 + Wordmark W2</span>
    </div>
    <div style="position:absolute;top:170px;left:0;right:0;display:flex;justify-content:center">
      {A.symbol("color", w=236)}
    </div>
    <div style="position:absolute;top:470px;left:0;right:0;display:flex;justify-content:center">
      {A.wordmark("primary", width=360)}
    </div>
    <div style="position:absolute;top:642px;left:0;right:0;text-align:center">
      <div class="cover-tag">Toda voz se aprende.</div>
    </div>
    <div style="position:absolute;top:700px;left:157px;right:157px;text-align:center">
      <div class="lead" style="color:var(--muted)">Guia de marca do aplicativo de prática
      conversacional personalizada por machine learning — pesquisa aplicada
      sobre aprender idiomas conversando de verdade.</div>
    </div>
    <div style="position:absolute;left:86px;right:86px;top:846px">
      <div class="hairline"></div>
    </div>
    <div class="cover-meta" style="top:900px;display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-size:14px;font-weight:600">Ana Luiza Gonçalves César</div>
        <div style="font-size:12.5px;color:var(--muted);margin-top:3px">MBA em Data Science e Analytics</div>
        <div style="font-size:12.5px;color:var(--muted);margin-top:2px">Orientador: Douglas Augusto de Paula</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:13px;font-weight:600;color:var(--verde)">MBA USP/Esalq</div>
        <div style="font-size:11.5px;letter-spacing:2px;text-transform:uppercase;color:var(--tinta);opacity:.75;margin-top:3px">Universidade de São Paulo</div>
      </div>
    </div>
  </div>
</div>'''

# ============================== P2 · CONCEITO ==============================
conceito_inner = f'''
<div class="rule"></div>
<div class="row">
  <div class="half">
    <p class="body-txt" style="margin:0 0 12px 0">O <b>sabiá-laranjeira</b> (<i>Turdus rufiventris</i>)
    é a ave brasileira por excelência: símbolo nacional imortalizado na
    <i>Canção do Exílio</i>, de Gonçalves Dias. E ele faz algo notável —
    <b>não nasce sabendo cantar</b>. O sabiá aprende o próprio canto ouvindo
    os adultos e ensaiando, repetição após repetição, até que a voz vire dele.</p>
    <p class="body-txt" style="margin:0">É exatamente assim que se aprende um idioma:
    ouvindo, errando, ajustando, repetindo — até a nova voz ficar natural.
    O nome <b>Sabiá</b> transforma a metáfora em marca: um aplicativo de
    conversa em que a IA é a professora paciente e o aluno é o filhote que
    ganha o próprio canto.</p>
  </div>
  <div style="width:180px;display:flex;flex-direction:column;align-items:center;gap:10px">
    {A.symbol("color", w=150)}
    <div class="caption" style="text-align:center">sabiá-laranjeira<br>Turdus rufiventris</div>
  </div>
</div>
<div class="card" style="margin-top:22px;padding:20px 24px;background:var(--areia);border-color:var(--borda)">
  <div class="fraunces" style="font-style:italic;font-size:19px;line-height:1.4">&#8220;Minha terra tem palmeiras,<br>onde canta o Sabiá.&#8221;</div>
  <div class="caption" style="margin-top:8px">Gonçalves Dias, Canção do Exílio (1843)</div>
</div>
<div style="margin-top:22px">
  <div class="kicker" style="color:var(--verde)">Território visual · tropical-editorial</div>
  <div class="row" style="margin-top:12px">
    <div class="card third" style="padding:14px 16px">
      <div class="fraunces" style="font-weight:600;font-size:15px">Fauna, não clichê</div>
      <div class="caption" style="margin-top:4px">Nada de papagaio de adesivo ou toucano
      de folheto: o animal é desenhado, construído com geometria própria.</div>
    </div>
    <div class="card third" style="padding:14px 16px">
      <div class="fraunces" style="font-weight:600;font-size:15px">Voz que se aprende</div>
      <div class="caption" style="margin-top:4px">O canto do sabiá é aprendido — como a
      fala de uma segunda língua. A curva de canto do símbolo conta isso.</div>
    </div>
    <div class="card third" style="padding:14px 16px">
      <div class="fraunces" style="font-weight:600;font-size:15px">Dupla plateia</div>
      <div class="caption" style="margin-top:4px">Acolhedora no celular do participante,
      rigorosa o bastante para a banca avaliadora do TCC.</div>
    </div>
  </div>
</div>'''
conceito = page(2, "01 · Conceito", "O sabiá aprende a cantar.", conceito_inner)

# ============================== P3 · SÍMBOLO ==============================
anns = [
    ("#C1502E", "Peito ruivo", "a voz que ganha confiança a cada troca"),
    ("#243D2C", "Dorso verde-mata", "a estrutura séria, o lado acadêmico"),
    ("#E9A83B", "Bico amarelo", "o detalhe que ilumina — usar com parcimônia"),
    ("#C1502E", "Curvas de canto", "o aprendizado em andamento, saindo do bico"),
    ("#243D2C", "Silhueta contínua", "cauda integrada ao corpo, legível em 24px"),
]
ann_html = "".join(
    f'<div style="display:flex;gap:9px;align-items:flex-start;margin-bottom:9px">'
    f'<span style="width:9px;height:9px;border-radius:50%;background:{dot};margin-top:3px;flex-shrink:0"></span>'
    f'<div class="ann"><b>{t}</b> — {d}</div></div>'
    for dot, t, d in anns)

simbolo_inner = f'''
<div class="rule"></div>
<div class="row">
  <div style="width:290px;display:flex;flex-direction:column;align-items:center">
    <div style="width:270px;height:270px;display:flex;align-items:center;justify-content:center;
                border:1px dashed var(--borda);border-radius:14px;position:relative">
      {A.symbol("color", w=228)}
      <span class="mono" style="position:absolute;top:8px;left:12px;font-size:10px;color:var(--muted)">S4</span>
    </div>
    <div class="caption" style="text-align:center;margin-top:8px">Assinatura: duas curvas concêntricas<br>ancoradas na ponta do bico.</div>
  </div>
  <div class="half">
    <div class="kicker" style="color:var(--verde)">Anatomia da marca</div>
    <div style="margin-top:12px">{ann_html}</div>
    <div class="caption" style="margin-top:4px">Cada elemento do símbolo carrega um pedaço
    da narrativa — nada é ornamento.</div>
  </div>
</div>
<div class="kicker" style="color:var(--verde);margin-top:24px">Variantes</div>
<div class="row" style="margin-top:12px">
  <div style="width:192px">
    <div style="height:140px;background:var(--verde);border-radius:10px;display:flex;
                align-items:center;justify-content:center">{A.symbol("negative", w=110)}</div>
    <div class="caption" style="text-align:center;margin-top:6px">Negativo · fundos verde-mata</div>
  </div>
  <div style="width:192px">
    <div style="height:140px;background:#FFFFFF;border:1px solid var(--borda);border-radius:10px;display:flex;
                align-items:center;justify-content:center">{A.symbol("mono", w=110)}</div>
    <div class="caption" style="text-align:center;margin-top:6px">Monocromático · carimbos e impressões em 1 cor</div>
  </div>
  <div class="third">
    <div style="height:140px;background:#FFFFFF;border:1px solid var(--borda);border-radius:10px;
                display:flex;align-items:center;justify-content:center">{A.symbol("no-song", w=110)}</div>
    <div class="caption" style="text-align:center;margin-top:6px">Sem curvas · tamanhos mínimos</div>
  </div>
</div>
<div class="row" style="margin-top:22px;align-items:center">
  <div style="width:130px;height:130px;border:1px dashed var(--ruivo);border-radius:12px;
              display:flex;align-items:center;justify-content:center;flex-shrink:0">
    <div style="width:98px;height:98px;border:1px dashed var(--borda);border-radius:8px;
                display:flex;align-items:center;justify-content:center">{A.symbol("color", w=76)}</div>
  </div>
  <div class="half">
    <div class="kicker" style="color:var(--verde)">Área de proteção</div>
    <div class="body-txt" style="margin-top:8px">Mantenha ao redor do símbolo um respiro
    de <b>25% da sua largura</b> em todos os lados (traço ruivo pontilhado).
    Nenhum texto, imagem ou outra marca entra nessa zona.</div>
  </div>
</div>'''
simbolo = page(3, "02 · Símbolo — S4", "O sabiá cantor", simbolo_inner, h="h2")

# ============================== P4 · WORDMARK ==============================
wordmark_inner = f'''
<div class="rule"></div>
<div class="card" style="padding:26px 30px 22px 30px;display:flex;align-items:center;justify-content:center">
  {A.wordmark("primary", width=410)}
</div>
<div class="row" style="margin-top:18px;align-items:stretch">
  <div class="card" style="padding:16px 18px;width:230px;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#FFFFFF;flex-shrink:0">
    {A.wordmark_zoom(132)}
    <div class="caption" style="margin-top:10px;text-align:center">O acento do &#8220;á&#8221; é uma folha.</div>
  </div>
  <div class="half">
    <div class="kicker" style="color:var(--verde)">Construção</div>
    <div class="body-txt" style="margin-top:10px">Composto em <b>Fraunces</b> — serifa editorial
    de desenho quente — no peso semibold, eixo ótico de exibição (144) e terminais
    suavizados. Entreletra levemente aberto (+1,2%) para leitura calma.</div>
    <div class="body-txt" style="margin-top:10px">Sobre o &#8220;a&#8221; final, o acento agudo foi
    <b>redesenhado como folha</b>, ancorado na métrica exata do acento
    nativo da Fraunces — assenta como tipografia de verdade e ainda assim
    amarra o nome à fauna. Abaixo de 110px de largura,
    prefira o símbolo isolado.</div>
  </div>
</div>
<div class="kicker" style="color:var(--verde);margin-top:20px">Variantes</div>
<div class="row" style="margin-top:12px">
  <div class="half">
    <div style="background:var(--verde);border-radius:10px;padding:20px 16px;
                display:flex;justify-content:center">{A.wordmark("dark", width=240)}</div>
    <div class="caption" style="text-align:center;margin-top:6px">Negativo · creme com folha amarelo-bico</div>
  </div>
  <div class="half">
    <div style="background:var(--areia);border-radius:10px;padding:20px 16px;
                display:flex;justify-content:center">{A.wordmark("lower", width=235)}</div>
    <div class="caption" style="text-align:center;margin-top:6px">Minúsculo · interfaces e carimbos</div>
  </div>
</div>'''
wordmark_pg = page(4, "03 · Wordmark — W2", "Editorial, com folha", wordmark_inner, h="h2")

# ============================== P5 · LOCKUPS ==============================
lockups_inner = f'''
<div class="rule"></div>
<div class="row">
  <div class="half">
    <div class="kicker" style="color:var(--verde)">Horizontal · preferencial</div>
    <div class="card" style="margin-top:10px;padding:26px 20px;display:flex;align-items:center;justify-content:center;gap:20px;background:#FFFFFF">
      {A.symbol("color", w=78)}
      <div style="width:1px;height:70px;background:var(--borda)"></div>
      {A.wordmark("primary", width=228)}
    </div>
    <div class="caption" style="text-align:center;margin-top:6px">Símbolo à esquerda, wordmark à direita, divisor hairline</div>
  </div>
  <div style="width:236px">
    <div class="kicker" style="color:var(--verde)">Vertical · certificados</div>
    <div class="card" style="margin-top:10px;padding:22px 18px;display:flex;flex-direction:column;align-items:center;gap:12px;background:#FFFFFF">
      {A.symbol("color", w=88)}
      {A.wordmark("primary", width=164)}
      <div class="caption">Toda voz se aprende.</div>
    </div>
  </div>
</div>
<div class="kicker" style="color:var(--verde);margin-top:26px">Símbolo isolado e aplicação mínima</div>
<div class="row" style="margin-top:12px;align-items:flex-end">
  <div style="text-align:center">
    <div style="width:96px;height:96px;border-radius:50%;background:var(--verde);display:flex;
                align-items:center;justify-content:center">{A.symbol("negative", w=64)}</div>
    <div class="caption" style="margin-top:6px">avatar</div>
  </div>
  <div style="text-align:center">
    <div style="width:96px;height:96px;border-radius:22px;background:#FFFFFF;border:1px solid var(--borda);
                display:flex;align-items:center;justify-content:center">{A.symbol("no-song", w=62)}</div>
    <div class="caption" style="margin-top:6px">favicon</div>
  </div>
  <div style="text-align:center">
    <div style="width:48px;height:48px;border-radius:12px;background:#FFFFFF;border:1px solid var(--borda);
                display:flex;align-items:center;justify-content:center">{A.symbol("no-song", w=32)}</div>
    <div class="caption" style="margin-top:6px">32px</div>
  </div>
  <div style="text-align:center">
    <div style="width:26px;height:26px;border-radius:7px;background:#FFFFFF;border:1px solid var(--borda);
                display:flex;align-items:center;justify-content:center">{A.symbol("no-song", w=18)}</div>
    <div class="caption" style="margin-top:6px">24px</div>
  </div>
  <div class="grow" style="min-width:220px;max-width:300px">
    <div class="body-txt"><b>Regras de tamanho:</b> com as curvas de canto, nunca
    abaixo de <b>48px</b>; sem elas, o mínimo é <b>24px</b>. O favicon e o ícone
    pequeno usam sempre a versão sem curvas — o peito ruivo continua
    identificando a marca.</div>
  </div>
</div>
<div class="card" style="margin-top:22px;padding:16px 20px;background:var(--areia)">
  <div class="body-txt" style="font-size:13.5px"><b>Nunca:</b> esticar ou achatar; trocar
  as cores originais; refazer o acento com a fonte; enfeitar o símbolo com
  molduras, brilhos ou sombras; inclinar o conjunto.</div>
</div>'''
lockups = page(5, "04 · Lockups e usos mínimos", "Conjuntos de assinatura", lockups_inner, h="h2")

# ============================== P6 · CORES ==============================
def sw(name, hexv, papel, big=True):
    return (f'<div class="sw"><div style="height:{64 if big else 40}px;background:{hexv};'
            f'border-radius:7px;margin:-4px -4px 10px -4px;border:1px solid var(--borda)"></div>'
            f'<div class="nome">{name}</div><div class="hex" style="color:var(--muted)">{hexv.upper()}</div>'
            f'<div class="papel" style="color:var(--muted)">{papel}</div></div>')

cores_inner = f'''
<div class="rule"></div>
<div class="row">
  <div class="third">{sw("Creme Papel", "#F6F1E6", "O fundo de tudo (~60% da área). Papel quente, luz de fim de tarde.")}</div>
  <div class="third">{sw("Verde Mata", "#243D2C", "Estrutura: títulos fortes, botões, fundos escuros (~30%).")}</div>
  <div class="third">{sw("Ruivo Sabiá", "#C1502E", "O peito da marca: acentos, kickers, progresso, notas (~10%).")}</div>
</div>
<div class="row" style="margin-top:16px">
  <div class="third">{sw("Amarelo Bico", "#E9A83B", "Só o detalhe (&lt;1%): o bico, a folha no negativo, micro-hierarquia.")}</div>
  <div class="third">{sw("Tinta Grafite", "#28221C", "Texto e wordmark sobre claro. Quase preto, mas quente.")}</div>
  <div class="third">
    <div class="kicker" style="color:var(--verde)">Tints derivados</div>
    <div class="row" style="margin-top:10px;gap:8px">
      <div style="width:46px;height:46px;border-radius:8px;background:#EDE5D3;border:1px solid var(--borda)"></div>
      <div style="width:46px;height:46px;border-radius:8px;background:#4E7A62"></div>
      <div style="width:46px;height:46px;border-radius:8px;background:#DA8A6E"></div>
    </div>
    <div class="caption" style="margin-top:8px">Areia (cartões), Verde-folha (bordas
    e gráficos) e Ruivo-claro (estados)&nbsp;— mesma família, sem cores novas.</div>
  </div>
</div>
<div style="margin-top:24px">
  <div class="kicker" style="color:var(--verde)">Proporção de uso</div>
  <div style="display:flex;height:34px;border-radius:9px;overflow:hidden;margin-top:10px;border:1px solid var(--borda)">
    <div style="width:60%;background:#F6F1E6;display:flex;align-items:center;justify-content:center;font-size:11px;letter-spacing:1px;color:var(--muted)">CREME 60</div>
    <div style="width:30%;background:#243D2C;display:flex;align-items:center;justify-content:center;font-size:11px;letter-spacing:1px;color:#F6F1E6">VERDE 30</div>
    <div style="width:9%;background:#C1502E;display:flex;align-items:center;justify-content:center;font-size:11px;color:#F6F1E6">10</div>
    <div style="width:1%;background:#E9A83B"></div>
  </div>
</div>
<div style="margin-top:24px">
  <div class="kicker" style="color:var(--verde)">Contraste verificado (WCAG 2.1)</div>
  <table style="width:100%;border-collapse:collapse;margin-top:10px">
    <tr style="border-bottom:1px solid var(--borda)">
      <th style="text-align:left;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);padding-bottom:6px">Par</th>
      <th style="text-align:left;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);padding-bottom:6px">Uso</th>
      <th style="text-align:right;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);padding-bottom:6px">Razão</th>
      <th style="text-align:right;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);padding-bottom:6px">Nível</th>
    </tr>
    {A.contrast_table()}
  </table>
  <div class="caption" style="margin-top:8px">Razões calculadas programaticamente (fórmula
  WCAG 2.1). Texto corrido exige no mínimo AA (4,5:1); acentos grandes, 3:1.</div>
</div>'''
cores = page(6, "05 · Cores", "A paleta do sabiá", cores_inner, h="h2")

# ============================== P7 · TIPOGRAFIA ==============================
tipografia_inner = f'''
<div class="rule"></div>
<div class="row">
  <div class="grow" style="min-width:280px">
    <div class="card" style="padding:22px 24px;background:#FFFFFF">
      <div style="display:flex;align-items:baseline;gap:14px">
        <span class="fraunces" style="font-size:64px;font-weight:600;line-height:1">Aa</span>
        <span class="caption">Fraunces · 300–700</span>
      </div>
      <div class="fraunces" style="font-style:italic;font-size:24px;margin-top:10px">Toda voz se aprende.</div>
      <div class="body-txt" style="margin-top:10px"><b>A voz do sabiá.</b> Títulos, wordmark,
      citações e números de destaque. Sempre com respiro — nunca em blocos densos.</div>
    </div>
  </div>
  <div class="grow" style="min-width:280px">
    <div class="card" style="padding:22px 24px;background:#FFFFFF">
      <div style="display:flex;align-items:baseline;gap:14px">
        <span style="font-size:64px;font-weight:500;line-height:1;letter-spacing:-1px">Aa</span>
        <span class="caption">Inter · 300–700</span>
      </div>
      <div style="font-size:15px;font-weight:500;margin-top:14px">My name is Ana. Je m&#8217;appelle Ana.</div>
      <div class="body-txt" style="margin-top:10px"><b>A voz da interface.</b> Corpo de texto,
      formulários, chat, dados e legendas. Neutra para o conteúdo brilhar.</div>
    </div>
  </div>
</div>
<div style="margin-top:24px">
  <div class="kicker" style="color:var(--verde)">Escala</div>
  <div style="margin-top:12px">
    <div style="display:flex;align-items:baseline;gap:16px;border-bottom:1px solid var(--borda);padding:9px 0">
      <span class="caption mono" style="width:150px">Display · 40/44</span>
      <span class="fraunces" style="font-size:40px;line-height:1.05;font-weight:600">Onde canta</span>
    </div>
    <div style="display:flex;align-items:baseline;gap:16px;border-bottom:1px solid var(--borda);padding:9px 0">
      <span class="caption mono" style="width:150px">Título · 26/30</span>
      <span class="fraunces" style="font-size:26px;font-weight:600">Aula 1 · Apresentação pessoal</span>
    </div>
    <div style="display:flex;align-items:baseline;gap:16px;border-bottom:1px solid var(--borda);padding:9px 0">
      <span class="caption mono" style="width:150px">Subtítulo · 19/26</span>
      <span class="fraunces" style="font-size:19px;font-weight:500">Prática de conversa personalizada</span>
    </div>
    <div style="display:flex;align-items:baseline;gap:16px;border-bottom:1px solid var(--borda);padding:9px 0">
      <span class="caption mono" style="width:150px">Corpo · 14,5/23</span>
      <span style="font-size:14.5px;line-height:1.55">Corrija com gentileza e sugira uma frase melhor.</span>
    </div>
    <div style="display:flex;align-items:baseline;gap:16px;padding:9px 0">
      <span class="caption mono" style="width:150px">Legenda · 12/18</span>
      <span class="caption">Projeto de pesquisa · MBA USP/Esalq</span>
    </div>
  </div>
</div>
<div class="card" style="margin-top:20px;padding:14px 18px;background:var(--areia)">
  <div class="body-txt" style="font-size:13.5px"><b>Regra de ouro:</b> no máximo duas famílias
  por superfície. Hierarquia vem de <b>tamanho e peso</b> — nunca de cores extras.</div>
</div>'''
tipografia = page(7, "06 · Tipografia", "Duas vozes", tipografia_inner, h="h2")

# ============================== P8 · ÍCONE E SPLASH ==============================
icone_inner = f'''
<div class="rule"></div>
<div class="row">
  <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
    <div style="width:150px;height:150px;border-radius:30px;background:var(--creme);
                border:1px solid var(--borda);display:flex;align-items:center;justify-content:center;
                box-shadow:0 14px 30px rgba(40,34,28,0.18)">
      {A.symbol("color", w=106)}
    </div>
    <div class="caption">iOS · squircle creme</div>
  </div>
  <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
    <div style="width:150px;height:150px;border-radius:50%;background:var(--verde);
                display:flex;align-items:center;justify-content:center">
      {A.symbol("negative", w=104)}
    </div>
    <div class="caption">Android · adaptativo</div>
  </div>
  <div class="half">
    <div class="kicker" style="color:var(--verde)">Do ícone à primeira tela</div>
    <div class="body-txt" style="margin-top:10px">O ícone principal usa o <b>creme papel</b>
    como fundo — num mar de aplicativos azuis, o sabiá entra quente. No Android,
    a versão adaptativa segura o círculo verde-mata.</div>
    <div class="body-txt" style="margin-top:10px">O splash repete o encontro:
    símbolo, wordmark e a promessa. Menos de dois segundos, sem login
    antes da cortina.</div>
  </div>
</div>
<div class="row" style="margin-top:14px;align-items:flex-start">
  <div style="display:flex;flex-direction:column;align-items:center;gap:8px;flex-shrink:0">
    {A.phone(A.screen_splash())}
    <div class="caption">Splash · PWA Android/iOS</div>
  </div>
  <div class="half">
    <div class="kicker" style="color:var(--verde)">A professora é o sabiá</div>
    <div class="body-txt" style="margin-top:10px">No chat, a IA que ensina usa o próprio
    símbolo como avatar — um recorte da cabeça, com bico, olho e peito.
    A marca e a personagem são a mesma coisa: <b>zero custo cognitivo</b>,
    o participante já sabe com quem fala.</div>
    <div class="row" style="margin-top:14px">
      <div style="width:64px;height:64px;border-radius:50%;background:var(--verde);display:flex;align-items:center;justify-content:center">{A.symbol_crop("negative", A.HEAD_VB, 46)}</div>
      <div style="width:40px;height:40px;border-radius:50%;background:var(--verde);display:flex;align-items:center;justify-content:center">{A.symbol_crop("negative", A.HEAD_VB, 28)}</div>
      <div style="width:24px;height:24px;border-radius:50%;background:var(--verde);display:flex;align-items:center;justify-content:center">{A.symbol_crop("negative", A.HEAD_VB, 16)}</div>
    </div>
    <div class="caption" style="margin-top:8px">Avatar em 64 / 40 / 24px</div>
    <div class="row" style="margin-top:18px;align-items:flex-end">
      <div style="text-align:center"><div style="width:96px;height:96px;border-radius:22px;background:var(--creme);border:1px solid var(--borda);display:flex;align-items:center;justify-content:center">{A.symbol("color", w=68)}</div><div class="caption" style="margin-top:4px">96</div></div>
      <div style="text-align:center"><div style="width:48px;height:48px;border-radius:12px;background:var(--creme);border:1px solid var(--borda);display:flex;align-items:center;justify-content:center">{A.symbol("no-song", w=32)}</div><div class="caption" style="margin-top:4px">48</div></div>
      <div style="text-align:center"><div style="width:26px;height:26px;border-radius:7px;background:var(--creme);border:1px solid var(--borda);display:flex;align-items:center;justify-content:center">{A.symbol("no-song", w=17)}</div><div class="caption" style="margin-top:4px">24</div></div>
    </div>
  </div>
</div>'''
icone = page(8, "07 · Aplicação — produto", "O sabiá no bolso", icone_inner, h="h2")

# ============================== P9 · TELAS ==============================
telas_inner = f'''
<div class="rule"></div>
<div class="row" style="align-items:flex-start">
  <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
    {A.phone(A.screen_register())}
    <div class="caption" style="text-align:center;max-width:250px"><b>Cadastro da pesquisa.</b>
    Nome e sobrenome, idade, nível em cinco faixas e idioma — os campos
    exatos definidos no estudo. O TCLE aparece antes de qualquer dado ser salvo.</div>
  </div>
  <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
    {A.phone(A.screen_lesson())}
    <div class="caption" style="text-align:center;max-width:250px"><b>Aula conversacional.</b>
    Tema do plano de aulas (Aula 1 · Apresentação pessoal), correção gentil com
    nota 0–10 e progresso 1→20 — as métricas que alimentam o machine learning.</div>
  </div>
</div>
<div class="card" style="margin-top:18px;padding:14px 18px;background:var(--areia)">
  <div class="body-txt" style="font-size:13.5px"><b>Interface em português, prática no idioma
  escolhido</b> — como define o TCC. A personalização acontece nos bastidores:
  temas, dificuldade e feedback ajustados ao perfil e ao desempenho do participante.</div>
</div>'''
telas = page(9, "08 · Aplicação — telas da pesquisa", "Onde a marca trabalha", telas_inner, h="h2")

# ============================== P10 · GOVERNANÇA ==============================
checks = [
    ("Símbolo S4", "o sabiá cantor — assinatura das curvas de canto"),
    ("Wordmark W2", "Fraunces semibold com acento-folha"),
    ("Paleta", "cinco cores + tints, contraste WCAG verificado"),
    ("Tipografia", "Fraunces + Inter, escala e regras de uso"),
    ("Aplicações", "ícone, splash, avatar e telas da pesquisa"),
]
check_html = "".join(
    f'<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:11px">'
    f'<span style="width:15px;height:15px;border-radius:4px;border:1.5px solid #E9A83B;flex-shrink:0;margin-top:2px"></span>'
    f'<div><span style="font-weight:600">{t}</span> — <span style="opacity:.8">{d}</span></div></div>'
    for t, d in checks)

gover_inner = f'''
<div class="rule" style="background:rgba(246,241,230,0.25)"></div>
<div class="row">
  <div class="half">
    <div class="kicker on-dark">Para aprovar</div>
    <div style="margin-top:14px;font-size:14px;line-height:1.5">{check_html}</div>
    <div class="caption" style="color:rgba(246,241,230,0.65);margin-top:4px">Fluxo:
    aprovado pela autora (nov/2026) → apresentação à banca → aplicação final no produto.</div>
  </div>
  <div class="half">
    <div class="kicker on-dark">Próximos passos</div>
    <div style="margin-top:14px;font-size:14px;line-height:1.55">
      <div style="margin-bottom:11px"><span style="color:var(--amarelo);font-weight:700">1.</span>
      Aplicar a identidade no app (PWA responsivo, Android e iOS).</div>
      <div style="margin-bottom:11px"><span style="color:var(--amarelo);font-weight:700">2.</span>
      Aplicar o questionário de percepção: utilidade, clareza do feedback,
      dificuldade, realismo, contribuição e facilidade de uso.</div>
      <div><span style="color:var(--amarelo);font-weight:700">3.</span>
      Coletar métricas por lição (nota, acertos, tempo, evolução) e seguir
      o cronograma do TCC.</div>
    </div>
  </div>
</div>
<div style="margin-top:30px;display:flex;justify-content:center">{A.wordmark("dark", width=300)}</div>
<div style="text-align:center;margin-top:14px">
  <span class="fraunces" style="font-style:italic;font-size:18px;color:var(--amarelo)">Toda voz se aprende.</span>
</div>
<div style="margin-top:26px">
  <div class="hairline" style="background:rgba(246,241,230,0.25)"></div>
</div>
<div style="display:flex;justify-content:space-between;margin-top:14px;font-size:12px;color:rgba(246,241,230,0.75)">
  <div>Ana Luiza Gonçalves César · MBA em Data Science e Analytics<br>
  Orientador: Douglas Augusto de Paula</div>
  <div style="text-align:right">MBA USP/Esalq · Universidade de São Paulo<br>
  Sabiá · Identidade Visual V1.1 · 2026</div>
</div>'''
gover = page(10, "09 · Governança", "Da sua aprovação à banca", gover_inner, dark=True, h="h2")
gover = gover.replace('page dark"><div class="pad">', 'page dark last"><div class="pad">')

# ============================== MONTAGEM ==============================
html = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Sabiá — Identidade Visual</title>
<style>{FONTS_CSS}</style>
<style>{CSS}</style>
</head>
<body>
{cover}
{conceito}
{simbolo}
{wordmark_pg}
{lockups}
{cores}
{tipografia}
{icone}
{telas}
{gover}
</body>
</html>'''

out = "/home/z/my-project/download/sabia-identidade-visual.html"
with open(out, "w", encoding="utf-8") as f:
    f.write(html)
print("HTML ok:", out, f"({len(html)} bytes)")

# imprime contrastes para conferência
print("\nConstraste WCAG (conferência):")
for a, b in [("tinta", "creme"), ("tinta", "areia"), ("verde", "creme"),
             ("creme", "verde"), ("ruivo", "creme"), ("amarelo", "verde")]:
    print(f"  {a} sobre {b}: {A.contrast(A.C[a], A.C[b]):.2f}:1")
