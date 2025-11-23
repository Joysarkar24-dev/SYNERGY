/* ------------------------------------------------
   WORKOUT DATABASE (GYM • HOME MIX • HOME ONLY)
-------------------------------------------------- */

const workouts = {
    gym: {
        push: ["Bench Press", "Incline Dumbbell Press", "Shoulder Press", "Tricep Pushdown", "Lateral Raises"],
        pull: ["Deadlift", "Pull-Ups", "Rows", "Face Pulls", "Bicep Curls"],
        legs: ["Squats", "Leg Press", "Romanian Deadlift", "Leg Curls", "Calf Raises"]
    },

    homeMix: {
        push: ["Push-Ups", "Incline Push-Ups", "Resistance Band Press", "Dips on Chair"],
        pull: ["Resistance Band Row", "Back Extensions", "Doorway Rows"],
        legs: ["Bodyweight Squats", "Lunges", "Glute Bridges", "Jump Squats"]
    },

    home: {
        push: ["Push-Ups", "Decline Push-Ups", "Shoulder Taps"],
        pull: ["Superman Pulls", "Towel Rows"],
        legs: ["Air Squats", "Lunges", "Wall Sit", "Calf Raises"]
    }
};

/* ----------------------------------------------
   SETS & REPS BASED ON TIME • GOAL • LEVEL
---------------------------------------------- */

function getSetsReps(time, goal, level) {

    let base = 0;

    if (time <= 30) base = 2;
    else if (time <= 45) base = 3;
    else if (time <= 60) base = 4;
    else if (time <= 90) base = 5;
    else base = 6;

    if (goal === "strength") base += 1;
    if (level === "advanced") base += 1;

    let reps = goal === "strength" ? "4-6 reps" :
               goal === "hypertrophy" ? "8-12 reps" :
               "15-20 reps";

    return { sets: base, reps: reps };
}

/* ----------------------------------------------
   PLAN GENERATOR
---------------------------------------------- */

function generatePlan() {
    const type = document.getElementById("workoutType").value;
    const goal = document.getElementById("goal").value;
    const level = document.getElementById("level").value;
    const days = parseInt(document.getElementById("days").value);
    const time = parseInt(document.getElementById("time").value);

    const planDiv = document.getElementById("generatedPlan");
    planDiv.innerHTML = "";

    const schedule = ["push", "pull", "legs"];

    let dayCounter = 0;

    for (let i = 1; i <= days; i++) {
        const dayName = schedule[dayCounter % 3];
        const exerciseList = workouts[type][dayName];

        const sr = getSetsReps(time, goal, level);

        let section = `
            <h3 style="color:#b26cff;">Day ${i} — ${dayName.toUpperCase()}</h3>
            <table>
                <tr><th>Exercise</th><th>Sets</th><th>Reps</th></tr>
        `;

        exerciseList.forEach(ex => {
            section += `
            <tr>
                <td>${ex}</td>
                <td>${sr.sets}</td>
                <td>${sr.reps}</td>
            </tr>`;
        });

        section += "</table><br>";
        planDiv.innerHTML += section;

        dayCounter++;
    }
}

/* ----------------------------------------------
   MODAL CONTROL
---------------------------------------------- */

function openPlan() {
    generatePlan();
    document.getElementById("planModal").style.display = "flex";
}

function closePlan() {
    document.getElementById("planModal").style.display = "none";
}
