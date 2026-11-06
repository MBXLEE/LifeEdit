import type { Exercise } from "./life-domain";

// Display defaults for the starter library. Saved user fields always take precedence.
const catalog: Record<string, { equipment: string; difficulty: Exercise["difficulty"]; description: string }> = {
  "Bench Press": { equipment: "Barbell, bench", difficulty: "Intermediate", description: "A horizontal pressing movement for an upper body session." },
  "Incline Dumbbell Press": { equipment: "Dumbbells, incline bench", difficulty: "Intermediate", description: "An upper body press from an inclined bench." },
  "Shoulder Press": { equipment: "Dumbbells or machine", difficulty: "Beginner", description: "An overhead pressing movement." },
  "Lat Pulldown": { equipment: "Cable machine", difficulty: "Beginner", description: "An upper body pulling movement." },
  "Seated Row": { equipment: "Cable or row machine", difficulty: "Beginner", description: "A seated upper body pulling movement." },
  "Bicep Curls": { equipment: "Dumbbells or cable", difficulty: "Beginner", description: "An arm-focused curling movement." },
  "Tricep Pushdown": { equipment: "Cable machine", difficulty: "Beginner", description: "An arm-focused cable pushdown." },
  "Squats": { equipment: "Bodyweight or barbell", difficulty: "Beginner", description: "A lower body squat pattern." },
  "Romanian Deadlifts": { equipment: "Dumbbells or barbell", difficulty: "Intermediate", description: "A lower body hip hinge pattern." },
  "Leg Press": { equipment: "Leg press machine", difficulty: "Beginner", description: "A machine-based lower body press." },
  "Lunges": { equipment: "Bodyweight or dumbbells", difficulty: "Beginner", description: "A stepping lower body movement." },
  "Calf Raises": { equipment: "Bodyweight or machine", difficulty: "Beginner", description: "A standing or seated calf movement." },
  "Hip Thrusts": { equipment: "Bench, optional weight", difficulty: "Intermediate", description: "A hip extension movement." },
  "Plank": { equipment: "Mat", difficulty: "Beginner", description: "A stationary core hold." },
  "Dead Bug": { equipment: "Mat", difficulty: "Beginner", description: "A controlled floor-based core movement." },
  "Bird Dog": { equipment: "Mat", difficulty: "Beginner", description: "A controlled floor-based balance movement." },
  "Walking": { equipment: "Comfortable shoes", difficulty: "Beginner", description: "A flexible low-impact cardio option." },
  "Cycling": { equipment: "Bicycle or stationary bike", difficulty: "Beginner", description: "A seated cardio option." },
  "Light Jogging": { equipment: "Comfortable shoes", difficulty: "Beginner", description: "A gentle running option at a personal pace." },
  "Hip Mobility": { equipment: "Mat", difficulty: "Beginner", description: "A space for gentle hip movement." },
  "Shoulder Mobility": { equipment: "Optional band", difficulty: "Beginner", description: "A space for gentle shoulder movement." },
  "Gentle Stretching": { equipment: "Mat", difficulty: "Beginner", description: "A calm movement and recovery option." }
};

export function enrichExercise(exercise: Exercise): Exercise {
  const starter = catalog[exercise.name];
  if (!starter || !exercise.id.startsWith("library-")) return exercise;
  return { ...starter, ...exercise, equipment: exercise.equipment || starter.equipment, difficulty: exercise.difficulty || starter.difficulty, description: exercise.description || starter.description };
}
