import re
from ast import literal_eval

import nltk
import pandas as pd
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize

import tagtypes
from exceptions import exceptions

nltk.download('punkt')
nltk.download('wordnet')
nltk.download('stopwords')
nltk.download('averaged_perceptron_tagger')

pd.set_option('display.max_rows', 500)
pd.set_option('display.max_columns', 500)
pd.set_option('display.max_colwidth', 300)
pd.set_option('display.width', 1000)


def read_csv(file):
    return pd.read_csv(file)


def tokenize_ingredients(text):
    stop_words = set(stopwords.words('english'))
    text = literal_eval(text)
    res = []
    for text_item in text:
        text_tokens = word_tokenize(text_item)
        res.append(" ".join([w for w in text_tokens if w not in stop_words]))
    return res


def get_nouns(text):
    text = literal_eval(text)
    res = []
    for text_item in text:
        text_tokens = nltk.word_tokenize(text_item)
        tags = nltk.pos_tag(text_tokens)
        only_nouns = [w for (w, pos) in tags if (pos[0] == 'N' or w in exceptions)]
        if only_nouns:
            res.append(" ".join(only_nouns))
    return res


def lemmatize(text):
    lemmatizer = WordNetLemmatizer()
    text = literal_eval(text)
    res = []
    for text_item in text:
        text_tokens = nltk.word_tokenize(text_item)
        res.append(" ".join([lemmatizer.lemmatize(w) for w in text_tokens]))
    return res


def cuisine(text):
    text = literal_eval(text)
    cuisines = []
    cooking_time = []
    courses = []
    times = []
    for text_item in text:
        if text_item in tagtypes.cuisines:
            cuisines.append(text_item)
        if text_item in tagtypes.cooking_time:
            cooking_time.append(text_item)
        if text_item in tagtypes.course:
            courses.append(text_item)
        if text_item in tagtypes.times:
            times.append(text_item)
    return pd.Series([cuisines, cooking_time, courses, times], index=['cuisine', 'cooking time', 'courses', 'times'])


def name_to_link(text):
    return re.sub(r'\s+', r'-', str(text[0])) + f'-{text[1]}'


def main():
    df = read_csv("recipes_tokenized_lemma.csv")
    df = pd.concat([df[['id', 'name', 'ingredients']], df["tags"].apply(cuisine)], axis=1)
    df['name'] = df[['name', 'id']].apply(name_to_link, axis=1)
    df[['id', 'name', 'ingredients', 'cuisine', 'cooking time', 'courses', 'times']].to_csv("recipes_parsed.csv", index=False)
    print(read_csv("recipes_parsed.csv"))


if __name__ == '__main__':
    main()
