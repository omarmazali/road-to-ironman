// Domain definitions ported from Road to Ironman V59.
// Keep progression/domain data separate from the UI.
export const PROGRAM_DEFS: Record<string, any> = {
  "bench_press_horizontal":{key:"bench_press_horizontal",name:"Bench Press",sessions:["Upper A"],target:"3×6–10",muscles:["Pectoraux","Deltoïde antérieur","Triceps"],material:"variant",variants:["smith","dumbbell"],variantLabels:{smith:"Smith machine",dumbbell:"Haltères"},profile:{smith:"smith",dumbbell:"dumbbell"}},
  "chest_supported_row":{key:"chest_supported_row",name:"Chest-Supported Row",sessions:["Upper A"],target:"3×8–12",muscles:["Haut du dos","Grand dorsal","Deltoïde postérieur"],material:"machine",profile:"machine5"},
  "neutral_grip_lat_pulldown":{key:"neutral_grip_lat_pulldown",name:"Neutral-Grip Lat Pulldown",sessions:["Upper A","Upper B"],targetBySession:{"Upper A":"3×8–12","Upper B":"2×8–12"},muscles:["Grand dorsal","Haut du dos","Biceps"],material:"machine",profile:"machine5"},
  "cable_lateral_raise_unilateral":{key:"cable_lateral_raise_unilateral",name:"Unilateral Cable Lateral Raise",sessions:["Upper A","Upper B"],targetBySession:{"Upper A":"3×10–20","Upper B":"3×10–20"},muscles:["Deltoïde latéral"],material:"cable",profile:"cable2_5"},
  "reverse_pec_deck":{key:"reverse_pec_deck",name:"Reverse Pec Deck",sessions:["Upper A","Upper B"],targetBySession:{"Upper A":"3×12–20","Upper B":"3×12–20"},muscles:["Deltoïde postérieur","Haut du dos"],material:"machine",profile:"machine5"},
  "incline_dumbbell_curl":{key:"incline_dumbbell_curl",name:"Incline Dumbbell Curl",sessions:["Upper A"],target:"2×8–12",muscles:["Biceps"],material:"dumbbell",profile:"dumbbell"},
  "overhead_cable_triceps_extension":{key:"overhead_cable_triceps_extension",name:"Overhead Cable Triceps Extension",sessions:["Upper A"],target:"2×10–15",muscles:["Triceps"],material:"cable",profile:"cable2_5"},
  "incline_dumbbell_press":{key:"incline_dumbbell_press",name:"Incline Dumbbell Press",sessions:["Upper B"],target:"3×8–12",muscles:["Pectoraux","Deltoïde antérieur","Triceps"],material:"dumbbell",profile:"dumbbell"},
  "cable_row_high_chest":{key:"cable_row_high_chest",name:"High-Chest Cable Row",sessions:["Upper B"],target:"3×8–12",muscles:["Haut du dos","Grand dorsal","Deltoïde postérieur"],material:"cable",profile:"machine5"},
  "pec_deck":{key:"pec_deck",name:"Pec Deck",sessions:["Upper B"],target:"2×10–15",muscles:["Pectoraux"],material:"machine",profile:"machine5"},
  "cable_preacher_curl":{key:"cable_preacher_curl",name:"Cable Preacher Curl",sessions:["Upper B"],target:"2×10–15",muscles:["Biceps"],material:"cable",profile:"cable2_5"},
  "cable_triceps_pushdown":{key:"cable_triceps_pushdown",name:"Cable Triceps Pushdown",sessions:["Upper B"],target:"2×10–15",muscles:["Triceps"],material:"cable",profile:"cable2_5"},
  "leg_press":{key:"leg_press",name:"Leg Press",sessions:["Lower A","Lower B"],targetBySession:{"Lower A":"3×6–10","Lower B":"3×8–12"},muscles:["Quadriceps","Grand fessier","Adducteurs"],material:"plate",profile:"plate2_5"},
  "hip_thrust":{key:"hip_thrust",name:"Hip thrust",sessions:["Lower A","Lower B"],targetBySession:{"Lower A":"3×8–12","Lower B":"2×8–12"},muscles:["Grand fessier","Ischio-jambiers"],material:"plate",profile:"plate2_5"},
  "seated_leg_curl":{key:"seated_leg_curl",name:"Seated Leg Curl",sessions:["Lower A","Lower B"],targetBySession:{"Lower A":"3×8–12","Lower B":"2×10–15"},muscles:["Ischio-jambiers"],material:"machine",profile:"machine5"},
  "leg_extension":{key:"leg_extension",name:"Leg extension",sessions:["Lower A","Lower B"],targetBySession:{"Lower A":"2×10–15","Lower B":"2×10–15"},muscles:["Quadriceps"],material:"machine",profile:"machine5"},
  "standing_calf_raise":{key:"standing_calf_raise",name:"Standing Calf Raise",sessions:["Lower A"],target:"3×8–15",muscles:["Gastrocnémien","Soléaire"],material:"machine",profile:"machine5"},
  "smith_rdl":{key:"smith_rdl",name:"Smith RDL",sessions:["Lower B"],target:"2×8–12",muscles:["Ischio-jambiers","Grand fessier"],material:"smith",profile:"smith"},
  "seated_calf_raise":{key:"seated_calf_raise",name:"Seated Calf Raise",sessions:["Lower B"],target:"3×10–20",muscles:["Soléaire"],material:"machine",profile:"machine5"}
};

