# population:
#   https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/estimatesofthepopulationforenglandandwales
#   UK population estimates 1838 to 2022 edition
# internal migration:
#   https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/internalmigrationinenglandandwales
#   Moves by local authorities and regions by age and sex including origin and destination moves, year ending 2022 (2021 and 2023 local authority boundaries) edition
#   Moves by local authorities and regions by age and sex including origin and destination moves, years ending June 2012 to June 2021 time series edition
# NOTE: excludes Scotland and NI

import pandas as pd

def get_sheet_name_migration(year: int) -> str:
    return "IM{:0>4d}-T4a".format(year)

def get_column_name_population(year: int) -> str:
    return "Mid-{:0>4d}".format(year)

sheet_name_population = "Table 9"
column_name_migration = "All moves"

print("getting files")

migration_only2022 = pd.ExcelFile("../raw/2022tablesforpublicationon20212023las.xlsx")
migration_longterm = pd.ExcelFile("../raw/internalmigrationbackseries2012to2021.xlsx")

population_file = pd.ExcelFile("../raw/ukpopulationestimates18382022.xlsx")

population = population_file.parse(
    sheet_name_population,
    header=3,
    index_col=0,
    usecols="A,C:M",
    nrows=92,
)

population.loc["All ages"] = population.loc["All Ages"]
population = population.drop(index="All Ages")

likelihood = {
    "count": list(),
    "prob": list(),
}

for year in range(2012, 2023):
    migration_file = migration_only2022 if year == 2022 else migration_longterm

    migration = migration_file.parse(
        get_sheet_name_migration(year),
        header=3,
        index_col=0,
        usecols="A:B",
    )

    migration_90_plus = migration.loc[range(90, 105)].sum() + migration.loc["105+"]
    migration = migration.drop(index=range(90, 105)).drop(index="105+")
    migration.loc["90+"] = migration_90_plus

    

    l = migration[column_name_migration] / population[get_column_name_population(year)]
    ages_prob = list()
    ages_count = list()
    

    for (index, value) in l.items():
        ages_prob.append({
            "age": index,
            "value": value
        })

    for (index, value) in migration[column_name_migration].items():
        ages_count.append({
            "age": index,
            "value": value
        })

    ages_count.append(ages_count.pop(0))
    ages_count.append(ages_count.pop(0))

    likelihood["prob"].append({
        "year": year,
        "ages": ages_prob,
    })

    likelihood["count"].append({
        "year": year,
        "ages": ages_count,
    })
    
import json
out_file = "../likelihood_of_moving_by_age.json"
with open(out_file, "w") as f:
    json.dump(likelihood, f)
