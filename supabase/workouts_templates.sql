-- ============================================================================
-- GetFittWithMohit — Workout template library (15 templates)
--
-- Run once in the Supabase SQL Editor, after workouts.sql and
-- workouts_seed_exercises.sql. Safe to re-run: exercises that exist are
-- skipped, and a template is skipped if one with the same name exists.
-- Templates have no client; assign them from Coach → Workouts.
-- ============================================================================

-- 1. 19 extra exercises used by the hybrid, calisthenics, boxing and glute templates

-- (added to the library)
insert into public.exercises (name, muscle_group, equipment, locations, log_type, weight_step, cues) values
('Shadow Boxing','Cardio','Bodyweight','{gym,home,hotel}','time',2.5,array['Hands up guarding your chin','Stay light on the balls of your feet','Turn your hips into every punch']),
('Heavy Bag Rounds','Cardio','Heavy bag','{gym}','time',2.5,array['Hands back to your face after every punch','Breathe out sharply as you hit','Keep moving around the bag']),
('Battle Ropes','Cardio','Battle ropes','{gym}','time',2.5,array['Athletic stance, knees soft','Fast alternating waves from the shoulders','Keep your core braced']),
('Running Intervals','Cardio','None','{gym,home,hotel}','time',2.5,array['Fast but controlled — about 8 out of 10 effort','Walk or jog slowly in the rest','Stop if your form breaks down']),
('Air Bike Sprint','Cardio','Air bike','{gym}','time',2.5,array['Push and pull with arms and legs','All-out effort for the work period','Easy spin in the rest']),
('Medicine Ball Slam','Full body','Medicine ball','{gym}','reps',2.5,array['Ball overhead, rise onto your toes','Slam it down hard in front of you','Squat to pick it up with a flat back']),
('Wall Ball','Full body','Medicine ball','{gym}','reps',2.5,array['Squat with the ball at your chest','Drive up and throw to a target on the wall','Catch and go straight into the next squat']),
('Box Jump','Legs','Plyo box','{gym}','reps',2.5,array['Swing your arms and jump up','Land softly with both feet on the box','Step down, don''t jump down']),
('Skater Jump','Cardio','Bodyweight','{gym,home,hotel}','reps',2.5,array['Leap sideways from one foot to the other','Land softly and hold for a moment','Count each side as one rep']),
('Push Press','Shoulders','Barbell','{gym}','weight_reps',2.5,array['Bar on front of shoulders','Small dip with the knees, then drive','Use the leg drive to press overhead']),
('Dumbbell Snatch','Full body','Dumbbell','{gym,home}','weight_reps',2,array['Dumbbell between your feet, hinge down','Explode up, pull it close to your body','Punch it overhead in one move']),
('Dumbbell Hip Thrust','Glutes','Dumbbell','{gym,home,hotel}','weight_reps',2,array['Upper back on a bench or sofa','Dumbbell on your hips, drive them up','Squeeze glutes hard at the top']),
('Frog Pump','Glutes','Bodyweight','{gym,home,hotel}','reps',2.5,array['Soles of your feet together, knees out','Drive hips up by squeezing glutes','Short, controlled reps']),
('Archer Push-up','Chest','Bodyweight','{gym,home,hotel}','reps',2.5,array['Hands very wide','Lower towards one hand, other arm straight','Alternate sides; each side is one rep']),
('Negative Pull-up','Back','Bodyweight','{gym}','reps',2.5,array['Jump or step up to chin over the bar','Lower as slowly as you can — aim for 5 seconds','Reset and repeat']),
('Scapular Pull-up','Back','Bodyweight','{gym}','reps',2.5,array['Hang with straight arms','Pull shoulder blades down without bending elbows','Hold one second, then relax']),
('L-Sit Hold','Core','Parallettes','{gym,home}','time',2.5,array['Hands on bars or two chairs, arms locked','Lift your legs out in front','Bend your knees to make it easier']),
('Wall Handstand Hold','Shoulders','Bodyweight','{gym,home,hotel}','time',2.5,array['Walk your feet up the wall','Arms locked, push the floor away','Body tight, come down if form breaks']),
('Assisted Pistol Squat','Legs','Bodyweight','{gym,home,hotel}','reps',2.5,array['Hold a door frame or post for support','Lower on one leg, other leg forward','Use your arms only as much as needed'])
on conflict (name) do nothing;

-- Home / hotel swaps (only fills ones not already set)
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Heavy Bag Rounds' and a.name = 'Shadow Boxing' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Heavy Bag Rounds' and a.name = 'Shadow Boxing' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Battle Ropes' and a.name = 'Mountain Climber' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Battle Ropes' and a.name = 'High Knees' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Air Bike Sprint' and a.name = 'Burpee' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Air Bike Sprint' and a.name = 'Running Intervals' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Medicine Ball Slam' and a.name = 'Burpee' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Medicine Ball Slam' and a.name = 'Burpee' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Wall Ball' and a.name = 'Dumbbell Thruster' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Wall Ball' and a.name = 'Dumbbell Thruster' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Box Jump' and a.name = 'Jump Squat' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Box Jump' and a.name = 'Jump Squat' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Push Press' and a.name = 'Pike Push-up' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Push Press' and a.name = 'Dumbbell Shoulder Press' and e.hotel_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Dumbbell Snatch' and a.name = 'Dumbbell Thruster' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Negative Pull-up' and a.name = 'Band Lat Pulldown' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Negative Pull-up' and a.name = 'Band Lat Pulldown' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Scapular Pull-up' and a.name = 'Band Pull-Apart' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Scapular Pull-up' and a.name = 'Band Pull-Apart' and e.hotel_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'L-Sit Hold' and a.name = 'Hollow Body Hold' and e.hotel_alt_id is null;


