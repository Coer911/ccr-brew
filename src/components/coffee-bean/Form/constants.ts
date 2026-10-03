import { ROAST_LEVELS } from '@/lib/utils/roastProfileUtils';

// 预设选项
// 产区：咖啡生产国家及子产区
export const DEFAULT_ORIGINS = [
  // ==========================================
  // 非洲 (Africa)
  // ==========================================
  'Эфиопия', // Ethiopia
  '耶加雪菲', // Yirgacheffe - 最著名的埃塞产区
  'Сидамо', // Sidamo
  '古吉', // Guji
  '哈拉尔', // Harrar
  '利姆', // Limu
  '金玛', // Jimma
  '科契尔', // Kochere - 耶加雪菲子产区
  '歌迪贝', // Gedeb - 耶加雪菲子产区
  'Вока', // Worka - 耶加雪菲子产区
  '罕贝拉', // Hambela - 古吉子产区
  '夏奇索', // Shakisso - 古吉子产区
  'Урага', // Uraga - 古吉子产区
  'Кения', // Kenya
  'Ньери', // Nyeri
  'Киамбу (Кения)', // Kiambu
  'Кириньяга', // Kirinyaga
  'Муранга', // Murang'a
  'Тика', // Thika
  'Эмбу', // Embu
  'Меру', // Meru
  'Руанда', // Rwanda
  'Бурунди', // Burundi
  'Танзания', // Tanzania
  'Уганда', // Uganda
  'Конго', // Congo (DRC)
  'Малави', // Malawi

  // ==========================================
  // 中南美洲 (Central & South America)
  // ==========================================
  'Бразилия', // Brazil
  'Серрадо', // Cerrado - 巴西高原产区
  'Сул-де-Минас', // Sul de Minas
  'Можиана', // Mogiana
  'Баия', // Bahia
  'Колумбия', // Colombia
  'Уила', // Huila - 哥伦比亚最著名产区
  'Нариньо', // Nariño
  'Каука', // Cauca
  'Толима', // Tolima
  'Антьокия', // Antioquia
  'Сантандер', // Santander
  'Гватемала', // Guatemala
  'Антигуа', // Antigua
  'Уэуэтенанго', // Huehuetenango
  'Акатенанго', // Acatenango
  'Кобан', // Cobán
  'Сан-Маркос', // San Marcos
  'Нуэво-Ориенте', // Nuevo Oriente
  'Атитлан', // Atitlán
  'Коста-Рика', // Costa Rica
  'Тарразу', // Tarrazú - 哥斯达黎加最著名产区
  'Центральная долина', // Central Valley
  'Западная долина', // West Valley
  'Трес-Риос', // Tres Ríos
  'Панама', // Panama
  'Бокете', // Boquete - BOP 主产区
  'Волкан', // Volcán
  'Гондурас', // Honduras
  'Сальвадор', // El Salvador
  'Никарагуа', // Nicaragua
  'Мексика', // Mexico
  'Чьяпас', // Chiapas - 墨西哥主要产区
  'Перу', // Peru
  'Боливия', // Bolivia
  'Эквадор', // Ecuador

  // ==========================================
  // 亚洲 (Asia)
  // ==========================================
  'Индонезия', // Indonesia
  'Суматра', // Sumatra
  'Ачех', // Aceh
  'Гайо', // Gayo - 亚齐高地
  'Линтонг', // Lintong
  'Манделинг', // Mandheling - 实为贸易名
  'Озеро Тоба', // Lake Toba
  'Сулавеси', // Sulawesi
  'Тораджа', // Toraja
  'Ява', // Java
  'Бали', // Bali
  'Кинтамани', // Kintamani
  'Флорес', // Flores
  'Юньнань', // Yunnan
  'Баошань', // Baoshan
  'Пуэр', // Pu'er
  'Линьцан', // Lincang
  'Дэхун', // Dehong
  'Сишуанбаньна', // Xishuangbanna
  'Мэнлянь', // Menglian
  'Вьетнам', // Vietnam
  'Индия', // India
  'Мьянма', // Myanmar
  'Таиланд', // Thailand
  'Лаос', // Laos
  'Папуа — Новая Гвинея', // Papua New Guinea

  // ==========================================
  // 中东/加勒比 (Middle East / Caribbean)
  // ==========================================
  'Йемен', // Yemen
  'Матари', // Mattari - 也门经典产区
  'Хараз', // Haraz
  'Исмаили', // Ismaili / Bani Ismaili
  'Санани', // San'ani
  'Ямайка', // Jamaica
  'Блю Маунтин', // Blue Mountain
  'Гавайи', // Hawaii
  'Кона', // Kona
  'Гаити', // Haiti
  'Доминикана', // Dominican Republic
];

