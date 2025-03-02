#file to take internal migration data from regional and local authority files and put them together into a hierarchical json structure to make zooming possible maybe

import json
import csv

def merge_migration_data(json_file, csv_file, output_file):
    #load local authority data from JSON
    with open(json_file, "r", encoding="utf-8") as f:
        local_authorities = json.load(f)
    
    #load region data from CSV
    regions = {}
    with open(csv_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            region_name = row["Region Name"]
            region_code = row["Area Code"]
            net_migration = {year: row[year].replace(",", "") for year in row if year not in ["Area Code", "Region Name"]}
            
            #set format for json with region name, code, migration and local authorities which will each have their own data like the regions
            regions[region_name] = {
                "Region Code": region_code,
                "Net Migration": net_migration,
                "Local Authorities": []
            }
    
    #organise local authorities under their respective regions
    for la in local_authorities:
        #get la region
        region_name = la["Region"]
        #get net migrations for each year
        net_migration = {year: la[year] for year in la if year not in ["Area Code", "Region", "Area Name"]}
        
        la_entry = {
            "Area Code": la["Area Code"],
            "Area Name": la["Area Name"],
            "Net Migration": net_migration
        }
        
        #if region does exist then append local authority data
        if region_name in regions:
            regions[region_name]["Local Authorities"].append(la_entry)
    
    #write the hierarchical JSON output
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(regions, f, indent=4)

#call function with correct files, maybe change name of output to something nicer? idk
merge_migration_data("./data/internalUKMigrationTimeseries.json", "./data/regionMigrationUK(Sheet1).csv", "orderedRegionLAMigration.json")