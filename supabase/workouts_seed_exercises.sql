-- Starter exercise library: 141 exercises. Safe to re-run (existing names are skipped).
-- Video links are blank: open each exercise in Coach → Workouts → Library and use "Find demo on YouTube".
insert into public.exercises (name, muscle_group, equipment, locations, log_type, weight_step, cues) values
('Barbell Bench Press','Chest','Barbell','{gym}','weight_reps',2.5,array['Shoulder blades pinned back and down','Lower the bar to your lower chest','Feet planted, press up and slightly back']),
('Incline Barbell Bench Press','Chest','Barbell','{gym}','weight_reps',2.5,array['Bench at about 30 degrees','Bar touches your upper chest','Elbows about 45 degrees from your body']),
('Dumbbell Bench Press','Chest','Dumbbell','{gym,home,hotel}','weight_reps',2,array['Lower until the dumbbells reach chest level','Press up and slightly together','Wrists stacked over elbows']),
('Incline Dumbbell Press','Chest','Dumbbell','{gym,home,hotel}','weight_reps',2,array['Bench at about 30 degrees','Lower to the sides of your upper chest','Don''t let the dumbbells clash at the top']),
('Machine Chest Press','Chest','Machine','{gym}','weight_reps',5,array['Handles in line with mid-chest','Shoulder blades stay on the pad','Control the return, don''t let the stack slam']),
('Cable Fly','Chest','Cable','{gym}','weight_reps',2.5,array['Soft bend in the elbows throughout','Bring hands together like hugging a tree','Squeeze your chest for a second at the middle']),
('Dumbbell Fly','Chest','Dumbbell','{gym,home,hotel}','weight_reps',1,array['Soft bend in the elbows, keep it fixed','Lower until you feel a chest stretch','Lift by squeezing the chest, not the arms']),
('Pec Deck','Chest','Machine','{gym}','weight_reps',5,array['Seat height so handles are at chest level','Soft elbows, bring pads together','Slow on the way back']),
('Chest Dip','Chest','Bodyweight','{gym}','reps',2.5,array['Lean your torso forward','Lower until shoulders are just below elbows','Press up without locking out hard']),
('Push-up','Chest','Bodyweight','{gym,home,hotel}','reps',2.5,array['Body in one straight line, glutes tight','Hands just wider than shoulders','Chest to a fist''s height off the floor']),
('Feet-Elevated Push-up','Chest','Bodyweight','{gym,home,hotel}','reps',2.5,array['Feet on a bench or bed, body straight','Lower your chest towards the floor','Elbows about 45 degrees from your body']),
('Knee Push-up','Chest','Bodyweight','{gym,home,hotel}','reps',2.5,array['Straight line from knees to head','Hands under shoulders, slightly wider','Lower your chest, not your hips']),
('Deadlift','Back','Barbell','{gym}','weight_reps',5,array['Bar over mid-foot, shins close to the bar','Brace hard, chest up, back flat','Push the floor away, finish with glutes']),
('Trap Bar Deadlift','Back','Trap bar','{gym}','weight_reps',5,array['Stand in the centre of the bar','Hips down, chest up, arms long','Drive through the whole foot']),
('Romanian Deadlift','Back','Barbell','{gym}','weight_reps',2.5,array['Soft knees, push your hips back','Bar slides down your thighs','Stop when hamstrings are stretched, back stays flat']),
('Dumbbell Romanian Deadlift','Back','Dumbbell','{gym,home,hotel}','weight_reps',2,array['Hinge at the hips, soft knees','Dumbbells close to your legs','Squeeze glutes to stand tall']),
('Pull-up','Back','Bodyweight','{gym}','reps',2.5,array['Hands just wider than shoulders','Pull your chest towards the bar','Full hang at the bottom, no swinging']),
('Chin-up','Back','Bodyweight','{gym}','reps',2.5,array['Palms facing you, shoulder-width','Lead with your chest','Lower all the way down with control']),
('Assisted Pull-up','Back','Machine','{gym}','weight_reps',5,array['More assistance weight makes it easier','Pull elbows down to your sides','Pause with chin over the bar']),
('Lat Pulldown','Back','Cable','{gym}','weight_reps',2.5,array['Thighs locked under the pad','Pull the bar to your upper chest','Lead with elbows, don''t lean back far']),
('Close-Grip Lat Pulldown','Back','Cable','{gym}','weight_reps',2.5,array['Neutral grip handle','Pull to your upper chest','Squeeze shoulder blades down and together']),
('Seated Cable Row','Back','Cable','{gym}','weight_reps',2.5,array['Sit tall, slight knee bend','Pull the handle to your belly button','Squeeze shoulder blades, then slow return']),
('Barbell Row','Back','Barbell','{gym}','weight_reps',2.5,array['Hinge to about 45 degrees, back flat','Pull the bar to your lower ribs','No jerking with the hips']),
('Single-Arm Dumbbell Row','Back','Dumbbell','{gym,home,hotel}','weight_reps',2,array['Hand and knee on a bench, back flat','Pull the dumbbell to your hip','Don''t twist your torso']),
('Chest-Supported Dumbbell Row','Back','Dumbbell','{gym,hotel}','weight_reps',2,array['Chest on an incline bench','Pull elbows back past your ribs','Pause and squeeze at the top']),
('T-Bar Row','Back','Machine','{gym}','weight_reps',5,array['Chest on the pad if there is one','Pull handles to your chest','Squeeze, then lower slowly']),
('Machine Row','Back','Machine','{gym}','weight_reps',5,array['Chest against the pad','Pull with elbows, not hands','Control the return']),
('Inverted Row','Back','Bodyweight','{gym,home}','reps',2.5,array['Body straight from heels to head','Pull your chest to the bar or table edge','Lower with control']),
('Band Row','Back','Resistance band','{gym,home,hotel}','reps',2.5,array['Anchor the band at chest height','Pull hands to your ribs','Squeeze shoulder blades together']),
('Band Lat Pulldown','Back','Resistance band','{gym,home,hotel}','reps',2.5,array['Anchor the band high','Pull elbows down to your sides','Keep your chest tall']),
('Face Pull','Back','Cable','{gym}','weight_reps',2.5,array['Rope at face height','Pull towards your eyes, elbows high','Rotate hands back at the end']),
('Band Pull-Apart','Back','Resistance band','{gym,home,hotel}','reps',2.5,array['Arms straight at shoulder height','Pull the band apart to your chest','Squeeze shoulder blades, slow return']),
('Back Extension','Back','Bodyweight','{gym}','reps',2.5,array['Pad just below your hips','Lower with a flat back','Rise until your body is straight, no over-arching']),
('Superman Hold','Back','Bodyweight','{gym,home,hotel}','time',2.5,array['Lie face down, arms overhead','Lift arms, chest and legs together','Hold, breathing steadily']),
('Barbell Back Squat','Legs','Barbell','{gym}','weight_reps',2.5,array['Bar on your upper back, brace hard','Sit down between your heels','Knees track over toes, drive up through mid-foot']),
('Front Squat','Legs','Barbell','{gym}','weight_reps',2.5,array['Bar on front of shoulders, elbows high','Stay upright as you sit down','Drive up keeping elbows up']),
('Goblet Squat','Legs','Dumbbell','{gym,home,hotel}','weight_reps',2,array['Hold the dumbbell at your chest','Sit down between your heels, chest up','Elbows inside the knees at the bottom']),
('Leg Press','Legs','Machine','{gym}','weight_reps',5,array['Feet shoulder-width, mid-platform','Lower until knees reach about 90 degrees','Don''t lock knees hard at the top']),
('Hack Squat','Legs','Machine','{gym}','weight_reps',5,array['Back flat against the pad','Lower with control, knees over toes','Drive through your whole foot']),
('Bulgarian Split Squat','Legs','Dumbbell','{gym,home,hotel}','weight_reps',2,array['Back foot on a bench, laces down','Lower straight down, front heel planted','Torso slightly forward for more glutes']),
('Walking Lunge','Legs','Dumbbell','{gym,home,hotel}','weight_reps',2,array['Long step, both knees to about 90 degrees','Front heel stays down','Push through the front foot to step through']),
('Reverse Lunge','Legs','Dumbbell','{gym,home,hotel}','weight_reps',2,array['Step back, lower the back knee','Front shin stays roughly vertical','Push through the front heel to return']),
('Step-up','Legs','Dumbbell','{gym,home,hotel}','weight_reps',2,array['Whole foot on a knee-height box','Drive up through the top leg','Lower slowly, don''t push off the bottom foot']),
('Bodyweight Squat','Legs','Bodyweight','{gym,home,hotel}','reps',2.5,array['Feet shoulder-width','Sit back and down, chest up','Stand tall and squeeze glutes']),
('Jump Squat','Legs','Bodyweight','{gym,home,hotel}','reps',2.5,array['Quarter to half squat, then explode up','Land softly on the balls of your feet','Reset before each rep']),
('Leg Extension','Legs','Machine','{gym}','weight_reps',5,array['Knee lined up with the machine pivot','Kick up and squeeze your quads','Lower slowly']),
('Lying Leg Curl','Legs','Machine','{gym}','weight_reps',5,array['Hips pressed into the pad','Curl heels towards your glutes','Lower slowly, don''t let it drop']),
('Seated Leg Curl','Legs','Machine','{gym}','weight_reps',5,array['Thigh pad snug on your legs','Curl down and back fully','Slow return']),
('Standing Calf Raise','Legs','Machine','{gym}','weight_reps',5,array['Balls of feet on the edge','Full stretch at the bottom','Rise high, pause one second']),
('Seated Calf Raise','Legs','Machine','{gym}','weight_reps',5,array['Pad on lower thighs','Lower heels fully','Push up and pause at the top']),
('Single-Leg Calf Raise','Legs','Bodyweight','{gym,home,hotel}','reps',2.5,array['Stand on one foot on a step','Lower the heel fully','Rise high, hold a wall for balance']),
('Wall Sit','Legs','Bodyweight','{gym,home,hotel}','time',2.5,array['Back flat against the wall','Thighs parallel to the floor','Knees over ankles, breathe']),
('Single-Leg Romanian Deadlift','Legs','Dumbbell','{gym,home,hotel}','weight_reps',2,array['Hinge on one leg, back leg reaches back','Hips stay square to the floor','Stand up by squeezing the glute']),
('Barbell Hip Thrust','Glutes','Barbell','{gym}','weight_reps',5,array['Upper back on a bench, bar over hips','Drive hips up until body is flat','Chin tucked, squeeze glutes at the top']),
('Glute Bridge','Glutes','Bodyweight','{gym,home,hotel}','reps',2.5,array['Feet flat, close to your glutes','Push through heels, hips up','Squeeze at the top for a second']),
('Single-Leg Glute Bridge','Glutes','Bodyweight','{gym,home,hotel}','reps',2.5,array['One foot planted, other leg up','Drive hips up level','Don''t let hips drop to one side']),
('Cable Kickback','Glutes','Cable','{gym}','weight_reps',2.5,array['Ankle strap on, slight forward lean','Kick back and up with a straight leg','Squeeze the glute, don''t arch your back']),
('Hip Abduction Machine','Glutes','Machine','{gym}','weight_reps',5,array['Sit tall or lean slightly forward','Push knees out against the pads','Slow return']),
('Banded Lateral Walk','Glutes','Resistance band','{gym,home,hotel}','reps',2.5,array['Band above knees, half squat','Step sideways, keep tension','Don''t let knees cave in']),
('Cable Pull-Through','Glutes','Cable','{gym}','weight_reps',2.5,array['Rope between your legs, facing away','Hinge back with soft knees','Snap hips forward, squeeze glutes']),
('Barbell Overhead Press','Shoulders','Barbell','{gym}','weight_reps',2.5,array['Bar on front of shoulders, glutes tight','Press straight up, head moves through','Lock out overhead, ribs down']),
('Dumbbell Shoulder Press','Shoulders','Dumbbell','{gym,home,hotel}','weight_reps',2,array['Dumbbells at ear height to start','Press up and slightly together','Don''t arch your lower back']),
('Arnold Press','Shoulders','Dumbbell','{gym,home,hotel}','weight_reps',2,array['Start palms facing you at chin height','Rotate palms out as you press','Reverse the rotation on the way down']),
('Machine Shoulder Press','Shoulders','Machine','{gym}','weight_reps',5,array['Handles at shoulder height','Press up without shrugging','Slow return']),
('Dumbbell Lateral Raise','Shoulders','Dumbbell','{gym,home,hotel}','weight_reps',1,array['Slight lean forward, soft elbows','Raise to shoulder height, lead with elbows','Lower slowly, no swinging']),
('Cable Lateral Raise','Shoulders','Cable','{gym}','weight_reps',2.5,array['Cable from the low pulley across your body','Raise to shoulder height','Constant tension, slow down']),
('Rear Delt Fly','Shoulders','Dumbbell','{gym,home,hotel}','weight_reps',1,array['Hinge forward, back flat','Raise arms out wide, soft elbows','Squeeze the back of your shoulders']),
('Reverse Pec Deck','Shoulders','Machine','{gym}','weight_reps',5,array['Chest against the pad','Push handles back in an arc','Pause, then slow return']),
('Pike Push-up','Shoulders','Bodyweight','{gym,home,hotel}','reps',2.5,array['Hips high, body in an upside-down V','Lower your head towards the floor','Press back up through your shoulders']),
('Dumbbell Front Raise','Shoulders','Dumbbell','{gym,home,hotel}','weight_reps',1,array['Arms straight, slight elbow bend','Raise to shoulder height in front','Lower slowly']),
('Barbell Curl','Arms','Barbell','{gym}','weight_reps',2.5,array['Elbows pinned to your sides','Curl up without swinging','Lower slowly all the way']),
('Dumbbell Curl','Arms','Dumbbell','{gym,home,hotel}','weight_reps',1,array['Elbows by your sides','Turn palms up as you curl','Slow on the way down']),
('Hammer Curl','Arms','Dumbbell','{gym,home,hotel}','weight_reps',1,array['Palms facing each other','Curl without moving your elbows','Squeeze at the top']),
('Incline Dumbbell Curl','Arms','Dumbbell','{gym,hotel}','weight_reps',1,array['Lie back on an incline bench','Arms hang straight down','Curl up keeping elbows back']),
('Cable Curl','Arms','Cable','{gym}','weight_reps',2.5,array['Elbows fixed at your sides','Curl the bar or rope up','Constant tension, slow return']),
('Preacher Curl','Arms','EZ bar','{gym}','weight_reps',2.5,array['Armpits snug on the pad','Curl up, don''t lift your elbows','Lower almost to straight arms']),
('Band Curl','Arms','Resistance band','{gym,home,hotel}','reps',2.5,array['Stand on the band','Elbows by your sides','Curl up and squeeze']),
('Triceps Pushdown','Arms','Cable','{gym}','weight_reps',2.5,array['Elbows pinned to your sides','Push down until arms are straight','Only your forearms move']),
('Overhead Cable Triceps Extension','Arms','Cable','{gym}','weight_reps',2.5,array['Face away from the cable, rope behind head','Elbows point forward, stay fixed','Straighten arms fully']),
('Overhead Dumbbell Triceps Extension','Arms','Dumbbell','{gym,home,hotel}','weight_reps',1,array['Hold one dumbbell overhead with both hands','Lower behind your head, elbows in','Press back up to straight arms']),
('Skull Crusher','Arms','EZ bar','{gym}','weight_reps',2.5,array['Lie on a bench, arms straight up','Bend elbows to lower the bar to your forehead','Extend back up, elbows stay still']),
('Close-Grip Bench Press','Arms','Barbell','{gym}','weight_reps',2.5,array['Hands shoulder-width on the bar','Elbows tucked close to your body','Lower to lower chest, press up']),
('Bench Dip','Arms','Bodyweight','{gym,home,hotel}','reps',2.5,array['Hands on a bench behind you','Lower until elbows reach 90 degrees','Push up, keep hips close to the bench']),
('Diamond Push-up','Arms','Bodyweight','{gym,home,hotel}','reps',2.5,array['Hands together under your chest','Body straight, elbows close','Lower chest to your hands']),
('Plank','Core','Bodyweight','{gym,home,hotel}','time',2.5,array['Elbows under shoulders','Squeeze glutes and brace your stomach','Straight line, don''t let hips sag']),
('Side Plank','Core','Bodyweight','{gym,home,hotel}','time',2.5,array['Elbow under your shoulder','Hips lifted, body in a straight line','Do both sides']),
('Dead Bug','Core','Bodyweight','{gym,home,hotel}','reps',2.5,array['Lower back pressed into the floor','Lower opposite arm and leg slowly','Breathe out as you extend']),
('Bird Dog','Core','Bodyweight','{gym,home,hotel}','reps',2.5,array['On hands and knees, back flat','Reach opposite arm and leg long','Pause, keep hips level']),
('Hanging Knee Raise','Core','Bodyweight','{gym}','reps',2.5,array['Hang with straight arms','Bring knees up towards your chest','Lower slowly, no swinging']),
('Hanging Leg Raise','Core','Bodyweight','{gym}','reps',2.5,array['Hang with straight arms','Raise straight legs to hip height or higher','Control the way down']),
('Cable Crunch','Core','Cable','{gym}','weight_reps',2.5,array['Kneel, rope beside your head','Curl your ribs towards your hips','Hips stay still']),
('Ab Wheel Rollout','Core','Ab wheel','{gym,home}','reps',2.5,array['Start on knees, brace hard','Roll out only as far as your back stays flat','Pull back with your stomach']),
('Russian Twist','Core','Bodyweight','{gym,home,hotel}','reps',2.5,array['Lean back slightly, chest up','Rotate your torso side to side','Count each side as one rep']),
('Mountain Climber','Core','Bodyweight','{gym,home,hotel}','time',2.5,array['Hands under shoulders, plank position','Drive knees towards your chest','Keep hips low and steady']),
('Hollow Body Hold','Core','Bodyweight','{gym,home,hotel}','time',2.5,array['Lower back pressed into the floor','Arms and legs extended, lifted off the floor','Bend knees to make it easier']),
('Pallof Press','Core','Cable','{gym}','weight_reps',2.5,array['Stand side-on to the cable','Press hands straight out from your chest','Don''t let the cable twist you']),
('Bicycle Crunch','Core','Bodyweight','{gym,home,hotel}','reps',2.5,array['Hands lightly behind your head','Elbow to opposite knee, slowly','Extend the other leg long']),
('Reverse Crunch','Core','Bodyweight','{gym,home,hotel}','reps',2.5,array['Lie on your back, knees bent','Curl hips off the floor towards your chest','Lower slowly']),
('Farmer''s Carry','Core','Dumbbell','{gym,home,hotel}','time',2,array['Heavy dumbbells at your sides','Stand tall, shoulders back','Short, quick steps']),
('Treadmill Run','Cardio','Treadmill','{gym,hotel}','time_distance',2.5,array['Land under your hips, not out in front','Relaxed shoulders','Pace you could just about talk at']),
('Incline Treadmill Walk','Cardio','Treadmill','{gym,hotel}','time_distance',2.5,array['Incline 6–12 percent','Don''t hold the handrails','Brisk pace, upright posture']),
('Outdoor Walk','Cardio','None','{gym,home,hotel}','time_distance',2.5,array['Brisk pace','Swing your arms','Stand tall']),
('Outdoor Run','Cardio','None','{gym,home,hotel}','time_distance',2.5,array['Easy, conversational pace','Short, light steps','Breathe steadily']),
('Stationary Bike','Cardio','Bike','{gym,hotel}','time_distance',2.5,array['Seat so your knee is slightly bent at the bottom','Steady cadence','Add resistance, not just speed']),
('Rowing Machine','Cardio','Rower','{gym}','time_distance',2.5,array['Legs, then body, then arms','Reverse on the way back','Power from the legs']),
('Elliptical','Cardio','Elliptical','{gym,hotel}','time_distance',2.5,array['Stand tall','Push and pull with your arms','Keep the resistance challenging']),
('Stair Climber','Cardio','Stair machine','{gym}','time',2.5,array['Don''t lean on the rails','Full step each time','Steady pace']),
('Jump Rope','Cardio','Jump rope','{gym,home,hotel}','time',2.5,array['Small jumps on the balls of your feet','Turn the rope with your wrists','Elbows close to your sides']),
('Jumping Jacks','Cardio','Bodyweight','{gym,home,hotel}','time',2.5,array['Light on your feet','Arms fully overhead','Steady rhythm']),
('Burpee','Cardio','Bodyweight','{gym,home,hotel}','reps',2.5,array['Hands down, jump feet back','Chest to the floor, then up','Jump with arms overhead']),
('High Knees','Cardio','Bodyweight','{gym,home,hotel}','time',2.5,array['Drive knees to hip height','Stay on the balls of your feet','Pump your arms']),
('Swimming','Cardio','Pool','{gym,hotel}','time_distance',2.5,array['Long, relaxed strokes','Steady breathing rhythm','Rest at the wall when you need to']),
('Kettlebell Swing','Full body','Kettlebell','{gym,home}','weight_reps',4,array['Hinge at the hips, not a squat','Snap your hips forward','Arms just guide the bell to chest height']),
('Dumbbell Thruster','Full body','Dumbbell','{gym,home,hotel}','weight_reps',2,array['Dumbbells at shoulders, squat down','Drive up and press overhead in one move','Lower dumbbells as you sit back down']),
('Bear Crawl','Full body','Bodyweight','{gym,home,hotel}','time',2.5,array['Hands under shoulders, knees just off the floor','Move opposite hand and foot together','Keep your back flat']),
('Sled Push','Full body','Sled','{gym}','time',2.5,array['Arms straight or bent, lean in','Drive with short, powerful steps','Keep your back flat']),
('Cat-Cow','Mobility','Bodyweight','{gym,home,hotel}','reps',2.5,array['On hands and knees','Round your back up, then let it dip','Move slowly with your breath']),
('World''s Greatest Stretch','Mobility','Bodyweight','{gym,home,hotel}','reps',2.5,array['Lunge forward, hand inside the front foot','Rotate the other arm up to the ceiling','Do both sides']),
('Hip Flexor Stretch','Mobility','Bodyweight','{gym,home,hotel}','time',2.5,array['Half-kneel, back knee down','Tuck your pelvis, squeeze the back glute','Gently move hips forward']),
('Open Book Rotation','Mobility','Bodyweight','{gym,home,hotel}','reps',2.5,array['Lie on your side, knees bent','Open your top arm across to the other side','Follow your hand with your eyes']),
('Deep Squat Hold','Mobility','Bodyweight','{gym,home,hotel}','time',2.5,array['Sit as low as you comfortably can','Heels down, chest up','Hold onto something if needed']),
('Hamstring Stretch','Mobility','Bodyweight','{gym,home,hotel}','time',2.5,array['Straight leg on a low step','Hinge forward with a flat back','Breathe and relax into it']),
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
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Barbell Bench Press' and a.name = 'Push-up' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Barbell Bench Press' and a.name = 'Dumbbell Bench Press' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Incline Barbell Bench Press' and a.name = 'Feet-Elevated Push-up' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Incline Barbell Bench Press' and a.name = 'Incline Dumbbell Press' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Dumbbell Bench Press' and a.name = 'Push-up' and e.home_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Incline Dumbbell Press' and a.name = 'Feet-Elevated Push-up' and e.home_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Machine Chest Press' and a.name = 'Push-up' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Machine Chest Press' and a.name = 'Dumbbell Bench Press' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Cable Fly' and a.name = 'Push-up' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Cable Fly' and a.name = 'Dumbbell Fly' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Pec Deck' and a.name = 'Push-up' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Pec Deck' and a.name = 'Dumbbell Fly' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Chest Dip' and a.name = 'Feet-Elevated Push-up' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Chest Dip' and a.name = 'Push-up' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Deadlift' and a.name = 'Single-Leg Romanian Deadlift' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Deadlift' and a.name = 'Dumbbell Romanian Deadlift' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Trap Bar Deadlift' and a.name = 'Goblet Squat' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Trap Bar Deadlift' and a.name = 'Dumbbell Romanian Deadlift' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Romanian Deadlift' and a.name = 'Single-Leg Romanian Deadlift' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Romanian Deadlift' and a.name = 'Dumbbell Romanian Deadlift' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Pull-up' and a.name = 'Band Lat Pulldown' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Pull-up' and a.name = 'Band Lat Pulldown' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Chin-up' and a.name = 'Band Lat Pulldown' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Chin-up' and a.name = 'Band Lat Pulldown' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Assisted Pull-up' and a.name = 'Band Lat Pulldown' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Assisted Pull-up' and a.name = 'Band Lat Pulldown' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Lat Pulldown' and a.name = 'Band Lat Pulldown' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Lat Pulldown' and a.name = 'Single-Arm Dumbbell Row' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Close-Grip Lat Pulldown' and a.name = 'Band Lat Pulldown' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Close-Grip Lat Pulldown' and a.name = 'Single-Arm Dumbbell Row' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Seated Cable Row' and a.name = 'Band Row' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Seated Cable Row' and a.name = 'Single-Arm Dumbbell Row' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Barbell Row' and a.name = 'Single-Arm Dumbbell Row' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Barbell Row' and a.name = 'Chest-Supported Dumbbell Row' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Chest-Supported Dumbbell Row' and a.name = 'Single-Arm Dumbbell Row' and e.home_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'T-Bar Row' and a.name = 'Single-Arm Dumbbell Row' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'T-Bar Row' and a.name = 'Chest-Supported Dumbbell Row' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Machine Row' and a.name = 'Band Row' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Machine Row' and a.name = 'Single-Arm Dumbbell Row' and e.hotel_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Inverted Row' and a.name = 'Single-Arm Dumbbell Row' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Face Pull' and a.name = 'Band Pull-Apart' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Face Pull' and a.name = 'Band Pull-Apart' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Back Extension' and a.name = 'Superman Hold' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Back Extension' and a.name = 'Superman Hold' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Barbell Back Squat' and a.name = 'Goblet Squat' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Barbell Back Squat' and a.name = 'Goblet Squat' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Front Squat' and a.name = 'Goblet Squat' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Front Squat' and a.name = 'Goblet Squat' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Leg Press' and a.name = 'Bodyweight Squat' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Leg Press' and a.name = 'Goblet Squat' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Hack Squat' and a.name = 'Goblet Squat' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Hack Squat' and a.name = 'Goblet Squat' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Leg Extension' and a.name = 'Wall Sit' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Leg Extension' and a.name = 'Bulgarian Split Squat' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Lying Leg Curl' and a.name = 'Single-Leg Glute Bridge' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Lying Leg Curl' and a.name = 'Dumbbell Romanian Deadlift' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Seated Leg Curl' and a.name = 'Single-Leg Glute Bridge' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Seated Leg Curl' and a.name = 'Dumbbell Romanian Deadlift' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Standing Calf Raise' and a.name = 'Single-Leg Calf Raise' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Standing Calf Raise' and a.name = 'Single-Leg Calf Raise' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Seated Calf Raise' and a.name = 'Single-Leg Calf Raise' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Seated Calf Raise' and a.name = 'Single-Leg Calf Raise' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Barbell Hip Thrust' and a.name = 'Glute Bridge' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Barbell Hip Thrust' and a.name = 'Single-Leg Glute Bridge' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Cable Kickback' and a.name = 'Single-Leg Glute Bridge' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Cable Kickback' and a.name = 'Single-Leg Glute Bridge' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Hip Abduction Machine' and a.name = 'Banded Lateral Walk' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Hip Abduction Machine' and a.name = 'Banded Lateral Walk' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Cable Pull-Through' and a.name = 'Glute Bridge' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Cable Pull-Through' and a.name = 'Dumbbell Romanian Deadlift' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Barbell Overhead Press' and a.name = 'Pike Push-up' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Barbell Overhead Press' and a.name = 'Dumbbell Shoulder Press' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Machine Shoulder Press' and a.name = 'Pike Push-up' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Machine Shoulder Press' and a.name = 'Dumbbell Shoulder Press' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Cable Lateral Raise' and a.name = 'Dumbbell Lateral Raise' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Cable Lateral Raise' and a.name = 'Dumbbell Lateral Raise' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Reverse Pec Deck' and a.name = 'Band Pull-Apart' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Reverse Pec Deck' and a.name = 'Rear Delt Fly' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Barbell Curl' and a.name = 'Dumbbell Curl' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Barbell Curl' and a.name = 'Dumbbell Curl' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Incline Dumbbell Curl' and a.name = 'Dumbbell Curl' and e.home_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Cable Curl' and a.name = 'Band Curl' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Cable Curl' and a.name = 'Dumbbell Curl' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Preacher Curl' and a.name = 'Dumbbell Curl' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Preacher Curl' and a.name = 'Dumbbell Curl' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Triceps Pushdown' and a.name = 'Bench Dip' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Triceps Pushdown' and a.name = 'Overhead Dumbbell Triceps Extension' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Overhead Cable Triceps Extension' and a.name = 'Overhead Dumbbell Triceps Extension' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Overhead Cable Triceps Extension' and a.name = 'Overhead Dumbbell Triceps Extension' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Skull Crusher' and a.name = 'Diamond Push-up' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Skull Crusher' and a.name = 'Overhead Dumbbell Triceps Extension' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Close-Grip Bench Press' and a.name = 'Diamond Push-up' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Close-Grip Bench Press' and a.name = 'Dumbbell Bench Press' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Hanging Knee Raise' and a.name = 'Reverse Crunch' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Hanging Knee Raise' and a.name = 'Reverse Crunch' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Hanging Leg Raise' and a.name = 'Reverse Crunch' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Hanging Leg Raise' and a.name = 'Reverse Crunch' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Cable Crunch' and a.name = 'Dead Bug' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Cable Crunch' and a.name = 'Dead Bug' and e.hotel_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Ab Wheel Rollout' and a.name = 'Plank' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Pallof Press' and a.name = 'Dead Bug' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Pallof Press' and a.name = 'Side Plank' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Treadmill Run' and a.name = 'Outdoor Run' and e.home_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Incline Treadmill Walk' and a.name = 'Outdoor Walk' and e.home_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Stationary Bike' and a.name = 'Jumping Jacks' and e.home_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Rowing Machine' and a.name = 'Burpee' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Rowing Machine' and a.name = 'Stationary Bike' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Elliptical' and a.name = 'Outdoor Walk' and e.home_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Stair Climber' and a.name = 'Step-up' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Stair Climber' and a.name = 'Incline Treadmill Walk' and e.hotel_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Kettlebell Swing' and a.name = 'Dumbbell Romanian Deadlift' and e.hotel_alt_id is null;
update public.exercises e set home_alt_id = a.id from public.exercises a where e.name = 'Sled Push' and a.name = 'Bear Crawl' and e.home_alt_id is null;
update public.exercises e set hotel_alt_id = a.id from public.exercises a where e.name = 'Sled Push' and a.name = 'Burpee' and e.hotel_alt_id is null;
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