// 庄园：咖啡农场、庄园、处理站
export const DEFAULT_ESTATES = [
  // ==========================================
  // 巴拿马 (Panama) - BOP 知名庄园
  // ==========================================
  'Эсмеральда', // Hacienda La Esmeralda - 瑰夏发源地，BOP 常年冠军
  'Элида', // Elida Estate - Lamastus 家族，BOP 常客
  'Хартманн', // Finca Hartmann - 家族老牌庄园
  'Янсон', // Janson Coffee - 家族庄园
  'Кармен', // Carmen Estate - BOP 获奖庄园
  'Don Pachi', // Don Pachi Estate - BOP 获奖
  'Finca Deborah', // Finca Deborah - Jamison Savage 创立
  'Finca Sophia', // Finca Sophia - 2100m+ 高海拔，BOP 2025 第3名
  'Altieri', // Altieri Estate - BOP 获奖
  'Ninety Plus', // Ninety Plus Panama - 精品品牌
  'Abu', // Abu Estate
  'Lerida', // Finca Lerida

  // ==========================================
  // 哥伦比亚 (Colombia)
  // ==========================================
  'Параисо', // Finca El Paraiso - Diego Bermudez，热冲击处理法创始
  'Пальма и Тукан', // La Palma y El Tucan (LPET) - Felipe Sardi
  'Inmaculada', // Finca Inmaculada
  'El Diviso', // Finca El Diviso - Los Nogales 关联
  'Los Nogales', // Finca Los Nogales - 发酵创新先驱
  'Monteblanco', // Finca Monteblanco - Rodrigo Sanchez
  'San Luis', // Finca San Luis

  // ==========================================
  // 危地马拉 (Guatemala)
  // ==========================================
  'Инхерто', // Finca El Injerto - 8次 COE 冠军
  'Santa Felisa', // Finca Santa Felisa
  'La Soledad', // Finca La Soledad
  'Bella Vista', // Bella Vista

  // ==========================================
  // 哥斯达黎加 (Costa Rica)
  // ==========================================
  'Ла Минита', // Hacienda La Minita - 塔拉珠传奇
  'Las Lajas', // Finca Las Lajas - 蜜处理先驱 Chacon 家族
  'Herbazú', // Herbazú
  'Don Mayo', // Don Mayo

  // ==========================================
  // 巴西 (Brazil)
  // ==========================================
  'Daterra', // Daterra - 巴西精品先驱，雨林认证
  'Santa Inês', // Fazenda Santa Inês
  'Fortaleza', // Fazenda Ambiental Fortaleza (FAF)
  'Passeio', // Fazenda Passeio
  'Samambaia', // Fazenda Samambaia

  // ==========================================
  // 埃塞俄比亚 (Ethiopia) - 处理站
  // ==========================================
  'Halo Beriti', // Halo Beriti - 耶加雪菲知名处理站
  'Worka Sakaro', // Worka Sakaro
  'Dumerso', // Dumerso
  'Aricha', // Aricha
  'Idido', // Idido - 耶加雪菲
  'Конга', // Konga
  'Buku', // Buku - 古吉
  'Shantawene', // Shantawene
  'Hambela Wamena', // Hambela Wamena

  // ==========================================
  // 肯尼亚 (Kenya) - 处理厂/合作社
  // ==========================================
  'Gakuyuini', // Gakuyuini - Thirikwa 合作社
  'Kii', // Kii Factory - Rungeto 合作社
  'Кароту', // Karogoto - 明星处理厂
  'Gatura', // Gatura
  'Othaya', // Othaya

  // ==========================================
  // 卢旺达/布隆迪 (Rwanda/Burundi)
  // ==========================================
  'Long Miles', // Long Miles Coffee Project - Burundi
  'Gitwe', // Gitwe - Long Miles 自有农场
  'Heza', // Heza 处理站
  'Buf', // Buf Café - Rwanda
  'Musasa', // Musasa - Rwanda
  'Huye Mountain', // Huye Mountain - Rwanda 南部

  // ==========================================
  // 萨尔瓦多 (El Salvador)
  // ==========================================
  'Santa Rosa', // Finca Santa Rosa - Pacamara 知名
  'San Jose', // Finca San Jose

  // ==========================================
  // 洪都拉斯 (Honduras)
  // ==========================================
  'Las Capucas', // Las Capucas 合作社

  // ==========================================
  // 牙买加 (Jamaica) - 蓝山
  // ==========================================
  'Clifton Mount', // Clifton Mount - 蓝山顶级
  'Wallenford', // Wallenford Estate
  'Mavis Bank', // Mavis Bank

  // ==========================================
  // 夏威夷 (Hawaii)
  // ==========================================
  'Greenwell', // Greenwell Farms - Kona 代表

  // ==========================================
  // 也门 (Yemen)
  // ==========================================
  'Qima', // Qima Coffee - 也门精品先驱，Yemenia 发现者

  // ==========================================
  // 云南 (Yunnan) - 省级精品庄园
  // ==========================================
  'Айни', // Aini - 首批云南精品庄园
  'Тяньюй', // Tianyu - 首批云南精品庄园
  'Лайчжукэ', // Laizhuke - 首批云南精品庄园
  'Синьчжай', // Xinzhai - 首批云南精品庄园
  'Маньяй', // Manya - 朱苦拉古树
  'Сяоаоцзы', // Xiaoaozi - 第二批云南精品庄园
  'Битон', // Bidun - 首批云南精品庄园
  'Цзоюань', // Zuoyuan
  'Гаошэн', // Gaosheng

  // ==========================================
  // 印尼 (Indonesia)
  // ==========================================
  'Wahana', // Wahana Estate - 苏门答腊北部
  'Frinsa', // Frinsa Estate - 西爪哇

  // ==========================================
  // 品牌/项目 (Brands/Projects)
  // ==========================================
  'Ninety Plus', // Ninety Plus - 精品咖啡品牌
  'Деревня Гейша', // Gesha Village - 埃塞俄比亚瑰夏原产地项目
];

