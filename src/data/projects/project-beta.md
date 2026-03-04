---
id: proj-beta
slug: project-beta
title: Project Beta
type: project
order: 2
description: An infrastructure monitoring dashboard with real-time metrics visualization.
categoryId: cat-experience
featured: true
tags:
  - Go
  - React
  - Kubernetes
  - Prometheus
links:
  github: https://github.com/example/project-beta
orbit:
  orbitRadius: 2.5
  orbitSpeed: 0.1
  size: 0.45
  color: "#80ffee"
---

## Problem

Operations teams lacked a unified view of infrastructure health across multiple Kubernetes clusters.

## Approach

Built a Go backend that aggregates Prometheus metrics, with a React frontend using D3.js for real-time chart rendering. Deployed as a Helm chart for easy cluster adoption.

## Results

- Reduced mean-time-to-detection by 60%.
- Adopted by 12 internal teams within 3 months.
- Processed 1M+ data points per minute.

## Tech Stack

Go, React, D3.js, Kubernetes, Prometheus, Helm, PostgreSQL
