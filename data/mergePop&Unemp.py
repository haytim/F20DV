import pandas as pd

# Load datasets
population_df = pd.read_csv("populationByRegion.csv")
unemployment_df = pd.read_csv("unemploymentRate.csv")

# Merge on 'Region'
merged_df = pd.merge(population_df, unemployment_df, on="Region", suffixes=("_population", "_unemployment"))

# Save to CSV
merged_df.to_csv("populationUnemployment.csv", index=False)

print("Merged data saved as merged_data.csv")