export const REINFORCEMENT_DEFS: Record<string, any> = {
  bird_dog:{key:"bird_dog",name:"Bird Dog",zone:"Back",mode:"perSide",unit:"/côté",target:"2×8–12/côté",profile:"bodyweight",resistanceAllowed:true},
  side_plank:{key:"side_plank",name:"Side plank",zone:"Back",mode:"time",unit:"s",target:"2×20–45 s",profile:"bodyweight",resistanceAllowed:true},
  hip_hinge:{key:"hip_hinge",name:"Hip Hinge Technique",zone:"Back",mode:"reps",unit:"reps",target:"2×10–15",profile:"bodyweight",resistanceAllowed:true},
  external_rotation:{key:"external_rotation",name:"External Rotation",zone:"Shoulder",mode:"reps",unit:"reps",target:"3×10–15",profile:"cable2_5",resistanceAllowed:true},
  scaption:{key:"scaption",name:"Scaption",zone:"Shoulder",mode:"reps",unit:"reps",target:"2×10–15",profile:"cable2_5",resistanceAllowed:true},
  serratus_punch:{key:"serratus_punch",name:"Serratus punch",zone:"Shoulder",mode:"reps",unit:"reps",target:"2×10–15",profile:"cable2_5",resistanceAllowed:true},
  face_pull:{key:"face_pull",name:"Face Pull",zone:"Shoulder",mode:"reps",unit:"reps",target:"2×12–20",profile:"cable2_5",resistanceAllowed:true},
  eversion:{key:"eversion_resisted",name:"Resisted Eversion",zone:"Ankle",mode:"reps",unit:"reps",target:"2×12–20",profile:"cable2_5",resistanceAllowed:true},
  inversion:{key:"inversion_resisted",name:"Resisted Inversion",zone:"Ankle",mode:"reps",unit:"reps",target:"2×12–20",profile:"cable2_5",resistanceAllowed:true},
  dorsiflexion:{key:"dorsiflexion_resisted",name:"Resisted Dorsiflexion",zone:"Ankle",mode:"reps",unit:"reps",target:"2×12–20",profile:"cable2_5",resistanceAllowed:true},
  plantarflexion:{key:"plantarflexion_resisted",name:"Resisted Plantarflexion",zone:"Ankle",mode:"reps",unit:"reps",target:"2×12–20",profile:"cable2_5",resistanceAllowed:true},
  single_leg_balance:{key:"single_leg_balance",name:"Single-Leg Balance",zone:"Ankle",mode:"time",unit:"s",target:"2×30–60 s",profile:"bodyweight",resistanceAllowed:true},
  dynamic_balance:{key:"dynamic_balance",name:"Dynamic Balance / Reach",zone:"Ankle",mode:"reps",unit:"reps",target:"2×6–10/côté",profile:"bodyweight",resistanceAllowed:true,perSide:true},
  step_up:{key:"step_up",name:"Controlled Step-Up",zone:"Ankle",mode:"reps",unit:"reps/côté",target:"2×8–12/côté",profile:"bodyweight",resistanceAllowed:true,perSide:true},
  step_down:{key:"step_down",name:"Controlled Step-Down",zone:"Ankle",mode:"reps",unit:"reps/côté",target:"2×8–12/côté",profile:"bodyweight",resistanceAllowed:true,perSide:true},
  position_test:{key:"ankle_position_test",name:"Specific Position Test",zone:"Ankle",mode:"test",unit:"douleur",target:"1 test",profile:"bodyweight",resistanceAllowed:false,testOnly:true}
};

export const REINFORCEMENT_PLAN: Record<string, string[]> = {
 "Upper A":["external_rotation","scaption","serratus_punch","bird_dog","side_plank","eversion","inversion","single_leg_balance"],
 "Lower A":["hip_hinge","single_leg_balance","dynamic_balance","dorsiflexion","plantarflexion"],
 "Upper B":["external_rotation","face_pull","bird_dog","side_plank","eversion","inversion","step_up","step_down"],
 "Lower B":["hip_hinge","single_leg_balance","dynamic_balance","dorsiflexion","plantarflexion","position_test"]
};

export const CYCLE: Array<{ day: number; muscu: string | null; endurance: string | null }> = [
 {day:1,muscu:"Upper A",endurance:null},
 {day:2,muscu:"Lower A",endurance:"Natation"},
 {day:3,muscu:null,endurance:null},
 {day:4,muscu:"Upper B",endurance:null},
 {day:5,muscu:"Lower B",endurance:null},
 {day:6,muscu:"Upper B",endurance:"Natation"},
 {day:7,muscu:"Upper A",endurance:"Natation"}
];

export const LOADS: Record<string, number[]> = {
 dumbbell:[2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48],
 cable2_5:Array.from({length:41},(_,i)=>(i+1)*2.5),
 machine5:Array.from({length:25},(_,i)=>(i+1)*5),
 smith:Array.from({length:81},(_,i)=>i*2.5),
 plate2_5:Array.from({length:121},(_,i)=>i*2.5),
 bodyweight:[0]
};

export const START_DATE = '2026-08-30';
