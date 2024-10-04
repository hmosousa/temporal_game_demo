import json

import datasets   

DATASET_NAME = "hugosousa/SmallTimelines"
SPLIT = "train"
SUBSET = "one"

dataset = datasets.load_dataset(DATASET_NAME, SUBSET, split=SPLIT)

print(dataset)  

with open("sample_data.json", "w") as f:
    json.dump(dataset[0], f, indent=2)