// 处理法
export const DEFAULT_PROCESSES = [
  // ==========================================
  // 传统处理法 (Traditional Processing)
  // ==========================================
  'Натуральная', // Natural / Dry Process - 最古老的处理方式
  'Мытая', // Washed / Wet Process - 18世纪荷兰人发明
  'Хани', // Honey Process / Miel Process
  'Пальп-нэчурал', // Pulped Natural - 巴西常用
  'Полумытая', // Semi-washed
  'Влажная очистка (Giling Basah)', // Wet Hulling / Giling Basah - 印尼特有

  // ==========================================
  // 水洗法变体 (Washed Variations)
  // ==========================================
  'Кенийская мытая', // Kenya Double Wash - 72小时双重发酵
  'Двойная мытая', // Double Washed
  'Механическая мытая', // Mechanical Demucilage

  // ==========================================
  // 蜜处理细分 (Honey Process by Mucilage %)
  // ==========================================
  'Белый хани', // White Honey - 10-20% 果胶
  'Жёлтый хани', // Yellow Honey - 25-50% 果胶
  'Золотой хани', // Gold Honey - 20-25% 果胶，高海拔低温
  'Красный хани', // Red Honey - 50-75% 果胶
  'Чёрный хани', // Black Honey - 75-100% 果胶
  'Хани с маракуйей', // Passion Honey - 延长干燥至1个月
  'Хани «изюм»', // Raisin Honey

  // ==========================================
  // 日晒法变体 (Natural Variations)
  // ==========================================
  'Винная натуральная', // Winey Natural - 类似红酒发酵
  'Натуральная «изюм»', // Raisin Natural
  'Медленная натуральная', // Slow Dry Natural
  'Натуральная на африканских кроватях', // Raised Bed Natural
  'Полунатуральная', // Semi-Natural - 两段式干燥

  // ==========================================
  // 厌氧发酵系列 (Anaerobic Fermentation)
  // ==========================================
  'Анаэробная ферментация', // Anaerobic Fermentation - 密封无氧环境
  'Анаэробная натуральная', // Anaerobic Natural
  'Анаэробная мытая', // Anaerobic Washed
  'Анаэробный хани', // Anaerobic Honey
  'Двойная анаэробная', // Double Anaerobic
  'Длительная анаэробная', // Extended Anaerobic - 72小时以上
  'Холодная анаэробная', // Cold Anaerobic - 6-10°C 环境

  // ==========================================
  // 二氧化碳浸渍 (Carbonic Maceration)
  // ==========================================
  'Карбоническая мацерация', // Carbonic Maceration (CM) - 源自葡萄酒工艺
  'CM натуральная', // CM Natural
  'CM мытая', // CM Washed
  'CM хани', // CM Honey

  // ==========================================
  // 菌种接种发酵 (Inoculated Fermentation)
  // ==========================================
  'Молочнокислая ферментация', // Lactic Fermentation - 乳酸菌
  'Дрожжевая ферментация', // Yeast Inoculation - 特定酵母菌株
  'Уксуснокислая ферментация', // Acetic Fermentation
  'Ферментация с кодзи', // Koji Fermentation - 米曲霉 Aspergillus oryzae

  // ==========================================
  // 共同发酵/浸渍 (Co-Ferment & Infused)
  // ==========================================
  'Ко-ферментация', // Co-Fermentation - 添加水果/香料一同发酵
  'Фруктовая ферментация', // Fruit Fermentation
  'Ферментация с личи', // Lychee Ferment
  'Ферментация с клубникой', // Strawberry Ferment
  'Ферментация с маракуйей', // Passion Fruit Ferment
  'Ферментация с ананасом', // Pineapple Ferment
  'Ферментация с манго', // Mango Ferment
  'Ферментация с корицей', // Cinnamon Ferment
  'Мацерация', // Infused Process - 浸泡吸收风味

  // ==========================================
  // 桶陈/过桶处理 (Barrel Processing)
  // ==========================================
  'Ферментация в бочке', // Barrel Aged
  'Бочка из-под виски', // Whiskey Barrel
  'Бочка из-под рома', // Rum Barrel
  'Бочка из-под вина', // Wine Barrel
  'Бочка из-под бурбона', // Bourbon Barrel
  'Бочка из-под хереса', // Sherry Barrel

  // ==========================================
  // 温控处理 (Temperature Controlled)
  // ==========================================
  'Термошок', // Thermal Shock - Diego Bermudez 代表技术
  'Медленная холодная ферментация', // Cold/Slow Fermentation

  // ==========================================
  // Mossto 处理 (Mossto/Must Process)
  // ==========================================
  'Ферментация в мосто', // Mossto - 使用发酵液/果汁接种
  'Ферментация в соке', // Juice Fermentation

  // ==========================================
  // 实验性/特殊处理 (Experimental)
  // ==========================================
  'Алхимия', // Alchemy Process - Qima Coffee (也门)
  'Двойная ферментация', // Double Fermentation
  'Тройная ферментация', // Triple Fermentation
  'Длительная ферментация', // Extended Fermentation
];