-- 2. Templates

-- Full Body Foundation · 3-day
do $$
declare p uuid; s uuid;
begin
  if exists (select 1 from public.workout_plans where client_id is null and name = 'Full Body Foundation · 3-day') then return; end if;
  insert into public.workout_plans (client_id, name, schedule_type, sessions_per_week, progression_enabled) values (null, 'Full Body Foundation · 3-day', 'rolling', 3, true) returning id into p;
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'A', 'Full Body A', 0, 'Weeks 1–2: learn the movements. Stop each set with 2–3 reps left in the tank.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, 10, null, 90, null from public.exercises where name = 'Goblet Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 90, null from public.exercises where name = 'Dumbbell Bench Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 12, null, 75, null from public.exercises where name = 'Seated Cable Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 10, null, 90, null from public.exercises where name = 'Dumbbell Romanian Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 2, 12, null, 60, null from public.exercises where name = 'Dumbbell Lateral Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, null, 30, 45, null from public.exercises where name = 'Plank';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 1, null, 600, 0, 'Finisher — brisk, steady pace' from public.exercises where name = 'Incline Treadmill Walk';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'B', 'Full Body B', 1, 'Smooth, controlled reps. Quality first.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, 12, null, 90, null from public.exercises where name = 'Leg Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 75, null from public.exercises where name = 'Lat Pulldown';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 10, null, 90, null from public.exercises where name = 'Incline Dumbbell Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 15, null, 60, null from public.exercises where name = 'Glute Bridge';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 10, null, 45, null from public.exercises where name = 'Dead Bug';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 1, null, 600, 0, 'Finisher — brisk, steady pace' from public.exercises where name = 'Incline Treadmill Walk';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'C', 'Full Body C', 2, 'Same weights as last time is fine — consistency beats intensity this month.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, 10, null, 90, null from public.exercises where name = 'Reverse Lunge';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 90, null from public.exercises where name = 'Machine Chest Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 10, null, 90, null from public.exercises where name = 'Single-Arm Dumbbell Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 10, null, 90, null from public.exercises where name = 'Dumbbell Shoulder Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 2, 10, null, 45, null from public.exercises where name = 'Bird Dog';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 2, null, 30, 30, null from public.exercises where name = 'Side Plank';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 1, null, 600, 0, 'Finisher — steady pace' from public.exercises where name = 'Stationary Bike';
end $$;

-- Upper / Lower · 4-day
do $$
declare p uuid; s uuid;
begin
  if exists (select 1 from public.workout_plans where client_id is null and name = 'Upper / Lower · 4-day') then return; end if;
  insert into public.workout_plans (client_id, name, schedule_type, sessions_per_week, progression_enabled) values (null, 'Upper / Lower · 4-day', 'rolling', 4, true) returning id into p;
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'A', 'Upper A', 0, 'Main lift first while you''re fresh. Leave 1–2 reps in the tank.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 8, null, 120, null from public.exercises where name = 'Barbell Bench Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 4, 10, null, 90, null from public.exercises where name = 'Seated Cable Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 10, null, 90, null from public.exercises where name = 'Dumbbell Shoulder Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 12, null, 75, null from public.exercises where name = 'Lat Pulldown';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 15, null, 60, null from public.exercises where name = 'Dumbbell Lateral Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 12, null, 60, null from public.exercises where name = 'Triceps Pushdown';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 1, null, 600, 0, 'Finisher — brisk, steady pace' from public.exercises where name = 'Incline Treadmill Walk';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'B', 'Lower A', 1, 'Brace before every squat rep. Depth you can control.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 8, null, 150, null from public.exercises where name = 'Barbell Back Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 120, null from public.exercises where name = 'Romanian Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 12, null, 90, null from public.exercises where name = 'Walking Lunge';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 12, null, 60, null from public.exercises where name = 'Lying Leg Curl';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 15, null, 60, null from public.exercises where name = 'Standing Calf Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, null, 45, 45, null from public.exercises where name = 'Plank';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 1, null, 600, 0, 'Finisher — brisk, steady pace' from public.exercises where name = 'Incline Treadmill Walk';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'C', 'Upper B', 2, 'Squeeze every row — feel your back working, not your arms.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 10, null, 90, null from public.exercises where name = 'Incline Dumbbell Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 4, 10, null, 90, null from public.exercises where name = 'Chest-Supported Dumbbell Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 8, null, 90, null from public.exercises where name = 'Assisted Pull-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 12, null, 60, null from public.exercises where name = 'Cable Fly';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 15, null, 60, null from public.exercises where name = 'Face Pull';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 12, null, 60, null from public.exercises where name = 'Dumbbell Curl';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 1, null, 600, 0, 'Finisher — steady pace' from public.exercises where name = 'Stationary Bike';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'D', 'Lower B', 3, 'Hip thrusts: pause one second at the top of every rep.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 6, null, 150, null from public.exercises where name = 'Trap Bar Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 12, null, 90, null from public.exercises where name = 'Leg Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 10, null, 90, null from public.exercises where name = 'Bulgarian Split Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 10, null, 90, null from public.exercises where name = 'Barbell Hip Thrust';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 15, null, 60, null from public.exercises where name = 'Seated Calf Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 12, null, 60, null from public.exercises where name = 'Hanging Knee Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 1, null, 600, 0, 'Finisher — brisk, steady pace' from public.exercises where name = 'Incline Treadmill Walk';
end $$;

