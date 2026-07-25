# RescueHub: A Web-based Animal Rescue Operations and Information Management System

[![University](https://img.shields.io/badge/University-University%20of%20San%20Carlos-green.svg)](https://www.usc.edu.ph/)
[![Department](https://img.shields.io/badge/Department-DCISM-blue.svg)]()
[![Course](https://img.shields.io/badge/Course-Information%20Management%20II-orange.svg)]()
[![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Express%20%7C%20Prisma%20%7C%20MySQL-purple.svg)]()

> **An Information Management II Proposal & Academic Project**  
> Presented to the Faculty of the Department of Computer, Information Sciences and Mathematics  
> **University of San Carlos — Talamban Campus, Cebu City**  
> **Instructor:** Mr. Edwin Bartlett  
> **Date:** July 2026  

---



## 📖 Table of Contents
1. [Executive Summary & Rationale](#-executive-summary--rationale)
2. [General & Specific Objectives](#-general--specific-objectives)
3. [System Architecture & Tech Stack](#-system-architecture--tech-stack)
4. [Functional Requirements (Paper Section 2.5)](#-functional-requirements-paper-section-25)
5. [Database Schema & ERD](#-database-schema--erd)
6. [SQL Benchmark Queries (Paper Section 2.4)](#-sql-benchmark-queries-paper-section-24)
7. [Access & Security Controls (RBAC)](#-access--security-controls-rbac)
8. [Installation & Setup Guide](#-installation--setup-guide)
9. [Appendices & References](#-appendices--references)

---

## 📌 Executive Summary & Rationale

Animal welfare organizations and stray shelters frequently operate under highly dynamic field conditions. Field rescuers, veterinarians, and volunteer coordinators are constantly in transit, responding to emergency reports of injured, stray, or distressed animals. However, operational efficiency is severely hampered by critical bottlenecks:

* 🚨 **Information Disconnect:** Rescuers in the field lack real-time access to active incident locations, contact details of reporting citizens, and historical records of animals previously rescued in the area, leading to delayed dispatches.
* 🏠 **Unmonitored Shelter Capacities:** Intake staff lack a centralized mechanism to monitor kennel availability across different shelter locations, which causes unbalanced distributions and shelter overcrowding.
* 🩺 **Fragmented Health Tracking:** Veterinary diagnosis, medication logs, and treatment plans are recorded in paper-based logs or localized spreadsheets, rendering historical medical data inaccessible when adjusting rehabilitation plans.

**RescueHub** solves these challenges by providing a centralized, web-based platform that unifies public incident reporting, dispatch management, real-time shelter capacity allocation, veterinary treatment tracking, and append-only activity auditing.

---

## 🎯 General & Specific Objectives

### General Objective
To develop and deploy **RescueHub**, a web-based Animal Rescue Operations and Information Management Platform that centralizes public incident reporting, rescue case dispatching, shelter capacity allocation, and veterinary treatment history tracking for animal welfare organizations.

### Specific Objectives & Success Criteria
* ⏱️ **Reduce Response Lag:** Decrease the time elapsed between public incident reporting and volunteer team dispatch by **50%** through automated notifications.
* 📄 **Minimize Administrative Overhead:** Reduce home office administration and paper log maintenance costs by **20%** by digitizing case sheets and medical logs.
* 📍 **Eliminate Duplicate Dispatches:** Reduce double dispatches to the same location/animal report by **40%** through live coordinate mapping and incident status tracking.
* 📋 **Lighten Field Cargo:** Decrease physical documentation carried by field responders by **75%** without compromising reporting compliance.
* 💊 **Enhance Medical Accuracy:** Ensure **100%** of admitted animals have their diagnoses, medication dosages, and veterinarian identities accurately logged and easily retrievable in the field.

---

## 🛠️ System Architecture & Tech Stack

```mermaid
graph TD
    A["Public Citizen / Field Rescuer / Vet / Dispatcher"] -->|HTTP/REST| B["Vite + React 18 Frontend UI"]
    B -->|Zustand State & TanStack Router| C["Express.js REST API Server"]
    C -->|JWT Auth & RBAC Middleware| D["Prisma ORM"]
    D -->|SQL Queries| E[("MySQL Relational Database")]
```

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend Framework** | React 18, TypeScript, Vite, TanStack Router |
| **Styling & Components** | TailwindCSS, Shadcn UI, Lucide Icons, Sonner Toasts |
| **State Management** | Zustand (Persistent Local & API Sync Store) |
| **Backend Server** | Node.js, Express.js (TypeScript) |
| **ORM & Database** | Prisma ORM, MySQL 8.0 Database |
| **Authentication & Security** | JSON Web Tokens (JWT), bcryptjs, Express RBAC Middleware |

---

## 📋 2.5 Functional Requirements (Paper Section 2.5)

### 2.5.1 Citizen Emergency Incident Reporting Subsystem (Public Portal)
* **FR-1.1 Incident Data Capture:** The system shall allow public users (citizens) to submit emergency incident reports by inputting the reporter's name, contact phone number, animal species (Dog, Cat, Bird, Other), estimated severity level (`Low`, `Medium`, `High`, `Critical`), geographic location/address, landmark description, and optional photo file uploads.
* **FR-1.2 Interactive Map Location Pinning:** The system shall provide an interactive map interface allowing users to pin geographic coordinates (latitude and longitude) or select pre-defined municipal landmarks.
* **FR-1.3 Anonymous Incident Submissions:** The system shall permit users to toggle anonymous reporting, withholding reporter contact details while still queuing the incident for emergency dispatch review.
* **FR-1.4 Submission Confirmation:** Upon successful submission, the system shall generate a unique incident tracking reference and display a clear confirmation notification to the reporter.

### 2.5.2 Emergency Dispatch & Case Lifecycle Subsystem
* **FR-2.1 Incident Queue & Review:** The system shall display incoming public incident reports in a centralized dispatcher queue sorted chronologically and prioritized by severity.
* **FR-2.2 Incident Verification & Promotion:** The system shall enable authorized dispatchers to review pending incident reports and promote valid reports into formal Rescue Cases (`RC-2026-XXXX`).
* **FR-2.3 Responder & Shelter Assignment:** The system shall allow dispatchers to assign active field rescue teams (or individual rescuers) and designate target housing shelters to specific rescue cases.
* **FR-2.4 Lifecycle Status Progression:** The system shall strictly enforce sequential case status transitions through the operational pipeline: `REPORTED` ➔ `ASSIGNED` ➔ `EN_ROUTE` ➔ `RESCUED` ➔ `SHELTER_INTAKE` ➔ `UNDER_TREATMENT` ➔ `RECOVERED` ➔ `ADOPTED`/`RELEASED`.
* **FR-2.5 Rescue Journey Audit Timeline:** The system shall render a vertical, chronological timeline for every rescue case, displaying all status updates, responder reassignments, and notes along with timestamps and user attribution.

### 2.5.3 Animal Intake & Shelter Capacity Allocation Subsystem
* **FR-3.1 Digital Animal Profile Registration:** The system shall allow shelter intake staff to register admitted animals with detailed attributes including name, species, breed, sex, estimated age, weight (kg), physical condition assessment, admission date, and primary photo.
* **FR-3.2 Real-Time Capacity Calculation:** The system shall continuously calculate and display total, occupied, and available bed capacities for all registered shelter facilities using live database queries (`Available Beds = Total Capacity - Occupied Beds`).
* **FR-3.3 Overcrowding Threshold Warnings:** The system shall trigger visual warnings (high-occupancy badges) whenever a shelter facility reaches or exceeds **90%** bed capacity utilization.
* **FR-3.4 Image Storage & Indexing:** The system shall store uploaded animal photos on the server file directory and index relative path references within the MySQL `Animal` table.

### 2.5.4 Veterinary Medical Care & Treatment Subsystem
* **FR-4.1 Medical Examination Logging:** The system shall allow authorized veterinarians to create medical care entries tied to specific animal IDs, recording primary diagnosis, surgical/clinical procedures performed, prescribed medications, and clinical notes.
* **FR-4.2 Follow-Up Checkup Scheduling:** The system shall enable veterinarians to specify future follow-up evaluation dates (`followup_date`) for animals under care.
* **FR-4.3 Pending Care Alerts:** The system shall track pending follow-up evaluations and highlight animals requiring re-examination on the clinic dashboard.
* **FR-4.4 Historical Health Records Retrieval:** The system shall maintain a complete historical log of all veterinary interventions per animal, accessible to clinic staff during ongoing rehabilitation.

### 2.5.5 Access Control, Reporting & System Audit Subsystem
* **FR-5.1 Role-Based Access Control (RBAC):** The system shall restrict interface features and REST API endpoints according to user roles (`Admin`, `Dispatcher`, `Veterinarian`, `Rescuer`, `Guest`).
* **FR-5.2 Append-Only System Activity Logging:** The system shall automatically record database mutation events (case creation, status updates, treatment entries, record deletions) into an append-only `ActivityLog` table with user identity and ISO timestamps.
* **FR-5.3 Interactive Dashboard Analytics:** The system shall generate aggregated operational metrics including active emergency cases, animals under treatment, total intake distribution by species, and vet care workload statistics.

---

## 🗄️ Database Schema & ERD

The database schema is fully normalized up to **3rd Normal Form (3NF)** in MySQL via Prisma ORM:

```
+------------------+       +-------------------+       +--------------------+
|  Incident_Report | ----> |       Ticket      | ----> |       Animal       |
| (Citizen Intake) | 1:1   |   (Rescue Case)   | 1:1   |  (Admitted Record) |
+------------------+       +-------------------+       +--------------------+
                                     |                           |
                                     v                           v
                           +-------------------+       +--------------------+
                           |        Team       |       |  Animal_Treatment  |
                           | (Assigned Rescuer)|       |  (Veterinary Care) |
                           +-------------------+       +--------------------+
```

---

## 📊 SQL Benchmark Queries (Paper Section 2.4)

### Query 1: Active Emergency & Critical Rescue Cases
```sql
SELECT 
    t.id AS case_id,
    CONCAT('RC-2026-', LPAD(t.id, 4, '0')) AS case_number,
    t.priority AS severity,
    t.status AS case_status,
    ir.location,
    CONCAT(a.first_name, ' ', a.last_name) AS assigned_rescuer,
    s.shelter_name AS target_shelter,
    t.created_at AS dispatched_at
FROM Ticket t
LEFT JOIN Incident_Report ir ON t.incident_report_id = ir.id
LEFT JOIN Team tm ON t.current_assigned_team_id = tm.id
LEFT JOIN Agent a ON tm.manager_agent_id = a.id
LEFT JOIN Animal an ON an.ticket_id = t.id
LEFT JOIN Shelter s ON an.shelter_id = s.id
WHERE t.priority IN ('Critical', 'High')
  AND t.status NOT IN ('CLOSED', 'ADOPTED', 'RELEASED')
ORDER BY t.created_at DESC;
```

### Query 2: Live Shelter Bed Capacity Utilization
```sql
SELECT 
    s.id AS shelter_id,
    s.shelter_name,
    s.capacity AS total_beds,
    COUNT(an.id) AS occupied_beds,
    (s.capacity - COUNT(an.id)) AS available_beds,
    ROUND((COUNT(an.id) / s.capacity) * 100, 1) AS occupancy_percentage
FROM Shelter s
LEFT JOIN Animal an ON s.id = an.shelter_id 
    AND an.status NOT IN ('Adopted', 'Released')
GROUP BY s.id, s.shelter_name, s.capacity
ORDER BY occupancy_percentage DESC;
```

---

## 🔒 Access & Security Controls (RBAC)

### User Role Permissions Matrix

| Permission / Function | Guest (Public) | Rescuer | Veterinarian | Dispatcher | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Submit Incident Report** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View Rescue Cases Queue** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Update Case Status & Notes** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Promote Incident / Assign Responder** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **View & Register Animal Profiles** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Log Veterinary Medical Care** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Manage Shelters & Rescuers Roster** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Delete Records Across System** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **View Full Activity Audit Logs** | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## ⚙️ Installation & Local Setup Guide

### Prerequisites
* **Node.js** v18.0 or higher
* **MySQL Server** 8.0 or higher
* **npm** or **yarn**

### 1. Clone the Repository
```bash
git clone https://github.com/Hubrisdog/rescue-hub.git
cd rescue-hub
```

### 2. Configure Environment Variables
Create a `.env` file inside the `server/` directory:
```env
PORT=5000
DATABASE_URL="mysql://root:password@localhost:3306/rescuehub_db"
JWT_SECRET="rescuehub_secret_key_2026"
```

### 3. Install Dependencies & Push Database Schema
```bash
# Install root/frontend dependencies
npm install

# Install server dependencies
cd server
npm install

# Push Prisma schema to MySQL
npx prisma db push

# Seed database with benchmark records
npm run prisma:seed
```

### 4. Run Development Servers
```bash
# In server directory:
npm run dev

# In a new terminal (root directory):
npm run dev
```

Open your browser at `http://localhost:5173` to view **RescueHub**!

---

## 🛠️ Production Stabilization & Hotfixes (July 2026 Release)

To prepare **RescueHub** for a live deployment and defense, the codebase underwent a rigorous security audit, stabilization phase, and bug-fixing pipeline. The following production-grade hotfixes were implemented:

1. **Assigned Rescuer Flow Synchronization:**
   * Resolved a database-to-API discrepancy where seeded rescuers (e.g. Mark Davis) had `NULL` team IDs in the database.
   * Standardized the backend update and promotion controllers to implement role-based team fallbacks (Team 1 for Rescuers, 2 for Dispatchers, 3 for Vets), aligning the database writes with the read API mappings.
   * Integrated front-end team-to-member resolution in the tables, dropdowns, and details drawers.
2. **Medical Recommendation & Outcome Progression:**
   * Redesigned the veterinary recommendations to clear animals as `Recovered` (Medically Cleared), decoupling medical certification from adoption decisions.
   * Integrated the outcomes flow in the Animal Registry so that cleared animals can be promoted to `Ready for Adoption` (domestic species) or `Ready for Release` (wild species).
   * Synced all treatment progress bars and completed filters.
3. **Rescue Date Validation:**
   * Fixed payload serialization to ensure case rescue dates are accurately tracked and stored, with automatic backend timestamp logging when a case advances to the `RESCUED` state.
4. **Case-Insensitive Species Checks:**
   * Standardized all species and status calculations to be case-insensitive, protecting the frontend filters and timelines from casing variances in user-entered species names (e.g. `Bird` vs `bird`).
5. **Security & Session Management:**
   * Corrected JWT expiration countdown rendering in the user account panel, removing redundant millisecond multipliers.
   * Added demo bypass login helpers for rapid verification during defense.

---

## 📄 License & Academic Attribution
This project was developed for academic evaluation under **Information Management II (IM2)** at the **University of San Carlos (USC)**. All rights reserved by the student authors and faculty instructors.