// 品种：基于 World Coffee Research 官方目录
// 品种：基于 World Coffee Research 官方目录 (varieties.worldcoffeeresearch.org)
export const DEFAULT_VARIETIES = [
  // ==========================================
  // 原生品种 (Foundation Varieties)
  // 咖啡最重要的两大原生品种
  // ==========================================
  'Типика', // Typica - 最古老的阿拉比卡品种之一
  'Бурбон', // Bourbon - 与铁皮卡并列的重要原生品种

  // ==========================================
  // 波旁自然变异 (Bourbon Natural Mutations)
  // ==========================================
  'Красный бурбон', // Red Bourbon - 经典波旁，红色果实
  'Жёлтый бурбон', // Yellow Bourbon - 巴西常见，黄色果实
  'Розовый бурбон', // Pink Bourbon - 稀有变异
  'Оранжевый бурбон', // Orange Bourbon - 稀有变异
  'Бурбон Пойнту (Лорина)', // Bourbon Pointu / Laurina - 低咖啡因
  'Пакас', // Pacas - 萨尔瓦多发现的波旁矮化变异
  'Вилья Сарчи', // Villa Sarchi - 哥斯达黎加发现的波旁矮化变异
  'Текисик', // Tekisic - 萨尔瓦多改良波旁，高海拔品质出众
  'BM139', // Bourbon Mayaguez 139 - 卢旺达/布隆迪常见
  'BM71', // Bourbon Mayaguez 71 - 卢旺达/布隆迪常见

  // ==========================================
  // 铁皮卡自然变异 (Typica Natural Mutations)
  // ==========================================
  'Блю Маунтин', // Blue Mountain - 牙买加铁皮卡变异
  'Марагоджип', // Maragogipe - 巴西发现的大豆变异
  'Паче', // Pache - 危地马拉发现的矮化变异
  'Кона', // Kona - 夏威夷铁皮卡变异
  'Ява', // Java - 中美洲高品质，抗病性好
  'AB3', // AB3 Java - 爪哇高杯测品质

  // ==========================================
  // 波旁矮化变异 (Bourbon Dwarf/Compact)
  // ==========================================
  'Катурра', // Caturra - 波旁自然矮化变异，产量高
  'Катуаи', // Catuai - 蒙多诺沃×卡杜拉杂交

  // ==========================================
  // 自然杂交品种 (Natural Hybrids)
  // ==========================================
  'Мундо Ново', // Mundo Novo - 波旁×铁皮卡自然杂交
  'Пакамара', // Pacamara - 帕卡斯×象豆杂交，大豆高品质
  'Маракатурра', // Maracaturra - 象豆×卡杜拉杂交

  // ==========================================
  // 肯尼亚/东非品种 (Kenya/East Africa)
  // Scott Labs 选育系列
  // ==========================================
  'SL28', // SL28 - 肯尼亚经典，高品质抗旱
  'SL34', // SL34 - 肯尼亚经典，卓越杯测品质
  'SL14', // SL14 - 抗旱抗寒高杆品种
  'K7', // K7 - 肯尼亚/坦桑尼亚，抗CBD
  'Ruiru 11', // Ruiru 11 - 肯尼亚抗病矮化杂交
  'Батиан', // Batian - 肯尼亚高产抗病高杆品种

  // ==========================================
  // 卢旺达/布隆迪品种 (Rwanda/Burundi)
  // ==========================================
  'Джексон', // Jackson 2/1257 - 卢旺达/布隆迪常见
  'Мибиризи', // Mibirizi - 卢旺达抗旱高品质
  'Pop3303/21', // Pop3303/21 - 卢旺达抗病高产
  'RAB C15', // RAB C15 - 卢旺达新品种

  // ==========================================
  // 埃塞俄比亚品种 (Ethiopian Varieties)
  // JARC 选育系列及原生种
  // ==========================================
  'Эфиопские местные', // Ethiopian Heirloom / Landrace
  '74110', // JARC 74110 - 抗CBD选育
  '74112', // JARC 74112 - 抗CBD选育
  '74158', // JARC 74158 - 抗CBD选育
  '74148', // JARC 74148
  '74165', // JARC 74165
  '哈拉尔', // Harar - 也门/卢旺达变种

  // ==========================================
  // 瑰夏/艺伎 (Geisha/Gesha)
  // 源自埃塞俄比亚，巴拿马发扬光大
  // ==========================================
  'Гейша', // Geisha/Gesha - 埃塞原生，巴拿马闻名

  // ==========================================
  // 印度品种 (Indian Varieties)
  // ==========================================
  'Кент', // Kent - 印度早期抗锈品种
  'S795', // S795 (Selection 3) - 印度广泛种植
  'Sln.5B', // Sln.5B (S.2931) - 印度抗锈高产
  'Sln.6', // Sln.6 (S.2828) - 印度中高海拔适应
  'S4808', // S4808 - 印度育种系

  // ==========================================
  // Catimor 系列 (Catimor Group)
  // 卡杜拉×Timor Hybrid 杂交抗病系列
  // ==========================================
  'Катимор', // Catimor - 泛指此系列
  'Catimor 129', // Catimor 129 / Nyika - 马拉维/赞比亚
  'IHCAFE 90', // IHCAFE 90 - 洪都拉斯低海拔适应
  'Costa Rica 95', // Costa Rica 95 - 哥斯达黎加
  'Lempira', // Lempira - 洪都拉斯
  'T5175', // T5175 - 低海拔高肥力
  'T8667', // T8667 - 高产抗锈
  'Anacafe 14', // Anacafe 14 - 危地马拉高产
  'Catisic', // Catisic - 酸性土壤适应
  'Oro Azteca', // Oro Azteca - 墨西哥
  'Fronton', // Fronton - 波多黎各

  // ==========================================
  // Sarchimor 系列 (Sarchimor Group)
  // Villa Sarchi×Timor Hybrid 杂交抗病系列
  // ==========================================
  'IAPAR 59', // IAPAR 59 - 巴西中海拔
  'Marsellesa', // Marsellesa - 中海拔高酸度
  'Parainema', // Parainema - 洪都拉斯抗锈抗线虫
  'Cuscatleco', // Cuscatleco - 萨尔瓦多
  'T5296', // T5296 - 中海拔适应
  'Obata', // Obata Red - 巴西抗锈高产
  'Limani', // Limani - 波多黎各

  // ==========================================
  // F1 杂交品种 (F1 Hybrids)
  // 高产高品质一代杂交
  // ==========================================
  'Centroamericano', // Centroamericano (H1) - WCR高产高品质
  'H3', // H3 - 高海拔高品质
  'Milenio', // Milenio (H10) - 高产抗锈
  'Starmaya', // Starmaya - 高酸度
  'Evaluna', // Evaluna (EC18) - 高海拔高产
  'Mundo Maya', // Mundo Maya (EC16) - 农林复合适应
  'MundoMex', // EC15 / MundoMex - 高产高品质
  'Nayarita', // Nayarita (EC19) - 高海拔高品质
  'Эсперанса', // Esperanza (L4 A5) - 高产抗锈湿润环境

  // ==========================================
  // 哥伦比亚品种 (Colombian Varieties)
  // ==========================================
  'Кастильо', // Castillo - 哥伦比亚主要抗病品种
  'Колумбия', // Colombia - 哥伦比亚早期抗病品种
  'Cenicafe 1', // Cenicafe 1 - 哥伦比亚新品种

  // ==========================================
  // 巴西品种 (Brazilian Varieties)
  // ==========================================
  'Catigua MG2', // Catigua MG2 - 巴西精品适应性强
  'IPR 103', // IPR 103 - 抗热抗旱
  'IPR 107', // IPR 107 - 高海拔机采适应
  'Paraiso', // Paraiso - 巴西矮化高产

  // ==========================================
  // 中美洲新品种 (Central American New Varieties)
  // ==========================================
  'Casiopea', // Casiopea - 高海拔卓越品质

  // ==========================================
  // 其他地区品种 (Other Regional Varieties)
  // ==========================================
  'Caripe', // Caripe / Criollo - 委内瑞拉大豆高品质
  'Monte Claro', // Monte Claro / Ombligon - 委内瑞拉
  'Venecia', // Venecia - 多雨区适应
  'Nyasaland', // Nyasaland / Bugisu - 乌干达小农常用
  'KP423', // KP423 - 乌干达抗旱
  'BPL10', // BPL10 Java - 爪哇抗锈
  'Kartika 1', // Kartika 1 - 印尼农林适应

  // ==========================================
  // 罗布斯塔嫁接砧木 (Robusta Rootstock)
  // ==========================================
  'Nemaya', // Nemaya - 抗线虫砧木
];