-- Upper / Lower Strength · 4-day
do $$
declare p uuid; s uuid;
begin
  if exists (select 1 from public.workout_plans where client_id is null and name = 'Upper / Lower Strength · 4-day') then return; end if;
  insert into public.workout_plans (client_id, name, schedule_type, sessions_per_week, progression_enabled) values (null, 'Upper / Lower Strength · 4-day', 'rolling', 4, true) returning id into p;
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'A', 'Upper Strength A', 0, 'Heavy day. Full rest between sets — strength needs recovery.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 5, 5, null, 180, null from public.exercises where name = 'Barbell Bench Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 5, 5, null, 150, null from public.exercises where name = 'Barbell Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 6, null, 150, null from public.exercises where name = 'Barbell Overhead Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 6, null, 120, null from public.exercises where name = 'Chin-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 15, null, 60, null from public.exercises where name = 'Face Pull';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'B', 'Lower Strength A', 1, 'Every squat rep identical. Stop a set if your back rounds.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 5, 5, null, 180, null from public.exercises where name = 'Barbell Back Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 6, null, 150, null from public.exercises where name = 'Romanian Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 8, null, 120, null from public.exercises where name = 'Leg Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 10, null, 60, null from public.exercises where name = 'Standing Calf Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, null, 45, 45, null from public.exercises where name = 'Plank';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'C', 'Upper Strength B', 2, 'Press with your whole body tight — glutes squeezed.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 5, 5, null, 180, null from public.exercises where name = 'Barbell Overhead Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 4, 6, null, 150, null from public.exercises where name = 'Pull-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 4, 6, null, 150, null from public.exercises where name = 'Incline Barbell Bench Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 8, null, 90, null from public.exercises where name = 'Single-Arm Dumbbell Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 8, null, 90, null from public.exercises where name = 'Close-Grip Bench Press';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'D', 'Lower Strength B', 3, 'Deadlift: reset your setup before every single rep.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 5, 3, null, 180, null from public.exercises where name = 'Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 4, 6, null, 150, null from public.exercises where name = 'Front Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 8, null, 90, null from public.exercises where name = 'Walking Lunge';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 12, null, 60, null from public.exercises where name = 'Back Extension';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 10, null, 60, null from public.exercises where name = 'Hanging Leg Raise';
end $$;

-- Push / Pull / Legs · 3-day
do $$
declare p uuid; s uuid;
begin
  if exists (select 1 from public.workout_plans where client_id is null and name = 'Push / Pull / Legs · 3-day') then return; end if;
  insert into public.workout_plans (client_id, name, schedule_type, sessions_per_week, progression_enabled) values (null, 'Push / Pull / Legs · 3-day', 'rolling', 3, true) returning id into p;
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'A', 'Push', 0, 'Chest, shoulders, triceps. Control the lowering on every press.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 8, null, 120, null from public.exercises where name = 'Barbell Bench Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 90, null from public.exercises where name = 'Incline Dumbbell Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 10, null, 90, null from public.exercises where name = 'Dumbbell Shoulder Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 15, null, 60, null from public.exercises where name = 'Cable Lateral Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 12, null, 60, null from public.exercises where name = 'Triceps Pushdown';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 12, null, 60, null from public.exercises where name = 'Overhead Cable Triceps Extension';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 1, null, 600, 0, 'Finisher — brisk, steady pace' from public.exercises where name = 'Incline Treadmill Walk';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'B', 'Pull', 1, 'Back and biceps. Lead every pull with your elbows.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 10, null, 90, null from public.exercises where name = 'Lat Pulldown';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 4, 8, null, 120, null from public.exercises where name = 'Barbell Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 12, null, 75, null from public.exercises where name = 'Seated Cable Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 15, null, 60, null from public.exercises where name = 'Face Pull';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 10, null, 60, null from public.exercises where name = 'Barbell Curl';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 12, null, 60, null from public.exercises where name = 'Hammer Curl';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 1, null, 600, 0, 'Finisher — steady pace' from public.exercises where name = 'Stationary Bike';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'C', 'Legs', 2, 'Big day. Eat well beforehand.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 8, null, 150, null from public.exercises where name = 'Barbell Back Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 120, null from public.exercises where name = 'Romanian Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 12, null, 90, null from public.exercises where name = 'Leg Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 15, null, 60, null from public.exercises where name = 'Leg Extension';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 12, null, 60, null from public.exercises where name = 'Lying Leg Curl';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 15, null, 60, null from public.exercises where name = 'Standing Calf Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 3, 12, null, 60, null from public.exercises where name = 'Hanging Knee Raise';
end $$;

