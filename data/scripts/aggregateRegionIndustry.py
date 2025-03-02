import pandas as pd

def aggregate_region_data(input_csv, output_csv):
    #read csv file
    df = pd.read_csv(input_csv, thousands=",", dtype=str)
    
    #define the SIC07 codes and descriptions to keep
    selected_sic07 = {
        "ABDE (1-9; 35-39)": "Agriculture, mining, electricity, gas, water and waste",
        "C (10-33)": "Manufacturing",
        "F (41-43)": "Construction",
        "G (45-47)": "Wholesale and retail trade; repair of motor vehicles",
        "H (49-53)": "Transportation and storage",
        "I (55-56)": "Accommodation and food service activities",
        "J (58-63)": "Information and communication",
        "K (64-66)": "Financial and insurance activities",
        "L (68)": "Real estate activities",
        "M (69-75)": "Professional, scientific and technical activities",
        "N (77-82)": "Administrative and support service activities",
        "O (84)": "Public administration and defence",
        "P (85)": "Education",
        "Q (86-88)": "Human health and social work activities",
        "R (90-93)": "Arts, entertainment and recreation",
        "S (94-96)": "Other service activities",
        "T (97-98)": "Activities of households"
    }
    
    #filter the required rows based on SIC07 column
    df_filtered = df[df['SIC07'].isin(selected_sic07.keys())]
    
    #select only the relevant columns (years and ITL1 region)
    year_columns = [col for col in df.columns if col.isdigit()]

    #convert year columns to numeric values
    for col in year_columns:
        df_filtered[col] = pd.to_numeric(df_filtered[col], errors="coerce")

    df_aggregated = df_filtered.groupby(["ITL1 region", "SIC07"])[year_columns].sum().reset_index()
    
    #add SIC07 description column
    df_aggregated["SIC07 desc"] = df_aggregated["SIC07"].map(selected_sic07)
    
    #reorder columns
    final_columns = ["ITL1 region", "SIC07", "SIC07 desc"] + year_columns
    df_aggregated = df_aggregated[final_columns]
    
    #save to CSV
    df_aggregated.to_csv(output_csv, index=False)
    
    print(f"Aggregated data saved to {output_csv}")

aggregate_region_data("./data/regionalGrossValueAddedInMillionsByIndustry.csv", "rgvAddedCondensed.csv")
