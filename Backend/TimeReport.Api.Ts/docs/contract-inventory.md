# Legacy API contract inventory

Source: ASP.NET controllers and the current frontend wrappers. This baseline intentionally records legacy behavior before route porting.

| Area              | Endpoints                                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth              | `GET setup-status`, `POST setup`, `POST login`, `POST logout`, `POST register`, `GET me`                                                                                        |
| Projects          | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `PATCH /:id/archive`, `PATCH /:id/unarchive`, `PATCH /:id/add-task`, `PATCH /:id/remove-task`                         |
| Tasks             | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `PATCH /:id/favorite`, `PATCH /:id/restore`, `GET /jira-details`                                                      |
| Tags              | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`                                                                                                                                    |
| Time entries      | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`, `POST /:id/duplicate`, `POST /reorder`, `GET /weekly-summary`, `GET /recent-description`, `POST /:id/push-to-jira`, `GET /export` |
| Daily notes       | `GET /:date`, `PUT /:date`, `GET /`, `GET /export`                                                                                                                              |
| Planner           | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`                                                                                                                                    |
| Profile           | `GET /`, `PATCH /`                                                                                                                                                              |
| Removed by design | `GET /api/admin/database/export`, `POST /api/admin/database/import`                                                                                                             |

All domain endpoints require a cookie session. Owned-resource misses return 404. Validation normally returns `{ "error": string }` with 400. Unauthorized requests return 401 without redirect. JSON uses ASP.NET's camel-case serialization. Tags and planner deletes return 204; most other successful deletes and reorder operations return 200 with an empty body.

Dates are calendar strings (`yyyy-MM-dd`). API clocks are `HH:mm`; SQLite stores EF `DateTime` values as local wall-clock timestamp strings. Audit timestamps are UTC and PostgreSQL returns them serialized as ISO-8601 UTC instants.