-- Push / Pull / Legs · 6-day
do $$
declare p uuid; s uuid;
begin
  if exists (select 1 from public.workout_plans where client_id is null and name = 'Push / Pull / Legs · 6-day') then return; end if;
  insert into public.workout_plans (client_id, name, schedule_type, sessions_per_week, progression_enabled) values (null, 'Push / Pull / Legs · 6-day', 'rolling', 6, true) returning id into p;
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'A', 'Push A — Heavy', 0, 'Heavy pressing. Leave 1–2 reps in the tank.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 6, null, 150, null from public.exercises where name = 'Barbell Bench Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 6, null, 150, null from public.exercises where name = 'Barbell Overhead Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 8, null, 90, null from public.exercises where name = 'Incline Dumbbell Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 12, null, 60, null from public.exercises where name = 'Dumbbell Lateral Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 10, null, 75, null from public.exercises where name = 'Skull Crusher';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'B', 'Pull A — Heavy', 1, 'Deadlift fresh, first thing.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 5, null, 180, null from public.exercises where name = 'Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 4, 6, null, 120, null from public.exercises where name = 'Pull-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 8, null, 120, null from public.exercises where name = 'Barbell Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 15, null, 60, null from public.exercises where name = 'Face Pull';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 8, null, 75, null from public.exercises where name = 'Barbell Curl';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'C', 'Legs A — Heavy', 2, 'Squat depth you can own. Brace hard.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 6, null, 180, null from public.exercises where name = 'Barbell Back Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 8, null, 120, null from public.exercises where name = 'Romanian Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 8, null, 90, null from public.exercises where name = 'Bulgarian Split Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 4, 10, null, 60, null from public.exercises where name = 'Standing Calf Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, null, 45, 45, null from public.exercises where name = 'Plank';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'D', 'Push B — Volume', 3, 'Lighter weights, more reps, short rests. Chase the pump.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 10, null, 90, null from public.exercises where name = 'Incline Barbell Bench Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 12, null, 75, null from public.exercises where name = 'Machine Chest Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 12, null, 75, null from public.exercises where name = 'Arnold Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 15, null, 60, null from public.exercises where name = 'Cable Fly';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 15, null, 45, null from public.exercises where name = 'Cable Lateral Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 15, null, 45, null from public.exercises where name = 'Triceps Pushdown';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'E', 'Pull B — Volume', 4, 'Squeeze and pause on every rep.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 12, null, 75, null from public.exercises where name = 'Lat Pulldown';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 12, null, 75, null from public.exercises where name = 'Chest-Supported Dumbbell Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 12, null, 75, null from public.exercises where name = 'Seated Cable Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 15, null, 45, null from public.exercises where name = 'Reverse Pec Deck';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 12, null, 60, null from public.exercises where name = 'Incline Dumbbell Curl';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 15, null, 45, null from public.exercises where name = 'Cable Curl';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'F', 'Legs B — Volume', 5, 'Glutes and hamstrings focus. Slow and controlled.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 10, null, 120, null from public.exercises where name = 'Hack Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 12, null, 90, null from public.exercises where name = 'Barbell Hip Thrust';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 12, null, 90, null from public.exercises where name = 'Walking Lunge';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 15, null, 60, null from public.exercises where name = 'Leg Extension';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 15, null, 60, null from public.exercises where name = 'Seated Leg Curl';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 15, null, 45, null from public.exercises where name = 'Seated Calf Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 3, 12, null, 60, null from public.exercises where name = 'Hanging Leg Raise';
end $$;

-- Upper / Lower / Full · 3-day
do $$
declare p uuid; s uuid;
begin
  if exists (select 1 from public.workout_plans where client_id is null and name = 'Upper / Lower / Full · 3-day') then return; end if;
  insert into public.workout_plans (client_id, name, schedule_type, sessions_per_week, progression_enabled) values (null, 'Upper / Lower / Full · 3-day', 'rolling', 3, true) returning id into p;
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'A', 'Upper', 0, 'All of your upper body in one session.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 8, null, 120, null from public.exercises where name = 'Barbell Bench Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 4, 10, null, 90, null from public.exercises where name = 'Lat Pulldown';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 10, null, 90, null from public.exercises where name = 'Dumbbell Shoulder Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 12, null, 75, null from public.exercises where name = 'Seated Cable Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 15, null, 60, null from public.exercises where name = 'Dumbbell Lateral Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 2, 12, null, 45, null from public.exercises where name = 'Dumbbell Curl';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 2, 12, null, 45, null from public.exercises where name = 'Triceps Pushdown';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'B', 'Lower', 1, 'Legs and core.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 8, null, 150, null from public.exercises where name = 'Barbell Back Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 120, null from public.exercises where name = 'Romanian Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 12, null, 90, null from public.exercises where name = 'Walking Lunge';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 12, null, 60, null from public.exercises where name = 'Lying Leg Curl';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 15, null, 60, null from public.exercises where name = 'Standing Calf Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, null, 45, 45, null from public.exercises where name = 'Plank';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 1, null, 600, 0, 'Finisher — brisk, steady pace' from public.exercises where name = 'Incline Treadmill Walk';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'C', 'Full Body', 2, 'A bit of everything — finish strong.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, 8, null, 150, null from public.exercises where name = 'Trap Bar Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 90, null from public.exercises where name = 'Incline Dumbbell Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 10, null, 90, null from public.exercises where name = 'Single-Arm Dumbbell Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 12, null, 90, null from public.exercises where name = 'Goblet Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 15, null, 60, null from public.exercises where name = 'Face Pull';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 10, null, 45, null from public.exercises where name = 'Dead Bug';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 1, null, 600, 0, 'Finisher — brisk, steady pace' from public.exercises where name = 'Incline Treadmill Walk';
end $$;