// 检查是否在浏览器环境中
const isBrowser = typeof window !== 'undefined';

// 从本地存储获取自定义预设
export type CoffeeBeanPresetKey =
  | 'origins'
  | 'countries'
  | 'regions'
  | 'estates'
  | 'processingStations'
  | 'altitudes'
  | 'processes'
  | 'batches'
  | 'varieties'
  | 'roasters'
  | 'flavors'
  | 'roastLevels';

export type BlendPresetKey = Extract<
  CoffeeBeanPresetKey,
  | 'origins'
  | 'countries'
  | 'regions'
  | 'estates'
  | 'processingStations'
  | 'altitudes'
  | 'processes'
  | 'batches'
  | 'varieties'
>;

const normalizePresetValue = (value: string) => value.trim();

const getCustomPresets = (key: CoffeeBeanPresetKey): string[] => {
  if (!isBrowser) return []; // 服务器端渲染时返回空数组

  try {
    const stored = localStorage.getItem(`brew-guide:custom-presets:${key}`);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error(`获取自定义${key}失败:`, e);
    return [];
  }
};

// 保存自定义预设到本地存储
const saveCustomPresets = (
  key: CoffeeBeanPresetKey,
  presets: string[]
): void => {
  if (!isBrowser) return; // 服务器端渲染时不执行

  try {
    localStorage.setItem(
      `brew-guide:custom-presets:${key}`,
      JSON.stringify(presets)
    );
  } catch (e) {
    console.error(`保存自定义${key}失败:`, e);
  }
};

