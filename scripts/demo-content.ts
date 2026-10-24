// A believable week with Oomi for the demo child, Leo (7). Written by hand so the parent journal,
// Oomi's memory and Oomi TV look like a real family's week, not lorem ipsum.
import type { Activity, Language } from "../src/lib/contracts";

export type SeedDiscovery = {
  key: string;
  /** Days before today, and local hour of the day. */
  daysAgo: number;
  hour: number;
  verdict: "answer" | "grown_up" | "decline";
  intent?: "question" | "challenge_report";
  language?: Language;
  question: string;
  topic?: string;
  emoji?: string;
  summary?: string;
  activity?: Activity;
  done?: boolean;
  /** Picture-book scene for the card illustration. */
  scene?: string;
  /** Pre-generate the Oomi TV explainer. */
  video?: boolean;
  alert?: string;
};

export const DISCOVERIES: SeedDiscovery[] = [
  {
    key: "sky-blue",
    daysAgo: 6,
    hour: 9,
    verdict: "answer",
    question: "Why is the sky blue?",
    topic: "Sky Colors",
    emoji: "🌈",
    summary: "Leo found out that sunlight is a mix of every color, and the air scatters the blue part all over the sky.",
    activity: {
      title: "A sunset in a glass",
      steps: [
        "Fill a clear glass with water and stir in a few drops of milk.",
        "In a dark room, shine a flashlight through the side: the water glows a little blue.",
        "Now shine it through the bottom and look from the top: it turns orange, like a sunset!",
      ],
      parentTip: "Watch tonight's sunset together and ask Leo why the sky turns orange at the end of the day.",
    },
    done: true,
    scene: "A child and a tiny coral explorer lying in the grass looking up at a huge bright blue sky, with sunbeams split into soft rainbow colors.",
    video: true,
  },
  {
    key: "walrus",
    daysAgo: 5,
    hour: 17,
    verdict: "answer",
    question: "What do walruses eat?",
    topic: "Walrus Lunch",
    emoji: "🦭",
    summary: "Leo learned that walruses slurp clams from the seafloor and find them in the dark with their super-sensitive whiskers.",
    activity: {
      title: "Whisker detective",
      steps: [
        "Hide 5 small things (a shell, a button, a coin…) in a tray of dry rice.",
        "Close your eyes and find them using only your fingertips, like walrus whiskers.",
        "Swap roles and time each other!",
      ],
      parentTip: "Ask Leo which object was the hardest to find, and why touch is so useful in the dark.",
    },
    done: true,
    scene: "A friendly walrus on the dark ocean floor feeling for clams with its big whiskers, little fish watching, soft blue light from above.",
  },
  {
    key: "what-happens-die",
    daysAgo: 5,
    hour: 19,
    verdict: "grown_up",
    question: "What happens when you die?",
    topic: "Big Feelings",
    emoji: "💛",
    summary: "Leo wondered about death. Oomi gently suggested asking you: it's a beautiful question to explore together.",
    activity: {
      title: "A gentle conversation",
      steps: [
        "Ask Leo what made them think about it today.",
        "Share, in simple words, what your family believes.",
        "Remember together someone or a pet you loved.",
      ],
      parentTip: "There's no perfect answer: listening and staying close matters more than explaining.",
    },
  },
  {
    key: "volcano",
    daysAgo: 4,
    hour: 10,
    verdict: "answer",
    question: "How do volcanoes work?",
    topic: "Volcano Power",
    emoji: "🌋",
    summary: "Leo discovered that deep underground, rock is so hot it melts, and gas pushes it up and out of volcanoes as lava.",
    activity: {
      title: "Kitchen volcano",
      steps: [
        "Put 2 spoons of baking soda and a drop of dish soap in a cup on a tray.",
        "Add a little red food coloring.",
        "Pour in vinegar and watch the foamy “lava” erupt!",
      ],
      parentTip: "Ask Leo where the bubbles come from: it's gas, just like inside a real volcano.",
    },
    done: true,
    scene: "A cheerful cartoon volcano gently puffing a cloud and glowing orange lava, a child and a tiny coral explorer watching from a safe green hill.",
    video: true,
  },
  {
    key: "moon-phases",
    daysAgo: 4,
    hour: 20,
    verdict: "answer",
    language: "fr",
    question: "Pourquoi la lune change de forme ?",
    topic: "Moon Phases",
    emoji: "🌙",
    summary: "Leo asked in French why the Moon changes shape, and learned that we only see the part of the Moon lit by the Sun.",
    activity: {
      title: "The Moon in your hands",
      steps: [
        "In a dark room, a lamp is the Sun and a ball on a pencil is the Moon.",
        "Hold the ball at arm's length and turn slowly around on the spot.",
        "Watch the lit part grow and shrink: crescent, half, full Moon!",
      ],
      parentTip: "Look for the Moon together this week and draw its shape each night.",
    },
    scene: "A child in pajamas at a window holding a small ball up to a lamp, a big crescent moon outside in a starry navy sky, cozy bedroom.",
    video: true,
  },
  {
    key: "bees-honey",
    daysAgo: 3,
    hour: 16,
    verdict: "answer",
    question: "How do bees make honey?",
    topic: "Busy Bees",
    emoji: "🐝",
    summary: "Leo learned that bees sip nectar from flowers, carry it home and fan it with their wings until it becomes honey.",
    activity: {
      title: "Flower detectives",
      steps: [
        "Find 3 different flowers outside or at the market.",
        "Look closely for the yellow pollen dust (a magnifying glass helps).",
        "At snack time, taste two kinds of honey and guess which flowers they came from.",
      ],
      parentTip: "Tell Leo that one bee makes only a tiny spoonful of honey in its whole life: it's teamwork!",
    },
    scene: "Round fuzzy bees flying between big colorful flowers toward a cozy beehive, a child and a tiny coral explorer watching with a magnifying glass.",
    video: true,
  },
  {
    key: "war-news",
    daysAgo: 3,
    hour: 18,
    verdict: "grown_up",
    question: "Why are there wars on the news?",
    topic: "Hard News",
    emoji: "🕊️",
    summary: "Leo heard something on the news and wanted to understand. Oomi invited Leo to talk about it with you.",
    activity: {
      title: "Talking about the news",
      steps: [
        "Ask Leo what they heard and how it made them feel.",
        "Reassure them: they are safe, and many grown-ups work for peace.",
        "Talk about the people who help, like doctors and rescuers.",
      ],
      parentTip: "Short, honest and reassuring answers work best at this age.",
    },
  },
  {
    key: "fire-decline",
    daysAgo: 3,
    hour: 11,
    verdict: "decline",
    question: "",
  },
  {
    key: "cats-purr",
    daysAgo: 2,
    hour: 8,
    verdict: "answer",
    question: "Why do cats purr?",
    topic: "Purr Science",
    emoji: "🐱",
    summary: "Leo discovered that cats purr by buzzing tiny muscles in their throat, often when they feel cozy and safe.",
    activity: {
      title: "Feel the buzz",
      steps: [
        "Put your hand gently on your throat and hum: feel the buzz?",
        "Hum high, then low: which one buzzes more?",
        "If you meet a calm cat, rest a hand softly on its side and feel the purr.",
      ],
      parentTip: "Ask Leo what other animals might buzz, rumble or purr.",
    },
    scene: "A sleepy orange cat curled on a cozy blanket with little vibration lines around it, a child gently petting it.",
  },
  {
    key: "pills-decline",
    daysAgo: 2,
    hour: 13,
    verdict: "decline",
    question: "",
    alert: "Where does mom keep her pills?",
  },
  {
    key: "magnets",
    daysAgo: 2,
    hour: 17,
    verdict: "answer",
    question: "How do magnets work?",
    topic: "Magnet Magic",
    emoji: "🧲",
    summary: "Leo learned that magnets have an invisible pull that grabs iron and steel, but not wood, paper or plastic.",
    activity: {
      title: "Magnet fishing",
      steps: [
        "Cut paper fish and put a paperclip on each one.",
        "Tie a magnet to a string on a stick.",
        "Go fishing! Then test what else the magnet can catch around the house.",
      ],
      parentTip: "Make a “yes / no” pile together: what does the magnet stick to?",
    },
    done: true,
    scene: "A child fishing paper fish with paperclips from a blue blanket pond using a magnet on a string, a tiny coral explorer cheering.",
  },
  {
    key: "salty-sea",
    daysAgo: 1,
    hour: 10,
    verdict: "answer",
    question: "Why is the sea salty?",
    topic: "Salty Seas",
    emoji: "🌊",
    summary: "Leo found out that rain and rivers carry tiny bits of salt from rocks to the sea, where it stays when the water evaporates.",
    activity: {
      title: "Grow a salt crystal",
      steps: [
        "Stir salt into a cup of warm water until no more dissolves.",
        "Pour a little into a dark saucer and leave it on a sunny windowsill.",
        "Check every day: sparkly salt crystals appear as the water disappears!",
      ],
      parentTip: "Ask Leo where the water went, and taste a tiny crystal together.",
    },
    scene: "Waves of a bright turquoise sea with sparkling salt crystals floating like stars, a child and a tiny coral explorer on the beach.",
  },
  {
    key: "octopus",
    daysAgo: 1,
    hour: 17,
    verdict: "answer",
    question: "Are octopuses really smart?",
    topic: "Octopus Brains",
    emoji: "🐙",
    summary: "Leo was amazed to learn that octopuses can open jars, and that each of their eight arms can feel and taste on its own.",
    activity: {
      title: "The eight-arm challenge",
      steps: [
        "Put a small toy inside a jar and close the lid.",
        "Try to open it using only one hand, then with two.",
        "Imagine having eight arms that can taste: what would you grab first?",
      ],
      parentTip: "Draw an octopus together and give each arm a different job.",
    },
    scene: "A clever purple octopus opening a jar with a little toy inside, underwater, bubbles, a child in a diving mask smiling.",
    video: true,
  },
  {
    key: "autumn-leaves",
    daysAgo: 0,
    hour: 9,
    verdict: "answer",
    question: "Why do leaves change color in autumn?",
    topic: "Autumn Leaves",
    emoji: "🍂",
    summary: "Leo discovered that leaves hide yellow and orange colors all summer, and they show up when the green fades in autumn.",
    activity: {
      title: "Leaf rainbow hunt",
      steps: [
        "Collect 6 leaves of different colors on a walk.",
        "Line them up from green to red, like a rainbow.",
        "Press your favorite one inside a heavy book.",
      ],
      parentTip: "Ask Leo which tree has the most colors on your street.",
    },
    scene: "A child and a tiny coral explorer collecting red, orange and yellow leaves under a big autumn tree, leaves twirling in the wind.",
    video: true,
  },
  {
    key: "sunset-done",
    daysAgo: 0,
    hour: 10,
    verdict: "answer",
    intent: "challenge_report",
    question: "I did the sunset in a glass! It turned orange!",
    topic: "Challenge Done",
    emoji: "🌅",
    summary: "Leo did the sunset-in-a-glass experiment and saw the light turn orange, just like a real sunset!",
    activity: {
      title: "Sunset color hunt",
      steps: [
        "Tonight, watch the sky with Leo as the sun goes down.",
        "Name every color you can spot together.",
        "Compare it with the glass of milky water.",
      ],
      parentTip: "Ask Leo why the sunset is orange: they know the answer now!",
    },
    scene: "A glass of milky water glowing orange in front of a window with a beautiful sunset, a proud child giving a thumbs up.",
  },
];