-- Body-Part Split · 5-day
do $$
declare p uuid; s uuid;
begin
  if exists (select 1 from public.workout_plans where client_id is null and name = 'Body-Part Split · 5-day') then return; end if;
  insert into public.workout_plans (client_id, name, schedule_type, sessions_per_week, progression_enabled) values (null, 'Body-Part Split · 5-day', 'rolling', 5, true) returning id into p;
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'A', 'Chest', 0, 'One muscle group a day, lots of volume.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 8, null, 120, null from public.exercises where name = 'Barbell Bench Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 4, 10, null, 90, null from public.exercises where name = 'Incline Dumbbell Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 12, null, 75, null from public.exercises where name = 'Machine Chest Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 15, null, 60, null from public.exercises where name = 'Cable Fly';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 10, null, 90, null from public.exercises where name = 'Chest Dip';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 1, null, 600, 0, 'Finisher — brisk, steady pace' from public.exercises where name = 'Incline Treadmill Walk';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'B', 'Back', 1, 'Width and thickness. Full stretch on every pulldown.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 10, null, 90, null from public.exercises where name = 'Lat Pulldown';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 4, 8, null, 120, null from public.exercises where name = 'Barbell Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 12, null, 75, null from public.exercises where name = 'Seated Cable Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 10, null, 90, null from public.exercises where name = 'Single-Arm Dumbbell Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 12, null, 60, null from public.exercises where name = 'Back Extension';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 1, null, 600, 0, 'Finisher — steady pace' from public.exercises where name = 'Stationary Bike';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'C', 'Legs', 2, 'Your hardest day — fuel up.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 8, null, 150, null from public.exercises where name = 'Barbell Back Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 4, 12, null, 120, null from public.exercises where name = 'Leg Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 10, null, 120, null from public.exercises where name = 'Romanian Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 15, null, 60, null from public.exercises where name = 'Leg Extension';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 12, null, 60, null from public.exercises where name = 'Lying Leg Curl';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 4, 15, null, 45, null from public.exercises where name = 'Standing Calf Raise';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'D', 'Shoulders', 3, 'Light and strict on raises — no swinging.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 8, null, 120, null from public.exercises where name = 'Barbell Overhead Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 90, null from public.exercises where name = 'Arnold Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 4, 15, null, 45, null from public.exercises where name = 'Cable Lateral Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 15, null, 45, null from public.exercises where name = 'Reverse Pec Deck';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 15, null, 45, null from public.exercises where name = 'Face Pull';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 12, null, 60, null from public.exercises where name = 'Hanging Knee Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 1, null, 600, 0, 'Finisher — brisk, steady pace' from public.exercises where name = 'Incline Treadmill Walk';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'E', 'Arms', 4, 'Biceps and triceps, alternating. Squeeze at the top.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 10, null, 75, null from public.exercises where name = 'Barbell Curl';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 4, 8, null, 90, null from public.exercises where name = 'Close-Grip Bench Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 12, null, 60, null from public.exercises where name = 'Hammer Curl';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 12, null, 60, null from public.exercises where name = 'Overhead Cable Triceps Extension';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 12, null, 60, null from public.exercises where name = 'Incline Dumbbell Curl';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 15, null, 45, null from public.exercises where name = 'Triceps Pushdown';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 1, null, 600, 0, 'Finisher — brisk, steady pace' from public.exercises where name = 'Incline Treadmill Walk';
end $$;

-- Glute & Lower Focus · 4-day
do $$
declare p uuid; s uuid;
begin
  if exists (select 1 from public.workout_plans where client_id is null and name = 'Glute & Lower Focus · 4-day') then return; end if;
  insert into public.workout_plans (client_id, name, schedule_type, sessions_per_week, progression_enabled) values (null, 'Glute & Lower Focus · 4-day', 'rolling', 4, true) returning id into p;
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'A', 'Glutes A', 0, 'Pause and squeeze at the top of every hip thrust.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 10, null, 90, null from public.exercises where name = 'Barbell Hip Thrust';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 120, null from public.exercises where name = 'Romanian Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 10, null, 90, null from public.exercises where name = 'Bulgarian Split Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 15, null, 45, null from public.exercises where name = 'Cable Kickback';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 20, null, 45, null from public.exercises where name = 'Hip Abduction Machine';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 1, null, 600, 0, 'Finisher — brisk, steady pace' from public.exercises where name = 'Incline Treadmill Walk';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'B', 'Upper', 1, 'Balanced upper body for posture and shape.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, 10, null, 90, null from public.exercises where name = 'Lat Pulldown';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 90, null from public.exercises where name = 'Dumbbell Shoulder Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 12, null, 75, null from public.exercises where name = 'Seated Cable Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 10, null, 90, null from public.exercises where name = 'Incline Dumbbell Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 15, null, 60, null from public.exercises where name = 'Dumbbell Lateral Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, null, 45, 45, null from public.exercises where name = 'Plank';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'C', 'Glutes B', 2, 'Sit back into the squat. Drive through your heels.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 8, null, 150, null from public.exercises where name = 'Barbell Back Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 12, null, 90, null from public.exercises where name = 'Cable Pull-Through';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 10, null, 90, null from public.exercises where name = 'Step-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 20, null, 45, null from public.exercises where name = 'Frog Pump';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 12, null, 60, null from public.exercises where name = 'Seated Leg Curl';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 15, null, 45, null from public.exercises where name = 'Banded Lateral Walk';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 1, null, 600, 0, 'Finisher — brisk, steady pace' from public.exercises where name = 'Incline Treadmill Walk';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'D', 'Full Body', 3, 'Strength from head to toe.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, 8, null, 150, null from public.exercises where name = 'Trap Bar Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 12, null, 90, null from public.exercises where name = 'Walking Lunge';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 10, null, 90, null from public.exercises where name = 'Single-Arm Dumbbell Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 10, null, 60, null from public.exercises where name = 'Push-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 12, null, 45, null from public.exercises where name = 'Single-Leg Glute Bridge';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 10, null, 45, null from public.exercises where name = 'Dead Bug';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 1, null, 600, 0, 'Finisher — steady pace' from public.exercises where name = 'Stationary Bike';
end $$;

