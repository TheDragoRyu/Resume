---
id: proj-alpha
slug: project-alpha
title: Project Alpha
type: project
order: 1
description: A real-time collaborative document editor with conflict-free replicated data types.
categoryId: cat-experience
featured: true
tags:
  - React
  - TypeScript
  - WebSocket
  - CRDT
links:
  github: https://github.com/example/project-alpha
  demo: https://project-alpha.example.com
orbit:
  orbitRadius: 2
  orbitSpeed: 0.12
  size: 0.5
  color: "#ff80ff"
---

## Problem

Teams needed a way to edit documents simultaneously without conflicts or data loss, even on unreliable connections.

## Approach

Built a browser-based editor using CRDTs (Conflict-free Replicated Data Types) for automatic merge resolution. Used WebSockets for real-time sync with an offline-first architecture.

## Results

- 99.9% uptime over 6 months of production use.
- Supported 50+ concurrent editors per document.
- Zero data loss incidents.

## Tech Stack

React, TypeScript, WebSocket, Yjs (CRDT library), Node.js, PostgreSQL