export type SeedMemory = { kind: "interest" | "challenge" | "fact" | "preference"; content: string; weight?: number; done?: boolean };

export const MEMORY: SeedMemory[] = [
  { kind: "interest", content: "sea animals", weight: 6 },
  { kind: "interest", content: "space", weight: 5 },
  { kind: "interest", content: "volcanoes", weight: 4 },
  { kind: "interest", content: "how things work", weight: 3 },
  { kind: "interest", content: "colors and light", weight: 3 },
  { kind: "interest", content: "bees", weight: 2 },
  { kind: "challenge", content: "Grow a salt crystal on the windowsill and check it every day" },
  { kind: "challenge", content: "Find the Moon each night this week and draw its shape" },
  { kind: "challenge", content: "Sunset in a glass", done: true },
  { kind: "challenge", content: "Kitchen volcano", done: true },
  { kind: "challenge", content: "Magnet fishing", done: true },
  { kind: "fact", content: "Sunlight is a mix of all the colors, and the air scatters blue the most" },
  { kind: "fact", content: "Walruses find clams in the dark with their whiskers" },
  { kind: "fact", content: "The Moon doesn't change shape: we see the part lit by the Sun" },
  { kind: "fact", content: "Magnets pull iron and steel, not wood or plastic" },
  { kind: "fact", content: "Each octopus arm can feel and taste on its own" },
  { kind: "preference", content: "Loves funny sound words and little jokes" },
  { kind: "preference", content: "Prefers stories with sea animals" },
  { kind: "preference", content: "Sometimes asks questions in French" },
];