const getHiddenPresets = (key: CoffeeBeanPresetKey): string[] => {
  if (!isBrowser) return [];

  try {
    const stored = localStorage.getItem(`brew-guide:hidden-presets:${key}`);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error(`读取隐藏${key}失败:`, e);
    return [];
  }
};

const saveHiddenPresets = (
  key: CoffeeBeanPresetKey,
  presets: string[]
): void => {
  if (!isBrowser) return;

  try {
    localStorage.setItem(
      `brew-guide:hidden-presets:${key}`,
      JSON.stringify(presets)
    );
  } catch (e) {
    console.error(`保存隐藏${key}失败:`, e);
  }
};

const getDefaultPresets = (key: CoffeeBeanPresetKey): string[] => {
  switch (key) {
    case 'origins':
      return [...DEFAULT_ORIGINS];
    case 'estates':
      return [...DEFAULT_ESTATES];
    case 'processes':
      return [...DEFAULT_PROCESSES];
    case 'varieties':
      return [...DEFAULT_VARIETIES];
    case 'flavors':
      return [...FLAVOR_TAGS];
    case 'roastLevels':
      return [...ROAST_LEVELS];
    case 'roasters':
      return [];
    default:
      return [];
  }
};

const isDefaultPreset = (key: CoffeeBeanPresetKey, value: string): boolean => {
  const normalizedValue = normalizePresetValue(value);
  return getDefaultPresets(key).includes(normalizedValue);
};

const isPresetHidden = (key: CoffeeBeanPresetKey, value: string): boolean => {
  const normalizedValue = normalizePresetValue(value);
  return getHiddenPresets(key).includes(normalizedValue);
};

const unhidePreset = (key: CoffeeBeanPresetKey, value: string): void => {
  const normalizedValue = normalizePresetValue(value);
  if (!normalizedValue || !isBrowser) return;

  const hiddenPresets = getHiddenPresets(key);
  const nextHiddenPresets = hiddenPresets.filter(
    preset => preset !== normalizedValue
  );

  if (nextHiddenPresets.length !== hiddenPresets.length) {
    saveHiddenPresets(key, nextHiddenPresets);
  }
};

// 添加自定义预设
export const addCustomPreset = (
  key: CoffeeBeanPresetKey,
  value: string
): void => {
  const normalizedValue = normalizePresetValue(value);
  if (!isBrowser || !normalizedValue || isDefaultPreset(key, normalizedValue)) {
    return;
  }

  unhidePreset(key, normalizedValue);

  const presets = getCustomPresets(key);
  if (!presets.includes(normalizedValue)) {
    // 将新预设添加到数组开头，这样最新的预设会优先显示
    presets.unshift(normalizedValue);
    saveCustomPresets(key, presets);
  }
};

// 删除自定义预设
export const removeCustomPreset = (
  key: CoffeeBeanPresetKey,
  value: string
): void => {
  const normalizedValue = normalizePresetValue(value);
  if (!isBrowser || !normalizedValue || isDefaultPreset(key, normalizedValue)) {
    return;
  }

  const presets = getCustomPresets(key);
  const nextPresets = presets.filter(preset => preset !== normalizedValue);
  if (nextPresets.length !== presets.length) {
    saveCustomPresets(key, nextPresets);
  }

  const hiddenPresets = getHiddenPresets(key);
  if (!hiddenPresets.includes(normalizedValue)) {
    saveHiddenPresets(key, [...hiddenPresets, normalizedValue]);
  }
};

// 检查是否为自定义预设
export const isCustomPreset = (
  key: CoffeeBeanPresetKey,
  value: string
): boolean => {
  if (!isBrowser) return false;

  const normalizedValue = normalizePresetValue(value);
  return (
    Boolean(normalizedValue) &&
    !isDefaultPreset(key, normalizedValue) &&
    !isPresetHidden(key, normalizedValue)
  );
};

export const getVisiblePresetSuggestions = (
  key: CoffeeBeanPresetKey,
  values: string[]
): string[] => {
  return values.filter(value => {
    const normalizedValue = normalizePresetValue(value);
    return normalizedValue && !isPresetHidden(key, normalizedValue);
  });
};

