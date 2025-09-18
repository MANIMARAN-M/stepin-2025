import * as fs from 'fs'; // Import the 'fs' module for file system operations
import * as yaml from 'js-yaml'; // Import the 'js-yaml' module for parsing YAML files

// Define the structure of a failure record
interface Failure {
  test_id: string; // Unique identifier for the test
  module: string; // Module where the failure occurred
  environment: string; // Environment in which the failure occurred (e.g., QA, UAT)
  failure_type: string; // Type of failure (e.g., Backend Service Bug, Authentication Failure)
  impacted_layers: string[]; // List of layers impacted by the failure
}

// Define the structure of the policy configuration
interface Policy {
  caps: {
    per_incident_minutes_max: number; // Maximum minutes allowed per incident
  };
  multipliers: {
    by_environment: Record<string, number>; // Multipliers based on environment
    by_failure_type: Record<string, number>; // Multipliers based on failure type
  };
  module_priority_score: Record<string, number>; // Priority scores for each module
  minutes_per_impacted_layer: Record<string, number>; // Minutes allocated per impacted layer
}

// Define the structure of the output plan
interface Plan {
  test_id: string; // Unique identifier for the test
  module: string; // Module where the failure occurred
  environment: string; // Environment in which the failure occurred
  failure_type: string; // Type of failure
  impacted_layers: string[]; // List of layers impacted by the failure
  Base_minutes: number; // Base minutes calculated for the failure
  Final_minutes: number; // Final minutes after applying multipliers and caps
  priority_score: number; // Priority score for the failure
}

// Function to compute the plan based on failures and policy
export function computePlan(failures: Failure[], policy: Policy): Plan[] {
  console.log('Computing plan for failures:', failures.length); // Log the number of failures being processed
  return failures.map((failure) => {
    // Calculate base minutes as the sum of minutes for each impacted layer
    const baseMinutes = failure.impacted_layers.reduce((sum, layer) => {
      return sum + (policy.minutes_per_impacted_layer[layer] || 0);
    }, 0);

      // If no impacted layers, set priority_score to 0
    if (failure.impacted_layers.length === 0) {
      return {
        test_id: failure.test_id,
        module: failure.module,
        environment: failure.environment,
        failure_type: failure.failure_type,
        impacted_layers: failure.impacted_layers,
        Base_minutes: baseMinutes,
        Final_minutes: 0,
        priority_score: 0,
      };
    }

    // Retrieve the environment multiplier, defaulting to 1.0 if not found
    const envMultiplier = policy.multipliers.by_environment[failure.environment] || 1.0;

    // Retrieve the failure type multiplier, defaulting to 1.0 if not found
    const failureTypeMultiplier = policy.multipliers.by_failure_type[failure.failure_type] || 1.0;

    // Calculate final minutes by applying multipliers and capping at the maximum allowed
    const finalMinutes = Math.min(
      policy.caps.per_incident_minutes_max,
      baseMinutes * envMultiplier * failureTypeMultiplier
    )

    // Retrieve the module priority score, defaulting to 1 if not found
    const modulePriority = policy.module_priority_score[failure.module] || 1;

    // Calculate the priority score and round it to 3 decimal places
    const priorityScore = parseFloat(
      (
        modulePriority * envMultiplier * failureTypeMultiplier
      ).toFixed(3)
    );

    // Return the computed plan for the failure
    return {
      test_id: failure.test_id,
      module: failure.module,
      environment: failure.environment,
      failure_type: failure.failure_type,
      impacted_layers: failure.impacted_layers,
      Base_minutes: baseMinutes,
      Final_minutes: finalMinutes,
      priority_score: priorityScore,
    };
  });
}

// Main function to orchestrate the script
export function main() {
  const failuresFile = process.env.FAILURE_PATH || 'Failures.jsonl'; // Path to the failures dataset file
  const policyFile = process.env.POLICY_PATH || 'Policy.yaml'; // Path to the policy configuration file
  const outputFile = 'plan.json'; // Path to the output file

  // Read and parse Failures.jsonl
  const failures: Failure[] = fs
    .readFileSync(failuresFile, 'utf-8') // Read the file as a UTF-8 string
    .split('\n') // Split the file content into lines
    .filter(Boolean) // Remove empty lines
    .map((line: string) => {
      try {
        return JSON.parse(line); // Parse each line as JSON
      } catch (error) {
        console.warn(`Skipping invalid JSON line: ${line}`); // Log a warning for invalid JSON
        return null; // Skip invalid lines
      }
    })
    .filter((failure): failure is Failure => failure !== null); // Filter out null values

  // Read and parse Policy.yaml
  const policy: Policy = yaml.load(fs.readFileSync(policyFile, 'utf-8')) as Policy;

  // Compute the plan based on failures and policy
  const plan = computePlan(failures, policy);

  // Sort the plan by priority_score (descending) and module (ascending)
  plan.sort((a, b) => {
    if (b.priority_score !== a.priority_score) {
      return b.priority_score - a.priority_score; // Sort by priority_score descending
    }
    return a.module.localeCompare(b.module); // Sort by module ascending
  });

  console.log('Generated Plan:', plan.length); // Log the generated plan

  // Write the sorted plan to plan.json
  fs.writeFileSync(outputFile, JSON.stringify(plan, null, 2)); // Write the plan as a formatted JSON file

  console.log(`Plan written to ${outputFile}`); // Log success message
}

// main(); // Do not execute main when imported as a module