import datasets

from src.constants import HF_DIR
from src.env import DATASETS

for level, dataset in enumerate(DATASETS):
    print(f"Level {level + 2}")
    dataset = datasets.load_from_disk(HF_DIR / dataset)
    dataset = datasets.concatenate_datasets(
        [
            dataset["train"],
            dataset["valid"],
            dataset["test"],
        ]
    )
    print(f"Number of games: {len(dataset)}")
    n_relations = [len(game["relations"]) for game in dataset]
    n_before = [
        len([rel for rel in game["relations"] if rel["relation"] == "<"])
        for game in dataset
    ]
    n_after = [
        len([rel for rel in game["relations"] if rel["relation"] == ">"])
        for game in dataset
    ]
    n_equal = [
        len([rel for rel in game["relations"] if rel["relation"] == "="])
        for game in dataset
    ]
    print(f"Number of relations: {sum(n_relations)}")
    print(f"Number of before relations: {sum(n_before)}")
    print(f"Number of after relations: {sum(n_after)}")
    print(f"Number of equal relations: {sum(n_equal)}")
    
    dataset = dataset.map(lambda x: {"n_tkns": len(x["text"].split())})
    print(f"Number of tokens: {sum(dataset['n_tkns'])}")
    print()
