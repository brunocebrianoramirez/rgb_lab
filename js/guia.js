/* ==========================================================================
   rgb_lab — GUIA DE CADA LABORATÓRIO
   --------------------------------------------------------------------------
   Um tutorial dentro de cada laboratório, escrito para quem nunca abriu um
   editor na vida. Ele mora numa gaveta que desliza por cima da ferramenta —
   não é outra página, não tira você de onde estava, e fecha no ESC.

   COMO ACRESCENTAR UM PASSO (é para isto que este arquivo existe):

     Ache o laboratório em `PASSOS` e escreva mais um objeto na lista:

       { t: 'TÍTULO CURTO',
         p: 'o texto. pode ter <b>negrito</b> e <k>tecla</k>.',
         faz: 'a frase que diz o que fazer AGORA',       (opcional)
         img: 'nome-do-desenho'                          (opcional)
       }

     Só isso. A numeração, as bolinhas, o "de X", a navegação e a memória de
     onde a pessoa parou se ajustam sozinhas. Nenhum outro arquivo precisa
     ser tocado.

   AS REGRAS DA ESCRITA aqui dentro, porque um tutorial que usa as palavras
   do programa não ensina nada:

     · nada de "renderizar", "buffer", "parâmetro", "instanciar";
     · um passo faz UMA coisa. Se tem dois verbos, são dois passos;
     · sempre dizer o que a pessoa vai VER acontecer, não só o que clicar;
     · a primeira pessoa do plural ("vamos") só cansa — usar imperativo;
     · quando um nome do programa é estranho, explicar na hora, entre
       parênteses, com palavra de gente.
   ========================================================================== */