-- Express 30 · 3-day
do $$
declare p uuid; s uuid;
begin
  if exists (select 1 from public.workout_plans where client_id is null and name = 'Express 30 · 3-day') then return; end if;
  insert into public.workout_plans (client_id, name, schedule_type, sessions_per_week, progression_enabled) values (null, 'Express 30 · 3-day', 'rolling', 3, true) returning id into p;
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'A', 'Express A', 0, '30 minutes, short rests. Move with purpose.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, 12, null, 45, null from public.exercises where name = 'Goblet Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 45, null from public.exercises where name = 'Dumbbell Bench Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 10, null, 45, null from public.exercises where name = 'Single-Arm Dumbbell Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 10, null, 45, null from public.exercises where name = 'Dumbbell Romanian Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 2, null, 40, 30, null from public.exercises where name = 'Plank';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'B', 'Express B', 1, 'Keep rests short — this is about density.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, 10, null, 45, null from public.exercises where name = 'Walking Lunge';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 12, null, 45, null from public.exercises where name = 'Lat Pulldown';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 10, null, 45, null from public.exercises where name = 'Dumbbell Shoulder Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 15, null, 30, null from public.exercises where name = 'Glute Bridge';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 2, null, 30, 30, null from public.exercises where name = 'Mountain Climber';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'C', 'Express C', 2, 'Full body, fast. Done is better than perfect.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, 10, null, 45, null from public.exercises where name = 'Dumbbell Thruster';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 12, null, 45, null from public.exercises where name = 'Push-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 10, null, 45, null from public.exercises where name = 'Chest-Supported Dumbbell Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 10, null, 45, null from public.exercises where name = 'Reverse Lunge';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 2, 10, null, 30, null from public.exercises where name = 'Dead Bug';
end $$;

-- Home Dumbbell · 3-day
do $$
declare p uuid; s uuid;
begin
  if exists (select 1 from public.workout_plans where client_id is null and name = 'Home Dumbbell · 3-day') then return; end if;
  insert into public.workout_plans (client_id, name, schedule_type, sessions_per_week, progression_enabled) values (null, 'Home Dumbbell · 3-day', 'rolling', 3, true) returning id into p;
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'A', 'Home A', 0, 'Needs: a pair of dumbbells and a bench or sturdy step.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 12, null, 75, null from public.exercises where name = 'Goblet Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 4, 10, null, 75, null from public.exercises where name = 'Dumbbell Bench Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 4, 10, null, 60, null from public.exercises where name = 'Single-Arm Dumbbell Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 12, null, 75, null from public.exercises where name = 'Dumbbell Romanian Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 15, null, 45, null from public.exercises where name = 'Dumbbell Lateral Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 10, null, 45, null from public.exercises where name = 'Dead Bug';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'B', 'Home B', 1, 'Slow the lowering down to make light weights work harder.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, 10, null, 75, null from public.exercises where name = 'Bulgarian Split Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 75, null from public.exercises where name = 'Dumbbell Shoulder Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 12, null, 60, null from public.exercises where name = 'Push-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 10, null, 60, null from public.exercises where name = 'Single-Leg Romanian Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 12, null, 45, null from public.exercises where name = 'Hammer Curl';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 12, null, 45, null from public.exercises where name = 'Overhead Dumbbell Triceps Extension';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 2, null, 30, 30, null from public.exercises where name = 'Side Plank';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'C', 'Home C', 2, 'Finish with a brisk walk outside if you can.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, 10, null, 75, null from public.exercises where name = 'Reverse Lunge';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 75, null from public.exercises where name = 'Incline Dumbbell Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 15, null, 45, null from public.exercises where name = 'Rear Delt Fly';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 12, null, 60, null from public.exercises where name = 'Dumbbell Hip Thrust';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 10, null, 60, null from public.exercises where name = 'Dumbbell Thruster';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, null, 45, 45, null from public.exercises where name = 'Plank';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 1, null, 900, 0, 'Finisher — brisk pace' from public.exercises where name = 'Outdoor Walk';
end $$;

