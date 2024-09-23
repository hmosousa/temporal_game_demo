import re


def highlight_entities(text):
    pattern = r"<(\w+\d+)>(.*?)</\1>"
    return re.sub(pattern, r'<span class="entity \1">\2</span>', text)
