/* «Живой» вариант: экскурсия с голосом и субтитрами, вопросы и ответы, видео на первом экране.
   Работает без сервера. Голос — либо файлы audio/<язык>/NN.mp3, если они лежат рядом,
   либо речь самого устройства зрителя. Нет ни того ни другого — идут субтитры. */
(function () {
  var root = document.documentElement;
  var TJ = root.lang === 'tg', L = TJ ? 'tj' : 'ru';
  var Q = new URLSearchParams(location.search);
  var REC = Q.get('rec') === '1';
  if (REC) root.classList.add('live-rec');

  /* ───────── Тексты ───────── */
  var UI = {
    listen: ['Слушать', 'Гӯш кардан'],
    listenLong: ['Слушать презентацию', 'Гӯш кардани муаррифӣ'],
    qa: ['Вопросы', 'Саволҳо'],
    qaTitle: ['Вопросы и ответы', 'Саволу ҷавоб'],
    qaNote: ['Здесь готовые ответы на частые вопросы.', 'Дар ин ҷо ҷавобҳои тайёр ба саволҳои маъмул ҷамъ оварда шудаанд.'],
    ph: ['Например: как вас найти', 'Масалан: шуморо чӣ гуна ёбем'],
    ask: ['Спросить', 'Пурсидан'],
    mic: ['Спросить голосом', 'Бо овоз пурсидан'],
    say: ['Озвучить', 'Бо овоз хондан'],
    write: ['Написать нам', 'Ба мо навиштан'],
    pause: ['Пауза', 'Таваққуф'],
    play: ['Продолжить', 'Идома додан'],
    prev: ['Назад', 'Ба қафо'],
    next: ['Дальше', 'Ба пеш'],
    stop: ['Закрыть экскурсию', 'Пӯшидани муаррифӣ'],
    close: ['Закрыть', 'Пӯшидан'],
    paused: ['Пауза. Нажмите ▶, чтобы продолжить', 'Таваққуф. Барои идома ▶-ро пахш кунед'],
    silent: ['Идут субтитры: озвучка для этого языка не записана', 'Зернавис: барои ин забон овоз сабт нашудааст'],
    none: ['Готового ответа на этот вопрос здесь нет. Напишите нам — ответим в рабочий день.', 'Барои ин савол дар ин ҷо ҷавоби тайёр нест. Ба мо нависед — дар рӯзи корӣ ҷавоб медиҳем.'],
    micDenied: ['Браузер не дал доступ к микрофону. Напишите вопрос текстом.', 'Браузер ба микрофон иҷозат надод. Саволро бо матн нависед.'],
    micNo: ['Не расслышал. Попробуйте ещё раз или напишите текстом.', 'Нашунидам. Бори дигар кӯшиш кунед ё бо матн нависед.'],
    mailSubj: ['Вопрос по предложению EUROSFERA', 'Савол оид ба пешниҳоди EUROSFERA'],
    talk: ['Спросить сайт голосом', 'Аз сомона бо овоз пурсидан'],
    talkStop: ['Остановить ответ', 'Қатъ кардани ҷавоб'],
    hear: ['Слушаю. Спросите, например: «что получает банк» или «что нужно от банка»', 'Гӯш мекунам. Масалан пурсед: «шуморо чӣ гуна ёбем»'],
    you: ['Вы спросили', 'Шумо пурсидед'],
    bot: ['Помощник сайта', 'Ёрдамчии сомона'],
    show: ['Показать на странице', 'Дар саҳифа нишон додан']
  };
  function t(k) { return UI[k][TJ ? 1 : 0]; }

  /* Остановки экскурсии: куда прокрутить и что сказать. step — шаг внутри закреплённой сцены сделки */
  var STOPS = [
    { top: true,
      ru: 'Здравствуйте. Это проект предложения компании Евросфера для банков Таджикистана. Мы — торговая компания из Софии. Одна сделка клиента — это четыре дохода банка: платёж, конвертация, аккредитив и кредит на импорт.',
      tj: 'Ассалому алайкум. Ин лоиҳаи пешниҳоди ширкати Евросфера барои бонкҳои Тоҷикистон аст. Мо ширкати савдо аз София ҳастем. Як муомилаи мизоҷ — чор даромади бонк аст: пардохт, мубодилаи асъор, аккредитив ва қарз барои воридот.' },
    { sel: '.calc__grid', f: -0.16,
      ru: 'Сколько банк зарабатывает на одной сделке. Вот пример: контракт на 100 000 евро. Платёж, конвертация, аккредитив и проценты по кредиту вместе дают около 7 000 евро. Цифры условные — подвиньте ползунки и подставьте тарифы своего банка.',
      say: 'Сколько банк зарабатывает на одной сделке. Вот пример: контракт на сто тысяч евро. Платёж, конвертация, аккредитив и проценты по кредиту вместе дают около семи тысяч евро. Цифры условные — подвиньте ползунки и подставьте тарифы своего банка.',
      tj: 'Бонк аз як муомила чӣ қадар даромад мегирад. Ин як намуна аст: шартнома ба маблағи 100 000 евро. Пардохт, мубодилаи асъор, аккредитив ва фоизҳои қарз якҷоя тақрибан 7 000 евро даромад меоранд. Рақамҳо шартӣ мебошанд — онҳоро тағйир диҳед ва тарофаҳои бонки худро гузоред.' },
    { sel: '#offer', f: 0.02,
      ru: 'Что мы предлагаем банку. Соглашение о сотрудничестве. Банк ведёт расчёты клиента, финансирует его и проверяет по своим правилам. Мы находим фабрику, покупаем товар по своему контракту, оформляем экспорт, доставляем и передаём документы. Клиент заключает контракт поставки с нами и платит через банк.',
      tj: 'Мо ба бонк чӣ пешниҳод мекунем. Созишнома дар бораи ҳамкорӣ. Бонк ҳисоббаробаркунии мизоҷро анҷом медиҳад, ӯро маблағгузорӣ мекунад ва тибқи қоидаҳои худ месанҷад. Мо корхонаро меёбем, молро бо шартномаи худ мехарем, содиротро ба расмият медарорем, мерасонем ва ҳуҷҷатҳоро месупорем. Мизоҷ шартномаи таҳвилро бо мо мебандад ва тавассути бонк мепардозад.' },
    { sel: '#need', f: 0.02,
      ru: 'Что нужно от банка. Три вещи: рекомендовать нас клиентам, которым нужен товар из-за рубежа; вести расчёты клиента по своим тарифам; назначить контактное лицо. Банк нам ничего не платит и за поставку не отвечает. Наш доход — торговая наценка в цене товара.',
      tj: 'Аз бонк чӣ лозим аст. Се чиз: моро ба мизоҷоне тавсия додан, ки ба онҳо мол аз хориҷа лозим аст; ҳисоббаробаркунии мизоҷро тибқи тарофаҳои худ анҷом додан; шахси масъулро барои тамос таъин кардан. Бонк ба мо ҳеҷ чиз намепардозад ва барои таҳвил ҷавобгар нест. Даромади мо — иловапулии савдо дар нархи мол.' },
    { sel: '.band', f: -0.1,
      ru: 'Клиент приходит к нам по рекомендации банка — и остаётся клиентом банка.',
      tj: 'Мизоҷ бо тавсияи бонк ба мо меояд — ва мизоҷи бонк боқӣ мемонад.' },
    { step: 0,
      ru: 'Как идёт одна сделка. Шаг первый — заявка. Клиент банка присылает перечень товаров и, если есть, контакты фабрики. Предложение на своё имя мы запрашиваем у фабрики сами.',
      tj: 'Як муомила чӣ гуна мегузарад. Қадами якум — дархост. Мизоҷи бонк рӯйхати молҳо ва, агар бошад, маълумоти тамоси корхонаро мефиристад. Пешниҳоди нархро ба номи худ мо аз корхона худамон мепурсем.' },
    { step: 1,
      ru: 'Шаг второй — проверка. Проверяем фабрику и клиента по открытым реестрам и санкционным спискам, а товар — по правилам экспорта из Евросоюза. Проверку клиента по правилам банка проводит сам банк.',
      tj: 'Қадами дуюм — санҷиш. Корхона ва мизоҷро аз рӯйи феҳристҳои кушод ва рӯйхатҳои таҳримӣ, молро аз рӯйи қоидаҳои содирот аз Иттиҳоди Аврупо месанҷем. Санҷиши мизоҷро тибқи қоидаҳои бонк худи бонк мегузаронад.' },
    { step: 2,
      ru: 'Шаг третий — два контракта. Мы заключаем контракт закупки с фабрикой и контракт поставки с клиентом. Для фабрики мы покупатель, для клиента — продавец.',
      tj: 'Қадами сеюм — ду шартнома. Мо бо корхона шартномаи харид ва бо мизоҷ шартномаи таҳвил мебандем. Барои корхона мо харидор, барои мизоҷ — фурӯшанда ҳастем.' },
    { step: 3,
      ru: 'Шаг четвёртый — расчёт. Клиент платит нам цену товара по контракту поставки — через свой банк, переводом или аккредитивом. Фабрике платим мы, по своему контракту закупки.',
      tj: 'Қадами чорум — ҳисоббаробаркунӣ. Мизоҷ ба мо нархи молро тибқи шартномаи таҳвил мепардозад — тавассути бонки худ, бо интиқоли маблағ ё аккредитив. Ба корхона мо мепардозем, тибқи шартномаи хариди худ.' },
    { step: 4,
      ru: 'Шаг пятый — отгрузка. Принимаем товар у фабрики, оформляем экспорт и доставляем на условиях контракта. Клиенту и банку сообщаем дату отгрузки и дату прибытия.',
      tj: 'Қадами панҷум — борфиристӣ. Молро аз корхона қабул мекунем, содиротро ба расмият медарорем ва тибқи шартҳои шартнома мерасонем. Ба мизоҷ ва бонк санаи борфиристӣ ва санаи расиданро хабар медиҳем.' },
    { step: 5,
      ru: 'Шаг шестой — закрытие. Клиент получает документы по сделке, а банк — их копии: контракт поставки, инвойс, упаковочный лист, транспортные документы и экспортную декларацию.',
      tj: 'Қадами шашум — анҷом. Мизоҷ ҳуҷҷатҳои муомиларо ва бонк нусхаҳои онҳоро мегирад: шартномаи таҳвил, инвойс, варақаи бастабандӣ, ҳуҷҷатҳои нақлиётӣ ва декларатсияи содиротӣ.' },
    { sel: '.lanes', f: -0.3,
      ru: 'Кто кому платит. Здесь два отдельных платежа. Первый: клиент платит нам цену товара — через банк. Второй: мы платим фабрике по своему контракту закупки. Документы идут от фабрики через нас клиенту, копии получает банк. Товар идёт от фабрики клиенту.',
      tj: 'Кӣ ба кӣ мепардозад. Ин ҷо ду пардохти алоҳида ҳаст. Якум: мизоҷ ба мо нархи молро тавассути бонк мепардозад. Дуюм: мо ба корхона тибқи шартномаи хариди худ мепардозем. Ҳуҷҷатҳо аз корхона тавассути мо ба мизоҷ мераванд, нусхаҳоро бонк мегирад. Мол аз корхона ба мизоҷ меравад.' },
    { sel: '.terms', f: -0.1,
      ru: 'Как клиент платит за товар. Готовы работать по документарному аккредитиву банка. Либо аванс до отгрузки и остаток против отгрузочных документов. Сумма и валюта фиксируются при подписании контракта. Покупатель у фабрики — мы, клиент платит только нам.',
      tj: 'Мизоҷ барои мол чӣ гуна мепардозад. Омодаем бо аккредитиви ҳуҷҷатии бонк кор кунем. Ё пешпардохт то борфиристӣ ва бақия бар ивази ҳуҷҷатҳои борфиристӣ. Маблағ ва асъор ҳангоми имзои шартнома муайян карда мешаванд. Барои корхона харидор — мо, мизоҷ танҳо ба мо мепардозад.' },
    { sel: '#client', f: -0.05,
      ru: 'Клиент банка получает фабрику, которую находим и проверяем мы, один контракт поставки, товар с комплектом документов и одного человека на связи.',
      tj: 'Мизоҷи бонк корхонаеро, ки мо меёбем ва месанҷем, як шартномаи таҳвил, мол бо маҷмуи ҳуҷҷатҳо ва як шахси масъул барои тамос ба даст меорад.' },
    { sel: '.check', f: 0.02,
      ru: 'Что мы проверяем. Клиента, товар, фабрику и конечного получателя. Не берём товары, вывоз которых из Евросоюза в Таджикистан запрещён, сделки без понятного конечного получателя и оплату по чужим контрактам. Мы не оказываем платёжных услуг. Мы торговая компания: покупаем товар и продаём его клиенту банка. Платёж клиента — это цена товара.',
      tj: 'Мо чиро месанҷем. Мизоҷ, мол, корхона ва гирандаи ниҳоиро. Молҳоеро, ки содироташон аз Иттиҳоди Аврупо ба Тоҷикистон манъ аст, муомилаҳо бе гирандаи ниҳоии маълум ва пардохт аз рӯйи шартномаҳои шахсони сеюмро намегирем. Мо хизматрасониҳои пардохтӣ пешниҳод намекунем. Мо ширкати савдо ҳастем: молро мехарем ва ба мизоҷи бонк мефурӯшем. Пардохти мизоҷ — ин нархи мол аст.' },
    { sel: '.pilot', f: 0.02,
      ru: 'Предлагаем начать с пилота. Сначала соглашение: кто что делает и как проверяем сделки. Затем первые сделки: клиент обращается к нам сам, по рекомендации банка. И разбор результатов вместе.',
      tj: 'Пешниҳод мекунем, ки аз лоиҳаи озмоишӣ оғоз кунем. Аввал — созишнома: кӣ чӣ кор мекунад ва муомилаҳоро чӣ гуна месанҷем. Баъд — муомилаҳои аввал: мизоҷ бо тавсияи бонк худаш ба мо муроҷиат мекунад. Ва ҷамъбасти муштараки натиҷаҳо.' },
    { end: true,
      ru: 'Это проект предложения. Давайте обсудим пилот. Телефон и почта — на экране. Спасибо за внимание.',
      tj: 'Ин лоиҳаи пешниҳод аст. Биёед лоиҳаи озмоиширо муҳокима кунем. Телефон ва почта дар экран нишон дода шудаанд. Ташаккур барои таваҷҷуҳ.' }
  ];

  /* Готовые ответы. kw — начала слов, по которым вопрос узнаётся */
  var QA = [
    { go: { end: true },
      ru: { q: 'Как вас найти?', kw: ['найти', 'адрес', 'где', 'наход', 'контакт', 'телефон', 'почт', 'связа', 'офис', 'позвон', 'сайт', 'реквизит'],
        a: 'ЕВРОСФЕРА ЕООД (EUROSFERA Ltd.), ЕИК 207067847. Адрес: Болгария, София 1202, ул. Българска морава 22. Телефон: +359 89 209 84 60. Почта: sale@euro.s.bg. Сайт: euro.s.bg.',
        say: 'Мы находимся в Софии, в Болгарии. Адрес, телефон, почта и сайт — на экране.' },
      tj: { q: 'Шуморо чӣ гуна ёбем?', kw: ['ёб', 'ёфт', 'суроға', 'куҷо', 'тамос', 'телефон', 'почта', 'дафтар', 'занг', 'сомона', 'реквизит'],
        a: 'ЕВРОСФЕРА ЕООД (EUROSFERA Ltd.), ЕИК 207067847. Суроға: Булғористон, София 1202, кӯчаи Българска морава 22. Телефон: +359 89 209 84 60. Почта: sale@euro.s.bg. Сомона: euro.s.bg.' } },
    { go: { sel: '.lanes', f: -0.3 },
      ru: { q: 'Чем вы отличаетесь?', kw: ['лучш', 'отлич', 'преимущ', 'почему', 'зачем', 'сильн', 'особен'],
        a: 'Мы берём на себя товарную часть сделки: находим фабрику, покупаем товар по своему контракту, оформляем экспорт и доставляем. Для клиента мы продавец и отвечаем за количество, качество и срок. Клиент платит нам через банк, а банк получает копии документов по сделке.' },
      tj: { q: 'Фарқи шумо дар чист?', kw: ['беҳтар', 'фарқ', 'бартар', 'чаро', 'афзал', 'хос'],
        a: 'Мо корҳои марбут ба молро ба зимма мегирем: корхонаро меёбем, молро бо шартномаи худ мехарем, содиротро ба расмият медарорем ва мерасонем. Барои мизоҷ мо фурӯшанда ҳастем ва барои миқдор, сифат ва муҳлат ҷавоб медиҳем. Мизоҷ ба мо тавассути бонк мепардозад ва бонк нусхаҳои ҳуҷҷатҳои муомиларо мегирад.' } },
    { go: { step: 0 },
      ru: { q: 'Что вы можете сделать?', kw: ['можете', 'умеете', 'делаете', 'услуг', 'сделать', 'занимаетесь', 'предлагаете', 'товар', 'привез', 'возите', 'привоз'],
        a: 'Найти фабрику и проверить её, купить товар по своему контракту, оформить экспорт, доставить и передать документы. Работаем с отделочными материалами и сантехникой, оборудованием и агротоварами. Другие группы товаров — после отдельной проверки.' },
      tj: { q: 'Шумо чӣ кор карда метавонед?', kw: ['метавон', 'хизмат', 'пешниҳод', 'мол', 'овар', 'машғул', 'мекунед'],
        a: 'Корхонаро меёбем ва месанҷем, молро бо шартномаи худ мехарем, содиротро ба расмият медарорем, мерасонем ва ҳуҷҷатҳоро месупорем. Бо масолеҳи пардозӣ ва сантехника, таҷҳизот ва молҳо барои соҳаи кишоварзӣ кор мекунем. Гурӯҳҳои дигари молҳо — пас аз санҷиши алоҳида.' } },
    { go: { sel: '#need', f: 0.02 },
      ru: { q: 'Что нужно от банка?', kw: ['нужн', 'нужно', 'требу', 'обязан', 'должен', 'рекоменд'],
        a: 'Три вещи: рекомендовать нас клиентам, которым нужен товар из-за рубежа, вести расчёты клиента по своим тарифам и назначить контактное лицо. Банк нам ничего не платит и за поставку не отвечает.' },
      tj: { q: 'Аз бонк чӣ лозим аст?', kw: ['лозим', 'талаб', 'зарур', 'тавсия', 'даркор', 'вазифа', 'уҳда', 'ӯҳда', 'ухда', 'мехоҳед', 'мехохед', 'интизор', 'ҷавобгар', 'чавобгар', 'масъул'],
        a: 'Се чиз: моро ба мизоҷоне тавсия додан, ки ба онҳо мол аз хориҷа лозим аст, ҳисоббаробаркунии мизоҷро тибқи тарофаҳои худ анҷом додан ва шахси масъулро барои тамос таъин кардан. Бонк ба мо ҳеҷ чиз намепардозад ва барои таҳвил ҷавобгар нест.' } },
    { go: { sel: '.calc__grid', f: -0.16 },
      ru: { q: 'Что получает банк?', kw: ['банк', 'доход', 'зарабат', 'получ', 'выгод', 'польз'],
        a: 'Как правило, международный платёж и конвертацию по сделке, аккредитив и материал для кредита на импорт. Независимого поставщика из Евросоюза, которого можно рекомендовать клиентам. И копии документов по каждой сделке. Пример расчёта дохода на одной сделке — на экране.' },
      tj: { q: 'Бонк чӣ ба даст меорад?', kw: ['бонк', 'даромад', 'фоида', 'манфиат', 'мегирад'],
        a: 'Чун қоида, пардохти байналмилалӣ ва мубодилаи асъор аз рӯйи муомила, аккредитив ва мавод барои қарзи воридотӣ. Таҳвилгари мустақил аз Иттиҳоди Аврупо, ки онро ба мизоҷон тавсия додан мумкин аст. Ва нусхаҳои ҳуҷҷатҳо барои ҳар муомила. Намунаи ҳисоби даромад аз як муомила дар экран нишон дода шудааст.' } },
    { go: { step: 3 },
      ru: { q: 'Кто платит фабрике?', kw: ['плат', 'оплат', 'фабрик', 'деньг', 'перевод', 'расчёт', 'расчет', 'счёт', 'счет', 'аккредитив'],
        a: 'Фабрике платим мы — по своему контракту закупки. Клиент платит только нам: цену товара по контракту поставки, через свой банк.' },
      tj: { q: 'Ба корхона кӣ пардохт мекунад?', kw: ['пардохт', 'корхона', 'пул', 'интиқол', 'ҳисоб', 'аккредитив', 'мепардоз'],
        a: 'Ба корхона мо мепардозем — тибқи шартномаи хариди худ. Мизоҷ танҳо ба мо мепардозад: нархи молро тибқи шартномаи таҳвил, тавассути бонки худ.' } },
    { go: { sel: '.check__say', f: -0.5 },
      ru: { q: 'Вы платёжный агент?', kw: ['агент', 'платёжн', 'платежн', 'лиценз', 'посредник', 'финансов'],
        a: 'Нет. Мы не оказываем платёжных услуг и не переводим деньги по поручению третьих лиц. Мы торговая компания: покупаем товар в собственность и продаём его клиенту банка.' },
      tj: { q: 'Шумо агенти пардохт ҳастед?', kw: ['агент', 'агенти', 'пардохтӣ', 'литсензия', 'иҷозатнома', 'миёнарав', 'молиявӣ'],
        a: 'Не. Мо хизматрасониҳои пардохтӣ пешниҳод намекунем ва бо супориши шахсони сеюм маблағ интиқол намедиҳем. Мо ширкати савдо ҳастем: молро ба моликияти худ мехарем ва ба мизоҷи бонк мефурӯшем.' } },
    { go: { sel: '.check', f: 0.02 },
      ru: { q: 'Как вы проверяете сделки?', kw: ['провер', 'комплаенс', 'санкци', 'риск', 'безопас', 'контрол', 'огранич', 'реэкспорт'],
        a: 'До оплаты проверяем клиента и фабрику по открытым реестрам и санкционным спискам, а товар — по правилам экспорта из Евросоюза. В контракт включаем запрет реэкспорта и берём декларацию конечного пользователя. Проверку клиента по правилам банка проводит сам банк.' },
      tj: { q: 'Муомилаҳоро чӣ гуна месанҷед?', kw: ['санҷ', 'месанҷ', 'комплаенс', 'таҳрим', 'хатар', 'бехатар', 'назорат', 'маҳдуд', 'реэкспорт'],
        a: 'Пеш аз пардохт мизоҷ ва корхонаро аз рӯйи феҳристҳои кушод ва рӯйхатҳои таҳримӣ, молро аз рӯйи қоидаҳои содирот аз Иттиҳоди Аврупо месанҷем. Ба шартнома манъи реэкспортро дохил мекунем ва эъломияи истифодабарандаи ниҳоиро мегирем. Санҷиши мизоҷро тибқи қоидаҳои бонк худи бонк мегузаронад.' } },
    { go: { sel: '.terms', f: -0.1 },
      ru: { q: 'Сколько это стоит?', kw: ['стоит', 'стоим', 'цен', 'сколько', 'тариф', 'комисс', 'процент', 'вознагражд'],
        a: 'Цена товара с экспортным оформлением и доставкой фиксируется в контракте поставки при подписании. Банк нам ничего не платит: наш доход — торговая наценка в цене товара.' },
      tj: { q: 'Ин чанд пул меистад?', kw: ['нарх', 'чанд', 'меист', 'арзиш', 'тариф', 'тарофа', 'комиссия', 'фоиз', 'подош'],
        a: 'Нархи мол бо расмиёти содирот ва молрасонӣ ҳангоми имзо дар шартномаи таҳвил муайян карда мешавад. Бонк ба мо ҳеҷ чиз намепардозад: даромади мо — иловапулии савдо дар нархи мол.' } },
    { go: { sel: '.pilot', f: 0.02 },
      ru: { q: 'С чего начать?', kw: ['начать', 'начин', 'начн', 'пилот', 'старт', 'первый', 'шаг', 'дальше', 'сотруднич'],
        a: 'С пилота из трёх шагов: соглашение о том, кто что делает, первые сделки и совместный разбор результатов. Напишите или позвоните — согласуем встречу.' },
      tj: { q: 'Аз чӣ оғоз кунем?', kw: ['оғоз', 'сар', 'озмоиш', 'қадам', 'аввал', 'ҳамкор'],
        a: 'Аз лоиҳаи озмоишӣ иборат аз се қадам: созишнома дар бораи он ки кӣ чӣ кор мекунад, муомилаҳои аввал ва ҷамъбасти муштараки натиҷаҳо. Нависед ё занг занед — вохӯриро мувофиқа мекунем.' } },
    { go: { step: 4 },
      ru: { q: 'Сколько времени занимает сделка?', kw: ['срок', 'времен', 'занима', 'долго', 'быстро', 'когда', 'дней', 'недел'],
        a: 'Срок зависит от товара, фабрики и маршрута. Называем его до подписания и фиксируем в контракте.' },
      tj: { q: 'Муомила чанд вақт мегирад?', kw: ['муҳлат', 'вақт', 'мегирад', 'дароз', 'тез', 'кай', 'рӯз', 'ҳафта'],
        a: 'Муҳлат аз мол, корхона ва масир вобаста аст. Онро пеш аз имзо мегӯем ва дар шартнома қайд мекунем.' } }
  ];

  /* ───────── Видео на первом экране ───────── */
  (function heroVideo() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    var box = document.createElement('div');
    box.className = 'hero__video'; box.setAttribute('aria-hidden', 'true');
    box.innerHTML = '<img src="img/port.jpg" alt="">';
    hero.insertBefore(box, hero.firstChild);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'metadata';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.addEventListener('loadeddata', function () { box.classList.add('is-video'); var p = v.play(); if (p && p.catch) p.catch(function () {}); });
    v.addEventListener('error', function () { v.remove(); });   // файла нет — остаётся фото
    v.src = 'video/hero.mp4';
    box.appendChild(v);
    document.addEventListener('visibilitychange', function () { if (document.hidden) v.pause(); else if (box.classList.contains('is-video')) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } });
  })();

  /* ───────── Голос ───────── */
  var synth = window.speechSynthesis || null, voiceOf = null;
  function pickVoice() {
    if (!synth) return;
    var want = TJ ? 'tg' : 'ru';
    var list = (synth.getVoices() || []).filter(function (v) { return (v.lang || '').toLowerCase().replace('_', '-').indexOf(want) === 0; });
    function rank(v) { var n = v.name || ''; return (/natural|neural|enhanced|premium|siri/i.test(n) ? 4 : 0) + (/google/i.test(n) ? 2 : 0) + (v.localService ? 1 : 0); }
    list.sort(function (a, b) { return rank(b) - rank(a); });
    voiceOf = list[0] || null;
  }
  if (synth) { pickVoice(); if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice); else synth.onvoiceschanged = pickVoice; }
  function sentences(text) { return (text.match(/[^.!?…]+[.!?…]+[»"]?\s*|[^.!?…]+$/g) || [text]).map(function (s) { return s.trim(); }).filter(Boolean); }
  function quiet() { if (synth) { try { synth.cancel(); } catch (e) {} } }

  /* Субтитры */
  var sub = document.createElement('div');
  sub.className = 'live-sub'; sub.setAttribute('aria-live', 'polite');
  document.body.appendChild(sub);
  function caption(text, note) { sub.textContent = text || ''; if (note) { var s = document.createElement('small'); s.textContent = note; sub.appendChild(s); } sub.classList.toggle('is-on', !!text); }

  /* Проговорить список фраз одну за другой. Возвращает функцию отмены. */
  var run = 0;
  function speak(list, opts, done) {
    var my = ++run, i = 0, timer = 0, useVoice = !!(synth && voiceOf && !opts.mute);
    function step() {
      clearTimeout(timer);
      if (my !== run) return;
      if (i >= list.length) { done && done(); return; }
      var s = list[i++];
      if (opts.caption) caption(s, opts.label || (!useVoice && !MUTE && i === 1 ? t('silent') : ''));
      if (useVoice) {
        var u = new SpeechSynthesisUtterance(s);
        u.voice = voiceOf; u.lang = voiceOf.lang; u.rate = 1; u.pitch = 1;
        u.onend = step; u.onerror = step;
        timer = setTimeout(step, s.length * 110 + 4000);       // страховка: событие конца приходит не всегда
        try { synth.speak(u); } catch (e) { step(); }
      } else {
        timer = setTimeout(step, opts.pace ? opts.pace(s) : Math.max(1900, s.length * 62));
      }
    }
    quiet(); step();
    return function () { if (my === run) run++; clearTimeout(timer); quiet(); };
  }

  /* Записанный голос. FILES: null — ещё не знаем, true — файлы лежат рядом, false — их нет */
  var MUTE = Q.get('voice') === 'off', DEVICE = Q.get('voice') === 'device', FILES = MUTE ? false : null;
  if (FILES === null) {
    var probe = new Audio(); probe.preload = 'metadata';
    probe.addEventListener('loadedmetadata', function () { if (FILES === null) FILES = true; });
    probe.addEventListener('error', function () { if (FILES === null) FILES = false; });
    probe.src = 'audio/' + L + '/01.mp3';
  }
  function voice(list, file, opts, done) {
    var dead = false, a = null, inner = null, guard = 0;
    function fallback() {
      if (dead || inner) return;
      clearTimeout(guard); if (a) { try { a.pause(); } catch (e) {} a = null; }
      inner = speak(list, { caption: opts.caption, label: opts.label, mute: !DEVICE }, done);
    }
    if (!file || FILES === false) { fallback(); }
    else {
      a = new Audio(file);
      var total = list.join(' ').length, marks = [], acc = 0, shown = -1;
      list.forEach(function (x) { acc += x.length; marks.push(acc / total); });
      a.addEventListener('error', function () { if (FILES === null) FILES = false; fallback(); });
      a.addEventListener('timeupdate', function () {
        if (dead || !opts.caption) return;
        var r = a.currentTime / (a.duration || 1), k = 0; while (k < marks.length - 1 && r > marks[k]) k++;
        if (k !== shown) { shown = k; caption(list[k], opts.label || ''); }
      });
      a.addEventListener('ended', function () { if (!dead) { dead = true; done && done(); } });
      a.addEventListener('canplay', function () {
        if (dead || inner) return; clearTimeout(guard); FILES = true;
        if (opts.caption) caption(list[0], opts.label || '');
        var p = a.play(); if (p && p.catch) p.catch(fallback);
      }, { once: true });
      guard = setTimeout(fallback, 3500);                         // файл не ответил — не держим зрителя
    }
    return function () { dead = true; clearTimeout(guard); if (a) { try { a.pause(); } catch (e) {} } if (inner) inner(); };
  }

  /* ───────── Экскурсия ───────── */
  var tour = { on: false, paused: false, i: 0, cancel: null, wait: 0, lock: 0 };
  var lenis = function () { return window.__lenis || null; };

  function stopY(s) {
    var H = innerHeight, max = document.documentElement.scrollHeight - H;
    if (s.end) return max;
    if (s.top) return 0;
    if (s.step != null) {
      if (!root.classList.contains('js-deal')) { var one = document.querySelectorAll('[data-step]')[s.step]; return one ? Math.max(0, Math.min(max, one.getBoundingClientRect().top + scrollY - 90)) : scrollY; }
      var d = document.querySelector('.deal'); var top = d.getBoundingClientRect().top + scrollY; return Math.min(max, top + (d.offsetHeight - H) / 6 * (s.step + 0.5));
    }
    var el = document.querySelector(s.sel); if (!el) return scrollY;
    return Math.max(0, Math.min(max, el.getBoundingClientRect().top + scrollY + H * (s.f || 0) - (s.f ? 0 : 0)));
  }
  function travel(y, sec) {
    tour.lock = Date.now() + sec * 1000 + 400;                   // пока едем сами — жесты не считаем вмешательством
    var l = lenis();
    if (l) l.scrollTo(y, { duration: sec, force: true });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  }
  function pad(n) { return (n < 9 ? '0' : '') + (n + 1); }

  function playStop(n) {
    var s = STOPS[n], list = sentences(s[L]);
    tour.i = n; paint();
    if (REC) console.log('TOUR_STOP ' + n + ' ' + Math.round(performance.now()));
    travel(stopY(s), n === 0 ? 0.6 : 1.3);
    clearTimeout(tour.wait);
    tour.wait = setTimeout(function () {
      if (!tour.on || tour.paused || tour.i !== n) return;
      if (REC) console.log('TOUR_SAY ' + n + ' ' + Math.round(performance.now()));
      var next = function () { if (!tour.on || tour.i !== n) return; if (n < STOPS.length - 1) playStop(n + 1); else finish(); };
      var dur = tour.durations && tour.durations[n];
      if (dur) {                                              // запись видео: держим ровно длину звуковой дорожки
        var total = list.join(' ').length, acc = 0;
        tour.cancel = speak(list, { caption: true, mute: true, pace: function (x) { return Math.max(400, dur * 1000 * x.length / total); } }, next);
        return;
      }
      tour.cancel = voice(list, 'audio/' + L + '/' + pad(n) + '.mp3', { caption: true }, next);
    }, n === 0 ? 700 : 1400);
  }
  function hush() { clearTimeout(tour.wait); if (tour.cancel) { tour.cancel(); tour.cancel = null; } }
  function startTour(n) { closeQA(); hushTalk(); tour.on = true; tour.paused = false; root.classList.add('is-tour'); if (window.ScrollTrigger) setTimeout(function () { ScrollTrigger.refresh(); playStop(n || 0); }, 60); else playStop(n || 0); }
  function pauseTour(msg) { if (!tour.on || tour.paused) return; tour.paused = true; hush(); caption(msg === false ? '' : t('paused')); paint(); }
  function resumeTour() { if (!tour.on) return; tour.paused = false; playStop(tour.i); }
  function finish() { hush(); tour.on = false; tour.paused = false; caption(''); root.classList.remove('is-tour'); paint(); if (window.ScrollTrigger) setTimeout(function () { ScrollTrigger.refresh(); }, 60); if (REC) console.log('TOUR_DONE ' + Math.round(performance.now())); window.__tourDone = true; }
  function jump(d) { if (!tour.on) return; var n = Math.max(0, Math.min(STOPS.length - 1, tour.i + d)); hush(); tour.paused = false; playStop(n); }

  /* Зритель сам взялся за прокрутку — ставим на паузу и не спорим с рукой */
  ['wheel', 'touchmove'].forEach(function (ev) {
    window.addEventListener(ev, function () { if (tour.on && !tour.paused && !REC && Date.now() > tour.lock) pauseTour(); }, { passive: true });
  });
  window.addEventListener('pagehide', function () { hush(); quiet(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && tour.on && !tour.paused && !REC) pauseTour(); });

  /* ───────── Кнопки в шапке ───────── */
  var ctl = document.createElement('div');
  ctl.className = 'live-ctl';
  ctl.innerHTML =
    '<button class="live-btn live-btn--go" type="button" data-idle data-act="go" aria-label="' + t('listenLong') + '"><i class="ico ico--play" aria-hidden="true"></i><span>' + t('listen') + '</span></button>' +
    '<button class="live-btn" type="button" data-idle data-act="qa" aria-expanded="false"><span>' + t('qa') + '</span></button>' +
    '<button class="live-btn live-btn--icon" type="button" data-tour data-act="prev" aria-label="' + t('prev') + '"><i class="ico ico--prev" aria-hidden="true"></i></button>' +
    '<button class="live-btn live-btn--icon live-btn--go" type="button" data-tour data-act="toggle" aria-label="' + t('pause') + '"><i class="ico ico--pause" aria-hidden="true"></i></button>' +
    '<button class="live-btn live-btn--icon" type="button" data-tour data-act="next" aria-label="' + t('next') + '"><i class="ico ico--next" aria-hidden="true"></i></button>' +
    '<span class="live-count" data-tour aria-hidden="true"></span>' +
    '<button class="live-btn live-btn--icon" type="button" data-tour data-act="stop" aria-label="' + t('stop') + '"><i class="ico ico--x" aria-hidden="true"></i></button>';
  var top = document.querySelector('.top'), lang = document.querySelector('.top__lang');
  if (top) top.insertBefore(ctl, lang || null);
  var bToggle = ctl.querySelector('[data-act="toggle"]'), bQA = ctl.querySelector('[data-act="qa"]'), count = ctl.querySelector('.live-count');
  function paint() {
    count.textContent = pad(tour.i) + ' / ' + STOPS.length;
    bToggle.querySelector('.ico').className = 'ico ' + (tour.paused ? 'ico--play' : 'ico--pause');
    bToggle.setAttribute('aria-label', tour.paused ? t('play') : t('pause'));
  }
  ctl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var a = b.dataset.act;
    if (a === 'go') startTour(0);
    else if (a === 'qa') (panel.classList.contains('is-open') ? closeQA : openQA)();
    else if (a === 'toggle') (tour.paused ? resumeTour : pauseTour)();
    else if (a === 'prev') jump(-1);
    else if (a === 'next') jump(1);
    else if (a === 'stop') finish();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (panel.classList.contains('is-open')) closeQA(); else if (tour.on) finish(); } });

  /* ───────── Вопросы и ответы ───────── */
  var panel = document.createElement('aside');
  panel.className = 'live-qa'; panel.setAttribute('aria-label', t('qaTitle')); panel.setAttribute('inert', '');
  var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  panel.innerHTML =
    '<div class="live-qa__head"><h2>' + t('qaTitle') + '</h2><button class="live-btn live-btn--icon" type="button" data-close aria-label="' + t('close') + '"><i class="ico ico--x" aria-hidden="true"></i></button></div>' +
    '<p class="live-qa__note">' + t('qaNote') + '</p>' +
    '<form><input type="text" autocomplete="off" enterkeyhint="search" placeholder="' + t('ph') + '" aria-label="' + t('ask') + '">' +
    (Rec && !TJ ? '<button class="live-qa__mic" type="button" aria-label="' + t('mic') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg></button>' : '') +
    '<button class="live-qa__send" type="submit">' + t('ask') + '</button></form>' +
    '<p class="live-qa__msg" role="status"></p>' +
    '<div class="live-qa__chips"></div><div class="live-qa__out" aria-live="polite"></div>';
  document.body.appendChild(panel);
  var input = panel.querySelector('input'), out = panel.querySelector('.live-qa__out'), chips = panel.querySelector('.live-qa__chips'), msg = panel.querySelector('.live-qa__msg');
  QA.forEach(function (item, k) { var b = document.createElement('button'); b.type = 'button'; b.textContent = item[L].q; b.dataset.k = k; chips.appendChild(b); });

  function norm(s) { return s.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-яғӣқӯҳҷ0-9\s-]/gi, ' ').split(/\s+/).filter(Boolean); }
  function find(text) {
    var words = norm(text), best = -1, score = 0;
    QA.forEach(function (item, k) {
      var s = 0;
      item[L].kw.forEach(function (kw) { var w = kw.replace(/ё/g, 'е'); if (words.some(function (x) { return x.indexOf(w) === 0; })) s++; });
      if (s > score) { score = s; best = k; }
    });
    return best;
  }
  function answer(k, asked) {
    out.textContent = '';
    var h = document.createElement('h3'), p = document.createElement('p'), acts = document.createElement('div');
    acts.className = 'live-qa__acts';
    var text = k < 0 ? t('none') : QA[k][L].a;
    h.textContent = k < 0 ? asked : QA[k][L].q; p.textContent = text;
    out.appendChild(h); out.appendChild(p);
    if (k >= 0 && (FILES || (DEVICE && synth && voiceOf))) { var say = document.createElement('button'); say.type = 'button'; say.textContent = t('say'); say.addEventListener('click', function () { hushTalk(); talking = voice(sentences(QA[k][L].say || text), 'audio/' + L + '/qa-' + pad(k) + '.mp3', {}, function () { talking = null; }); }); acts.appendChild(say); }
    if (k >= 0) { var show = document.createElement('button'); show.type = 'button'; show.textContent = t('show'); show.addEventListener('click', function () { closeQA(); travel(stopY(QA[k].go), 1.3); }); acts.appendChild(show); }
    var mail = document.createElement('a');
    mail.href = 'mailto:sale@euro.s.bg?subject=' + encodeURIComponent(t('mailSubj')) + (asked ? '&body=' + encodeURIComponent(asked) : '');
    mail.textContent = t('write'); acts.appendChild(mail);
    out.appendChild(acts);
  }
  function ask(text) { text = (text || '').trim(); msg.textContent = ''; if (!text) return; var k = find(text); answer(k, text); if (k >= 0 && matchMedia('(min-width:700px)').matches) travel(stopY(QA[k].go), 1.3); }
  panel.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  chips.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; var k = +b.dataset.k; input.value = b.textContent; msg.textContent = ''; answer(k, b.textContent); if (matchMedia('(min-width:700px)').matches) travel(stopY(QA[k].go), 1.3); });
  panel.querySelector('[data-close]').addEventListener('click', function () { closeQA(); });

  var mic = panel.querySelector('.live-qa__mic');
  if (mic) mic.addEventListener('click', function () { closeQA(); listen(); });

  /* ───────── Разговор с сайтом: спросили голосом — сайт сам открыл раздел и ответил ───────── */
  var fab = document.createElement('button');
  fab.className = 'live-fab'; fab.type = 'button'; fab.setAttribute('aria-label', t('talk'));
  fab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg><i aria-hidden="true"></i>';
  document.body.appendChild(fab);
  var hear = null, talking = null, fade = 0;
  function mode(m) { fab.classList.toggle('is-rec', m === 'rec'); fab.classList.toggle('is-talk', m === 'talk'); fab.setAttribute('aria-label', m === 'talk' ? t('talkStop') : t('talk')); }
  function hushTalk() { clearTimeout(fade); if (talking) { talking(); talking = null; } if (hear) { try { hear.abort(); } catch (e) {} hear = null; } mode(''); }
  function reply(text) {
    var k = find(text);
    caption('«' + text + '»', t('you'));
    clearTimeout(fade);
    fade = setTimeout(function () {
      if (k < 0) { caption(''); openQA(); input.value = text; answer(-1, text); return; }
      travel(stopY(QA[k].go), 1.3);
      mode('talk');
      talking = voice(sentences(QA[k][L].say || QA[k][L].a), 'audio/' + L + '/qa-' + pad(k) + '.mp3', { caption: true, label: t('bot') }, function () { talking = null; mode(''); fade = setTimeout(function () { caption(''); }, 1600); });
    }, 1100);
  }
  function listen() {
    if (tour.on) pauseTour(false);
    if (talking || hear) { hushTalk(); caption(''); return; }
    if (!Rec || TJ) { openQA(); return; }                       // распознавания речи нет — обычное поле для вопроса
    if (DEVICE && synth) { try { var u0 = new SpeechSynthesisUtterance(' '); u0.volume = 0; synth.speak(u0); } catch (e) {} }
    hear = new Rec(); hear.lang = 'ru-RU'; hear.interimResults = true; hear.maxAlternatives = 1;
    var got = '';
    mode('rec'); caption(t('hear'));
    hear.onresult = function (e) { var s = ''; for (var x = 0; x < e.results.length; x++) s += e.results[x][0].transcript; got = s; caption('«' + s + '»', t('you')); if (e.results[e.results.length - 1].isFinal) { try { hear.stop(); } catch (err) {} } };
    hear.onerror = function (e) { got = ''; caption((e.error === 'not-allowed' || e.error === 'service-not-allowed') ? t('micDenied') : t('micNo')); clearTimeout(fade); fade = setTimeout(function () { caption(''); }, 4200); if (e.error === 'not-allowed' || e.error === 'service-not-allowed') openQA(); };
    hear.onend = function () { hear = null; mode(''); if (got.trim()) reply(got.trim()); };
    try { hear.start(); } catch (err) { hear = null; mode(''); openQA(); }
  }
  fab.addEventListener('click', listen);
  if ('IntersectionObserver' in window) {
    var card = document.querySelector('.dossier');
    var watch = new IntersectionObserver(function (es) {
      fab.classList.toggle('is-away', es[0].isIntersecting && root.classList.contains('deal-flat') && matchMedia('(max-width:699px)').matches);
    }, { rootMargin: '-' + Math.max(0, innerHeight - 96) + 'px 0px 0px 0px' });
    if (card) watch.observe(card);
  }
  window.__ask = reply;                                          // для проверки без микрофона

  function openQA() { if (tour.on) pauseTour(false); panel.classList.add('is-open'); panel.removeAttribute('inert'); bQA.setAttribute('aria-expanded', 'true'); if (matchMedia('(hover:hover)').matches) input.focus(); }
  function closeQA() { panel.classList.remove('is-open'); panel.setAttribute('inert', ''); bQA.setAttribute('aria-expanded', 'false'); }

  /* ───────── Запись видео: ?tour=auto&rec=1 запускает экскурсию без кнопок и без голоса ───────── */
  if (Q.get('tour') === 'auto') {
    var go = function () { startTour(0); };
    if (REC) {
      fetch('audio/' + L + '/manifest.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
        .then(function (m) { if (m && m.durations) tour.durations = m.durations; setTimeout(go, 3200); });
    } else setTimeout(go, 3200);
  }
  paint();
})();
