# Feature: Google Calendar Clone Foundation

## 1. Objective
Investigate and document all existing codebase resources, UI components, date utilities, schemas, and configurations that can serve as a foundation for building a Google Calendar clone within the current Next.js application.

## 2. Classification
- **Classification:** Feature
- **Reasoning:** The user explicitly requested an investigation to *create* a clone of Google Calendar, which implies building a new feature or significantly expanding the existing task-calendar views.

## 3. Relevant Domains
- **UI / Frontend Views:** Calendar grid, drag-and-drop mechanics, multi-day layouts, reusable design system components.
- **Database / Data Models:** Prisma schema defining tasks (events) and their temporal attributes.
- **Server Actions:** Data layer functions managing scheduling, resizing, and dragging of events.
- **Localization (i18n):** Multi-language support for dates, days, and calendar controls.
- **Styling / Utilities:** Color palette generation for event categorization and icon assets.

## 4. Files to Review

### Database Schema
- **File Name:** schema.prisma
- **Full Path:** C:\Users\PC\Documents\Development\MVP\stratify\prisma\schema.prisma
- **Purpose:** Defines the data models. The Tarea model contains properties crucial for a calendar system: day (day of the week), start (start hour), dur (duration), dueDate, and relationship fields like objId (for categorization).

### UI Components
- **File Name:** ViewTareas.jsx
- **Full Path:** C:\Users\PC\Documents\Development\MVP\stratify\components\views\ViewTareas.jsx
- **Purpose:** The most critical file. This is already a highly functional calendar component featuring multi-day views, a time-slot grid (7 to 22), drag-and-drop for events, resizing controls, and an unscheduled event sidebar.
- **File Name:** Icon.jsx
- **Full Path:** C:\Users\PC\Documents\Development\MVP\stratify\components\ui\Icon.jsx
- **Purpose:** Contains all SVG icons required for calendar controls, including calendar, clock, chev-l (left), chev-r (right), and drag.

### Server Actions
- **File Name:** tareas.js
- **Full Path:** C:\Users\PC\Documents\Development\MVP\stratify\lib\actions\tareas.js
- **Purpose:** Server actions for the calendar data layer. Contains logic to create, schedule, move, unschedule, and resize events, integrating directly with Prisma.

### Pages
- **File Name:** page.jsx
- **Full Path:** C:\Users\PC\Documents\Development\MVP\stratify\app\tareas\page.jsx
- **Purpose:** Next.js Server Component that acts as the entry point for the calendar. It queries database entities (Tareas, Objetivos, Metas) and provides them to the ViewTareas view.

### Utilities and Localization
- **File Name:** i18n.js
- **Full Path:** C:\Users\PC\Documents\Development\MVP\stratify\lib\i18n.js
- **Purpose:** Contains translations (es/en) for months, days of the week, and calendar navigation strings (today, week, unschedule).
- **File Name:** palette.js
- **Full Path:** C:\Users\PC\Documents\Development\MVP\stratify\lib\palette.js
- **Purpose:** Defines the oklch color scheme system used to render different events in distinct colors (similar to Google Calendar's event colors).

## 5. Summary of Findings
The repository is exceptionally well-prepared for a Google Calendar clone feature. The ViewTareas.jsx component currently functions as a specialized calendar for tasks, complete with a time-grid, drag-and-drop, and resizing logic that mimics Google Calendar. Date management relies on native JavaScript Date functions (no external libraries like date-fns are used). To expand this into a full Google Calendar clone, the existing Tarea model and ViewTareas UI can be generalized into Events, adding support for arbitrary dates instead of weekly static days, full start/end DateTimes, and recurring logic if needed.
