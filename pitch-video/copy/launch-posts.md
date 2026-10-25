# Oomi: launch posts

Same voice as the kickoff post (`doc/build-in-public/01-kickoff.md`): short lines, real, a question at the end. Don't reuse the kickoff's "~1,000 questions a day" line: it isn't research. No stats needed.

Tags: `#parisdevdayhack` · `@OpenAI` · `@openaidevs` · `@borvibe`. On LinkedIn, type each tag by hand and pick the page from the list, or it won't link. Same for Ali and Akram.

---

## X thread (launch film)

Attach the 60s vertical or the full film to tweet 1. Pin the thread.

**1/**
```
36 hours ago, Oomi was a sketch.

Today it answers kids' questions out loud, then sends them on a real-world mission.

Here's the launch film 🎬

Built at the @OpenAI DevDay hackathon #parisdevdayhack 🧵
```

**2/**
```
A kid holds the button: "How do airplanes fly?"

Oomi: "Wings push the air down, so the air pushes the plane up! Want to test it? Fold two paper planes, big wings and small wings."

Every answer ends in a mission.
```

**3/**
```
When the kid comes back ("The big wings won!"), Oomi remembers the mission and asks why.

Then it gets out of the way. The best interaction is the one where the kid puts it down.
```

**4/**
```
Parents don't get a transcript.

They get a spark: an illustrated card of what their kid wondered about, and something to do together tonight.

Plus a bedtime story made from the day.
```

**5/**
```
The hard part was trust.

• Push-to-talk only. No always-on mic
• No audio stored
• Every question: answer / ask a grown-up / gentle no
• Our server decides what Oomi says, not the model
• It never says "I love you"
```

**6/**
```
Built with @openaidevs: gpt-realtime for live voice, the Moderation API + a nano classifier for the safety gate, a reasoning model for missions and memory, GPT Image + TTS for stories.

English and French.
```

**7/**
```
All the software works today. The necklace simulator speaks the exact protocol of the ESP32 necklace.

Next step: build the real one.

Built in public by Eli, Ali and Akram, with a lot of paper planes. @borvibe
```

**8/**
```
We don't want kids spending more time with AI.

We want AI to help kids spend more time discovering the world.

Parents: what's the first question your kid would ask Oomi? 👇
```

---

## LinkedIn post

No link in the post; put it in the first comment.

```
36 hours ago, Oomi was a sketch in a notebook.

It started with my little cousins. They ask "why?" all day long. And my aunts and uncles kept telling me the same thing: they wanted something better than a screen.

So this weekend at the OpenAI DevDay Hackathon in Paris, Ali, Akram and I built Oomi.

A tiny AI necklace that answers kids' questions… then sends them out to explore.

→ A kid holds the button: "How do airplanes fly?"
→ Oomi answers in three playful sentences.
→ Then: "Want to test it? Fold two paper planes and see which flies farther."

Every answer ends in a mission.

At night, parents don't get a transcript. They get a spark: what their kid wondered about, and something to do together. Then a bedtime story made from the day.

We designed the trust part first:
• Push-to-talk only. No always-on mic.
• No audio stored.
• Every question gets one of three answers: a real one, "ask your mom or dad", or a gentle no.
• It's not a best friend. It never asks a kid to come back.

All the software works today, in English and French. Next step: the real necklace.

We don't want kids spending more time with AI. We want AI to help kids spend more time discovering the world.

The launch film is below. What would make you trust (or not trust) something like this for your kids?

Built in public 🛠️ with @OpenAI @openaidevs @borvibe

#parisdevdayhack #BuildInPublic #OpenAI #Hackathon #EdTech #Parenting
```

**First comment:**
```
Demo, repo and the full build-in-public thread here: [link]. Families who want to try the first necklaces: tell us in the comments.
```

---

## Build in Public recap (final post, Sunday night)

Works on LinkedIn as-is; split at the blank lines for an X thread. Attach a screenshot grid: first sketch, first eyes, first live answer, parent journal, the team.

```
Build in Public #final: 36 hours, one necklace, three of us.

Saturday 11:29 · First commit. An empty repo and a spec with one rule: every answer ends in a mission.

Saturday 11:58 · Our first post, with an honest question: would you let your kid wear this?

Saturday afternoon · The foundation: a necklace simulator with eyes, server-controlled voice, and the safety pipeline. Every question gets a verdict: answer, ask a grown-up, or decline.

Saturday evening · Oomi speaks live. Push-to-talk, memory, and a parent journal with illustrated discovery cards.

Saturday night · Oomi answers in French. Oomi TV for the family tablet, where every video ends in a mission. A mascot studio so kids can make Oomi their own.

Sunday · Polish, the launch film, and a lot of rehearsals.

Sunday night · About 55 commits later, it all works, end to end. The simulator speaks the same protocol as the real necklace. Building that is next.

What we learned:
• Safety is a pipeline, not a prompt.
• The mission is the product. Answering is the easy part.
• Parents want a spark, not a transcript.

Thank you to everyone who commented on our first post. Your questions about privacy and trust shaped what we built.

@OpenAI @openaidevs @borvibe #parisdevdayhack #BuildInPublic
```

---

## Product Hunt

**Name:** Oomi
**Tagline (60 chars max):** `The AI necklace where every answer ends in a mission`
**Alt:** `An AI necklace that answers kids, then sends them outside`

**First comment (maker):**
```
Hi Product Hunt 👋 I'm Eli, with Ali and Akram.

Oomi started with my little cousins. They ask "why?" all day, and their parents wanted something better than handing them a screen.

Oomi is a tiny push-to-talk necklace for kids aged 6–10. A kid asks "How do airplanes fly?", Oomi answers in a few playful sentences, then gives them a mission: fold two paper planes and race them. When they come back, Oomi remembers and asks what they found.

Parents get a journal of discoveries (not transcripts) with something to do together, plus a bedtime story made from the day.

What we cared about most:
• Push-to-talk only, no audio stored
• Every question: answer, "ask a grown-up", or a gentle no, decided by our server, not the model
• Not a best friend. It never asks kids to come back

We built all the software in 36 hours at the OpenAI DevDay Hackathon. The necklace simulator already speaks the real device protocol; the hardware is next.

We'd love your honest take: what would you need to see before putting this on your kid?
```

---

## Instagram / TikTok caption

Use with the 60s vertical cut.

```
Kids ask "why?" all day. Oomi answers… then sends them outside to find out ✈️

A tiny AI necklace where every answer ends in a mission. Built in 36 hours at #parisdevdayhack

Push-to-talk. No audio kept. Not a best friend.

What would your kid ask first? 👇

#BuildInPublic #OpenAI #Parenting #KidsActivities #STEMkids
```

---

## Waitlist landing hero

**Headline:** Every answer ends in a mission.

**Subhead:** Oomi is a tiny AI necklace that answers your kid's questions out loud, then sends them out to discover the world. You get the spark, and something to do together.

**CTA button:** `Join the first families`
**Under the button:** No spam. Just one email when the first necklaces are ready.

**Benefits:**
- **Questions become adventures.** Every answer comes with a small real-world experiment, no screen needed.
- **You see the spark, not a transcript.** A daily journal of what your kid wondered about, a "do it together" idea, and a bedtime story made from the day.
- **Built for trust.** It only listens when your kid presses the button, never keeps their voice, and sends the big questions to you.
