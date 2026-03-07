---
id: proj-soil-moisture-simulator
slug: soil-moisture-simulator
title: "SoilMoisture Simulator"
type: project
order: 2
description: "A real-time soil moisture simulation built in Unity using data-oriented design principles."
categoryId: cat-experience
featured: false
tags:
  - Unity
  - C#
  - Game Development
  - Simulation
  - ECS
links:
  github: https://github.com/TheDragoRyu/SoilMoisture-Simulator
---

## Problem
Needed a hands-on project to learn Unity's Entity Component System and DOTS architecture — a fundamentally different way of structuring game logic compared to traditional object-oriented approaches.

## Solution
Built a soil moisture simulator where moisture spreads and updates across a grid in real time. Unity's ECS architecture separated all data into components and all logic into systems, allowing the simulation to scale efficiently. DOTS enabled the simulation to run with data-oriented performance patterns rather than per-object update cycles.

## Highlights
- Real-time moisture propagation visualized across a simulated soil grid
- Simulation state managed entirely through ECS components, not MonoBehaviour objects
- Logic structured as discrete systems operating on component data
- Demonstrated the performance and scalability benefits of data-oriented design in a visible, interactive context

## Tech Stack
Unity, C#, Unity ECS, Unity DOTS