(function (VE) {
  'use strict';

  var G = VE.guia = {};

  /* ======================================================== OS DESENHOS ====
     SVG pequeno, sem cor fixa: tudo herda `currentColor` e o canal do
     laboratório, para o desenho continuar certo no claro e no escuro.   */
  var D = {};

  D.trilha = '<svg viewBox="0 0 240 78">' +
    '<rect class="gs-box" x="2" y="10" width="236" height="24"/>' +
    '<rect class="gs-fill" x="4" y="12" width="86" height="20"/>' +
    '<rect class="gs-fill" x="94" y="12" width="62" height="20"/>' +
    '<text class="gs-t" x="16" y="26">VÍDEO A</text><text class="gs-t" x="106" y="26">VÍDEO B</text>' +
    '<rect class="gs-box" x="2" y="42" width="236" height="24"/>' +
    '<rect class="gs-fill2" x="4" y="44" width="140" height="20"/>' +
    '<text class="gs-t" x="16" y="58">SOM</text>' +
    '<line class="gs-play" x1="70" y1="4" x2="70" y2="72"/>' +
    '<path class="gs-play" d="M64 4h12l-6 7z"/></svg>';

  D.camadas = '<svg viewBox="0 0 240 96">' +
    '<rect class="gs-box" x="52" y="8" width="120" height="30" transform="skewX(-18)"/>' +
    '<text class="gs-t" x="42" y="27">DE CIMA</text>' +
    '<rect class="gs-box" x="52" y="52" width="120" height="30" transform="skewX(-18)"/>' +
    '<text class="gs-t" x="32" y="71">DE BAIXO</text>' +
    '<path class="gs-arrow" d="M196 22v42"/><path class="gs-arrow" d="M192 58l4 8 4-8"/>' +
    '<text class="gs-t2" x="186" y="88">MISTURA</text></svg>';

  D.corte = '<svg viewBox="0 0 240 60">' +
    '<rect class="gs-fill" x="8" y="16" width="100" height="28"/>' +
    '<rect class="gs-fill" x="116" y="16" width="100" height="28"/>' +
    '<line class="gs-play" x1="112" y1="8" x2="112" y2="52"/>' +
    '<text class="gs-t2" x="86" y="58">CORTE AQUI</text></svg>';

  D.onda = '<svg viewBox="0 0 240 64">' +
    '<rect class="gs-box" x="2" y="6" width="236" height="52"/>' +
    '<path class="gs-wave" d="M6 32 q8 -20 16 0 t16 0 t16 -14 t16 14 t16 6 t16 -22 t16 16 t16 -4 t16 8 t16 -18 t16 14 t16 0 t16 0"/>' +
    '<line class="gs-play" x1="86" y1="6" x2="86" y2="58"/></svg>';

  D.cadeia = '<svg viewBox="0 0 240 54">' +
    '<rect class="gs-box" x="4" y="14" width="52" height="26"/><text class="gs-t" x="14" y="31">SOM</text>' +
    '<path class="gs-arrow" d="M58 27h18"/><path class="gs-arrow" d="M70 23l8 4-8 4"/>' +
    '<rect class="gs-fill" x="80" y="14" width="52" height="26"/><text class="gs-t" x="86" y="31">EFEITO</text>' +
    '<path class="gs-arrow" d="M134 27h18"/><path class="gs-arrow" d="M146 23l8 4-8 4"/>' +
    '<rect class="gs-fill" x="156" y="14" width="52" height="26"/><text class="gs-t" x="162" y="31">EFEITO</text>' +
    '<path class="gs-arrow" d="M210 27h22"/><path class="gs-arrow" d="M224 23l8 4-8 4"/></svg>';

  D.orbita = '<svg viewBox="0 0 240 90">' +
    '<ellipse class="gs-box" cx="120" cy="46" rx="88" ry="26"/>' +
    '<circle class="gs-head" cx="120" cy="46" r="13"/>' +
    '<circle class="gs-dot" cx="208" cy="46" r="6"/>' +
    '<circle class="gs-dot2" cx="60" cy="34" r="4"/>' +
    '<circle class="gs-dot2" cx="170" cy="62" r="4"/>' +
    '<text class="gs-t2" x="86" y="86">O SOM DÁ A VOLTA</text></svg>';

  D.letra = '<svg viewBox="0 0 240 78">' +
    '<rect class="gs-box" x="30" y="6" width="180" height="60"/>' +
    '<text class="gs-big" x="120" y="50">Aa</text>' +
    '<line class="gs-guide" x1="30" y1="50" x2="210" y2="50"/>' +
    '<line class="gs-guide" x1="30" y1="20" x2="210" y2="20"/>' +
    '<text class="gs-t2" x="6" y="76">CAIXA DE TEXTO</text></svg>';

  D.espaco = '<svg viewBox="0 0 240 46">' +
    '<rect class="gs-key" x="46" y="10" width="148" height="26" rx="2"/>' +
    '<text class="gs-t" x="98" y="27">ESPAÇO</text>' +
    '<text class="gs-t2" x="8" y="27">▶</text><text class="gs-t2" x="214" y="27">❚❚</text></svg>';

  /* ============================================================= OS PASSOS */
  var PASSOS = {

    /* ------------------------------------------------------------- VÍDEO */
    video: {
      titulo: 'COMO USAR O LABORATÓRIO DE VÍDEO',
      linha: 'do arquivo solto ao vídeo pronto, sem pular nada',
      passos: [
        {
          t: 'O QUE É ESTA TELA',
          p: 'Três pedaços, e só três. À <b>esquerda</b> ficam as coisas que você pode usar: ' +
            'seus arquivos e o catálogo de efeitos. No <b>meio</b>, em cima, a imagem — é o que vai sair no fim. ' +
            'Embaixo dela, a <b>linha do tempo</b>, que é onde o vídeo é montado. À <b>direita</b>, a ficha: ' +
            'quando você seleciona alguma coisa, tudo o que dá para mexer nela aparece ali.',
          faz: 'Passe o olho nos três pedaços antes de continuar. Nada quebra se você clicar.'
        },
        {
          t: 'PÔR UM VÍDEO PARA DENTRO',
          p: 'Nada é enviado para lugar nenhum. O arquivo abre <b>aqui no seu computador</b>, dentro do navegador, ' +
            'e vai embora quando você fechar a aba. Por isso não tem cadastro, não tem espera e não tem nuvem.',
          faz: 'Na coluna da esquerda, clique em <b>ARQUIVO</b> e escolha um vídeo. Ele aparece na linha do tempo lá embaixo.',
          img: 'trilha'
        },
        {
          t: 'A LINHA DO TEMPO',
          p: 'A faixa colorida é o seu vídeo. O comprimento dela é a duração. A <b>risca vertical</b> que atravessa tudo ' +
            'é onde você está agora — arraste ela e a imagem em cima muda junto.<br><br>' +
            'Cada andar da linha do tempo é uma <b>pista</b>. O que está numa pista de cima aparece <b>na frente</b> ' +
            'do que está numa pista de baixo. É empilhar, igual a papel sobre papel.',
          faz: 'Arraste a risca vertical para a frente e para trás. Veja a imagem acompanhar.',
          img: 'trilha'
        },
        {
          t: 'TOCAR E PARAR',
          p: 'A tecla mais importante daqui é a <b>barra de espaço</b>. Ela toca. Aperta de novo, para. ' +
            'Mais nada para decorar.<br><br>Se quiser voltar ao começo, aperte <k>Home</k>.',
          faz: 'Aperte <k>espaço</k>. Aperte de novo.',
          img: 'espaco'
        },
        {
          t: 'CORTAR UM PEDAÇO FORA',
          p: 'Editar é, na maior parte do tempo, tirar. Ponha a risca vertical no ponto exato onde quer cortar, ' +
            'clique no clipe para selecioná-lo e corte. Ficam dois pedaços independentes; clique no que não presta e ' +
            'aperte <k>Delete</k>.',
          faz: 'Leve a risca até um ponto, selecione o clipe e aperte <k>S</k> para cortar.',
          img: 'corte'
        },
        {
          t: 'PÔR UM EFEITO',
          p: 'O catálogo da esquerda tem os efeitos separados por <b>famílias</b> — cor, tempo, espaço, glitch e por aí. ' +
            'Cada um tem uma miniatura mostrando o que ele faz.<br><br>' +
            'Um efeito sempre entra <b>no clipe que estiver selecionado</b>. Se nada estiver selecionado, ele não tem onde entrar.',
          faz: 'Clique num clipe para selecionar. Depois clique num efeito no catálogo. Olhe a imagem mudar.'
        },
        {
          t: 'AJUSTAR O EFEITO',
          p: 'Com o clipe ainda selecionado, olhe a coluna da direita: o efeito apareceu na <b>PILHA DE EFEITOS</b>. ' +
            'Clique no nome dele e os controles abrem.<br><br>' +
            'Pode pôr <b>vários</b>. Eles acontecem de cima para baixo, e trocar a ordem muda o resultado — ' +
            'um borrão antes de um contraste não é a mesma coisa que um contraste antes de um borrão.',
          faz: 'Abra o efeito na coluna da direita e arraste um dos controles.'
        },
        {
          t: 'DUAS IMAGENS AO MESMO TEMPO',
          p: 'Aqui começa a parte boa. Ponha um segundo vídeo (ou uma foto) numa pista <b>acima</b> do primeiro. ' +
            'Ele vai tapar o de baixo, porque está na frente.<br><br>' +
            'Só que ele não precisa tapar. Selecione o clipe de cima, vá à coluna da direita e abra <b>COMPOSIÇÃO</b>.',
          faz: 'Ponha uma segunda imagem numa pista de cima. Selecione ela.',
          img: 'camadas'
        },
        {
          t: 'MODO DE MISTURA',
          p: 'Em <b>COMPOSIÇÃO</b>, clique em <b>ESCOLHER</b>. Abre um quadro com 27 maneiras de as duas imagens ' +
            'conversarem, cada uma com um pedacinho mostrando o efeito.<br><br>' +
            'Os três que resolvem quase tudo:<br>' +
            '<b>MULTIPLICAR</b> — o branco de cima some. Serve para pôr sombra, sujeira, textura de papel.<br>' +
            '<b>TELA</b> — o preto de cima some. Serve para pôr luz, fogo, faísca, vazamento de luz.<br>' +
            '<b>DIFERENÇA</b> — onde as duas são iguais fica preto. É o modo do negativo e do estranho.',
          faz: 'Experimente MULTIPLICAR e depois TELA. A diferença é imediata.',
          img: 'camadas'
        },
        {
          t: 'OPACIDADE E PREENCHIMENTO',
          p: 'Logo abaixo do modo há dois controles que parecem iguais e não são.<br><br>' +
            '<b>OPACIDADE</b> tira a camada da frente — em 50% você vê metade dela e metade do que está atrás.<br>' +
            '<b>PREENCHIMENTO</b> mantém a camada inteira e diminui a <b>conversa</b> dela com o fundo. ' +
            'Em MULTIPLICAR isso dá um resultado completamente diferente de baixar a opacidade.<br><br>' +
            'Em modo NORMAL os dois fazem a mesma coisa. É nos outros que eles se separam.',
          faz: 'Com MULTIPLICAR ligado, baixe a OPACIDADE para 0.5. Volte para 1 e baixe o PREENCHIMENTO para 0.5. Compare.'
        },
        {
          t: 'RECORTAR COM MÁSCARA',
          p: 'Máscara é decidir <b>onde</b> a camada aparece. Na seção <b>MÁSCARAS DA CAMADA</b>, clique em ' +
            '<b>+ ELIPSE</b>: a camada passa a existir só dentro de um oval.<br><br>' +
            'Os controles que importam: <b>SUAVIDADE</b> derrete a borda (em zero fica um recorte de tesoura, ' +
            'em 1 vira uma névoa) e <b>INVERTER</b> troca o dentro pelo fora — é assim que se faz um buraco.<br><br>' +
            'Pode pôr várias e mandar elas se <b>somarem</b>, se <b>subtraírem</b> ou ficarem só onde ' +
            'as duas se cruzam.',
          faz: 'Ponha uma elipse, suba a SUAVIDADE até uns 0.4 e depois clique em INVERTER.'
        },
        {
          t: 'RECORTAR NO CONTORNO DE UMA COISA',
          p: 'Oval e retângulo servem quando a coisa é oval ou retangular. Quando não é, ' +
            'use <b>+ CANETA</b> — e ela funciona como a caneta de qualquer editor.<br><br>' +
            '<b>Desenhando:</b> cada clique na prévia põe um vértice. Se você <b>arrastar ' +
            'enquanto clica</b>, o trecho já nasce curvo. Clique no <b>ponto verde</b> (o ' +
            'primeiro) ou aperte <b>Enter</b> para fechar o contorno.<br><br>' +
            '<b>Depois de fechado:</b> arraste um ponto para movê-lo · clique num <b>trecho</b> ' +
            'para pôr vértice ali · <b>alt+clique</b> num ponto para tirá-lo.<br><br>' +
            '<b>As curvas:</b> clique num ponto e aparecem duas <b>bolinhas azuis</b> — são as ' +
            'alças. Arrastá-las abaúla o traçado, e as duas andam espelhadas para a curva passar ' +
            'lisa pelo vértice. Segurando <b>alt</b> ao arrastar, elas se soltam uma da outra e ' +
            'você faz um canto vivo no meio de uma curva.<br><br>' +
            'Com pressa? <b>SUAVIZAR TUDO</b> curva o traçado inteiro de uma vez, e <b>RETO</b> volta.',
          faz: 'Clique em + CANETA, contorne alguma coisa da imagem com uns 6 cliques, feche com Enter e clique em SUAVIZAR TUDO.'
        },
        {
          t: 'FAZER O RECORTE ANDAR JUNTO',
          p: 'Se a coisa se mexe na cena, o recorte vai atrás. Você não anima ponto por ' +
            'ponto: anima <b>o caminho inteiro</b>, de uma vez.<br><br>' +
            '<b>1.</b> Ponha o cursor no primeiro quadro e acerte o traçado ali.<br><br>' +
            '<b>2.</b> Em <b>CAMINHO DO TRAÇADO</b>, clique no <b>losango</b>. Ele acende: ' +
            'a forma daquele instante ficou gravada.<br><br>' +
            '<b>3.</b> Ande com o cursor e corrija o contorno. <b>Cada mexida vira keyframe ' +
            'sozinha</b> — você não clica em mais nada. Os losangos aparecem no clipe.<br><br>' +
            'O <b>‹ ◆ ›</b> ao lado pula de um keyframe a outro, e o <b>◆</b> do meio grava ou ' +
            'tira a pose deste instante. Desligar o losango grande congela o traçado no que ' +
            'está na tela — nada de saltos.<br><br>' +
            'Vale para tudo o que muda a forma: arrastar vértice, mexer nas alças, ' +
            '<b>mover, escalar ou girar</b> a máscara inteira.',
          faz: 'Clique no losango de CAMINHO DO TRAÇADO, avance um segundo e arraste um ponto. Volte ao início e veja o contorno voltar sozinho.'
        },
        {
          t: 'ACOMPANHAR UM OBJETO QUE ATRAVESSA O QUADRO',
          p: 'Se a coisa só ANDA — uma garrafa que cruza a cena, um carro que passa — ' +
            'não faz sentido caçar doze vértices a cada quadro. Pegue o contorno inteiro:<br><br>' +
            '<b>Arraste por dentro do traçado</b> e ele vai todo junto. É o gesto mais rápido, e ' +
            'com a animação ligada cada arrasto vira keyframe.<br><br>' +
            'Precisa mexer só num pedaço? <b>Arraste por fora</b> para laçar os vértices que quer, ' +
            'ou <b>shift+clique</b> para ir juntando um a um. Arrastar qualquer um deles move o ' +
            'grupo inteiro. <b>SELECIONAR TUDO</b> na ficha pega todos de uma vez.<br><br>' +
            'Se a coisa também cresce ou gira, use <b>ESCALA</b> e <b>ROTAÇÃO</b> na ficha — ' +
            'eles entram no mesmo keyframe do caminho.',
          faz: 'Com a animação ligada, arraste por dentro do traçado em três instantes diferentes da linha do tempo e depois toque para ver o recorte acompanhar.'
        },
        {
          t: 'FAIXA DE MESCLA',
          p: 'Esta é a ferramenta que ninguém conhece e que resolve mais problema do que qualquer outra.<br><br>' +
            'Em vez de recortar por <b>lugar</b>, ela recorta por <b>tom</b>: você diz "some onde esta camada for escura" ' +
            'ou "só apareça onde o fundo for claro". Nada de contornar nada com o mouse.<br><br>' +
            'É o caminho mais rápido para tirar o céu branco de uma foto, para casar uma textura com a pele sem ' +
            'ela parecer um adesivo, e para dupla exposição.',
          faz: 'Abra FAIXA DE MESCLA, ligue e clique em <b>TIRAR O PRETO</b>. O preto da camada de cima desaparece.'
        },
        {
          t: 'MATTE — UMA CAMADA VIRA RECORTE',
          p: 'Em <b>MATTE DE FAIXA</b> você escolhe outra camada para servir de <b>silhueta</b>. Ela some da imagem ' +
            'e passa a ser o molde: onde ela é branca, esta camada aparece; onde é preta, some.<br><br>' +
            'É como se faz texto preenchido por vídeo, letra com fogo dentro, imagem revelada por uma mancha.',
          faz: 'Ponha um texto numa pista, e no clipe de vídeo escolha MATTE > LUMA, com o texto como silhueta.'
        },
        {
          t: 'COR',
          p: 'A seção <b>COR DA CAMADA</b> tem a correção que qualquer programa de cor tem, e ela vale só para ' +
            'aquela camada — não bagunça o resto.<br><br>' +
            '<b>EXPOSIÇÃO</b> é a luz, medida em paradas, igual a câmera. <b>VIBRAÇÃO</b> é a saturação esperta: ' +
            'ela puxa só as cores fracas, então aumenta cor sem transformar pele em cenoura.',
          faz: 'Ligue COR e mexa em EXPOSIÇÃO e VIBRAÇÃO.'
        },
        {
          t: 'FAZER O EFEITO SE MEXER SOZINHO',
          p: 'Todo controle com um <b>losango ◆</b> do lado pode virar animação.<br><br>' +
            'Leve a risca do tempo para onde a animação começa, clique no losango (ele acende) e ponha o valor. ' +
            'Depois leve a risca para a frente e mude o valor de novo. Pronto: entre os dois pontos o programa ' +
            'faz a passagem sozinho.',
          faz: 'Escolha um controle, acenda o losango, e crie dois valores em dois momentos. Aperte <k>espaço</k>.'
        },
        {
          t: 'TIRAR O VÍDEO DAQUI',
          p: 'Em cima, à direita, tem <b>EXPORTAR</b>. Escolha o tamanho e espere — a conta é feita no seu computador, ' +
            'então demora mais ou menos conforme a máquina.<br><br>' +
            'Salve também o <b>projeto</b> (um arquivo pequeno de texto): ele guarda a montagem inteira e pode ' +
            'ser reaberto depois. O vídeo em si não vai dentro dele, então guarde os arquivos originais.',
          faz: 'Clique em EXPORTAR quando estiver satisfeito.'
        }
      ]
    },

    /* ------------------------------------------------------------- ÁUDIO */
    audio: {
      titulo: 'COMO USAR O LABORATÓRIO DE ÁUDIO',
      linha: 'do arquivo de som ao som transformado',
      passos: [
        {
          t: 'O QUE É ESTA TELA',
          p: 'Em cima, o <b>desenho do som</b>: aquele borrão que sobe e desce é o volume ao longo do tempo. ' +
            'Onde está grosso, tem som alto; onde está fino, tem silêncio.<br><br>' +
            'Embaixo dele, a <b>estante de efeitos</b>: cada cartão é um efeito, e eles acontecem na ordem em que estão.',
          img: 'onda'
        },
        {
          t: 'PÔR UM SOM PARA DENTRO',
          p: 'Igual ao vídeo: o arquivo abre aqui dentro, no seu computador, e não sobe para lugar nenhum.<br><br>' +
            'Se você não tem um arquivo à mão, existe um botão que <b>gera um som de teste</b> — serve perfeitamente ' +
            'para entender o que cada efeito faz.',
          faz: 'Clique em <b>ABRIR ÁUDIO</b> e escolha um arquivo. Ou clique no som de teste.'
        },
        {
          t: 'TOCAR E PARAR',
          p: 'A mesma tecla do laboratório de vídeo: <b>barra de espaço</b> toca e para. ' +
            '<k>Home</k> volta ao começo. <k>Esc</k> para de vez.',
          faz: 'Aperte <k>espaço</k>.',
          img: 'espaco'
        },
        {
          t: 'ESCOLHER UM PEDAÇO',
          p: 'Arraste em cima do desenho do som e você marca um trecho. A partir daí, o que você fizer vale ' +
            '<b>só para aquele pedaço</b>. Clique fora para desmarcar e voltar a valer para o som inteiro.',
          faz: 'Arraste sobre o desenho e aperte <k>espaço</k>: toca só o trecho marcado.',
          img: 'onda'
        },
        {
          t: 'PÔR UM EFEITO',
          p: 'A lista de módulos fica na faixa em cima da estante, separada por famílias: ' +
            '<b>ATMOSFERA</b> (espaços, reverberação), <b>DEFORMAÇÃO</b>, <b>GLITCH</b>, <b>GRANULAR</b>, ' +
            '<b>ESPECTRAL</b> e outras.<br><br>' +
            'Clicou, o efeito entra na estante como um cartão novo. O som é recalculado na hora.',
          faz: 'Clique numa família e depois num efeito. Aperte <k>espaço</k> para ouvir.',
          img: 'cadeia'
        },
        {
          t: 'A ORDEM MUDA TUDO',
          p: 'Os cartões da estante são uma <b>fila</b>: o som entra no primeiro, sai dele já mudado, e entra no segundo.<br><br>' +
            'Distorcer e depois pôr eco não é a mesma coisa que pôr eco e depois distorcer — no primeiro caso ' +
            'o eco repete o som sujo, no segundo a sujeira come o eco. Use as setinhas do cartão para trocar a ordem.',
          faz: 'Ponha dois efeitos e troque a ordem deles. Ouça os dois jeitos.',
          img: 'cadeia'
        },
        {
          t: 'OS CONTROLES DO CARTÃO',
          p: 'Cada cartão tem controles próprios. Três nomes aparecem em quase todos:<br><br>' +
            '<b>MISTURA</b> — quanto do som processado se junta ao original. Em 0 você ouve só o original; ' +
            'em 1, só o efeito. É o controle mais útil de todos.<br>' +
            '<b>SEMENTE</b> — o número do sorteio. Efeitos que sorteiam coisas usam ele: trocar o número dá outro ' +
            'resultado, e voltar ao número devolve exatamente o som de antes.<br>' +
            '<b>TIPO / ESPAÇO</b> — quando existe um menu no cartão, ele esconde variações inteiras. ' +
            'O de ATMOSFERA tem doze ambientes diferentes ali dentro.',
          faz: 'Abra o menu de um cartão que tenha um. Percorra as opções.'
        },
        {
          t: 'DESLIGAR SEM PERDER',
          p: 'Cada cartão tem um botão de <b>mudo</b>. Ele desliga aquele efeito sem apagar os ajustes — ' +
            'é assim que se compara "com" e "sem" sem perder o trabalho.<br><br>' +
            'Existe também um botão <b>A/B</b> em cima: ele alterna entre o som original e o processado, inteiro.',
          faz: 'Mute um cartão, ouça, desmute.'
        },
        {
          t: 'O SOM DANDO A VOLTA EM VOLTA DA CABEÇA',
          p: 'O efeito de <b>órbita</b> é o mais impressionante daqui, e precisa de <b>fone de ouvido</b> — ' +
            'em caixa de som ele não funciona.<br><br>' +
            'Ele não muda o volume dos lados: ele calcula como o som chegaria a cada orelha, com a cabeça no meio ' +
            'atrapalhando. Por isso dá para ouvir se a fonte está na frente ou atrás.<br><br>' +
            'O <b>doppler</b> faz o tom subir quando ela se aproxima e descer quando se afasta, como ambulância passando.',
          faz: 'Ponha o fone. Acrescente o efeito de órbita e ouça uma volta inteira.',
          img: 'orbita'
        },
        {
          t: 'MUTAÇÃO — DEIXAR O ACASO ESCOLHER',
          p: 'Os botões de <b>MUTAR</b> sorteiam valores novos para os controles: <b>SUTIL</b> mexe pouco, ' +
            '<b>EXTREMO</b> mexe muito.<br><br>' +
            'O <b>cadeado</b> ao lado de um controle protege ele do sorteio. Achou um valor bom? Tranque e mute o resto.',
          faz: 'Clique em MUTAR SUTIL algumas vezes e ouça o que aparece.'
        },
        {
          t: 'PRESETS',
          p: 'A lista de presets é um ponto de partida pronto: cada um monta uma estante inteira de efeitos ' +
            'já ajustada para um resultado — cinematográfico, glitch, textura, espaço.<br><br>' +
            'Carregar um preset e depois mexer nele é a maneira mais rápida de aprender o que cada efeito faz.',
          faz: 'Carregue um preset e olhe quais cartões ele montou.'
        },
        {
          t: 'O SOM MEXENDO NA IMAGEM',
          p: 'Isto liga os dois laboratórios. Deixe um som tocando aqui, vá para o laboratório de vídeo, ' +
            'selecione um clipe e abra <b>ÁUDIO REATIVO</b> na coluna da direita.<br><br>' +
            'Você escolhe o que ouvir (<b>grave</b>, <b>médio</b>, <b>agudo</b> ou o volume geral) e o que ele deve ' +
            'mexer — escala, posição, a força de um efeito. A imagem passa a pulsar com o som, de verdade, ' +
            'sem você animar nada.',
          faz: 'Deixe um som tocando, vá ao vídeo e mapeie o GRAVE para a ESCALA de um clipe.'
        },
        {
          t: 'TIRAR O SOM DAQUI',
          p: 'O botão de exportar salva o som já processado como arquivo. O trecho marcado é respeitado: ' +
            'se você marcou um pedaço, sai o pedaço.',
          faz: 'Clique em EXPORTAR.'
        }
      ]
    },

    /* -------------------------------------------------------- TIPOGRAFIA */
    type: {
      titulo: 'COMO USAR O LABORATÓRIO DE TIPOGRAFIA',
      linha: 'texto que vira imagem, e imagem que vira vídeo',
      passos: [
        {
          t: 'PARA QUE SERVE',
          p: 'Este laboratório faz uma coisa só: transformar <b>texto</b> em <b>imagem</b>, para essa imagem ' +
            'entrar no vídeo depois. Título, legenda, letreiro, crédito, palavra solta no meio da tela.',
          img: 'letra'
        },
        {
          t: 'ESCREVER',
          p: 'Digite na caixa de texto. O que aparece na tela é exatamente o que vai sair — não tem surpresa depois.',
          faz: 'Apague o que está escrito e ponha seu texto.',
          img: 'letra'
        },
        {
          t: 'ESCOLHER O TAMANHO DA TELA',
          p: 'Antes de ajeitar qualquer coisa, escolha o formato: <b>1920×1080</b> é o vídeo deitado de sempre, ' +
            '<b>1080×1920</b> é o de celular em pé, <b>1080×1080</b> é o quadrado.<br><br>' +
            'Escolher depois de ajeitar o texto obriga a ajeitar tudo de novo.',
          faz: 'Escolha o formato agora.'
        },
        {
          t: 'A LETRA',
          p: 'Troque a fonte, o peso (fino ou gordo) e o tamanho. Dois controles que passam despercebidos e ' +
            'fazem toda a diferença:<br><br>' +
            '<b>ENTRELETRA</b> — o ar entre uma letra e outra. Título quase sempre quer um pouco mais.<br>' +
            '<b>ENTRELINHA</b> — o ar entre uma linha e outra. Texto grudado cansa a vista.',
          faz: 'Mexa na entreletra até o título respirar.'
        },
        {
          t: 'FUNDO TRANSPARENTE',
          p: 'Se você marcar <b>FUNDO TRANSPARENTE</b>, sai só a letra — o resto fica vazio. É isso que permite ' +
            'pôr o texto <b>por cima</b> de um vídeo no outro laboratório, sem uma tarja atrás.<br><br>' +
            'Se deixar desmarcado, sai um retângulo colorido com o texto dentro.',
          faz: 'Marque FUNDO TRANSPARENTE.'
        },
        {
          t: 'ANIMAR O TEXTO',
          p: 'A lista de animações faz as letras entrarem em cena de um jeito ou de outro — subindo, aparecendo ' +
            'uma a uma, sendo digitadas, tremendo.<br><br>' +
            'Marque <b>ANIMAR</b> e escolha uma. A prévia repete sozinha.',
          faz: 'Marque ANIMAR e experimente três animações diferentes.'
        },
        {
          t: 'MANDAR PARA O VÍDEO',
          p: 'Quando estiver bom, clique em <b>ENVIAR PRA TIMELINE</b>. O texto vira um clipe na linha do tempo ' +
            'do laboratório de vídeo, numa pista própria.<br><br>' +
            'Lá ele é um clipe como qualquer outro: dá para mover, esticar, pôr efeito, mudar o modo de mistura ' +
            'e usar como <b>silhueta</b> para preencher a letra com vídeo.',
          faz: 'Clique em ENVIAR PRA TIMELINE e vá ver no laboratório 01.'
        },
        {
          t: 'LETRA PREENCHIDA COM VÍDEO',
          p: 'O truque que vale por si só. No laboratório de vídeo, ponha o texto numa pista e um vídeo em outra. ' +
            'Selecione o <b>vídeo</b>, abra <b>MATTE DE FAIXA</b>, escolha <b>LUMA</b> e aponte para o texto.<br><br>' +
            'O texto some como texto e vira o molde: o vídeo passa a existir só dentro das letras.',
          faz: 'Faça isto uma vez. Depois disso não tem volta.'
        }
      ]
    }
  };

  G.PASSOS = PASSOS;
  G.D = D;

  /* ============================================================== A GAVETA */
  var atual = null, idx = 0, caixa = null;

  function chave(lab) { return 'rgb_guia_' + lab; }

  function esc(s) { return String(s == null ? '' : s).replace(/[<>&]/g, function (m) { return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[m]; }); }

  /* <k>tecla</k> vira uma tecla desenhada; <b> continua negrito. */
  function texto(s) {
    return String(s).replace(/<k>(.*?)<\/k>/g, '<kbd class="gk">$1</kbd>');
  }

  function monta() {
    if (caixa) return caixa;
    caixa = document.createElement('div');
    caixa.className = 'guia hidden';
    caixa.id = 'guia';
    caixa.innerHTML =
      '<div class="guia-bg" data-gfechar></div>' +
      '<div class="guia-cx" role="dialog" aria-modal="true" aria-labelledby="guiaTit">' +
      '<div class="guia-h">' +
      '<span class="lbl" id="guiaTit"></span><i class="l"></i>' +
      '<span class="micro" id="guiaN"></span>' +
      '<button class="cmd cmd-sm" data-gfechar title="Fechar (Esc)">✕</button></div>' +
      '<div class="guia-sub" id="guiaSub"></div>' +
      '<div class="guia-dots" id="guiaDots"></div>' +
      '<div class="guia-b" id="guiaB"></div>' +
      '<div class="guia-f">' +
      '<button class="cmd cmd-sm" id="guiaAnt" data-gir="-1">← ANTERIOR</button>' +
      '<button class="cmd cmd-sm" data-gir="reset" title="Voltar ao primeiro passo">↺</button>' +
      '<i class="l"></i>' +
      '<button class="cmd cmd-sm cmd-go" id="guiaProx" data-gir="1">PRÓXIMO →</button></div>' +
      '</div>';
    document.body.appendChild(caixa);

    caixa.addEventListener('click', function (e) {
      var f = e.target.closest('[data-gfechar]');
      if (f) { G.fechar(); return; }
      var b = e.target.closest('[data-gir]');
      if (b) {
        var v = b.dataset.gir;
        if (v === 'fim') G.fechar();
        else if (v === 'reset') G.ir(0);
        else G.ir(idx + (+v));
        return;
      }
      var d = e.target.closest('[data-gdot]');
      if (d) G.ir(+d.dataset.gdot);
    });
    return caixa;
  }

  G.abrir = function (lab) {
    lab = lab || (VE.shell && VE.shell.view) || 'video';
    if (!PASSOS[lab]) return false;
    atual = lab;
    monta();
    var salvo = 0;
    try { salvo = parseInt(localStorage.getItem(chave(lab)) || '0', 10) || 0; } catch (e) { }
    idx = Math.max(0, Math.min(PASSOS[lab].passos.length - 1, salvo));
    caixa.classList.remove('hidden');
    document.documentElement.classList.add('guia-on');
    G.pinta();
    return true;
  };

  G.fechar = function () {
    if (!caixa) return;
    caixa.classList.add('hidden');
    document.documentElement.classList.remove('guia-on');
  };

  G.aberto = function () { return !!(caixa && !caixa.classList.contains('hidden')); };

  G.ir = function (n) {
    if (!atual) return;
    var total = PASSOS[atual].passos.length;
    idx = Math.max(0, Math.min(total - 1, n));
    try { localStorage.setItem(chave(atual), String(idx)); } catch (e) { }
    G.pinta();
  };

  G.pinta = function () {
    if (!atual || !caixa) return;
    var g = PASSOS[atual], total = g.passos.length, p = g.passos[idx];
    caixa.querySelector('#guiaTit').textContent = g.titulo;
    caixa.querySelector('#guiaSub').textContent = g.linha;
    caixa.querySelector('#guiaN').textContent = (idx + 1) + ' / ' + total;

    var dots = '';
    for (var i = 0; i < total; i++) {
      dots += '<button class="gdot' + (i === idx ? ' on' : (i < idx ? ' feito' : '')) +
        '" data-gdot="' + i + '" title="passo ' + (i + 1) + ': ' + esc(g.passos[i].t) + '"></button>';
    }
    caixa.querySelector('#guiaDots').innerHTML = dots;

    var h = '<div class="gpasso">';
    h += '<div class="gnum">' + String(idx + 1).padStart(2, '0') + '</div>';
    h += '<h3 class="gt">' + esc(p.t) + '</h3>';
    if (p.img && D[p.img]) h += '<div class="gimg">' + D[p.img] + '</div>';
    h += '<div class="gp">' + texto(p.p) + '</div>';
    if (p.faz) h += '<div class="gfaz"><span>FAÇA AGORA</span>' + texto(p.faz) + '</div>';
    h += '</div>';
    caixa.querySelector('#guiaB').innerHTML = h;
    caixa.querySelector('#guiaB').scrollTop = 0;

    var ant = caixa.querySelector('#guiaAnt');
    var prox = caixa.querySelector('#guiaProx');
    ant.disabled = (idx === 0);
    prox.textContent = (idx === total - 1) ? 'TERMINAR ✓' : 'PRÓXIMO →';
    prox.dataset.gir = (idx === total - 1) ? 'fim' : '1';
  };

  /* setas e ESC enquanto a gaveta está aberta */
  window.addEventListener('keydown', function (e) {
    if (!G.aberto()) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); G.fechar(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); G.ir(idx + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); G.ir(idx - 1); }
  }, true);

  /* liga os botões COMO USAR de cada laboratório */
  G.init = function () {
    document.querySelectorAll('[data-guia]').forEach(function (b) {
      b.addEventListener('click', function () { G.abrir(b.dataset.guia); });
    });
  };

})(window.VE);
