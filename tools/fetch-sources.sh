#!/bin/sh
# Télécharge les sources brutes (Banque mondiale, Our World in Data) dans tools/cache/.
# Ensuite : node tools/build-countries.mjs  →  countries.js
set -e
cd "$(dirname "$0")"
mkdir -p cache
WB="https://api.worldbank.org/v2"
curl -sf -m 60 "$WB/country?format=json&per_page=400" -o cache/wb-countries.json
for ind in SP.POP.TOTL SP.DYN.CBRT.IN SP.DYN.LE00.MA.IN SP.DYN.LE00.FE.IN SP.DYN.IMRT.IN NY.GDP.PCAP.PP.CD SI.POV.GINI \
  SE.TER.ENRR VC.IHR.PSRC.P5 SP.DYN.TFRT.IN SP.M18.2024.FE.ZS SH.STA.MMRT SH.DYN.AIDS.ZS SH.PRV.SMOK SH.XPD.OOPC.CH.ZS \
  SL.AGR.EMPL.ZS SL.IND.EMPL.ZS SL.UEM.TOTL.ZS SP.URB.TOTL.IN.ZS IT.NET.USER.ZS FP.CPI.TOTL.ZG FR.INR.LEND FX.OWN.TOTL.ZS \
  GC.TAX.TOTL.GD.ZS CM.MKT.LCAP.GD.ZS SL.TLF.CACT.FE.ZS; do
  curl -sf -m 120 "$WB/country/all/indicator/$ind?format=json&per_page=20000&date=2010:2024" -o "cache/wb-$ind.json"
done
OWID="https://ourworldindata.org/grapher"
for s in happiness-cantril-ladder mean-years-of-schooling-long-run life-expectancy life-expectancy-at-birth-including-the-un-projections \
  number-of-births-per-year fertility-rate-with-projections child-mortality-around-the-world gdp-per-capita-maddison-project-database \
  population population-with-un-projections; do
  curl -sfL -m 120 -A "Mozilla/5.0" "$OWID/$s.csv?v=1&csvType=full&useColumnShortNames=true" -o "cache/owid-$s.csv"
done
ls -la cache
