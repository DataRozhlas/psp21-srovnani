# coding: utf-8
# %%
import requests
import xml.etree.ElementTree as ET
import pandas as pd

okresy = {
    'CZ0100': 'Praha',
    'CZ0201': 'Benešov',
    'CZ0202': 'Beroun',
    'CZ0203': 'Kladno',
    'CZ0204': 'Kolín',
    'CZ0205': 'Kutná Hora',
    'CZ0206': 'Mělník',
    'CZ0207': 'Mladá Boleslav',
    'CZ0208': 'Nymburk',
    'CZ0209': 'Praha-východ',
    'CZ020A': 'Praha-západ',
    'CZ020B': 'Příbram',
    'CZ020C': 'Rakovník',
    'CZ0311': 'České Budějovice',
    'CZ0312': 'Český Krumlov',
    'CZ0313': 'Jindřichův Hradec',
    'CZ0314': 'Písek',
    'CZ0315': 'Prachatice',
    'CZ0316': 'Strakonice',
    'CZ0317': 'Tábor',
    'CZ0321': 'Domažlice',
    'CZ0322': 'Klatovy',
    'CZ0323': 'Plzeň-město',
    'CZ0324': 'Plzeň-jih',
    'CZ0325': 'Plzeň-sever',
    'CZ0326': 'Rokycany',
    'CZ0327': 'Tachov',
    'CZ0411': 'Cheb',
    'CZ0412': 'Karlovy Vary',
    'CZ0413': 'Sokolov',
    'CZ0421': 'Děčín',
    'CZ0422': 'Chomutov',
    'CZ0423': 'Litoměřice',
    'CZ0424': 'Louny',
    'CZ0425': 'Most',
    'CZ0426': 'Teplice',
    'CZ0427': 'Ústí nad Labem',
    'CZ0511': 'Česká Lípa',
    'CZ0512': 'Jablonec nad Nisou',
    'CZ0513': 'Liberec',
    'CZ0514': 'Semily',
    'CZ0521': 'Hradec Králové',
    'CZ0522': 'Jičín',
    'CZ0523': 'Náchod',
    'CZ0524': 'Rychnov nad Kněžnou',
    'CZ0525': 'Trutnov',
    'CZ0531': 'Chrudim',
    'CZ0532': 'Pardubice',
    'CZ0533': 'Svitavy',
    'CZ0534': 'Ústí nad Orlicí',
    'CZ0631': 'Havlíčkův Brod',
    'CZ0632': 'Jihlava',
    'CZ0633': 'Pelhřimov',
    'CZ0634': 'Třebíč',
    'CZ0635': 'Žďár nad Sázavou',
    'CZ0641': 'Blansko',
    'CZ0642': 'Brno-město',
    'CZ0643': 'Brno-venkov',
    'CZ0644': 'Břeclav',
    'CZ0645': 'Hodonín',
    'CZ0646': 'Vyškov',
    'CZ0647': 'Znojmo',
    'CZ0711': 'Jeseník',
    'CZ0712': 'Olomouc',
    'CZ0713': 'Prostějov',
    'CZ0714': 'Přerov',
    'CZ0715': 'Šumperk',
    'CZ0721': 'Kroměříž',
    'CZ0722': 'Uherské Hradiště',
    'CZ0723': 'Vsetín',
    'CZ0724': 'Zlín',
    'CZ0801': 'Bruntál',
    'CZ0802': 'Frýdek-Místek',
    'CZ0803': 'Karviná',
    'CZ0804': 'Nový Jičín',
    'CZ0805': 'Opava',
    'CZ0806': 'Ostrava-město',
    'CZZZZZ': 'Zahraničí'
}

ns = '{http://www.volby.cz/ps/}'

# %%
zkratky = pd.read_csv('./data/psrkl17.csv', encoding='windows-1250',
                      sep=';').set_index('KSTRANA').ZKRATKAK8.to_dict()
# %%

out = []
for okres in okresy:

    r = requests.get(
        #'http://90.183.210.4/pls/psmedia/vysledky_okres?nuts=' + okres
        'https://volby.cz/pls/ps2017nss/vysledky_okres?nuts=' + okres
        #'https://volby.cz/pls/ps2021/vysledky_okres?nuts=' + okres
    )
    root = ET.fromstring(r.text)
    for obec in root.findall(ns + 'OBEC'):
        tmp = {
            'cisob': obec.get('CIS_OBEC'),
            'ucast': int(obec.find(ns + 'UCAST').get('PLATNE_HLASY')),
            'zapsani': int(obec.find(ns + 'UCAST').get('ZAPSANI_VOLICI'))
        }
        for party in obec.findall(ns + 'HLASY_STRANA'):
            zkr = zkratky[int(party.get('KSTRANA'))]
            tmp[zkr] = int(party.get('HLASY'))

        out.append(tmp)

# %%
pd.DataFrame.from_dict(out).to_csv(
    './data/data17.csv', index=False, encoding='utf-8')
# %%
# %%