// 获取完整预设列表（自定义+默认）
export const getFullPresets = (key: BlendPresetKey): string[] => {
  const defaultPresets = getDefaultPresets(key);
  // 将自定义预设放在前面，这样用户最近添加的内容会优先显示
  return getVisiblePresetSuggestions(key, [
    ...getCustomPresets(key),
    ...defaultPresets,
  ]);
};

// 预设风味标签
export const FLAVOR_TAGS = [
  // 水果类
  'Цитрусовые',
  'Бергамот',
  'Апельсин',
  'Лимон',
  'Лайм',
  'Грейпфрут',
  'Мандарин',
  'Кумкват',
  'Тропические фрукты',
  'Ананас',
  'Манго',
  'Маракуйя',
  'Папайя',
  'Личи',
  'Лонган',
  'Ягоды',
  'Черника',
  'Клубника',
  'Ежевика',
  'Малина',
  'Клюква',
  'Красная смородина',
  'Косточковые',
  'Персик',
  'Абрикос',
  'Слива',
  'Вишня',
  'Нектарин',
  'Медовый персик',
  'Яблоко',
  'Груша',
  'Азиатская груша',
  'Банан',
  'Арбуз',
  'Дыня',
  'Свежий финик',
  'Сухофрукты',
  'Изюм',
  'Инжир',
  'Кокос',
  'Дуриан',
  'Чернослив',
  'Гранат',

  // 花香类
  'Цветочные',
  'Жасмин',
  'Роза',
  'Фиалка',
  'Ромашка',
  'Флёрдоранж',
  'Гардения',
  'Жимолость',
  'Лаванда',
  'Орхидея',
  'Пион',
  'Османтус',
  'Гвоздика (цветок)',
  'Кедр',
  'Чёрный чай «Липтон»',

  // 甜味类
  'Карамель',
  'Мёд',
  'Тёмный сахар',
  'Коричневый сахар',
  'Кленовый сироп',
  'Ириска',
  'Тростниковый сахар',
  'Шоколад',
  'Молочный шоколад',
  'Тёмный шоколад',
  'Белый шоколад',
  'Какао-порошок',
  'Какао-бобы',
  'Сливки',
  'Сыр',
  'Сгущёнка',
  'Ваниль',
  'Кекс',
  'Печенье',
  'Пудинг',
  'Патока',
  'Маршмеллоу',
  'Солодовый сахар',
  'Вафля',
  'Пралине',
  'Кокосовая стружка',

  // 坚果类
  'Орехи',
  'Миндаль',
  'Фундук',
  'Грецкий орех',
  'Кешью',
  'Арахис',
  'Кедровый орех',
  'Фисташка',
  'Каштан',
  'Макадамия',
  'Бразильский орех',
  'Пекан',
  'Семечки',

  // 香料类
  'Корица',
  'Гвоздика (цветок)',
  'Кардамон',
  'Бадьян',
  'Фенхель',
  'Сычуаньский перец',
  'Перец',
  'Чёрный перец',
  'Белый перец',
  'Имбирь',
  'Мускатный орех',
  'Шафран',
  'Чили',
  'Карри',
  'Анис',
  'Пряная острота',

  // 草本类
  'Травяные',
  'Мята',
  'Базилик',
  'Кинза',
  'Розмарин',
  'Тимьян',
  'Шалфей',
  'Свежая трава',
  'Сено',
  'Сушёное сено',
  'Зелёный чай',
  'Мох',
  'Листья',
  'Луговые травы',
  'Незрелость',
  'Бобовые',
  'Свежескошенная трава',
  'Тёмная зелень',
  'Корнеплоды',
  'Пинто-бобы',
  'Зелёные ноты',
  'Оливковое масло',
  'Травы',

  // 谷物/烘焙类
  'Солод',
  'Тост',
  'Обжаренная пшеница',
  'Ячмень',
  'Овёс',
  'Жареный миндаль',
  'Жареный фундук',
  'Жареный арахис',
  'Обжарочные ноты',
  'Жареные орехи',
  'Попкорн',
  'Печенье',
  'Венская вафля',
  'Злаки',
  'Коричневые обжарочные ноты',
  'Дымные ноты',
  'Пепельность',
  'Горелость',
  'Жареный табак',
  'Сложный табак',

  // 酒类/发酵类
  'Красное вино',
  'Белое вино',
  'Виски',
  'Ром',
  'Рисовое вино',
  'Ферментированность',
  'Хмель',
  'Шампанское',
  'Портвейн',
  'Херес',
  'Бренди',
  'Водка',
  'Брожение',
  'Перезрелость',
  'Уксусная кислота',
  'Молочная кислота',
  'Лимонная кислота',
  'Яблочная кислота',

  // 茶类
  'Чёрный чай',
  'Эрл Грей',
  'Чайные ноты',
  'Зелёный чай',
  'Улун',
  'Пуэр',
  'Матча',
  'Жасминовый чай',
  'Хризантемовый чай',
  'Те Гуань Инь',
  'Цзинь Цзюнь Мэй',
  'Да Хун Пао',

  // 其他
  'Древесные',
  'Табак',
  'Кожа',
  'Сосна',
  'Ель',
  'Камфорное дерево',
  'Сандал',
  'Свежесть',
  'Сладкое послевкусие',
  'Яркость',
  'Насыщенность',
  'Сладость',
  'Освежающая кислотность',
  'Чистота',
  'Плотность',
  'Баланс',
  'Сложность',
  'Многослойность',
  'Шелковистость',
  'Округлость',
  'Гладкость',
  'Живость',
  'Сдержанность',
  'Элегантность',
  'Дикость',
  'Ароматность',
  'Мягкий аромат',
  'Деликатность',
  'Лёгкость',
  'Тяжесть',
  'Минеральность',
  'Морская соль',
  'Дым',
  'Карамелизация',
  'Резина',
  'Скунс',
  'Нефть',
  'Медицинские ноты',
  'Фенольность',
  'Мясные ноты',
  'Бульон',
  'Затхлая земля',
  'Затхлая пыль',
  'Сырость',
  'Древесный привкус',
  'Фильтровальная бумага',
  'Картон',
  'Окисленность',
  'Солёность',
  'Горечь',
  'Кислотность',
  'Умами',
  'Сладкий вкус',
  'Шершавость',
  'Песчанистость',
  'Пыльность',
  'Мелкая землистость',
  'Гладкое тело',
  'Бархатистость',
  'Шёлковость',
  'Сиропистость',
  'Маслянистость',
  'Металличность',
  'Сухость во рту',
];

