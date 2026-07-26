# Placement Management Engine

The Placement Management Engine is the administrative core of JobMode. It manages the lifecycle of recruitment drives and student applications.

## Key Concepts

- **Drive**: A recruitment event hosted by a company (e.g., "Google SWE 2026"). Drives have constraints like `ctc_min`, `gpa_requirement`, and `structured_eligibility`.
- **Application**: A student's intent to participate in a Drive.
- **Outcomes**: The final result of a Drive (who got placed and at what CTC).

## Workflow

1. **Creation**: A Placement Representative (PR) or Admin creates a new Drive.
2. **Filtering**: Students browse available drives. The frontend queries the backend to determine if the student's profile meets the `structured_eligibility` criteria.
3. **Applying**: Student applies. The application moves to `applied` status.
4. **Processing**: The company conducts interviews. PR updates statuses to `shortlisted`, `rejected`, or `placed`.
5. **Analytics**: The Placement Admin Dashboard calculates conversion funnels (Applied -> Shortlisted -> Placed).
