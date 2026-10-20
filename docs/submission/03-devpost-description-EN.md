# AccessMap — Devpost description (paste into Devpost)

## Elevator pitch
AccessMap is a campus accessibility map for Qitaihe No.1 High School: students pin stairs, missing ramps, and broken elevators, and the school view ranks what to fix first—then copies that list for facilities staff.

## What is the specific problem, and how do you know it's real?
I am a Grade 12 student at **Qitaihe No.1 High School (七台河市第一中学)** in Heilongjiang, China. Our main gate has **stairs and no ramp**. Classmates who use a wheelchair—or anyone with a temporary injury or a stroller—cannot enter the school the way everyone else does. Inside campus, the main teaching building has an elevator (so classes are reachable once you are inside), but the lab building, library, and gym still create barriers for upper floors.

I know this is real because I walk this campus every school day. The gate is the choke point for the whole school. This is not a generic accessibility-app idea—it is the route I take, and the places I see classmates get stuck.

(If you talked to a specific classmate or teacher, add one sentence with their role—no need for names.)

## What it does
- Interactive Leaflet map of our campus with seeded barrier pins
- **Student mode:** “Can I get in today?” — nearest open barriers, live location optional
- **School mode:** ranked repair order for open barriers
- **Export this week’s repair priorities:** copy plain text, download CSV, or print—fully client-side, no account
- Report a barrier (stairs / no ramp / elevator broken / other) with optional note and photo
- English by default (for international judges) with Chinese toggle; voice + on-screen captions; keyboard / screen-reader path

Live demo: https://zsbzds081102-sudo.github.io/accessmap/
Repo: https://github.com/zsbzds081102-sudo/accessmap

## How we built it
Vite + React + TypeScript + Leaflet / react-leaflet. Map tiles: Amap. Data stays in the browser localStorage (hackathon prototype—not official school records). Development assisted by AI tools including **DeepSeek Harness (DeepSeek V4.1 Flash)** and Cursor.

## Challenges
- Making Web Speech sound natural and stop stuttering when location updates fire often
- Keeping a 20-second judge path clear on both phone and laptop
- Ranking repairs so student reports beat demo seeds within the same severity, without a backend

## What’s next
- Optional school staff inbox (still privacy-first)
- More campuses with the same dual Student / School model
- Offline-friendly PWA packaging for weak campus Wi-Fi

## Built with
React, TypeScript, Vite, Leaflet, react-leaflet, Web Speech API, GitHub Pages
