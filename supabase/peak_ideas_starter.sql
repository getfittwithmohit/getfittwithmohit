-- ============================================================================
-- PEAK Ideas — starter pack: 14 original ideas (two weeks, all six topics).
-- Safe to re-run (skips any hook that already exists).
-- They arrive as DRAFTS: approve them in Coach Dashboard → PEAK Ideas → Review.
-- Run AFTER supabase/peak_ideas.sql.
-- ============================================================================

insert into public.peak_ideas
  (topic, hook, body, action, easier_action, coach_take, recall_question, recall_options, recall_answer, triggers)
select v.* from (values
  ('Consistency', 'Motivation follows action. Not the other way round.', 'Most people wait to feel motivated before they train. On busy weeks, that feeling rarely shows up.

Motivation is a result, not a starting point. The first five minutes of moving create the energy you were waiting for.

On low days, don''t negotiate with the whole workout. Commit only to starting.', 'Tonight, put your gym shoes and clothes where you''ll see them first thing.', 'Just put your gym shoes by the door.', 'After a 12-hour day I don''t ask clients for a workout. I ask for shoes on. Most days, the workout follows.', 'On a low-energy day, what do you commit to?', array['Skipping it and resting fully','Only starting: the first five minutes','Waiting until you feel ready']::text[], 1, array['low_energy','missed_workout']::text[]),
  ('Consistency', 'Never miss twice. One skipped day is life. Two is a new habit.', 'Missing a workout or eating off plan once doesn''t undo anything. A wedding, a late meeting, a sick child: life happens.

The damage starts on day two, when one miss quietly becomes the new normal.

So the rule after any slip is simple. At the very next chance, do something. Even something small.', 'Put your next workout in your calendar now, with a time and a place.', 'Do ten squats right now, wherever you are.', 'Monday is not a magic day. The next meal and the next morning are your restart.', 'What matters most after a missed day?', array['Making up for it with double work','Starting fresh next Monday','Not missing the next one']::text[], 2, array['missed_workout','overeating']::text[]),
  ('Consistency', 'You don''t need a perfect week. You need a minimum week.', 'When travel, deadlines or a family function hits, most people drop everything because they can''t do the full plan.

Decide your minimum in advance: the version you''ll do even in your worst week. Maybe two 20-minute workouts, protein at every meal and 7,000 steps.

Hitting your minimum keeps the habit alive until normal life returns.', 'Write down your minimum week: the workouts, food and steps you''ll hit no matter what.', 'Decide your one non-negotiable for this week.', 'Most of my clients travel or work late. The ones who win aren''t perfect. They protect their minimum.', 'What is a minimum week for?', array['Keeping the habit alive in hard weeks','Resting completely when busy','Replacing your normal plan for good']::text[], 0, array['comeback','missed_workout']::text[]),
  ('Identity', 'The words after ''I am'' quietly decide your choices.', 'Listen to how you describe yourself. ''I''m not a morning person.'' ''I have a sweet tooth.'' ''I''m too busy to train.''

Your mind works hard to keep those sentences true, so your choices follow your labels.

Change the sentence first. ''I''m someone who moves every day'' gives you a reason to act before the results arrive.', 'Write one new ''I am'' sentence about your health and make it your phone wallpaper.', 'Say your new ''I am'' sentence out loud once today.', 'Clients who change the sentence first stop needing me to chase them. They start chasing themselves.', 'Why change how you describe yourself?', array['Your choices tend to follow your labels','It impresses the people around you','It replaces the need for action']::text[], 0, array['new_start']::text[]),
  ('Identity', 'Keep small promises to yourself. Self-trust is built, not found.', 'You''d stop trusting a friend who kept cancelling on you. Your mind keeps the same score on you.

Every snoozed alarm and broken ''from tomorrow'' teaches you that your own word doesn''t count.

The fix isn''t a bigger promise. It''s a tiny one you keep today. Confidence is just a long list of kept promises.', 'Choose one promise so small you can''t fail, and keep it before tonight.', 'Drink one glass of water right now. Promise kept.', null, 'How is self-trust rebuilt?', array['With one big, bold goal','By keeping small promises again and again','By waiting for confidence to arrive']::text[], 1, array['comeback','new_start']::text[]),
  ('Nutrition', 'You don''t eat what you want. You eat what''s in front of you.', 'By evening, after a long day of decisions, willpower runs low. That''s when the biscuit tin, the namkeen packet and the open fridge win.

It isn''t weakness. We eat what is easy and visible.

So make the good choice the easy one. Fruit and protein at eye level. Snacks in a closed box on a high shelf, or out of the house.', 'Move one tempting snack out of sight and put a healthy option in its place.', 'Put a bowl of fruit where you''ll see it first.', 'I''d rather a client spend five minutes rearranging their kitchen than five days fighting cravings.', 'What usually decides what you eat in the evening?', array['How strong your willpower is','How hungry you were at lunch','What''s easy and visible around you']::text[], 2, array['overeating']::text[]),
  ('Nutrition', 'Build your plate the other way round: protein first, every meal.', 'Most Indian meals are built around rice or rotis, with protein as a small side: a spoon of dal, a few pieces of paneer.

That''s why so many people feel hungry an hour later and snack all evening.

You don''t need a new diet. Start each meal by putting a palm-sized portion of protein on your plate first, then add the rest.', 'At your next meal, put a palm-sized portion of protein on the plate first.', 'Add one extra protein item to today''s lunch.', 'Dal, eggs, paneer, curd, chicken, tofu. Pick what your family already cooks. Just put it first.', 'What goes on your plate first?', array['Rice or rotis','A palm-sized portion of protein','A big salad']::text[], 1, '{}'::text[]),
  ('Focus', 'If it''s not in your calendar, it''s not a plan. It''s a hope.', 'Meetings, calls and family plans all have a fixed time. Your workout usually doesn''t, so it''s the first thing to go.

People who stay fit through busy seasons don''t have more time. They decide where their time goes before the week decides for them.

Treat training like a client meeting: fixed time, fixed place, not moved lightly.', 'Block three workout slots in your calendar this week and name them like meetings.', 'Block just one 30-minute slot for tomorrow.', null, 'Why put workouts in your calendar?', array['So others can see you''re busy','It makes workouts shorter','Unplanned time gets taken by other things']::text[], 2, array['missed_workout']::text[]),
  ('Focus', 'Your phone is the first meeting of your day. Cancel it.', 'Most people check messages within minutes of waking. Before water or a single clear thought, the day already belongs to other people''s urgent requests.

The first 30 minutes set the tone for the rest of the day.

Give them to yourself instead: water, movement and a moment to decide what matters today. The messages will still be there.', 'Tonight, charge your phone outside the bedroom or across the room.', 'Keep your phone face down for the first 10 minutes tomorrow.', null, 'Who should own the first 30 minutes of your day?', array['You: water, movement, your priorities','Your inbox, so you''re on top of work','Whoever messages first']::text[], 0, array['low_sleep','low_energy']::text[]),
  ('Sleep', 'Sleep isn''t a break from your progress. It''s where progress happens.', 'Training puts stress on your body. Recovery, mostly while you sleep, is when it adapts and gets stronger. Short sleep also makes cravings louder and patience shorter the next day.

Cutting sleep to fit in more work is borrowing from tomorrow.

Protect your sleep like you protect your training. It''s part of the plan, not a reward after it.', 'Set a bedtime alarm 30 minutes before you want to be asleep tonight.', 'Switch off screens 15 minutes earlier tonight.', null, 'When does your body mostly adapt and get stronger?', array['During the workout itself','Only on weekends','While you recover and sleep']::text[], 2, array['low_sleep','low_energy']::text[]),
  ('Sleep', 'A good night’s sleep starts the moment you wake up.', 'Most people only think about sleep at 11 pm. But your body clock is set by what you do all day.

Morning daylight tells your body when the day starts, so it knows when to wind down at night. Late chai and heavy late dinners push sleep later.

A better night starts with a better morning.', 'Step outside for five minutes of daylight within an hour of waking tomorrow.', 'Open the curtains and stand by the window for two minutes.', 'Morning walk, balcony chai, school drop on foot. Any daylight counts.', 'What helps set your body clock for better sleep?', array['Morning daylight','A late-evening workout','A heavier dinner']::text[], 0, array['low_sleep']::text[]),
  ('Mindset', 'Discipline isn''t forcing yourself. It''s removing the need to.', 'People think disciplined people have more willpower. Mostly, they just have fewer decisions to make.

Their gym bag is packed the night before. Lunch is already decided. Workout time is fixed.

Every decision you make in advance is one less fight with yourself in the moment. Save willpower for emergencies, not for every day.', 'Decide tomorrow''s workout time and meals tonight, and write them down.', 'Pack your gym bag tonight.', null, 'What do disciplined people mostly have?', array['More willpower than others','More free time','Fewer decisions to make in the moment']::text[], 2, array['low_energy']::text[]),
  ('Mindset', 'A bad day is part of the plan, not proof the plan failed.', 'Progress never moves in a straight line. The scale jumps after a salty dinner, energy dips in a stressful week, a workout feels heavy.

Many people read one bad day as proof that nothing works, and quit right before the change shows.

Judge your progress by the month, not the morning. One day is weather. Four weeks is climate.', 'Write down three things you''ve done well in the last month.', 'Name one thing you''ve done better this week than last.', null, 'How should you judge your progress?', array['By the trend over weeks','By each morning''s scale reading','By how you feel today']::text[], 0, array['comeback','needs_support']::text[]),
  ('Mindset', 'Compare yourself to who you were last month, not to someone online.', 'Social media shows other people''s best moments, best angles and best lighting. Your real life can''t win that comparison.

The only fair race is against your past self. Can you lift a little more, sleep a little better, or skip the late-night snack more often than before?

That''s the scoreboard that matters.', 'Write down one thing you can do today that you couldn''t do a month ago.', 'Mute one account that makes you feel behind.', null, 'Who is the fair comparison for your progress?', array['Fitness creators online','Your past self','Your fittest friend']::text[], 1, '{}'::text[])
) as v(topic, hook, body, action, easier_action, coach_take, recall_question, recall_options, recall_answer, triggers)
where not exists (select 1 from public.peak_ideas p where p.hook = v.hook);

-- Check: should show 14 (or more if you already had ideas)
select status, count(*) from public.peak_ideas group by status;