export type SeedStory = { key: string; daysAgo: number; title: string; pages: { text: string; scene: string }[] };

export const STORIES: SeedStory[] = [
  {
    key: "octopus-story",
    daysAgo: 1,
    title: "Leo and the Octopus Who Couldn't Sleep",
    pages: [
      {
        text: "That night, Leo's bath was full of bubbles. Blub, blub! Oomi blinked its big cream eyes. “Look, Leo!” Under the foam, a tiny purple octopus was trying to open the shampoo bottle. “I can't sleep,” it sighed. “My eight arms all want to do different things!”",
        scene: "A bathtub full of bubbles at night, a small purple octopus holding a shampoo bottle, a child in the bath laughing and a tiny coral explorer on the edge.",
      },
      {
        text: "Leo remembered what Oomi had said: each octopus arm can feel and taste on its own. “Let's give every arm a cozy job,” said Leo. One arm hugged a sponge. One stroked a rubber duck. One held a little shell, smooth and cool. Slowly, slowly, all eight arms grew calm.",
        scene: "The little purple octopus holding a sponge, a rubber duck and a shell with its arms, calm and smiling, soft bubbles floating around.",
      },
      {
        text: "The octopus yawned a bubbly yawn. Blub… blub… Leo yawned too. Oomi dimmed its eyes like a night-light. “Goodnight, little octopus. Goodnight, eight sleepy arms.” And in a warm bed, under a blanket soft as the sea, Leo drifted off to sleep.",
        scene: "A child asleep in a cozy bed with an ocean-blue blanket, a tiny coral explorer glowing softly like a night-light, a sleeping octopus in a bowl of water on the nightstand.",
      },
    ],
  },
  {
    key: "volcano-story",
    daysAgo: 4,
    title: "The Volcano Who Burped Bubbles",
    pages: [
      {
        text: "On a green island far away lived a little volcano named Puff. Every evening, Puff rumbled. Rumble, rumble! But tonight, instead of lava, out came bubbles. Pop, pop, pop! Leo and Oomi sailed over on a paper boat to see what was going on.",
        scene: "A small round smiling volcano on a green island puffing big colorful bubbles at sunset, a child and a tiny coral explorer arriving on a paper boat.",
      },
      {
        text: "“I think I ate too much baking soda,” giggled Puff. Leo laughed. “That's just gas pushing up, like in our kitchen volcano!” Together they counted the bubbles drifting into the sky, glowing orange and pink, until the very last one floated away. Pop.",
        scene: "The little volcano, the child and the tiny coral explorer counting glowing orange and pink bubbles floating into a twilight sky.",
      },
      {
        text: "Puff let out one last warm sigh and closed its sleepy crater. The island grew quiet. The stars came out, one by one. Leo curled up in the paper boat, Oomi's eyes glowing soft and slow. “Goodnight, Puff.” And the waves rocked Leo gently to sleep.",
        scene: "A sleeping volcano under a starry sky, a child asleep in a paper boat on calm water, a tiny coral explorer glowing softly beside them.",
      },
    ],
  },
];
