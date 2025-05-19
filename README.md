# Enhanced HTML Preview

Enhanced version of the HTML Preview project with support for multiple parameters.

## Overview

This project is an enhanced version of the [HTML Preview project](https://github.com/html-preview/html-preview.github.io) that allows rendering HTML files from git repositories (like GitHub, GitLab, BitBucket, etc.) or URL's directly in your browser without cloning or downloading the repository.

The enhanced version adds support for multiple parameters that allow customizing the preview experience.

<!--
SPDX-FileCopyrightText: 2012 - 2021 Jerzy Głowacki <jerzyglowacki@gmail.com>
SPDX-FileCopyrightText: 2024 Robin Vobruba <hoijui.quaero@gmail.com>

SPDX-License-Identifier: Apache-2.0
-->

> [!warning]
> Freely hosted [CORS][CORS] (Cross-origin resource sharing) proxies -
like the ones used by this script -
are a potential **security risk!**

> [!warning]
> If a script stores sensitive data (as cookie, `localStorage`, etc...), then **other repos you open will also have access** to this data.
> 
> How to avoid risk:
> - Don't input sensitive data while previewing
> - Clear all site data after previewing a repo

Currently supported git forges:

- [x] GitHub
- [x] BitBucket
- [x] GitLab
  - [x] gitlab.com
  - [x] lab.allmende.io
  - [x] gitlab.opensourceecology.de
- [x] ForgeJo
  - [x] codeberg.org
- [x] SourceHut
- [ ] Gitea

We have a collection of the [file URLs](forges.md) for the above.

## How it works

If you try to open raw version of any HTML, CSS or JS file
in a web browser directly from GitHub,
all you will see is its source code.
GitHub forces them to use the "text/plain" content-type,
so they cannot be interpreted in their native form by the browser.

## Usage

In order to use it,
just prepend this fragment to the URL of any HTML file:
**[https://itseyup.github.io/?url=](https://itseyup.github.io/?url=)**
e.g.:

- <https://itseyup.github.io/?url=https://github.com/twbs/bootstrap/gh-pages/2.3.2/index.html>
- <https://itseyup.github.io/?url=https://github.com/documentcloud/backbone/blob/master/examples/todos/index.html>

What it does:

1. Load HTML using [CORS] proxy
2. Process all links, frames, scripts and styles, and
3. Load each of them using [CORS] proxy,
    so they can be evaluated by the browser.

**Git-Forge HTML Preview** was tested
under the latest Google Chrome and Mozilla Firefox (**in _2012_**).

[CORS]: https://httptoolkit.com/blog/cors-proxies/