-- Zero Equipment / Hotel · 3-day
do $$
declare p uuid; s uuid;
begin
  if exists (select 1 from public.workout_plans where client_id is null and name = 'Zero Equipment / Hotel · 3-day') then return; end if;
  insert into public.workout_plans (client_id, name, schedule_type, sessions_per_week, progression_enabled) values (null, 'Zero Equipment / Hotel · 3-day', 'rolling', 3, true) returning id into p;
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'A', 'Bodyweight A', 0, 'No equipment, any room. Short rests keep it challenging.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 20, null, 45, null from public.exercises where name = 'Bodyweight Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 4, 12, null, 45, null from public.exercises where name = 'Push-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, null, 30, 30, null from public.exercises where name = 'Superman Hold';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 20, null, 30, null from public.exercises where name = 'Glute Bridge';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, null, 45, 30, null from public.exercises where name = 'Plank';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 10, null, 45, null from public.exercises where name = 'Burpee';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'B', 'Bodyweight B', 1, 'Explosive on the jumps, controlled on the way down.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, 12, null, 45, null from public.exercises where name = 'Jump Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 45, null from public.exercises where name = 'Pike Push-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 12, null, 30, null from public.exercises where name = 'Single-Leg Glute Bridge';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 12, null, 45, null from public.exercises where name = 'Bench Dip';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 12, null, 30, null from public.exercises where name = 'Dead Bug';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, null, 30, 30, null from public.exercises where name = 'Mountain Climber';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 3, null, 30, 30, null from public.exercises where name = 'High Knees';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'C', 'Bodyweight C', 2, 'Use a chair or door frame for balance on the single-leg work.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, 6, null, 45, null from public.exercises where name = 'Assisted Pistol Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 45, null from public.exercises where name = 'Feet-Elevated Push-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, null, 45, 30, null from public.exercises where name = 'Wall Sit';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 10, null, 30, null from public.exercises where name = 'Bird Dog';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, null, 20, 30, null from public.exercises where name = 'Hollow Body Hold';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, null, 45, 30, null from public.exercises where name = 'Jumping Jacks';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 3, 8, null, 45, null from public.exercises where name = 'Burpee';
end $$;

-- Hybrid Strength + Conditioning · 4-day
do $$
declare p uuid; s uuid;
begin
  if exists (select 1 from public.workout_plans where client_id is null and name = 'Hybrid Strength + Conditioning · 4-day') then return; end if;
  insert into public.workout_plans (client_id, name, schedule_type, sessions_per_week, progression_enabled) values (null, 'Hybrid Strength + Conditioning · 4-day', 'rolling', 4, true) returning id into p;
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'A', 'Strength — Upper', 0, 'Strong and fit. Heavy first, then carry.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 6, null, 150, null from public.exercises where name = 'Barbell Bench Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 4, 6, null, 120, null from public.exercises where name = 'Pull-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 6, null, 120, null from public.exercises where name = 'Push Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 10, null, 90, null from public.exercises where name = 'Single-Arm Dumbbell Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, null, 40, 60, null from public.exercises where name = 'Farmer''s Carry';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'B', 'Engine — Intervals', 1, 'Hard efforts, full recovery between. Quality over quantity.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 1, null, 480, 60, 'Warm-up pace, building up' from public.exercises where name = 'Rowing Machine';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 8, null, 30, 60, '30 s hard, 60 s easy' from public.exercises where name = 'Running Intervals';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 15, null, 60, null from public.exercises where name = 'Kettlebell Swing';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 10, null, 60, null from public.exercises where name = 'Burpee';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 2, null, 45, 30, null from public.exercises where name = 'Plank';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'C', 'Strength — Lower', 2, 'Explosive box jumps first, while you''re fresh.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, 5, null, 90, 'Step down every rep' from public.exercises where name = 'Box Jump';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 4, 6, null, 150, null from public.exercises where name = 'Barbell Back Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 8, null, 120, null from public.exercises where name = 'Romanian Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 10, null, 90, null from public.exercises where name = 'Walking Lunge';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 10, null, 60, null from public.exercises where name = 'Hanging Leg Raise';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'D', 'Engine — Steady', 3, 'Easy pace — you should be able to hold a conversation.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 1, null, 1500, 60, 'Zone 2: conversational pace' from public.exercises where name = 'Treadmill Run';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 4, null, 30, 45, null from public.exercises where name = 'Battle Ropes';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 12, null, 60, null from public.exercises where name = 'Medicine Ball Slam';
end $$;

-- Calisthenics · 3-day
do $$
declare p uuid; s uuid;
begin
  if exists (select 1 from public.workout_plans where client_id is null and name = 'Calisthenics · 3-day') then return; end if;
  insert into public.workout_plans (client_id, name, schedule_type, sessions_per_week, progression_enabled) values (null, 'Calisthenics · 3-day', 'rolling', 3, true) returning id into p;
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'A', 'Push', 0, 'Needs: a floor and something to dip on. Perfect reps only.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 4, 12, null, 60, null from public.exercises where name = 'Push-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 8, null, 90, null from public.exercises where name = 'Chest Dip';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 8, null, 75, null from public.exercises where name = 'Pike Push-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 6, null, 75, null from public.exercises where name = 'Archer Push-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, null, 20, 60, null from public.exercises where name = 'Wall Handstand Hold';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, null, 20, 45, null from public.exercises where name = 'Hollow Body Hold';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'B', 'Pull', 1, 'Needs: a pull-up bar. Slow negatives build the strength for full pull-ups.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, 10, null, 60, null from public.exercises where name = 'Scapular Pull-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 4, 5, null, 90, null from public.exercises where name = 'Negative Pull-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 10, null, 60, null from public.exercises where name = 'Inverted Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 6, null, 120, null from public.exercises where name = 'Chin-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 12, null, 60, null from public.exercises where name = 'Hanging Knee Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, null, 10, 60, null from public.exercises where name = 'L-Sit Hold';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'C', 'Legs & Core', 2, 'Single-leg strength and a bulletproof core.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, 6, null, 60, null from public.exercises where name = 'Assisted Pistol Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 60, null from public.exercises where name = 'Jump Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 12, null, 45, null from public.exercises where name = 'Single-Leg Glute Bridge';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 15, null, 45, null from public.exercises where name = 'Single-Leg Calf Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, null, 45, 45, null from public.exercises where name = 'Wall Sit';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 10, null, 45, null from public.exercises where name = 'Dead Bug';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 6, 3, null, 30, 30, null from public.exercises where name = 'Side Plank';
end $$;

