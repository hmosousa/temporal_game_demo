import re


def highlight_entities(text):
    pattern = r"<(\w+\d+)>(.*?)</\1>"
    return re.sub(pattern, r'<span class="entity \1">\2</span>', text)


def build_entities_dict(text):
    pattern = r"<(\w+\d+)>(.*?)</\1>"
    groups = re.findall(pattern, text)
    eid2name = {eid: name for eid, name in groups}
    return eid2name
