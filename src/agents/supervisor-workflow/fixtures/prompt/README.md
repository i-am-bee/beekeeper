# Skills

1. Goal-and-requirement extraction
Example: Given “Organise a three-day team off-site near Prague in late September, dog-friendly, <$4 000 total”, the agent pulls out dates, location radius, pet policy, and budget ceilings before planning.
>>> SHOULD HAVE
>>> quality

2. Resource matching & capability mapping
Example: The agent sees that a “soil-quality survey” request can be satisfied by an existing soil_sampler_droid agent plus a lab_analysis_api, so it chooses those instead of generic LLM steps.
>>> SHOULD HAVE
>>> Matching tools 

3. Task decomposition & ordered sequencing
Example: Break “Digitise 12 medieval charters” into: (1) high-res scan, (2) OCR Latin script, (3) language detection, (4) human-readable output review, (5) archive to vector store.
>>> SHOULD HAVE
>>> YES

4. Explicit dependency tracking
Example: When drafting a crop-rotation plan, Step 4 (fertiliser schedule) is formally linked to yield predictions generated in Step 2.
>>> SHOULD HAVE
>>> quality

5. Constraint satisfaction (cost, time, capacity)
Example: Plan drone battery swaps so that each field pass stays under 25 min flight time and total batteries ≤ 6.
>>> SHOULD HAVE
>>> YES


7. Parallelisation & critical-path optimisation
Example: While 3-D scanning an artefact, the agent schedules a separate material-analysis request in parallel, shortening total turnaround.
>>> SHOULD HAVE
>>> YES

8. Budget / resource-usage optimisation
Example: Choose a rail-cargo route over air freight once the combined_cost_evaluator shows 18 % savings within deadline tolerances.
>>> SHOULD HAVE
>>> ??? 

9. Fallback / contingency planning
Example: If weather_api predicts > 70 % rain on harvest day, automatically branch to an indoor grain-drying workflow.
>>> Not support yet 

10. Progress monitoring & re-planning
Example: After Step 2 fails to locate a 4-star hotel under €180/night, dynamically re-plan to widen the search radius and re-evaluate cost.
>>> Not support yet

11. Multi-objective trade-off balancing
Example: Select a Formula 1 tyre strategy that minimises pit-stop count and maximises stint pace, displaying Pareto-front options.
>>> SHOULD HAVE
>>> ???

12. Provenance / audit-trail construction
Example: Attach source URLs and intermediate file hashes for each dataset ingested into a paleoclimate meta-analysis.
>>> YES


Task decomposition
Ordered sequencing
Task dependencies
Parallelisation
Aggregation
Conditions