-- Boxing Conditioning · 3-day
do $$
declare p uuid; s uuid;
begin
  if exists (select 1 from public.workout_plans where client_id is null and name = 'Boxing Conditioning · 3-day') then return; end if;
  insert into public.workout_plans (client_id, name, schedule_type, sessions_per_week, progression_enabled) values (null, 'Boxing Conditioning · 3-day', 'rolling', 3, true) returning id into p;
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'A', 'Bag Work', 0, 'No partner needed. Hands up, breathe out on every punch.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, null, 180, 60, null from public.exercises where name = 'Jump Rope';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, null, 180, 60, 'Jab, cross, hook — stay light on your feet' from public.exercises where name = 'Shadow Boxing';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 4, null, 180, 60, null from public.exercises where name = 'Heavy Bag Rounds';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 15, null, 45, null from public.exercises where name = 'Push-up';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, 20, null, 45, null from public.exercises where name = 'Russian Twist';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, null, 45, 30, null from public.exercises where name = 'Plank';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'B', 'Power', 1, 'Explosive power from the ground up.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, null, 120, 45, null from public.exercises where name = 'Jump Rope';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, null, 180, 60, null from public.exercises where name = 'Shadow Boxing';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 12, null, 60, null from public.exercises where name = 'Medicine Ball Slam';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 15, null, 60, null from public.exercises where name = 'Kettlebell Swing';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 4, null, 30, 45, null from public.exercises where name = 'Battle Ropes';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 3, 20, null, 45, null from public.exercises where name = 'Bicycle Crunch';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'C', 'Fight Fitness', 2, 'Short, sharp rounds. Keep your guard up when tired.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 6, null, 120, 60, 'Mix combinations every round' from public.exercises where name = 'Heavy Bag Rounds';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 45, null from public.exercises where name = 'Skater Jump';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 10, null, 60, null from public.exercises where name = 'Burpee';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 15, null, 45, null from public.exercises where name = 'Band Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 3, null, 20, 45, null from public.exercises where name = 'Hollow Body Hold';
end $$;

-- Maintenance Minimum · 2-day
do $$
declare p uuid; s uuid;
begin
  if exists (select 1 from public.workout_plans where client_id is null and name = 'Maintenance Minimum · 2-day') then return; end if;
  insert into public.workout_plans (client_id, name, schedule_type, sessions_per_week, progression_enabled) values (null, 'Maintenance Minimum · 2-day', 'rolling', 2, true) returning id into p;
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'A', 'Full Body A', 0, 'Busy period? Two sessions a week holds your results.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, 8, null, 150, null from public.exercises where name = 'Barbell Back Squat';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 8, null, 120, null from public.exercises where name = 'Barbell Bench Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 10, null, 90, null from public.exercises where name = 'Lat Pulldown';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 10, null, 120, null from public.exercises where name = 'Romanian Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 2, null, 45, 45, null from public.exercises where name = 'Plank';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 1, null, 600, 0, 'Finisher — brisk, steady pace' from public.exercises where name = 'Incline Treadmill Walk';
  insert into public.plan_sessions (plan_id, label, name, sort_order, coach_note) values (p, 'B', 'Full Body B', 1, 'Keep the weights where they are — this is about showing up.') returning id into s;
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 0, 3, 6, null, 150, null from public.exercises where name = 'Trap Bar Deadlift';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 1, 3, 10, null, 90, null from public.exercises where name = 'Dumbbell Shoulder Press';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 2, 3, 10, null, 90, null from public.exercises where name = 'Seated Cable Row';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 3, 3, 10, null, 90, null from public.exercises where name = 'Walking Lunge';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 4, 2, 12, null, 60, null from public.exercises where name = 'Hanging Knee Raise';
  insert into public.plan_exercises (session_id, exercise_id, sort_order, sets, target_reps, target_seconds, rest_seconds, note) select s, id, 5, 1, null, 600, 0, 'Finisher — steady pace' from public.exercises where name = 'Stationary Bike';
end $$;

-- Check: every template and how many exercises it has
select name, (select count(*) from public.plan_sessions s where s.plan_id = p.id) as sessions,
       (select count(*) from public.plan_exercises e join public.plan_sessions s on s.id = e.session_id where s.plan_id = p.id) as exercises
from public.workout_plans p where client_id is null order by name;
