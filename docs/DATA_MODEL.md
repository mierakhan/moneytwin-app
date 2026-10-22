# Data model

Every table has an `id` and a `tenant_id`, and every query filters by the tenant. Add indexes for every list and search.

```mermaid
erDiagram
  Tenant ||--o{ User : has
  Tenant ||--o{ user : owns
  Tenant ||--o{ transaction : owns
  Tenant ||--o{ category : owns
  Tenant ||--o{ budget : owns
  Tenant ||--o{ savingsGoal : owns
  Tenant ||--o{ Simulation : owns
  Tenant ||--o{ Allnsight : owns
  user ||--o{ transaction : has
  user ||--o{ transaction : has
  category ||--o{ transactions : has
  user ||--o{ budget : has
  user ||--o{ savingsGoal : has
  user ||--o{ Simulation : has
  user ||--o{ Allnsight : has
  User {
    int id PK
    int tenant_id FK
    string email
    string role
  }
  user {
    int id PK
    int tenant_id FK
    string name
    string email
    string password_hash
    string role
  }
  transaction {
    int id PK
    int tenant_id FK
    string amount
    string type
    string category_id
    string date
    string description
  }
  category {
    int id PK
    int tenant_id FK
    string name
    string type
  }
  budget {
    int id PK
    int tenant_id FK
    string category_id
    string monthly_limit
    string month
  }
  savingsGoal {
    int id PK
    int tenant_id FK
    string name
    string target_amount
    string saved_amount
    string target_date
  }
  Simulation {
    int id PK
    int tenant_id FK
    string scenario_name
    string input_data
    string projected_balance
  }
  Allnsight {
    int id PK
    int tenant_id FK
    string insight_type
    string explanation
    string created_at
  }
```

## user
- `name`: string
- `email`: string
- `password_hash`: string
- `role`: string
- has many transaction

## transaction
- `amount`: string
- `type`: string
- `category_id`: string
- `date`: string
- `description`: string
- belongs to user

## category
- `name`: string
- `type`: string
- has many transactions

## budget
- `category_id`: string
- `monthly_limit`: string
- `month`: string
- belongs to user

## savingsGoal
- `name`: string
- `target_amount`: string
- `saved_amount`: string
- `target_date`: string
- belongs to user

## Simulation
- `scenario_name`: string
- `input_data`: string
- `projected_balance`: string
- belongs to user

## Allnsight
- `insight_type`: string
- `explanation`: string
- `created_at`: string
- belongs to user

