// Les vrais clubs des grands championnats : les 5 principaux pays (ou ligues) de chaque sport.
// Composition des championnats à la saison 2025-2026, clubs rangés à peu près du plus fort au plus faible
// (le niveau de chacun s'en déduit, entre top et low). rev : recettes moyennes d'un club, en millions de
// dollars de 2025 ; x : prix d'un club en années de recettes ; rel : relégués par saison (0 : ligue fermée) ;
// cont : compétition continentale (group : qui la joue ensemble, spots : places qualificatives).
// « Nom@XX » : un club d'un autre pays que la ligue (Toronto en NBA, Leinster en URC…).
const REAL_CONTS = {
  "foot-eu": "la coupe d’Europe des clubs champions", "basket-eu": "la coupe d’Europe de basket", "rugby-eu": "la coupe d’Europe de rugby",
  "hockey-eu": "la ligue des champions de hockey", "baseball-as": "la série d’Asie des champions", "cricket-t20": "la ligue des champions T20",
  "velo-tdf": "le Tour de France", "esport-w": "le championnat du monde",
};
const REAL_LEAGUES = [
  // Football
  { id: "pl", sport: "foot", code: "GB", name: "Premier League", where: "Angleterre", rev: 380, x: 4.5, top: 92, low: 78, rel: 3, cont: "foot-eu", spots: 4, from: 1888,
    clubs: "Liverpool|Arsenal|Manchester City|Chelsea|Newcastle United|Aston Villa|Nottingham Forest|Brighton & Hove Albion|Tottenham Hotspur|Bournemouth|Brentford|Fulham|Crystal Palace|Manchester United|Everton|West Ham United|Wolverhampton Wanderers|Leeds United|Burnley|Sunderland" },
  { id: "liga", sport: "foot", code: "ES", name: "LaLiga", where: "Espagne", rev: 220, x: 4, top: 92, low: 76, rel: 3, cont: "foot-eu", spots: 4, from: 1929,
    clubs: "Real Madrid|FC Barcelone|Atlético de Madrid|Athletic Bilbao|Villarreal|Real Betis|Celta de Vigo|Real Sociedad|Osasuna|Rayo Vallecano|Valence CF|Getafe|Espanyol|Séville FC|Girona|RCD Majorque|Deportivo Alavés|Levante|Elche|Real Oviedo" },
  { id: "seriea", sport: "foot", code: "IT", name: "Serie A", where: "Italie", rev: 180, x: 3.5, top: 89, low: 76, rel: 3, cont: "foot-eu", spots: 4, from: 1929,
    clubs: "Inter Milan|SSC Naples|Juventus|AC Milan|Atalanta|AS Rome|Lazio|Bologne|Fiorentina|Côme|Torino|Udinese|Genoa|Cagliari|Hellas Vérone|Parme|Lecce|Sassuolo|Pise|Cremonese" },
  { id: "bund", sport: "foot", code: "DE", name: "Bundesliga", where: "Allemagne", rev: 240, x: 3.5, top: 91, low: 76, rel: 2, cont: "foot-eu", spots: 4, from: 1963,
    clubs: "Bayern Munich|Bayer Leverkusen|Borussia Dortmund|Eintracht Francfort|RB Leipzig|VfB Stuttgart|SC Fribourg|Mayence 05|VfL Wolfsburg|Borussia Mönchengladbach|Werder Brême|TSG Hoffenheim|Union Berlin|FC Augsbourg|Heidenheim|FC St. Pauli|FC Cologne|Hambourg SV" },
  { id: "l1", sport: "foot", code: "FR", name: "Ligue 1", where: "France", rev: 140, x: 3, top: 90, low: 75, rel: 3, cont: "foot-eu", spots: 3, from: 1932,
    clubs: "Paris Saint-Germain|Olympique de Marseille|AS Monaco|LOSC Lille|OGC Nice|Olympique lyonnais|RC Strasbourg|RC Lens|Stade brestois|Stade rennais|Toulouse FC|AJ Auxerre|Angers SCO|FC Nantes|Le Havre AC|FC Lorient|Paris FC|FC Metz" },
  // Basket
  { id: "nba", sport: "basket", code: "US", name: "NBA", where: "États-Unis", rev: 370, x: 12, top: 90, low: 80, rel: 0, from: 1946,
    clubs: "Oklahoma City Thunder|Cleveland Cavaliers|Boston Celtics|Denver Nuggets|New York Knicks|Houston Rockets|Los Angeles Lakers|Indiana Pacers|Minnesota Timberwolves|Golden State Warriors|Los Angeles Clippers|Milwaukee Bucks|Memphis Grizzlies|Detroit Pistons|Orlando Magic|Atlanta Hawks|Sacramento Kings|Chicago Bulls|Dallas Mavericks|Miami Heat|Phoenix Suns|San Antonio Spurs|Portland Trail Blazers|Toronto Raptors@CA|Brooklyn Nets|Philadelphia 76ers|New Orleans Pelicans|Charlotte Hornets|Utah Jazz|Washington Wizards" },
  { id: "acb", sport: "basket", code: "ES", name: "Liga ACB", where: "Espagne", rev: 25, x: 3, top: 86, low: 74, rel: 2, cont: "basket-eu", spots: 3, from: 1957,
    clubs: "Real Madrid|FC Barcelone|Valencia Basket|Unicaja Málaga|Baskonia|La Laguna Tenerife|Joventut Badalona|Gran Canaria|UCAM Murcie|Manresa|Río Breogán|Bàsquet Girona|MoraBanc Andorra@AD|Basket Saragosse|Bilbao Basket|Leyma Coruña" },
  { id: "bsl", sport: "basket", code: "TR", name: "Basketbol Süper Ligi", where: "Turquie", rev: 22, x: 3, top: 86, low: 72, rel: 2, cont: "basket-eu", spots: 2, from: 1966,
    clubs: "Fenerbahçe|Anadolu Efes|Galatasaray|Beşiktaş|Türk Telekom|Karşıyaka|Bahçeşehir Koleji|Tofaş|Darüşşafaka|Büyükçekmece|Manisa Basket|Petkim Spor" },
  { id: "gbl", sport: "basket", code: "GR", name: "Basket League", where: "Grèce", rev: 20, x: 3, top: 87, low: 71, rel: 2, cont: "basket-eu", spots: 2, from: 1927,
    clubs: "Olympiakos|Panathinaïkos|AEK Athènes|PAOK|Aris Thessalonique|Peristeri|Promitheas Patras|Kolossos Rhodes|Maroussi|Karditsa" },
  { id: "lnb", sport: "basket", code: "FR", name: "LNB Élite", where: "France", rev: 12, x: 3, top: 85, low: 70, rel: 2, cont: "basket-eu", spots: 2, from: 1921,
    clubs: "AS Monaco@MC|Paris Basketball|ASVEL|JL Bourg|Cholet Basket|SIG Strasbourg|Nanterre 92|Le Mans Sarthe|Limoges CSP|Élan Chalon|BCM Gravelines-Dunkerque|Saint-Quentin|JDA Dijon|ESSM Le Portel" },
  // Rugby
  { id: "top14", sport: "rugby", code: "FR", name: "Top 14", where: "France", rev: 45, x: 3, top: 90, low: 76, rel: 1, cont: "rugby-eu", spots: 6, from: 1892,
    clubs: "Stade toulousain|Union Bordeaux-Bègles|RC Toulon|ASM Clermont|Aviron bayonnais|Castres olympique|Racing 92|Stade français|Stade rochelais|Section paloise|LOU Rugby|Montpellier HR|USA Perpignan|US Montauban" },
  { id: "prem", sport: "rugby", code: "GB", name: "Premiership", where: "Angleterre", rev: 30, x: 3, top: 87, low: 76, rel: 0, cont: "rugby-eu", spots: 5, from: 1987,
    clubs: "Bath|Leicester Tigers|Bristol Bears|Northampton Saints|Sale Sharks|Gloucester|Saracens|Exeter Chiefs|Harlequins|Newcastle Red Bulls" },
  { id: "urc", sport: "rugby", code: "IE", name: "United Rugby Championship", where: "Irlande, Galles, Écosse, Italie, Afrique du Sud", rev: 20, x: 3, top: 89, low: 72, rel: 0, cont: "rugby-eu", spots: 6, from: 2001,
    clubs: "Leinster|Munster|Glasgow Warriors@GB|Bulls@ZA|Stormers@ZA|Sharks@ZA|Ulster|Edinburgh@GB|Cardiff@GB|Connacht|Lions@ZA|Benetton@IT|Ospreys@GB|Scarlets@GB|Zebre@IT|Dragons@GB" },
  { id: "super", sport: "rugby", code: "NZ", name: "Super Rugby Pacific", where: "Nouvelle-Zélande, Australie, Fidji", rev: 18, x: 3, top: 90, low: 72, rel: 0, from: 1996,
    clubs: "Crusaders|Chiefs|Blues|Hurricanes|Brumbies@AU|Reds@AU|Highlanders|Waratahs@AU|Fijian Drua@FJ|Western Force@AU|Moana Pasifika" },
  { id: "jrlo", sport: "rugby", code: "JP", name: "Japan Rugby League One", where: "Japon", rev: 15, x: 2, top: 86, low: 72, rel: 1, from: 2003,
    clubs: "Brave Lupus Tokyo|Saitama Wild Knights|Kubota Spears|Kobelco Kobe Steelers|Toyota Verblitz|Tokyo Sungoliath|Yokohama Canon Eagles|Shizuoka Blue Revs|Black Rams Tokyo" },
  // Hockey sur glace
  { id: "nhl", sport: "hockey", code: "US", name: "NHL", where: "États-Unis et Canada", rev: 210, x: 6, top: 90, low: 80, rel: 0, from: 1917,
    clubs: "Florida Panthers|Edmonton Oilers@CA|Dallas Stars|Winnipeg Jets@CA|Washington Capitals|Vegas Golden Knights|Carolina Hurricanes|Toronto Maple Leafs@CA|Colorado Avalanche|Tampa Bay Lightning|Los Angeles Kings|Minnesota Wild|St. Louis Blues|Ottawa Senators@CA|New Jersey Devils|Canadiens de Montréal@CA|Calgary Flames@CA|Vancouver Canucks@CA|Columbus Blue Jackets|Detroit Red Wings|New York Rangers|Utah Mammoth|New York Islanders|Pittsburgh Penguins|Anaheim Ducks|Boston Bruins|Buffalo Sabres|Seattle Kraken|Philadelphia Flyers|Nashville Predators|Chicago Blackhawks|San Jose Sharks" },
  { id: "khl", sport: "hockey", code: "RU", name: "KHL", where: "Russie", rev: 40, x: 2, top: 85, low: 73, rel: 0, from: 2008,
    clubs: "Lokomotiv Iaroslavl|Traktor Tcheliabinsk|CSKA Moscou|SKA Saint-Pétersbourg|Metallurg Magnitogorsk|Ak Bars Kazan|Avangard Omsk|Dynamo Moscou|Salavat Ioulaïev Oufa|Spartak Moscou|Torpedo Nijni Novgorod|Severstal Tcherepovets|Avtomobilist Iekaterinbourg|Sibir Novossibirsk|Amour Khabarovsk|Barys Astana@KZ|Dinamo Minsk@BY" },
  { id: "shl", sport: "hockey", code: "SE", name: "SHL", where: "Suède", rev: 20, x: 3, top: 84, low: 73, rel: 1, cont: "hockey-eu", spots: 4, from: 1922,
    clubs: "Luleå HF|Färjestad BK|Skellefteå AIK|Frölunda HC|Växjö Lakers|Rögle BK|Brynäs IF|Djurgårdens IF|Linköping HC|Malmö Redhawks|Leksands IF|Örebro HK|HV71|Timrå IK" },
  { id: "liiga", sport: "hockey", code: "FI", name: "Liiga", where: "Finlande", rev: 12, x: 3, top: 82, low: 72, rel: 0, cont: "hockey-eu", spots: 4, from: 1928,
    clubs: "Tappara|Ilves|Pelicans|KalPa|Lukko|Kärpät|HIFK|TPS|SaiPa|KooKoo|JYP|HPK|Ässät|Jukurit|Sport|K-Espoo" },
  { id: "nl", sport: "hockey", code: "CH", name: "National League", where: "Suisse", rev: 25, x: 3, top: 84, low: 73, rel: 1, cont: "hockey-eu", spots: 4, from: 1909,
    clubs: "ZSC Lions|Lausanne HC|HC Davos|HC Fribourg-Gottéron|HC Lugano|EV Zoug|SC Berne|Genève-Servette HC|SC Rapperswil-Jona Lakers|EHC Bienne|HC Ambri-Piotta|SCL Tigers|EHC Kloten|HC Ajoie" },
  // Baseball
  { id: "mlb", sport: "baseball", code: "US", name: "MLB", where: "États-Unis", rev: 330, x: 8, top: 90, low: 79, rel: 0, from: 1903,
    clubs: "Los Angeles Dodgers|New York Yankees|Philadelphia Phillies|Toronto Blue Jays@CA|Milwaukee Brewers|Chicago Cubs|Detroit Tigers|Seattle Mariners|San Diego Padres|Boston Red Sox|New York Mets|Houston Astros|Cleveland Guardians|Atlanta Braves|Arizona Diamondbacks|Texas Rangers|Kansas City Royals|San Francisco Giants|Cincinnati Reds|Baltimore Orioles|Tampa Bay Rays|St. Louis Cardinals|Minnesota Twins|Athletics|Pittsburgh Pirates|Miami Marlins|Los Angeles Angels|Washington Nationals|Chicago White Sox|Colorado Rockies" },
  { id: "npb", sport: "baseball", code: "JP", name: "Nippon Professional Baseball", where: "Japon", rev: 90, x: 4, top: 86, low: 77, rel: 0, cont: "baseball-as", spots: 1, from: 1950,
    clubs: "Fukuoka SoftBank Hawks|Hanshin Tigers|Yomiuri Giants|Hokkaido Nippon-Ham Fighters|Yokohama DeNA BayStars|Orix Buffaloes|Hiroshima Carp|Tohoku Rakuten Golden Eagles|Chiba Lotte Marines|Chunichi Dragons|Saitama Seibu Lions|Tokyo Yakult Swallows" },
  { id: "kbo", sport: "baseball", code: "KR", name: "KBO League", where: "Corée du Sud", rev: 40, x: 3, top: 82, low: 74, rel: 0, cont: "baseball-as", spots: 1, from: 1982,
    clubs: "LG Twins|Kia Tigers|Samsung Lions|Hanwha Eagles|SSG Landers|Doosan Bears|KT Wiz|Lotte Giants|NC Dinos|Kiwoom Heroes" },
  { id: "cpbl", sport: "baseball", code: "TW", name: "CPBL", where: "Taïwan", rev: 15, x: 3, top: 78, low: 72, rel: 0, cont: "baseball-as", spots: 1, from: 1990,
    clubs: "CTBC Brothers|Uni-President Lions|Rakuten Monkeys|Fubon Guardians|Wei Chuan Dragons|TSG Hawks" },
  { id: "lmb", sport: "baseball", code: "MX", name: "Liga Mexicana de Béisbol", where: "Mexique", rev: 10, x: 3, top: 79, low: 70, rel: 0, from: 1925,
    clubs: "Diablos Rojos del México|Sultanes de Monterrey|Tecolotes de los Dos Laredos|Toros de Tijuana|Algodoneros de Unión Laguna|Acereros de Monclova|Pericos de Puebla|Leones de Yucatán|Guerreros de Oaxaca|Olmecas de Tabasco|Saraperos de Saltillo|Rieleros de Aguascalientes" },
  // Cricket
  { id: "ipl", sport: "cricket", code: "IN", name: "Indian Premier League", where: "Inde", rev: 60, x: 15, top: 88, low: 82, rel: 0, cont: "cricket-t20", spots: 3, from: 2008,
    clubs: "Royal Challengers Bengaluru|Punjab Kings|Mumbai Indians|Gujarat Titans|Delhi Capitals|Kolkata Knight Riders|Sunrisers Hyderabad|Lucknow Super Giants|Rajasthan Royals|Chennai Super Kings" },
  { id: "bbl", sport: "cricket", code: "AU", name: "Big Bash League", where: "Australie", rev: 8, x: 3, top: 82, low: 75, rel: 0, cont: "cricket-t20", spots: 2, from: 2011,
    clubs: "Hobart Hurricanes|Sydney Sixers|Melbourne Stars|Perth Scorchers|Sydney Thunder|Brisbane Heat|Adelaide Strikers|Melbourne Renegades" },
  { id: "county", sport: "cricket", code: "GB", name: "County Championship", where: "Angleterre", rev: 8, x: 2, top: 82, low: 74, rel: 2, cont: "cricket-t20", spots: 1, from: 1890,
    clubs: "Surrey|Somerset|Essex|Hampshire|Nottinghamshire|Warwickshire|Durham|Sussex|Yorkshire|Worcestershire" },
  { id: "psl", sport: "cricket", code: "PK", name: "Pakistan Super League", where: "Pakistan", rev: 7, x: 5, top: 82, low: 76, rel: 0, from: 2016,
    clubs: "Lahore Qalandars|Islamabad United|Quetta Gladiators|Karachi Kings|Peshawar Zalmi|Multan Sultans" },
  { id: "sa20", sport: "cricket", code: "ZA", name: "SA20", where: "Afrique du Sud", rev: 8, x: 6, top: 83, low: 77, rel: 0, from: 2023,
    clubs: "MI Cape Town|Sunrisers Eastern Cape|Paarl Royals|Joburg Super Kings|Durban’s Super Giants|Pretoria Capitals" },
  // Cyclisme : les équipes du circuit mondial, de toutes nationalités
  { id: "wt", sport: "velo", code: "FR", name: "WorldTour", of: "du WorldTour", where: "circuit mondial, toutes nationalités", rev: 25, x: 2, top: 92, low: 76, rel: 2, cont: "velo-tdf", spots: 99, from: 2005, world: true,
    clubs: "UAE Team Emirates XRG@AE|Visma-Lease a Bike@NL|Lidl-Trek@US|Red Bull-Bora-Hansgrohe@DE|Soudal Quick-Step@BE|INEOS Grenadiers@GB|Alpecin-Deceuninck@BE|EF Education-EasyPost@US|Decathlon AG2R La Mondiale@FR|Groupama-FDJ@FR|Bahrain Victorious@BH|Movistar Team@ES|Jayco AlUla@AU|XDS Astana@KZ|Intermarché-Wanty@BE|Lotto@BE|Cofidis@FR|Picnic PostNL@NL" },
  // E-sport (League of Legends)
  { id: "lck", sport: "esport", code: "KR", name: "LCK", where: "Corée du Sud", rev: 15, x: 3, top: 92, low: 76, rel: 0, cont: "esport-w", spots: 4, from: 2012,
    clubs: "Gen.G|Hanwha Life Esports|T1|Dplus KIA|KT Rolster|BNK FearX|Nongshim RedForce|DRX|OKSavingsBank BRION|DN Freecs" },
  { id: "lpl", sport: "esport", code: "CN", name: "LPL", where: "Chine", rev: 20, x: 3, top: 90, low: 74, rel: 0, cont: "esport-w", spots: 4, from: 2013,
    clubs: "Bilibili Gaming|Anyone’s Legend|Top Esports|JD Gaming|Invictus Gaming|Weibo Gaming|Ninjas in Pyjamas|LNG Esports|EDward Gaming|FunPlus Phoenix|Team WE|Oh My God" },
  { id: "lec", sport: "esport", code: "DE", name: "LEC", where: "Europe", rev: 15, x: 3, top: 86, low: 74, rel: 0, cont: "esport-w", spots: 3, from: 2013, world: true,
    clubs: "G2 Esports@DE|Movistar KOI@ES|Karmine Corp@FR|Fnatic@GB|Team Vitality@FR|GIANTX@ES|Team Heretics@ES|SK Gaming@DE|Natus Vincere@UA|Team BDS@CH" },
  { id: "lta", sport: "esport", code: "US", name: "LTA Nord", where: "Amérique du Nord", rev: 12, x: 3, top: 84, low: 72, rel: 0, cont: "esport-w", spots: 2, from: 2013,
    clubs: "FlyQuest|Cloud9|Team Liquid|100 Thieves|Shopify Rebellion|Dignitas|Disguised|LYON" },
  { id: "cblol", sport: "esport", code: "BR", name: "CBLOL", where: "Brésil", rev: 4, x: 3, top: 80, low: 70, rel: 0, cont: "esport-w", spots: 1, from: 2013,
    clubs: "paiN Gaming|LOUD|FURIA|RED Canids|Vivo Keyd Stars|Fluxo W7M|Leviatán|Los Grandes" },
].map(l => {
  const list = l.clubs.split("|"), n = list.length;
  return { ...l, clubs: list.map((s, i) => { const [name, cc] = s.split("@"); return { name, code: cc || l.code, r: Math.round(l.top - (l.top - l.low) * i / Math.max(1, n - 1)) }; }) };
});
const REAL_LEAGUE_BY_ID = Object.fromEntries(REAL_LEAGUES.map(l => [l.id, l]));
const leagueAvg = lg => lg.clubs.reduce((s, c) => s + c.r, 0) / lg.clubs.length;
// La ligue d'élite d'un sport dans un pays (s'il en a une parmi les grandes).
const realLeagueFor = (sport, code, y) => REAL_LEAGUES.find(l => l.sport === sport && !l.world && l.code === code && y >= l.from) || null;
