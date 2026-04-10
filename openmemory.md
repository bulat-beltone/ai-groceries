# ai-groceries

## Overview

Статическое SPA в `index.html`, данные в `localStorage` (`gr7`: позиции, история, счётчики, **категории**, флаги перевода).

Полная спецификация поведения: **`MINI_TOOL_SPEC.md`**.

## Architecture

- Категории: кнопка **«Категории»** в шапке открывает модальное окно; список хранится в `gr7.cats`, при отсутствии — копия `DEFAULT_CATS` из `index.html`.
- Классификация: `POST /api/classify` (локально) или Worker; в теле передаётся актуальный список `{ id, name }` из сохранённых категорий.
- Перевод названий: `POST /api/translate` (`lib/handle-translate-request.js`), тот же `OPENAI_API_KEY` / Worker.

## User Defined Namespaces

- (none)

## Components

- **`index.html`** — UI, вкладка категорий, выбор отдела по строке (`select`), нормализация регистра при вводе, блок «Перевод» (de/en/es).

## Patterns

- Новые категории: `id` вида `cat_1`, `cat_2`, … (`catIdSeq`). Удаление: товары переносятся на другую категорию (`other` предпочтительно, иначе первая доступная).
