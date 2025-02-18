# get internal migration matrices for english regions, wales,
# scotland, and northern ireland (2012-2022)
# dataset: https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/internalmigrationinenglandandwales
# files: Moves by local authorities and regions by age and sex including origin and destination moves, year ending 2022 (2021 and 2023 local authority boundaries) edition of this dataset
#        Moves by local authorities and regions by age and sex including origin and destination moves, years ending June 2012 to June 2021 time series edition of this dataset

import pandas as pd
import json


def assert_square(df: pd.DataFrame) -> bool:
    rows, cols = df.shape
    return rows == cols


def make_object(df: pd.DataFrame, year: int) -> dict:
    regions = df.columns.values.tolist()
    matrix = df.to_numpy().tolist()
    return {"year": year, "regions": regions, "matrix": matrix}


def matrix_sheet_name(year: int) -> str:
    # workaround for error in dataset file
    extra = ""
    if year == 2019:
        extra = "I"

    return "IM{}{:0>4d}-T6".format(extra, year)

print("getting files")

data_only2022 = pd.ExcelFile("../raw/2022tablesforpublicationon20212023las.xlsx")
data_longterm = pd.ExcelFile("../raw/internalmigrationbackseries2012to2021.xlsx")

output_file = "../internal_migration_matrices.json"

data_out = list()

for year in range(2012, 2023):
    data_src = data_longterm
    if year == 2022:
        data_src = data_only2022

    matrix_sheet = matrix_sheet_name(year)
    data = data_src.parse(
        matrix_sheet, header=5, index_col=0, usecols="B:N", skipfooter=1
    )
    if not assert_square(data):
        print("not square:", year)
        continue

    # make dashes 0
    data[data == "-"] = 0
    data_object = make_object(data, year)

    data_out.append(data_object)
    print("processed:", year)

with open(output_file, "w") as f:
    json.dump(data_out, f)

print("written to:", output_file)
