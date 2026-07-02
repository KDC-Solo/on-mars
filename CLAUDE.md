# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current State

This repository contains no code yet. It is a companion app project for the solo mode of *On Mars*, the board game by Vital Lacerda (Eagle-Gryphon Games). The app automates the "Lacerda" automa opponent to remove solo-mode bookkeeping fatigue.

- `PRD.md` — the product requirements document; read this first for product scope and design decisions (notably the hybrid state model: app owns Lacerda's non-spatial state, player handles spatial moves).
- `docs/` holds the official game reference PDFs:

- `On Mars Rulebook EN Preview.pdf` — full game rules
- `On Mars Reference Book EN Preview.pdf` — detailed rules reference / glossary
- `On Mars Upgrade Pack Rules EN Preview.pdf` — upgrade pack rules
- `player_aids_V8_LowRes.pdf` — player aid summaries

## Working Here

- When implementing game rules or mechanics, treat the PDFs in `docs/` as the source of truth. The solo rules are on pp. 22–23 of the Rulebook; the Reference Book resolves edge cases the Rulebook glosses over.
- The Rulebook PDF is large (~18 MB); extract text with `pdftotext` for searching, or read a few pages at a time with the `pages` parameter.
- The repo lives at `github.com/ianpogi5/on-mars-solo` (public). Always commit and push changes without asking — except ask first if a commit would contain copyrighted work (PDFs, card photos, verbatim rulebook text, game art).
- The PDFs in `docs/` and photos in `docs/images/` are copyrighted game materials: they stay local and are gitignored — never commit them.
- Once a tech stack and build tooling are chosen, update this file with build/test/lint commands and architecture notes.
