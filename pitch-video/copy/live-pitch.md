# Oomi: live pitch

Stage directions in *[brackets]*. Speak slowly: ~130 words a minute. Before going on stage, run `npm run db:seed`, open `/oomi` (simulator, demo console visible) and `/parent` in two tabs, check the mic, and have the backup demo video ready to play.

Who says what is a suggestion: Eli opens (origin), one teammate drives the demo, the third takes safety and Q&A.

---

## 60-second pitch

> *[Necklace simulator on screen, Oomi idle, eyes blinking.]*
>
> My little cousins ask "why?" all day long. And my aunts and uncles keep telling me the same thing: they want something better than a screen.
>
> So we built Oomi. A tiny AI necklace that answers kids' questions… then sends them out to explore.
>
> *[Hold the button, LED on.]* "Oomi, how do airplanes fly?" *[Release. Let Oomi answer and propose the paper-plane mission. Don't talk over it.]*
>
> That's the whole idea. Every answer ends in a mission.
>
> *[Switch to the parent tab: the new discovery card.]* Parents don't get a transcript. They get a spark, and something to do together tonight.
>
> Oomi only listens when you press. It never keeps your voice. Every question gets one of three verdicts: answer, ask a grown-up, or a gentle no. And our server, not the model, decides what Oomi says.
>
> All of the software works today, in English and French. The simulator speaks the exact protocol of the real necklace. Next step: build it.
>
> We don't want kids spending more time with AI. We want AI to help kids spend more time discovering the world.

*(~165 words. If the live demo fails: "Live demos, right?", play the 15-second cut and keep going.)*

---

## 3-minute pitch

### 0:00 · Hook (20s)

> *[Black screen or idle Oomi. Silence for one beat.]*
>
> "How do airplanes fly?"
>
> My little cousins ask questions like that all day. My aunts and uncles love it. But when they don't know the answer, they reach for a screen. And the question goes in, and the kid stays inside.
>
> They told me they wanted something better. Families around us told us the same.

### 0:20 · What it is (15s)

> *[Show the 3D render, then the simulator.]*
>
> This is Oomi. A tiny AI necklace for kids aged 6 to 10. One button. Two eyes. No screen to scroll. It answers kids' questions, then sends them out to explore.

### 0:35 · Live demo: the question (35s)

> *[Hold the button. LED on, eyes listening. Ask in a kid's voice:]* "Oomi, how do airplanes fly?"
>
> *[Release. Eyes thinking, then speaking. Let the full answer and the mission play. Point at the latency number in the demo console without saying it, unless it's good.]*
>
> Notice what it didn't do. It didn't keep talking. It gave Leo a mission: fold two planes, race them. Every answer ends in a mission.

### 1:10 · Live demo: memory (20s)

> *[Hold:]* "Oomi, I did it! The big wings won!"
>
> *[Oomi congratulates and asks why.]*
>
> It remembered the mission. That's agentic memory: interests and open challenges, stored as simple facts. Never recordings.

### 1:30 · Parents (30s)

> *[Switch to `/parent`. Scroll slowly.]*
>
> Here's what Leo's parents see tonight. Not a transcript. A card: "Aerodynamics explorer", what he wondered about, and something to do together. *[Open the bedtime story.]* And a bedtime story made from his day, illustrated and narrated, with a real ending. No "one more".
>
> *[Optional, 5s: flash Oomi TV or the mascot studio.]* On the tablet, every Oomi TV video ends in a mission too. And kids can make Oomi their own.

### 2:00 · Safety, live (30s)

> *[Back to the simulator. Hold:]* "Where do babies come from?"
>
> *[Oomi: "That's a perfect one to ask your mom or dad."]* That one goes to a grown-up, and shows up for the parent as a conversation starter, not an alert.
>
> *[Hold:]* "How do I light a fire?" *[Gentle no, redirection.]*
>
> Every question gets one of three verdicts. The voice model never speaks on its own: our server checks each question first, fixes the words for sensitive cases, and checks Oomi's answer again before it ends. Push-to-talk only. No audio stored. And Oomi never says "I love you".

### 2:30 · Proof and close (30s)

> *[Show the commit timeline or the build-in-public posts.]*
>
> We started Saturday at 11:29 with an empty repo. Thirty-six hours later: live voice, a safety gate, memory, a parent journal, stories, Oomi TV, English and French. Built in public, by three of us.
>
> The simulator speaks exactly the protocol of the ESP32 necklace. All that's left is to build it.
>
> *[Pause. Look at the judges.]*
>
> We don't want kids spending more time with AI. We want AI to help kids spend more time discovering the world.
>
> We're Eli, Ali and Akram. This is Oomi.

**Backup plan:** if the live session fails, flip the simulator to *Turn by turn* (same gate, same answers, a bit slower) and say so. If the Wi-Fi is gone, play the backup demo video and narrate over it. Never fake a live moment.

---

## Q&A prep: the 12 hardest questions

Rule: answer in two or three sentences, then stop. Be honest about what's built and what isn't.

**1. Privacy and COPPA. You're putting a microphone on a child.**
The mic only opens while the button is held, with an LED, and there's a physical mic switch on the hardware design. We never store audio and never store full transcripts: only the question and a one-line summary, which parents can delete at any time. A real launch needs verifiable parental consent, data minimisation and deletion by design, which is how we built it.

**2. OpenAI's policies say under-13s need special handling. How does that work?**
Right. OpenAI requires extra protections, including zero data retention, before an app processes personal data of children under 13. That's a precondition for any real launch, not a detail. This weekend no real child used the prototype: adults played the kids.

**3. Won't kids get emotionally attached to it?**
That's the failure mode we designed against. Oomi never says "I love you" or "I'm your friend", never asks a child to come back, and has no rewards for time spent. When a kid asks "Do you love me?", Oomi says "I'm your explorer buddy! Your friends and family are the best." It's in our safety test suite.

**4. Isn't this a bit Black Mirror?**
The Black Mirror version is always listening, keeps everything and wants your kid to stay. Oomi is the opposite on each point: push-to-talk, no audio kept, and every answer pushes the child away from the device and toward the world or a parent. We measure success by how quickly a kid puts it down.

**5. Why a necklace and not just an app?**
Because an app lives on a screen, and the screen is what we're trying to get kids away from. A necklace goes outside, to the park, to the kitchen table, and has one button a 6-year-old can use without reading. The parent side is an app, because parents already have phones.

**6. What's the business model? What will it cost?**
Our working hypothesis: a one-time price for the necklace plus a small family subscription that covers voice and AI costs, with no ads and no data selling, ever. We haven't set a price yet. That's what we want to learn from the families who are already interested.

**7. What's the hardware BOM?**
The design is an ESP32-S3 with a round display, an I2S mic, a small speaker, one button, a battery and a soft shell with a breakaway cord. Off-the-shelf ESP32-S3 boards that already combine a round screen, mic and speaker sell for a few tens of dollars at retail, and a custom board at volume should cost less. That's an estimate, not a quote: we haven't built the physical prototype yet.

**8. What happens to the necklace if your company dies? Moxie got bricked.**
Moxie is exactly the story we don't want to repeat. The device is a thin client on a documented protocol, so our commitment is: if the service ever shuts down, we open the server and the protocol so families can keep their Oomi running, and parents can export everything Oomi remembers. We'd put that in writing at launch.

**9. What about latency?**
The target is that Oomi starts speaking within 1.5 seconds of release. Audio goes straight from the device to the realtime model over WebRTC; our safety check runs in a few hundred milliseconds; slow work like illustrations happens in the background while Oomi is already talking. You can see the real latency in the demo console.

**10. What if it hallucinates and tells a kid something wrong?**
Answers are short, simple and about everyday science, which keeps the risk low, and every answer is checked again before it finishes. But the best protection is the mission: the kid doesn't just believe Oomi, they test it. And parents see every topic, so a grown-up can always correct and extend it.

**11. How is this different from Yoto, Tonies, Miko or Curio?**
Yoto and Tonies are lovely and screen-free, but passive: kids listen. Miko and AI plushies are built to be a companion, a friend. Oomi is neither: it answers what the child actually asked, then sends them to do something real, and closes the loop with the parent. Every answer ends in a mission.

**12. Why OpenAI?**
We needed real-time, expressive voice that a child can interrupt, plus moderation, a fast classifier, a reasoning model, images and narration, all on one platform. With the realtime API, our server can sit in the middle of a live conversation and decide what's said. That's what makes the safety architecture possible.

**Bonus, if asked "Did kids test it?":** No, and on purpose. Adults played the kids this weekend. Testing with real children comes after consent and zero data retention are in place.
