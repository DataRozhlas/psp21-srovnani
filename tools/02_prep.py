# %%
import pandas as pd
import json
# %%
d17 = pd.read_csv(
    './data/data17.csv').fillna(0).set_index('cisob').to_dict(orient='index')
d21 = pd.read_csv(
    './data/data21.csv').fillna(0).set_index('cisob').to_dict(orient='index')
# %%

# %%
out = {}
for ob in d21:
    tmp = {}
    if ob not in d17:
        print(ob)
        continue
    # ANO
    out[ob] = {  # abs, pct
        'ksc': [
            d17[ob]['KSČM'] - d21[ob]['KSČM'],
            round((d17[ob]['KSČM'] / d17[ob]['ucast']) - \
                  (d21[ob]['KSČM'] / d21[ob]['ucast']), 4),
        ],
        'spd': [
            d17[ob]['SPD'] - d21[ob]['SPD'],
            round((d17[ob]['SPD'] / d17[ob]['ucast']) - \
                  (d21[ob]['SPD'] / d21[ob]['ucast']), 4),
        ],
        'cssd': [
            d17[ob]['ČSSD'] - d21[ob]['ČSSD'],
            round((d17[ob]['ČSSD'] / d17[ob]['ucast']) - \
                  (d21[ob]['ČSSD'] / d21[ob]['ucast']), 4),
        ],
        'ano': [
            d17[ob]['ANO'] - d21[ob]['ANO'],
            round((d17[ob]['ANO'] / d17[ob]['ucast']) - \
                  (d21[ob]['ANO'] / d21[ob]['ucast']), 4),
        ],
        'pirstan': [
            (d17[ob]['Piráti'] + d17[ob]['STAN']) - \
            (d21[ob]['Piráti+STAN']),
            round(((d17[ob]['Piráti'] + d17[ob]['STAN']) / d17[ob]['ucast']) - \
                  ((d21[ob]['Piráti+STAN']) / d21[ob]['ucast']), 4),
        ],
        'spolu': [
            (d17[ob]['TOP 09'] + d17[ob]['ODS'] + d17[ob]['KDU-ČSL']) - \
            (d21[ob]['SPOLU']),
            round(((d17[ob]['TOP 09'] + d17[ob]['ODS'] + d17[ob]['KDU-ČSL']) / d17[ob]['ucast']) - \
                  ((d21[ob]['SPOLU']) / d21[ob]['ucast']), 4),
        ],
        'ucast': [
            d17[ob]['ucast'] - d21[ob]['ucast'],
            round((d17[ob]['ucast'] / d17[ob]['zapsani']) - \
                  (d21[ob]['ucast'] / d21[ob]['zapsani']), 4)
        ],
    }

# %%¨
len(out)
# %%
xi = pd.DataFrame.from_dict(out, orient='index').applymap(
    lambda x: x[1]).ucast.to_dict()
# %%
with open('../js/data.js', 'w', encoding='utf-8') as f:
    f.write('export const data = ' + json.dumps(out, ensure_ascii=False) + ';')
# %%
xi
# %%
