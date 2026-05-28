"""Intentionally poor code for refactoring task."""

data = []


def add(x):
    global data
    if x != None:
        data.append(x)
    return data


def calc():
    s = 0
    for i in data:
        if "price" in i and "qty" in i:
            s = s + i["price"] * i["qty"]
    return s


def find(n):
    for i in data:
        if i["name"] == n:
            return i
    return None

