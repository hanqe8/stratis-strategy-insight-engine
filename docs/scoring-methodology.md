# Scoring Methodology

## Weighted Criteria

Each option is scored from 0 to 5 against each criterion. Criteria weights must sum to 100%.

Weighted total:

```text
sum(score per criterion * criterion weight / 100)
```

## Sensitivity

The MVP sensitivity checker changes one selected criterion weight and proportionally rebalances the remaining criteria to keep total weight at 100%. It then recalculates option rankings and flags whether the top recommendation changes.