// 风味分类
export const FLAVOR_CATEGORIES = {
  Фрукты: [
    'Цитрусовые',
    'Лимон',
    'Лайм (кислый)',
    'Лайм',
    'Яблоко',
    'Виноград',
    'Черника',
    'Клубника',
    'Вишня',
    'Персик',
    'Абрикос',
    'Ананас',
    'Тропические фрукты',
    'Красное вино',
    'Грейпфрут',
    'Апельсин',
    'Кокос',
    'Груша (сорт)',
    'Гранат',
    'Чернослив',
    'Изюм',
  ],
  Цветочные: ['Жасмин', 'Роза', 'Фиалка', 'Флёрдоранж', 'Лаванда', 'Ромашка', 'Чёрный чай «Липтон»'],
  Сладкие: [
    'Карамель',
    'Ириска',
    'Мёд',
    'Коричневый сахар',
    'Тёмный сахар',
    'Какао',
    'Шоколад',
    'Солодовый сахар',
    'Кленовый сироп',
    'Патока',
  ],
  Орехи: ['Миндаль', 'Фундук', 'Грецкий орех', 'Арахис', 'Кешью', 'Фисташка'],
  Пряности: [
    'Корица',
    'Гвоздика (цветок)',
    'Кардамон',
    'Перец',
    'Имбирь',
    'Мускатный орех',
    'Пряная острота',
    'Анис',
  ],
  'Злаки / обжарка': [
    'Тост',
    'Печенье',
    'Зерновые',
    'Хлопья',
    'Солод',
    'Жареный грецкий орех',
    'Злаки',
    'Коричневые обжарочные ноты',
    'Дымные ноты',
    'Пепельность',
    'Горелость',
  ],
  'Алкоголь / ферментация': [
    'Красное вино',
    'Виски',
    'Брожение',
    'Перезрелость',
    'Уксусная кислота',
    'Молочная кислота',
    'Лимонная кислота',
    'Яблочная кислота',
  ],
  Чай: ['Чёрный чай', 'Зелёный чай', 'Цветочный чай', 'Белый чай'],
  'Табак и дерево': ['Жареный табак', 'Сложный табак', 'Табак'],
  'Зелёные / овощные': [
    'Незрелость',
    'Бобовые',
    'Свежескошенная трава',
    'Тёмная зелень',
    'Корнеплоды',
    'Ноты сена',
    'Травы',
    'Пинто-бобы',
    'Зелёные ноты',
    'Оливковое масло',
  ],
  Текстура: [
    'Шершавость',
    'Песчанистость',
    'Пыльность',
    'Мелкая землистость',
    'Гладкое тело',
    'Бархатистость',
    'Шёлковость',
    'Сиропистость',
    'Маслянистость',
    'Металличность',
    'Сухость во рту',
  ],
  Другое: [
    'Минеральность',
    'Морская соль',
    'Дым',
    'Карамелизация',
    'Освежающе',
    'Насыщенность',
    'Кожа',
    'Резина',
    'Скунс',
    'Нефть',
    'Медицинские ноты',
    'Фенольность',
    'Мясные ноты',
    'Бульон',
    'Затхлая земля',
    'Затхлая пыль',
    'Сырость',
    'Древесный привкус',
    'Фильтровальная бумага',
    'Картон',
    'Окисленность',
    'Солёность',
    'Горечь',
    'Кислотность',
    'Умами',
    'Сладкий вкус',
  ],
};

// 动画配置
export const pageVariants = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
  },
  out: {
    opacity: 0,
  },
};

export const pageTransition = {
  duration: 0.2,
};
