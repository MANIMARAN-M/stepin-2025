# Step-In Project

## Overview
This project appears to be a Node.js/TypeScript application, possibly related to testing or planning automation, as suggested by the file names and structure. It includes a server, test scripts, and various configuration and data files.

## Project Structure

---

## 📂 Required Files
1. **Failures.jsonl**  
   - Input file containing failure details in JSON Lines format.  

2. **Policy.yaml**  
   - Input file defining the policies to guide recovery plan generation.  

Both files should be placed in:

---

## ▶️ How to Run

Open **PowerShell** in the project directory and run:

```powershell
$env:FAILURE_PATH="C:\Users\<your-username>\Downloads\step-in\solution\Failures.jsonl"
$env:POLICY_PATH="C:\Users\<your-username>\Downloads\step-in\solution\Policy.yaml"
npx ts-node generatePlan.ts
npx ts-node dashboard.ts

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation
1. Clone or download the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the dashboard
To start the dashboard (assuming `dashboard.js` is the entry point):
```bash
node dashboard.js
```

### Running Tests
If using Jest or a similar test runner:
```bash
npm test
```
Or run the TypeScript test file directly (if configured):
```bash
npx ts-node generatePlan.test.ts
```

## File Descriptions

## Core Logic: `generatePlan.ts`

The core logic for generating the plan is implemented in `generatePlan.ts`. Here’s how it works:

### Main Components
- **Failure, Policy, Plan Interfaces:**
   - Define the structure for failure records, policy configuration, and the output plan.
- **computePlan Function:**
   - Takes an array of failures and a policy object.
   - For each failure:
      - Calculates base minutes as the sum of minutes for each impacted layer (from policy).
      - Applies environment and failure type multipliers (from policy).
      - Caps the final minutes at a maximum allowed per incident (from policy).
      - Computes a priority score using module priority and multipliers.
      - Returns a plan object for each failure.
- **Main Script Logic:**
   - Reads failures from `Failures.jsonl` (one JSON object per line).
   - Reads policy configuration from `Policy.yaml`.
   - Calls `computePlan` to generate the plan.
   - Sorts the plan by priority score (descending) and module (ascending).
   - Writes the sorted plan to `plan.json`.

### Example Algorithm (Simplified)
1. For each failure:
      - `baseMinutes = sum(policy.minutes_per_impacted_layer[layer] for layer in impacted_layers)`
      - `finalMinutes = min(policy.caps.per_incident_minutes_max, baseMinutes * envMultiplier * failureTypeMultiplier)`
      - `priorityScore = modulePriority * envMultiplier * failureTypeMultiplier`
2. Output a sorted plan as JSON.

### Extending or Customizing
- Update the policy or failure data to change how plans are generated.
- Modify the logic in `generatePlan.ts` to adjust calculations or add new features.

## Customization
- Update `plan.json` and `Policy.yaml` as per your requirements.
- Modify `generatePlan.ts` to change plan generation logic.
- Add or update tests in `generatePlan.test.ts`.

## License
Specify your license here (e.g., MIT, Apache 2.0, etc.).

## Contact
For questions or support, contact the project maintainer.
